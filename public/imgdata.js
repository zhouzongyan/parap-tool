const MARKER_UNCOMPRESSED = 'DATA_END';
const MARKER_COMPRESSED = 'DATA_ZIP';

// 压缩数据
function compress(data) {
    return pako.deflate(data);
}

// 解压数据
function decompress(data) {
    return pako.inflate(data);
}

// 将字符串转换为Uint8Array
function stringToBytes(str) {
    return new TextEncoder().encode(str);
}

// 将Uint8Array转换为字符串
function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}

// 将数字转换为8字节的Uint8Array
function numberToBytes(num) {
    const arr = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
        arr[i] = num & 0xff;
        num = num >> 8;
    }
    return arr;
}

// 从8字节的Uint8Array转换为数字
function bytesToNumber(bytes) {
    let num = 0;
    for (let i = 0; i < 8; i++) {
        num = (num << 8) | bytes[i];
    }
    return num;
}

// 合并多个Uint8Array
function concatenateArrays(...arrays) {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// 检查并清理图片中的旧数据
async function cleanOldData(imageFile) {
    // 读取原始图片数据
    const originalData = new Uint8Array(await imageFile.arrayBuffer());

    // 检查是否存在旧数据
    const markerBytes = stringToBytes(MARKER_UNCOMPRESSED);
    let markerIndex = -1;
    for (let i = originalData.length - 9 - markerBytes.length; i >= 0; i--) {
        let found = true;
        for (let j = 0; j < markerBytes.length; j++) {
            if (originalData[i + j] !== markerBytes[j]) {
                found = false;
                break;
            }
        }
        if (found) {
            markerIndex = i;
            break;
        }
    }

    // 如果找到旧数据，则只返回原始图片部分
    if (markerIndex !== -1) {
        return originalData.slice(0, markerIndex);
    }
    return originalData;
}

async function embedData() {
    const imageInput = document.getElementById('imageInput');
    const dataInput = document.getElementById('dataInput');

    if (!imageInput.files[0]) {
        alert('请选择图片文件');
        return;
    }

    const imageFile = imageInput.files[0];
    // 清理旧数据
    const cleanImageData = await cleanOldData(imageFile);

    const data = stringToBytes(dataInput.value);
    // 根据选项决定是否压缩
    const useCompression = document.getElementById('useCompression').checked;
    const processedData = useCompression ? compress(data) : data;
    const markerBytes = stringToBytes(useCompression ? MARKER_COMPRESSED : MARKER_UNCOMPRESSED);
    const lengthBytes = numberToBytes(processedData.length);

    // 组合所有数据
    const finalData = concatenateArrays(
        cleanImageData,
        processedData,
        markerBytes,
        lengthBytes
    );

    // 创建下载链接
    const blob = new Blob([finalData], { type: imageFile.type });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embedded_' + imageFile.name;
    a.click();

    URL.revokeObjectURL(url);
}

// 从URL加载图片数据
async function loadImageFromUrl(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new Uint8Array(await blob.arrayBuffer());
    } catch (e) {
        throw new Error('Failed to load image from URL');
    }
}

