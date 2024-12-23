<template>
    <div class="image-data">
        <h1>图片数据隐写工具</h1>
        <div class="container">
            <!-- 写入数据卡片 -->
            <div class="card">
                <h3>写入数据</h3>
                <div class="file-input-wrapper" style="display: flex; justify-content: space-between">
                    <div>
                        <label class="file-input-label" for="imageInput">选择图片文件</label>
                        <input type="file" id="imageInput" accept="image/*" @change="handleImageInput">
                        <div class="file-name">{{ imageFileName }}</div>
                    </div>
                </div>
                <div class="data-input-section">
                    <div class="input-tabs">
                        <button class="tab-btn" :class="{ active: activeDataInput === 'text' }"
                            @click="switchDataInput('text')">
                            手动输入
                        </button>
                        <button class="tab-btn" :class="{ active: activeDataInput === 'file' }"
                            @click="switchDataInput('file')">
                            文件输入
                        </button>
                    </div>
                    <div id="textInput" class="input-panel" :class="{ active: activeDataInput === 'text' }">
                        <textarea v-model="dataInput" placeholder="输入要隐藏的数据..."></textarea>
                    </div>
                    <div id="fileInput" class="input-panel" :class="{ active: activeDataInput === 'file' }">
                        <div class="file-input-wrapper">
                            <label class="file-input-label" for="dataFileInput">选择数据文件</label>
                            <input type="file" id="dataFileInput" @change="loadDataFile">
                            <div class="file-name">{{ dataFileName }}</div>
                        </div>
                    </div>
                </div>
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="useCompression" v-model="useCompression">
                    <label for="useCompression">使用压缩（可以存储更多数据）</label>
                </div>
                <button @click="embedData">处理并下载</button>
            </div>

            <!-- 读取数据卡片 -->
            <div class="card">
                <h3>读取数据</h3>
                <div class="data-input-section">
                    <div class="input-tabs">
                        <button class="tab-btn" :class="{ active: activeImageInput === 'file' }"
                            @click="switchImageInput('file')">
                            本地图片
                        </button>
                        <button class="tab-btn" :class="{ active: activeImageInput === 'url' }"
                            @click="switchImageInput('url')">
                            网络图片
                        </button>
                    </div>
                    <div id="fileImageInput" class="input-panel" :class="{ active: activeImageInput === 'file' }">
                        <div class="file-input-wrapper">
                            <label class="file-input-label" for="readImageInput">选择图片文件</label>
                            <input type="file" id="readImageInput" accept="image/*" @change="handleReadImageInput">
                            <div class="file-name">{{ readImageFileName }}</div>
                        </div>
                    </div>
                    <div id="urlImageInput" class="input-panel" :class="{ active: activeImageInput === 'url' }">
                        <input type="text" v-model="imageUrl" placeholder="输入图片URL..." class="url-input"
                            @change="checkCompressionStatusByUrl">
                    </div>
                </div>
                <div class="compression-status">
                    <span>压缩状态：</span>
                    <span :style="{ color: compressionStatusColor }">{{ compressionStatus }}</span>
                </div>
                <button @click="extractData" :disabled="isLoading">
                    {{ isLoading ? '加载中...' : '读取数据' }}
                </button>
                <div class="extracted-data">{{ extractedData }}</div>
                <button v-if="extractedData" @click="downloadExtractedData" class="download-btn">
                    下载数据
                </button>
            </div>

            <!-- 预览卡片 -->
            <div class="preview card">
                <h3>预览</h3>
                <img :src="previewSrc" referrerpolicy="no-referrer" crossorigin="anonymous" v-if="previewSrc" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    embedDataToImage,
    checkImageCompression,
    extractDataFromImage,
    loadImageFromUrl
} from '@/utils/imageData'

// 状态管理
const activeDataInput = ref('text')
const activeImageInput = ref('file')
const imageFileName = ref('')
const dataFileName = ref('')
const readImageFileName = ref('')
const dataInput = ref<string | Uint8Array>('')
const imageUrl = ref('')
const useCompression = ref(true)
const compressionStatus = ref('未检测')
const extractedData = ref('')
const extractedDataRaw = ref('')
const previewSrc = ref('')
const isLoading = ref(false)
const isFileInput = ref(false)
const fileExtension = ref('')
const extractResult = ref<{
    success: boolean;
    dataRaw?: Uint8Array;
    displayData?: string;
    extension?: string;
    error?: string;
} | null>(null)

