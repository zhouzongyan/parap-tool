import JSZip from 'jszip'

// 定义标记字符串
const MARKER_PRE = 'DATA_'
const MARKER_BYTE = MARKER_PRE + 'BYTE'
const MARKER_JSON = MARKER_PRE + 'JSON'
const MARKER_SIZE = 9
const INT64_SIZE = 8

class MarkerError extends Error {
    constructor(message: string = '未找到MARKER') {
        super(message)
        this.name = 'MarkerError'
    }
}

// 将 uint64 转换为字节数组
function uint64ToBytes(num: number): Uint8Array {
    const buffer = new ArrayBuffer(8)
    const view = new DataView(buffer)
    view.setBigUint64(0, BigInt(num), false) // false for big-endian
    return new Uint8Array(buffer)
}

// 从字节数组读取 uint64
function bytesToUint64(bytes: Uint8Array): number {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return Number(view.getBigUint64(0, false)) // false for big-endian
}

// 定义配置接口
export interface Config {
    port: number;
    width: number;
    height: number;
    title: string;
    debug: boolean;
    hint: string;
    url: string;
}

// 定义输入类型
export type WebviewInput = {
    type: 'url';
    url: string;
} | {
    type: 'html';
    content: string;
} | {
    type: 'zip';
    data: Uint8Array;
}

export async function WriteDataJson(
    src: Uint8Array,
    input: WebviewInput,
    options: Omit<Config, 'url'> = defaultConfig
): Promise<Uint8Array> {
    // 创建完整的配置对象
    const config: Config = {
        ...options,
        url: ''  // 默认为空
    }

    let zipData = new Uint8Array(0)

    switch (input.type) {
        case 'url':
            // 情况1: 只需要设置 url
            config.url = input.url
            break;

        case 'html':
            // 情况2: 需要将 HTML 内容打包成 zip
            const zip = new JSZip()
            zip.file('index.html', input.content)
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            zipData = new Uint8Array(await zipBlob.arrayBuffer())
            break;

        case 'zip':
            // 情况3: 直接使用传入的 zip 数据
            zipData = input.data
            break;
    }

    // 将配置转换为 Uint8Array
    const jsonString = JSON.stringify(config)
    const jsonData = new TextEncoder().encode(jsonString)

    // 调用内部函数处理数据合并
    return await writeDataJson(src, jsonData, zipData)
}

// 默认配置
const defaultConfig: Omit<Config, 'url'> = {
    port: 0,
    width: 800,
    height: 600,
    title: 'WebView',
    debug: true,
    hint: ''
}

async function writeDataJson(src: Uint8Array, jsonData: Uint8Array, newData: Uint8Array): Promise<Uint8Array> {
    let rawData = deleteBeforeData(src)
    let mergeData = await writeData(rawData, newData, MARKER_BYTE)
    mergeData = await writeData(mergeData, jsonData, MARKER_JSON)
    return mergeData
}

async function readDataJson(src: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    let jsonData: Uint8Array = new Uint8Array(0)
    let reminData = src

    try {
        const [_jsonData, remainingAfterJson] = await readData(src, MARKER_JSON)
        jsonData = _jsonData
        reminData = remainingAfterJson
    } catch (err) {
        if (!(err instanceof MarkerError)) {
            throw err
        }
    }

    const [rawData, _] = await readData(reminData, MARKER_BYTE)
    return [jsonData, rawData]
}

function deleteBeforeData(src: Uint8Array): Uint8Array {
    let ret = src
    let dataLenAll = 0

    while (true) {
        try {
            const dataLen = checkMarker(ret, '')
            dataLenAll += dataLen
            ret = ret.slice(0, ret.length - dataLen)
        } catch (err) {
            if (err instanceof MarkerError) {
                return src.slice(0, src.length - dataLenAll)
            }
            throw err
        }
    }
}

async function writeData(data: Uint8Array, newData: Uint8Array, marker: string): Promise<Uint8Array> {
    if (newData.length === 0) {
        return data
    }

    // 合并数据
    const markerBytes = new TextEncoder().encode(marker)
    const lengthBytes = uint64ToBytes(newData.length)

    const result = new Uint8Array(data.length + newData.length + markerBytes.length + lengthBytes.length)
    result.set(data, 0)
    result.set(newData, data.length)
    result.set(markerBytes, data.length + newData.length)
    result.set(lengthBytes, data.length + newData.length + markerBytes.length)

    return result
}

function checkMarker(data: Uint8Array, marker: string): number {
    const markerSize = marker.length || MARKER_SIZE
    const suffixSize = markerSize + INT64_SIZE

    if (data.length < suffixSize) {
        throw new MarkerError()
    }

    const suffixBytes = data.slice(data.length - suffixSize)
    const markerBytes = suffixBytes.slice(0, markerSize)
    const markerText = new TextDecoder().decode(markerBytes)

    if (marker === '') {
        if (!markerText.startsWith(MARKER_PRE)) {
            throw new MarkerError()
        }
    } else if (markerText !== marker) {
        throw new MarkerError()
    }

    const dataLength = bytesToUint64(suffixBytes.slice(markerSize))
    return dataLength + suffixSize
}

async function readData(data: Uint8Array, marker: string): Promise<[Uint8Array, Uint8Array]> {
    const appendLength = checkMarker(data, marker)
    const markerSize = marker.length + INT64_SIZE

    if (data.length < appendLength) {
        throw new Error('数据长度无效')
    }

    const contentData = data.slice(data.length - appendLength, data.length - markerSize)
    const remainingData = data.slice(0, data.length - appendLength)
    return [contentData, remainingData]
}

// 添加读取配置的函数
export async function ReadConfig(src: Uint8Array): Promise<[Config | null, Uint8Array]> {
    try {
        const [jsonData, rawData] = await readDataJson(src)

        if (jsonData.length === 0) {
            return [null, rawData]
        }

        const jsonString = new TextDecoder().decode(jsonData)
        const config = JSON.parse(jsonString) as Config
        return [config, rawData]
    } catch (error) {
        console.error('Error reading config:', error)
        return [null, src]
    }
}