// 通过URL检查压缩状态
async function checkCompressionStatusByUrl(url) {
    if (!url.trim()) return;

    const compressionStatus = document.getElementById('compressionStatus');
    const extractedDataDiv = document.getElementById('extractedData');

    try {
        const fileData = await loadImageFromUrl(url);
        // 更新预览
        document.getElementById('preview').src = url;
        // 清除文件选择
        document.getElementById('readImageInput').value = '';
        document.getElementById('readImageFileName').textContent = '';

        // 复用现有的检查逻辑
        let markerIndex = -1;
        let isCompressed = false;
        const markerCompressed = stringToBytes(MARKER_COMPRESSED);
        const markerUncompressed = stringToBytes(MARKER_UNCOMPRESSED);

        for (let i = fileData.length - 8 - Math.max(markerCompressed.length, markerUncompressed.length); i >= 0; i--) {
            // 检查压缩标记
            let foundCompressed = true;
            for (let j = 0; j < markerCompressed.length; j++) {
                if (fileData[i + j] !== markerCompressed[j]) {
                    foundCompressed = false;
                    break;
                }
            }
            if (foundCompressed) {
                markerIndex = i;
                isCompressed = true;
                break;
            }

            // 检查未压缩标记
            let foundUncompressed = true;
            for (let j = 0; j < markerUncompressed.length; j++) {
                if (fileData[i + j] !== markerUncompressed[j]) {
                    foundUncompressed = false;
                    break;
                }
            }
            if (foundUncompressed) {
                markerIndex = i;
                isCompressed = false;
                break;
            }
        }

        if (markerIndex === -1) {
            compressionStatus.textContent = '未检测到数据';
            compressionStatus.style.color = '#6b7280';
            extractedDataDiv.textContent = '';
            return;
        }

        if (isCompressed) {
            compressionStatus.textContent = '已压缩';
            compressionStatus.style.color = '#10b981';
        } else {
            compressionStatus.textContent = '未压缩';
            compressionStatus.style.color = '#6b7280';
        }
    } catch (e) {
        alert('加载图片失败');
        compressionStatus.textContent = '未检测';
        compressionStatus.style.color = '#6b7280';
        extractedDataDiv.textContent = '';
    }
}

async function extractData() {
    const imageInput = document.getElementById('readImageInput');
    const imageUrl = document.getElementById('imageUrl').value.trim();
    const extractedDataDiv = document.getElementById('extractedData');
    const compressionStatus = document.getElementById('compressionStatus');

    let fileData;
    if (imageUrl) {
        try {
            fileData = await loadImageFromUrl(imageUrl);
        } catch (e) {
            alert('加载图片失败');
            return;
        }
    } else if (imageInput.files[0]) {
        const imageFile = imageInput.files[0];
        fileData = new Uint8Array(await imageFile.arrayBuffer());
    } else {
        alert('请选择图片文件或输入图片URL');
        compressionStatus.textContent = '未检测';
        compressionStatus.style.color = '#6b7280';
        return;
    }

    // 查找标记
    let markerIndex = -1, isCompressed = false;
    const markerCompressed = stringToBytes(MARKER_COMPRESSED);
    const markerUncompressed = stringToBytes(MARKER_UNCOMPRESSED);

    for (let i = fileData.length - 8 - Math.max(markerCompressed.length, markerUncompressed.length); i >= 0; i--) {
        // 检查压缩标记
        let foundCompressed = true;
        for (let j = 0; j < markerCompressed.length; j++) {
            if (fileData[i + j] !== markerCompressed[j]) {
                foundCompressed = false;
                break;
            }
        }
        if (foundCompressed) {
            markerIndex = i;
            isCompressed = true;
            break;
        }

        // 检查未压缩标记
        let foundUncompressed = true;
        for (let j = 0; j < markerUncompressed.length; j++) {
            if (fileData[i + j] !== markerUncompressed[j]) {
                foundUncompressed = false;
                break;
            }
        }
        if (foundUncompressed) {
            markerIndex = i;
            isCompressed = false;
            break;
        }
    }

    if (markerIndex === -1) {
        extractedDataDiv.textContent = '未找到隐藏数据';
        compressionStatus.textContent = '未检测';
        compressionStatus.style.color = '#6b7280';
        return;
    }

    // 读取数据长度
    const currentMarker = isCompressed ? markerCompressed : markerUncompressed;
    const lengthBytes = fileData.slice(markerIndex + currentMarker.length, markerIndex + currentMarker.length + 8);
    const dataLength = bytesToNumber(lengthBytes);

    // 检查数据长度是否合理
    if (dataLength <= 0 || dataLength > markerIndex) {
        extractedDataDiv.textContent = '数据格式错误';
        compressionStatus.textContent = '未检测';
        compressionStatus.style.color = '#6b7280';
        return;
    }

    // 提取数据
    const dataStartIndex = markerIndex - dataLength;
    const extractedData = fileData.slice(dataStartIndex, dataStartIndex + dataLength);

    let text;
    if (isCompressed) {
        // 数据是压缩的，需要解压
        try {
            const decompressedData = decompress(extractedData);
            text = bytesToString(decompressedData);
            compressionStatus.textContent = '已压缩';
            compressionStatus.style.color = '#10b981'; // 绿色
        } catch (e) {
            extractedDataDiv.textContent = '解压数据失败';
            compressionStatus.textContent = '错误';
            compressionStatus.style.color = '#ef4444'; // 红色
            return;
        }
    } else {
        // 数据未压缩
        try {
            text = bytesToString(extractedData);
        } catch (e) {
            extractedDataDiv.textContent = '读取数据失败';
            compressionStatus.textContent = '错误';
            compressionStatus.style.color = '#ef4444'; // 红色   
            return;
        }
        compressionStatus.textContent = '未压缩';
        compressionStatus.style.color = '#6b7280'; // 灰色
    }

    // 显示数据，如果太长则截断
    if (text.length > 5000) {
        extractedDataDiv.textContent = text.substring(0, 5000) + '\n\n... (数据太长，已截断显示)';
    } else {
        extractedDataDiv.textContent = text;
    }
}

