// 判断是否为开发环境
export const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// 获取主机名
export const getHostName = () => {
    return isDev ? '' : 'https://r.parap.us.kg'
}

// 下载文件
export const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
}
