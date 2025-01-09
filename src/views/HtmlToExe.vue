<template>
    <div class="html-to-exe">
        <h1>HTML转EXE工具</h1>
        <div class="container">
            <WebviewForm v-model="activeInput" v-model:url="webviewUrl" v-model:html="htmlContent"
                v-model:zipName="zipFileName" @zip-selected="handleZipSelected"
                @html-file-selected="handleHtmlSelected">
                <!-- EXE配置部分 -->

                <h3>EXE信息</h3>
                <div class="form-container">
                    <div class="form-row">
                        <div class="form-group">
                            <label>软件名称 (title)</label>
                            <div class="input-group">
                                <input type="text" v-model="exeInfo.title" placeholder="请输入软件名称" class="input-field">
                                <span class="field-desc">显示在窗口标题栏的名称</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>端口号 (port)</label>
                            <div class="input-group">
                                <input type="number" v-model="exeInfo.port" placeholder="请输入端口号" class="input-field">
                                <span class="field-desc">服务端口号</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>窗口宽度 (width)</label>
                            <div class="input-group">
                                <input type="number" v-model="exeInfo.width" placeholder="请输入窗口宽度" class="input-field">
                                <span class="field-desc">窗口的宽度，单位为像素</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>窗口高度 (height)</label>
                            <div class="input-group">
                                <input type="number" v-model="exeInfo.height" placeholder="请输入窗口高度" class="input-field">
                                <span class="field-desc">窗口的高度，单位为像素</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>调试模式 (debug)</label>
                            <div class="input-group">
                                <input type="checkbox" v-model="exeInfo.debug" class="checkbox-field">
                                <span class="field-desc">是否启用调试模式</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>窗口提示 (hint)</label>
                            <div class="input-group">
                                <select v-model="exeInfo.hint" class="input-field">
                                    <option value="HintNone">无</option>
                                    <option value="HintMin">最小化</option>
                                    <option value="HintMax">最大化</option>
                                    <option value="HintFixed">固定大小</option>
                                </select>
                                <span class="field-desc">窗口显示方式</span>
                            </div>
                        </div>
                    </div>
                </div>
            </WebviewForm>

            <div class="button-group">
                <Btn @click="generateExe('webview.exe')" :loading="isGenerating">
                    {{ isGenerating ? '生成中...' : '生成EXE(windows)' }}
                </Btn>
                <Btn @click="generateExe('webview')" :loading="isGenerating">
                    {{ isGenerating ? '生成中...' : '生成APP(macos)' }}
                </Btn>
            </div>
        </div>
        <Alert ref="alertRef" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WebviewForm from '@/components/WebviewForm.vue'
import Btn from '@/components/Btn.vue'
import Alert from '@/components/Alert.vue'
import { WriteDataJson, WebviewInput, Config } from '@/utils/exeData'

// 状态管理
const activeInput = ref('url')
const webviewUrl = ref('')
const htmlContent = ref('')
const zipFileName = ref('')
const zipFile = ref<File | null>(null)
const isGenerating = ref(false)

const exeInfo = ref({
    port: 0,
    width: 800,
    height: 600,
    title: 'WebView',
    debug: true,
    hint: 'HintNone'
})

const alertRef = ref()

// 切换输入类型
const switchInput = (type: 'url' | 'html' | 'zip') => {
    activeInput.value = type
}

// 处理ZIP文件选择
const handleZipSelected = (file: File) => {
    zipFile.value = file
}

// 格式化URL
const formatUrl = (url: string) => {
    if (!url) return url
    if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`
    }
    return url
}

// 生成应用
const generateExe = async (target: string) => {
    if (!validateInputs()) return

    isGenerating.value = true
    try {
        // 获取 webview 文件
        const webviewResponse = await fetch(`/${target}`)
        if (!webviewResponse.ok) {
            throw new Error(`Failed to load ${target}`)
        }
        const webviewData = new Uint8Array(await webviewResponse.arrayBuffer())
        // 准备输入数据
        let input: WebviewInput
        if (activeInput.value === 'url' && webviewUrl.value) {
            input = {
                type: 'url',
                url: formatUrl(webviewUrl.value)
            }
        } else if (activeInput.value === 'html' && htmlContent.value) {
            input = {
                type: 'html',
                content: htmlContent.value
            }
        } else if (activeInput.value === 'zip' && zipFile.value) {
            const arrayBuffer = await zipFile.value.arrayBuffer()
            input = {
                type: 'zip',
                data: new Uint8Array(arrayBuffer)
            }
        } else {
            throw new Error('Invalid input')
        }

        // 合并数据
        const result = await WriteDataJson(webviewData, input, exeInfo.value)

        // 创建下载
        const blob = new Blob([result], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${target}`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        document.body.removeChild(a)

    } catch (error) {
        console.error('Generation failed:', error)
        alertRef.value.show('生成失败！')
    } finally {
        isGenerating.value = false
    }
}

// 验证输入
const validateInputs = () => {
    if (!exeInfo.value.title) {
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

const updateConfig = (newConfig: Partial<Config>) => {
    exeInfo.value = { ...exeInfo.value, ...newConfig }
}

// 处理HTML文件选择
const handleHtmlSelected = async (file: File) => {
    try {
        const text = await file.text()
        htmlContent.value = text
    } catch (error) {
        console.error('Failed to read HTML file:', error)
        alertRef.value.show('读取HTML文件失败！')
    }
}
</script>

<style scoped>
/* 复用 HtmlToApk.vue 的样式 */
.html-to-exe {
    max-width: 800px;
    margin: 0 auto;
    padding: 15px;
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

.checkbox-field {
    margin-right: 8px;
}

.container {
    display: grid;
    gap: 15px;
}

.button-group {
    display: flex;
    gap: 15px;
}

@media (max-width: 768px) {
    .form-row {
        flex-direction: column;
        gap: 15px;
    }

    .button-group {
        flex-direction: column;
    }
}

.html-input {
    display: grid;
    gap: 10px;
}

.html-file-upload {
    display: flex;
    align-items: center;
    gap: 10px;
}

.html-file-upload span {
    color: var(--c-text-2);
    font-size: 0.9em;
}
</style>