// 计算属性
const compressionStatusColor = computed(() => {
    switch (compressionStatus.value) {
        case '已压缩':
            return 'var(--c-green)'
        case '错误':
            return 'var(--c-red)'
        default:
            return 'var(--c-text-2)'
    }
})

// 处理函数
const switchDataInput = (type: 'text' | 'file') => {
    activeDataInput.value = type
    if (type === 'text') {
        dataFileName.value = ''
        isFileInput.value = false
        dataInput.value = ''
    } else {
        dataInput.value = ''
        isFileInput.value = true
    }
}

const switchImageInput = (type: 'file' | 'url') => {
    activeImageInput.value = type
    if (type === 'file') {
        imageUrl.value = ''
        previewSrc.value = ''
    } else {
        readImageFileName.value = ''
        const url = imageUrl.value.trim()
        if (url) {
            previewSrc.value = url
        }
    }
    compressionStatus.value = '未检测'
    extractedData.value = ''
}

const handleImageInput = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        imageFileName.value = input.files[0].name
        const reader = new FileReader()
        reader.onload = (e) => {
            previewSrc.value = e.target?.result as string
        }
        reader.readAsDataURL(input.files[0])
    }
}

const handleReadImageInput = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        readImageFileName.value = input.files[0].name
        await checkCompressionStatus(input.files[0])
    }
}

const loadDataFile = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        const file = input.files[0]
        dataFileName.value = file.name
        try {
            const buffer = await file.arrayBuffer()
            dataInput.value = new Uint8Array(buffer)
            isFileInput.value = true
            fileExtension.value = file.name.split('.').pop() || ''
        } catch (e) {
            alert('读取文件失败')
        }
    }
}

