<template>
    <div class="html-to-apk">
        <h1>HTML转APK工具</h1>
        <div class="container">
            <WebviewForm v-model="activeInput" v-model:url="webviewUrl" v-model:html="htmlContent"
                v-model:zipName="zipFileName" @zip-selected="handleZipSelected">
                <!-- APK配置部分 -->
                <div class="card">
                    <h3>APK信息</h3>
                    <div class="form-container">
                        <div class="form-row">
                            <div class="form-group">
                                <label>软件名称 (label)</label>
                                <div class="input-group">
                                    <input type="text" v-model="apkInfo.label" placeholder="请输入软件名称"
                                        class="input-field">
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
            </WebviewForm>

            <Btn @click="generateApk" :loading="isGenerating">
                {{ isGenerating ? '生成中...' : '生成APK' }}
            </Btn>
        </div>
        <Alert ref="alertRef" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WebviewForm from '@/components/WebviewForm.vue'
import Btn from '@/components/Btn.vue'
import { getHostName, downloadFile } from '@/utils/dev'
import Alert from '@/components/Alert.vue'

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

// 添加 alert 组件引用
const alertRef = ref()

// 切换输入类型
const switchInput = (type: 'url' | 'html' | 'zip') => {
    activeInput.value = type
}

// 处理ZIP文件选择
const handleZipSelected = (file: File) => {
    zipFile.value = file
    zipFileName.value = file.name
}

// 格式化URL
const formatUrl = (url: string) => {
    if (!url) return url
    url = url.trim()
    // 如果是相对路径或者没有协议前缀，添加 https://
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
        return `https://${url}`
    }
    return url
}

// 生成APK
const generateApk = async () => {
    if (!validateInputs()) {
        return
    }

    isGenerating.value = true
    try {
        const formData = new FormData()

        // 添加 manifest 信息
        formData.append('manifest', JSON.stringify({
            version_code: apkInfo.value.versionCode,
            version_name: apkInfo.value.versionName,
            label: apkInfo.value.label,
            package: ''
        }))

        // 只添加当前激活标签的内容
        if (activeInput.value === 'url' && webviewUrl.value) {
            formData.append('url', formatUrl(webviewUrl.value))
        } else if (activeInput.value === 'html' && htmlContent.value) {
            const htmlFile = new File([htmlContent.value], 'index.html', {
                type: 'text/html'
            })
            formData.append('html_file', htmlFile)
        } else if (activeInput.value === 'zip' && zipFile.value) {
            formData.append('zip_file', zipFile.value)
        } else {
            throw new Error('No valid content selected')
        }
        const hostName = await getHostName()
        const response = await fetch(`${hostName}/tool/html2apk`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error('APK generation failed')
        }
        if (window.wvPort) {
            const blob = await response.text()
            alertRef.value.show(blob)
        } else {
            const blob = await response.blob()
            downloadFile(blob, 'webview.apk')
        }
    } catch (error) {
        console.error('APK generation failed:', error)
        alertRef.value.show('APK生成失败！')
    } finally {
        isGenerating.value = false
    }
}

// 验证输入
const validateInputs = () => {
    if (!apkInfo.value.label) {
        alertRef.value.show('请输入软件名称')
        return false
    }

    if (activeInput.value === 'url') {
        if (!webviewUrl.value) {
            alertRef.value.show('请输入网址')
            return false
        }
        webviewUrl.value = formatUrl(webviewUrl.value)
    }

    if (activeInput.value === 'html' && !htmlContent.value) {
        alertRef.value.show('请输入HTML源码')
        return false
    }

    if (activeInput.value === 'zip' && !zipFile.value) {
        alertRef.value.show('请选择ZIP文件')
        return false
    }

    return true
}

const updateConfig = (newConfig: Partial<typeof apkInfo.value>) => {
    apkInfo.value = { ...apkInfo.value, ...newConfig }
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

/* 添加配置表单样式 */
.form-container {
    padding: 0 15px;
}

.form-row {
    display: flex;
    gap: 15px;
    justify-content: space-between;
}

.form-group {
    flex: 1;
    min-width: 0;
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

.field-desc {
    display: block;
    font-size: 0.8em;
    color: var(--c-text-2);
    margin-top: 4px;
}

@media (max-width: 768px) {
    .form-row {
        flex-direction: column;
        gap: 15px;
    }
}
</style>