// 添加预览功能
function previewImage(input) {
    const preview = document.getElementById('preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
    }
}

// 切换图片输入方式（读取数据卡片）
function switchImageInput(type) {
    const filePanel = document.getElementById('fileImageInput');
    const urlPanel = document.getElementById('urlImageInput');
    const readImageInput = document.getElementById('readImageInput');
    const card = readImageInput.closest('.card');
    const buttons = card.querySelectorAll('.input-tabs .tab-btn');
    const fileBtn = buttons[0];
    const urlBtn = buttons[1];
    if (!fileBtn || !urlBtn) return;  // 安全检查
    const preview = document.getElementById('preview');

    if (type === 'file') {
        filePanel.classList.add('active');
        urlPanel.classList.remove('active');
        fileBtn.classList.add('active');
        urlBtn.classList.remove('active');
        // 清除URL输入
        document.getElementById('imageUrl').value = '';
        preview.src = '';
    } else {
        filePanel.classList.remove('active');
        urlPanel.classList.add('active');
        fileBtn.classList.remove('active');
        urlBtn.classList.add('active');
        // 清除文件选择
        document.getElementById('readImageInput').value = '';
        document.getElementById('readImageFileName').textContent = '';
        // 如果有URL，更新预览
        const url = document.getElementById('imageUrl').value.trim();
        if (url) {
            preview.src = url;
        } else {
            preview.src = '';
        }
    }
    // 重置压缩状态
    document.getElementById('compressionStatus').textContent = '未检测';
    document.getElementById('compressionStatus').style.color = '#6b7280';
    document.getElementById('extractedData').textContent = '';
}

// 主题相关函数
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getSystemTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(getSystemTheme());
    }
}

// 文件名更新函数
function updateFileName(input, elementId) {
    const fileName = input.files[0]?.name || '';
    document.getElementById(elementId).textContent = fileName;
}

// 加载数据文件
async function loadDataFile(input) {
    updateFileName(input, 'dataFileName');
    if (!input.files[0]) return;

    try {
        const text = await input.files[0].text();
        document.getElementById('dataInput').value = text;
        // 切换到文件输入标签
        switchDataInput('file');
    } catch (e) {
        alert('读取文件失败');
    }
}

// ��数据输入方式（写入数据卡片）
function switchDataInput(type) {
    const textPanel = document.getElementById('textInput');
    const filePanel = document.getElementById('fileInput');
    const buttons = document.querySelectorAll('.data-input-section .input-tabs .tab-btn');
    const textBtn = buttons[0];
    const fileBtn = buttons[1];
    if (!textBtn || !fileBtn) return;  // 安全检查

    if (type === 'text') {
        textPanel.classList.add('active');
        filePanel.classList.remove('active');
        textBtn.classList.add('active');
        fileBtn.classList.remove('active');
        // 清除文件选择
        document.getElementById('dataFileInput').value = '';
        document.getElementById('dataFileName').textContent = '';
    } else {
        textPanel.classList.remove('active');
        filePanel.classList.add('active');
        textBtn.classList.remove('active');
        fileBtn.classList.add('active');
        // 清除文本输入
        document.getElementById('dataInput').value = '';
    }
}

// 初始化主题监听
window.addEventListener('load', () => {
    initTheme();

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}); 