<template>
    <div class="html-to-apk">
        <h1>HTML转APK工具</h1>
        <div class="container">
            <!-- WebView内容输入 -->
            <div class="card">
                <h3>WebView内容</h3>
                <div class="input-tabs">
                    <button class="tab-btn" :class="{ active: activeInput === 'url' }" @click="switchInput('url')">
                        网址
                    </button>
                    <button class="tab-btn" :class="{ active: activeInput === 'html' }" @click="switchInput('html')">
                        HTML源码
                    </button>
                    <button class="tab-btn" :class="{ active: activeInput === 'zip' }" @click="switchInput('zip')">
                        压缩包
                    </button>
                </div>

                <div class="input-panel" :class="{ active: activeInput === 'url' }">
                    <input type="text" v-model="webviewUrl" placeholder="请输入网址" class="input-field">
                </div>

                <div class="input-panel" :class="{ active: activeInput === 'html' }">
                    <textarea v-model="htmlContent" placeholder="请输入HTML源码" class="input-field textarea"></textarea>
                </div>

                <div class="input-panel" :class="{ active: activeInput === 'zip' }">
                    <FileUpload ref="zipUploadRef" v-model="zipFileName" input-id="zipInput" accept=".zip"
                        placeholder="选择ZIP文件或拖拽至此" icon="📦" @file-selected="handleZipSelected" />
                </div>
            </div>

            <!-- APK信息输入 -->
            <div class="card">
                <h3>APK信息</h3>
                <div class="form-container">
                    <div class="form-row">
                        <div class="form-group">
                            <label>软件名称 (label)</label>
                            <div class="input-group">
                                <input type="text" v-model="apkInfo.label" placeholder="请输入软件名称" class="input-field">
                                <span class="field-desc">对应 application.label，用于显示软件名</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>版本号 (versionCode)</label>
                            <div class="input-group">
                                <input type="number" v-model="apkInfo.versionCode" placeholder="请输入版本号"
                                    class="input-field">
                                <span class="field-desc">对应 manifest.android:versionCode，用于更新软件</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>版本名称 (versionName)</label>
                            <div class="input-group">
                                <input type="text" v-model="apkInfo.versionName" placeholder="请输入版本名称"
                                    class="input-field">
                                <span class="field-desc">对应 manifest.android:versionName，用于显示软件版本号</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Btn @click="generateApk" :loading="isGenerating">
                {{ isGenerating ? '生成中...' : '生成APK' }}
            </Btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from '@/components/FileUpload.vue'
import Btn from '@/components/Btn.vue'
// 状态管理
const activeInput = ref('url')
const webviewUrl = ref('')
const htmlContent = ref('')
const zipFileName = ref('')
const zipFile = ref<File | null>(null)
const isGenerating = ref(false)

const apkInfo = ref({
    label: 'WebViewDemo',
    versionCode: 1,
    versionName: '1.0.0'
})

// 切换输入类型
const switchInput = (type: 'url' | 'html' | 'zip') => {
    activeInput.value = type
}

// 处理ZIP文件选择
const handleZipSelected = (file: File) => {
    zipFile.value = file
}

// 生成APK
const generateApk = async () => {
    if (!validateInputs()) {
        return
    }

    isGenerating.value = true
    try {
        const formData = new FormData()
        const requestData: any = {
            manifest: {
                version_code: apkInfo.value.versionCode,
                version_name: apkInfo.value.versionName,
                label: apkInfo.value.label,
                package: 'com.example.webview'
            }
        }

        // 根据不同的输入类型设置内容
        if (activeInput.value === 'url') {
            requestData.url = webviewUrl.value
        } else if (activeInput.value === 'html') {
            requestData.index_html = new TextEncoder().encode(htmlContent.value)
        } else if (activeInput.value === 'zip' && zipFile.value) {
            requestData.html_zip = new Uint8Array(await zipFile.value.arrayBuffer())
        }

        const response = await fetch('/tool/html2apk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })

        if (!response.ok) {
            throw new Error('APK generation failed')
        }

        // 下载生成的APK
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'webview.apk'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

    } catch (error) {
        console.error('APK generation failed:', error)
        alert('APK生成失败！')
    } finally {
        isGenerating.value = false
    }
}

// 验证输入
const validateInputs = () => {
    if (!apkInfo.value.label) {
        alert('请输入软件名称')
        return false
    }

    if (activeInput.value === 'url' && !webviewUrl.value) {
        alert('请输入网址')
        return false
    }

    if (activeInput.value === 'html' && !htmlContent.value) {
        alert('请输入HTML源码')
        return false
    }

    if (activeInput.value === 'zip' && !zipFile.value) {
        alert('请选择ZIP文件')
        return false
    }

    return true
}
</script>

<style scoped>
.html-to-apk {
    max-width: 800px;
    margin: 0 auto;
    padding: 15px;
}

.container {
    display: grid;
    gap: 15px;
}

.card {
    background: var(--c-bg);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

h1 {
    font-size: 1.5em;
    margin-bottom: 15px;
    text-align: center;
}

h3 {
    font-size: 1.1em;
    margin-bottom: 12px;
}

.input-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
}

.tab-btn {
    flex: 1;
    padding: 8px;
    background: var(--c-bg-soft);
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    cursor: pointer;
    color: var(--c-text-1);
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

.input-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    background: var(--c-bg);
    color: var(--c-text-1);
    font-size: 0.9em;
}

.textarea {
    height: 200px;
    resize: vertical;
}

.form-container {
    padding: 0 15px;
}

.form-row {
    display: flex;
    gap: 20px;
    justify-content: space-between;
}

.form-group {
    flex: 1;
    min-width: 0;
    /* 防止flex项溢出 */
    max-width: 250px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: var(--c-text-1);
    font-size: 0.9em;
}

.input-group {
    width: 100%;
}

.input-field {
    width: 100%;
}

.field-desc {
    display: block;
    font-size: 0.8em;
    color: var(--c-text-2);
    margin-top: 4px;
}

/* 响应式布局 */
@media (max-width: 768px) {
    .form-row {
        flex-direction: column;
        gap: 15px;
    }

    .form-group {
        max-width: none;
    }
}

button {
    width: 100%;
    padding: 12px;
    background: var(--c-blue);
    color: var(--c-white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
}

button:disabled {
    background: var(--c-gray-3);
    cursor: not-allowed;
}

.actions {
    text-align: center;
}
</style>