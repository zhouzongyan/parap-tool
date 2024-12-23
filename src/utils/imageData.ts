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

// 主要功能函数
export const embedDataToImage = async (imageFile: File, data: string, useCompression: boolean) => {
    try {
        // 1. 将文本数据转换为字节
        const textData = stringToBytes(data)

        // 2. 根据需要压缩数据
        const processedData = useCompression ? pako.deflate(textData) : textData

        // 3. 准备标记和长度信息
        const markerBytes = stringToBytes(useCompression ? MARKER_COMPRESSED : MARKER_UNCOMPRESSED)
        const lengthBytes = numberToBytes(processedData.length)

        // 4. 获取原始图片数据
        const imageData = new Uint8Array(await imageFile.arrayBuffer())

        // 5. 验证数据大小
        const totalSize = imageData.length + processedData.length + markerBytes.length + lengthBytes.length
        if (totalSize > Number.MAX_SAFE_INTEGER) {
            throw new Error('数据太大')
        }

        // 6. 按照正确的顺序组合数据
        return concatenateArrays(
            imageData,      // 原始图片数据
            processedData,  // 处理后的数据（可能是压缩的）
            markerBytes,    // 标记（DATA_END 或 DATA_ZIP）
            lengthBytes     // 8字节的长度信息
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
        return { success: false, error: '未找到隐藏数据' }
    }

    const currentMarker = isCompressed ? markerCompressed : markerUncompressed
    const lengthBytes = fileData.slice(markerIndex + currentMarker.length, markerIndex + currentMarker.length + 8)
    const dataLength = bytesToNumber(lengthBytes)

    if (dataLength <= 0 || dataLength > markerIndex) {
        return { success: false, error: '数据格式错误' }
    }

    const dataStartIndex = markerIndex - dataLength
    const extractedBytes = fileData.slice(dataStartIndex, dataStartIndex + dataLength)

    try {
        const text = isCompressed
            ? bytesToString(pako.inflate(extractedBytes))
            : bytesToString(extractedBytes)

        return {
            success: true,
            data: text,
            isCompressed
        }
    } catch (e) {
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