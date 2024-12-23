import pako from 'pako'

// 常量定义
export const MARKER_UNCOMPRESSED = 'DATA_END'
export const MARKER_COMPRESSED = 'DATA_ZIP'

// 工具函数
export const stringToBytes = (str: string) => new TextEncoder().encode(str)
export const bytesToString = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

export const numberToBytes = (num: number) => {
    const arr = new Uint8Array(8)
    for (let i = 7; i >= 0; i--) {
        arr[i] = num & 0xff
        num = num >> 8
    }
    return arr
}

export const bytesToNumber = (bytes: Uint8Array) => {
    let num = 0
    for (let i = 0; i < 8; i++) {
        num = (num << 8) | bytes[i]
    }
    return num
}

export const concatenateArrays = (...arrays: Uint8Array[]) => {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
        result.set(arr, offset)
        offset += arr.length
    }
    return result
}

export const checkMarker = (data: Uint8Array, start: number, marker: Uint8Array) => {
    for (let j = 0; j < marker.length; j++) {
        if (data[start + j] !== marker[j]) return false
    }
    return true
}

// 添加一个函数来处理后缀名
const getExtensionBytes = (extension: string): Uint8Array => {
    // 移除点号并转换为小写
    extension = extension.replace(/^\./, '').toLowerCase()
    // 创建8字节的数组
    const bytes = new Uint8Array(8)
    // 将后缀名转换为字节
    const encoder = new TextEncoder()
    const extensionBytes = encoder.encode(extension)
    // 复制最多8个字节
    bytes.set(extensionBytes.slice(0, 8))
    return bytes
}

const getExtensionFromBytes = (bytes: Uint8Array): string => {
    // 找到第一个0字节的位置
    let end = bytes.findIndex(b => b === 0)
    if (end === -1) end = 8
    // 转换为字符串
    return new TextDecoder().decode(bytes.slice(0, end))
}

// 主要功能函数
export const embedDataToImage = async (
    imageFile: File,
    data: string | Uint8Array,
    useCompression: boolean,
    isText: boolean = true,
    extension?: string
) => {
    try {
        // 1. 根据输入类型处理数据
        const inputData = isText ? stringToBytes(data as string) : data as Uint8Array

        // 2. 根据需要压缩数据
        const processedData = useCompression ? pako.deflate(inputData) : inputData

        // 3. 准备标记和长度信息
        const markerBytes = stringToBytes(useCompression ? MARKER_COMPRESSED : MARKER_UNCOMPRESSED)
        const lengthBytes = numberToBytes(processedData.length)

        // 4. 准备后缀名信息
        const extensionBytes = getExtensionBytes(extension || (isText ? 'txt' : ''))

        // 5. 获取原始图片数据
        const imageData = new Uint8Array(await imageFile.arrayBuffer())

        // 6. 验证数据大小
        const totalSize = imageData.length + processedData.length + markerBytes.length +
            lengthBytes.length + extensionBytes.length
        if (totalSize > Number.MAX_SAFE_INTEGER) {
            throw new Error('数据太大')
        }

        // 7. 按照正确的顺序组合数据
        return concatenateArrays(
            imageData,      // 原始图片数据
            processedData,  // 处理后的数据
            markerBytes,    // 标记
            extensionBytes, // 后缀名（8字节）
            lengthBytes     // 长度信息（8字节）
        )
    } catch (e) {
        console.error('Error in embedDataToImage:', e)
        throw e
    }
}

export const checkImageCompression = async (fileData: Uint8Array) => {
    let markerIndex = -1
    let isCompressed = false
    const markerCompressed = stringToBytes(MARKER_COMPRESSED)
    const markerUncompressed = stringToBytes(MARKER_UNCOMPRESSED)

    for (let i = fileData.length - 8 - Math.max(markerCompressed.length, markerUncompressed.length); i >= 0; i--) {
        if (checkMarker(fileData, i, markerCompressed)) {
            markerIndex = i
            isCompressed = true
            break
        }
        if (checkMarker(fileData, i, markerUncompressed)) {
            markerIndex = i
            isCompressed = false
            break
        }
    }

    if (markerIndex === -1) {
        return { found: false }
    }

    return { found: true, isCompressed }
}

export const extractDataFromImage = async (fileData: Uint8Array) => {
    let markerIndex = -1
    let isCompressed = false
    const markerCompressed = stringToBytes(MARKER_COMPRESSED)
    const markerUncompressed = stringToBytes(MARKER_UNCOMPRESSED)

    // 从文件末尾开始查找标记
    for (let i = fileData.length - 16 - Math.max(markerCompressed.length, markerUncompressed.length); i >= 0; i--) {
        if (checkMarker(fileData, i, markerCompressed)) {
            markerIndex = i
            isCompressed = true
            break
        }
        if (checkMarker(fileData, i, markerUncompressed)) {
            markerIndex = i
            isCompressed = false
            break
        }
    }

    if (markerIndex === -1) {
        return { success: false, error: '未找到隐藏数据' }
    }

    try {
        const currentMarker = isCompressed ? markerCompressed : markerUncompressed

        // 读取后缀名（在标记后的8字节）
        const extensionBytes = fileData.slice(markerIndex + currentMarker.length, markerIndex + currentMarker.length + 8)
        const extension = getExtensionFromBytes(extensionBytes)

        // 读取数据长度（在后缀名后的8字节）
        const lengthBytes = fileData.slice(markerIndex + currentMarker.length + 8, markerIndex + currentMarker.length + 16)
        const dataLength = bytesToNumber(lengthBytes)

        if (dataLength <= 0 || dataLength > markerIndex) {
            return { success: false, error: '数据格式错误' }
        }

        const dataStartIndex = markerIndex - dataLength
        let extractedBytes = fileData.slice(dataStartIndex, markerIndex)

        if (isCompressed) {
            extractedBytes = pako.inflate(extractedBytes)
        }

        // 如果是文本格式，提供预览
        const isTextFile = extension === 'txt' || extension === ''
        if (isTextFile) {
            const decompressedText = bytesToString(extractedBytes)
            const displayText = decompressedText.length > 5000
                ? decompressedText.substring(0, 5000) + '\n\n... (数据太长，已截断显示)'
                : decompressedText

            return {
                success: true,
                dataRaw: extractedBytes,
                displayData: displayText,
                extension,
                isCompressed
            }
        } else {
            // 对于非文本文件，不提供预览
            return {
                success: true,
                dataRaw: extractedBytes,
                displayData: `二进制文件 (${extension})`,
                extension,
                isCompressed
            }
        }
    } catch (e) {
        console.error('Data extraction failed:', e)
        return { success: false, error: '读取数据失败' }
    }
}
// 从URL加载图片数据
export const loadImageFromUrl = async (url: string) => {
    // 1. 先尝试直接获取图片
    try {
        const response = await fetch(url, {
            mode: 'cors',  // 尝试CORS请求
            credentials: 'omit',
            referrerPolicy: 'no-referrer'
        })
        if (response.ok) {
            const blob = await response.blob()
            return new Uint8Array(await blob.arrayBuffer())
        }
    } catch (e) {
        console.warn('Direct fetch failed, trying proxy:', e)
    }
}

// 添加一个辅助函数来检查文件大小
export const checkFileSize = (size: number) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    return size <= maxSize
} 