// 主要功能函数
const embedData = async () => {
    const imageInput = document.getElementById('imageInput') as HTMLInputElement
    if (!imageInput.files?.[0]) {
        alert('请选择图片文件')
        return
    }

    if (!dataInput.value) {
        alert('请输入要隐藏的数据')
        return
    }

    const imageFile = imageInput.files[0]
    try {
        const finalData = await embedDataToImage(
            imageFile,
            dataInput.value,
            useCompression.value,
            !isFileInput.value,
            fileExtension.value
        )

        // 创建下载链接
        const blob = new Blob([finalData], { type: imageFile.type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'embedded_' + imageFile.name
        a.click()
        URL.revokeObjectURL(url)
    } catch (e) {
        console.error('Data embedding failed:', e)
        alert('数据写入失败')
    }
}

const checkCompressionStatus = async (file: File) => {
    const fileData = new Uint8Array(await file.arrayBuffer())
    const result = await checkImageCompression(fileData)
    if (!result.found) {
        compressionStatus.value = '未检测到数据'
        extractedData.value = ''
        return
    }
    compressionStatus.value = result.isCompressed ? '已压缩' : '未压缩'
}

const checkCompressionStatusByUrl = async () => {
    if (!imageUrl.value.trim()) return
    try {
        // 验证URL格式
        try {
            new URL(imageUrl.value)
        } catch {
            alert('请输入有效的URL')
            return
        }

        const fileData = await loadImageFromUrl(imageUrl.value)
        const result = await checkImageCompression(fileData)
        if (!result.found) {
            compressionStatus.value = '未检测到数据'
            extractedData.value = ''
            return
        }
        compressionStatus.value = result.isCompressed ? '已压缩' : '未压缩'
        // 更新预览
        previewSrc.value = imageUrl.value
    } catch (e) {
        alert(e instanceof Error ? e.message : '加载图片失败')
        compressionStatus.value = '未检测'
        extractedData.value = ''
        previewSrc.value = ''
    }
}

const extractData = async () => {
    let fileData: Uint8Array
    if (activeImageInput.value === 'url') {
        if (!imageUrl.value.trim()) {
            alert('请输入图片URL')
            return
        }
        try {
            fileData = await loadImageFromUrl(imageUrl.value)
        } catch (e) {
            alert(e instanceof Error ? e.message : '加载图片失败')
            return
        }
    } else {
        const imageInput = document.getElementById('readImageInput') as HTMLInputElement
        if (!imageInput.files?.[0]) {
            alert('请选择图片文件')
            return
        }
        fileData = new Uint8Array(await imageInput.files[0].arrayBuffer())
    }

    const result = await extractDataFromImage(fileData)
    if (!result.success) {
        extractedData.value = result.error
        extractedDataRaw.value = ''
        extractResult.value = null
        compressionStatus.value = result.error === '数据格式错误' ? '错误' : '未检测'
        return
    }

    // 使用显示数据和完整数据分别赋值
    extractedData.value = result.displayData
    extractedDataRaw.value = result.dataRaw
    extractResult.value = result
    compressionStatus.value = result.isCompressed ? '已压缩' : '未压缩'
}

// 修改下载函数
const downloadExtractedData = () => {
    if (!extractedDataRaw.value || !extractResult.value) return

    const blob = new Blob([extractedDataRaw.value])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = extractResult.value.extension || 'txt'
    a.download = `extracted_data_${timestamp}.${extension}`

    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
</script>

<style scoped>
.image-data {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 20px;
}

.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

h1 {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--c-text-1);
    margin-bottom: 30px;
    font-size: 2.5em;
}

.card {
    background: var(--c-bg);
    padding: 30px;
    border-radius: 15px;
    box-shadow: var(--vt-shadow-2);
    transition: all 0.3s ease;
    border: 1px solid var(--c-divider);
    backdrop-filter: blur(10px);
}

.card:hover {
    box-shadow: var(--vt-shadow-3);
}

h3 {
    color: var(--c-text-1);
    margin-bottom: 20px;
    font-size: 1.5em;
}

.input-group {
    margin-bottom: 20px;
}

.file-input-wrapper {
    position: relative;
    margin-bottom: 20px;
}

.file-input-wrapper input[type="file"] {
    display: none;
}

.file-input-label {
    display: inline-block;
    padding: 12px 20px;
    background: var(--c-blue);
    color: var(--c-white);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease;
    box-shadow: var(--vt-shadow-1);
}

.file-input-label:hover {
    background: var(--c-blue-dark);
}

.file-name {
    margin-top: 8px;
    font-size: 0.9em;
    color: var(--c-text-2);
}

textarea {
    width: 100%;
    height: 120px;
    padding: 15px;
    border: 1px solid var(--c-divider);
    border-radius: 8px;
    resize: vertical;
    font-family: inherit;
    margin-bottom: 20px;
    background-color: var(--c-bg);
    color: var(--c-text-1);
}

textarea:focus {
    border-color: var(--c-blue);
    outline: none;
}

.input-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.tab-btn {
    flex: 1;
    padding: 8px 15px;
    background: var(--c-bg-soft);
    border: 1px solid var(--c-divider);
    color: var(--c-text-1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab-btn.active {
    background: var(--c-blue);
    color: var(--c-white);
    border-color: var(--c-blue);
}

.input-panel {
    display: none;
}

.input-panel.active {
    display: block;
}

.checkbox-wrapper {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--c-text-1);
}

.compression-status {
    margin-bottom: 20px;
    padding: 8px;
    border-radius: 6px;
    background: var(--c-bg-soft);
    border: 1px solid var(--c-divider);
    color: var(--c-text-1);
}

.extracted-data {
    margin-top: 20px;
    padding: 15px;
    background: var(--c-bg-soft);
    border-radius: 8px;
    border: 1px solid var(--c-divider);
    min-height: 100px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--c-text-1);
}

.preview {
    grid-column: 1 / -1;
    text-align: center;
}

.preview img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: var(--vt-shadow-1);
    margin-top: 20px;
    border: 1px solid var(--c-divider);
    background: var(--c-bg-soft);
}

.url-input {
    width: 100%;
    padding: 12px 20px;
    margin-bottom: 20px;
    border: 1px solid var(--c-divider);
    border-radius: 8px;
    font-family: inherit;
    background-color: var(--c-bg);
    color: var(--c-text-1);
}

.url-input:focus {
    border-color: var(--c-blue);
    outline: none;
}

button {
    background: var(--c-blue);
    color: var(--c-white);
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s ease;
    width: 100%;
    box-shadow: var(--vt-shadow-1);
}

button:hover {
    background: var(--c-blue-dark);
    box-shadow: var(--vt-shadow-2);
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}

/* 添加下载按钮的样式 */
.download-btn {
    margin-top: 20px;
    background: var(--c-green);
}

.download-btn:hover {
    background: var(--c-green-dark);
}
</style>