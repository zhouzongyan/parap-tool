<template>
    <div class="qr-merge">
        <h1>二维码合并工具</h1>
        <div class="container">

            <div class="control-group-container">
                <div class="control-panel">
                    <div class="control-group">
                        <label>二维码大小</label>
                        <div class="size-controls">
                            <input type="range" v-model="qrSize_power" min="6" max="12" step="1" />
                            <span>{{ qrSize }}px</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="upload-section">
                <div class="upload-card">
                    <h3>支付宝收款码</h3>
                    <div class="upload-content">
                        <div class="upload-area">
                            <FileUpload ref="bgImageRef" v-model="bgImageName" placeholder="选择支付宝收款码或拖拽至此" icon="🟦"
                                @update:modelValue="updateBgImageName" @file-selected="handleAliImageSelected" />
                            <div v-if="bgImagePreview" class="preview-image">
                                <img :src="bgImagePreview" alt="支付宝收款码预览" />
                            </div>
                        </div>
                        <div v-if="alipayQrContent" class="qr-content">
                            <span class="qr-label">支付宝收款码内容：</span>
                            <span class="qr-value">{{ alipayQrContent }}</span>
                        </div>
                    </div>
                </div>

                <div class="upload-card">
                    <h3>微信收款码</h3>
                    <div class="upload-content">
                        <div class="upload-area">
                            <FileUpload ref="qrImageRef" v-model="qrImageName" placeholder="选择微信收款码图片或拖拽至此" icon="🟩"
                                @update:modelValue="updateQrImageName" @file-selected="handleWxImageSelected" />
                            <div v-if="qrImagePreview" class="preview-image">
                                <img :src="qrImagePreview" alt="微信收款码预览" />
                            </div>
                        </div>
                        <div v-if="wechatQrContent" class="qr-content">
                            <span class="qr-label">微信收款码内容：</span>
                            <span class="qr-value">{{ wechatQrContent }}</span>
                        </div>
                    </div>
                </div>
            </div>


            <div class="control-panel">
                <div class="control-group">
                    <label>支付宝清除区域</label>
                    <div class="clear-controls">
                        <select v-model="clearDirection">
                            <option value="vertical">纵向</option>
                            <option value="horizontal">横向</option>
                        </select>
                        <select v-model="clearMode">
                            <option value="outside-in">从外到里</option>
                            <option value="inside-out">从里到外</option>
                        </select>
                        <div class="range-with-value">
                            <input type="range" v-model="clearRatio" min="0" max="1" step="0.1" />
                            <span>{{ (clearRatio * 100).toFixed(0) }}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="control-panel">
                <Collapsible>
                    <template #header>
                        <div class="advanced-header">高级选项</div>
                    </template>
                    <template #content>
                        <div class="advanced-controls">
                            <div class="control-item">
                                <label>二维码层级:</label>
                                <select v-model="qrLayer" class="layer-select">
                                    <option value="alipay">支付宝在上</option>
                                    <option value="wechat">微信在上</option>
                                </select>
                            </div>
                            <div class="control-item">
                                <label>边距:</label>
                                <input type="range" v-model.number="margin" :min="0" :max="4" :step="0.5" />
                                <span>{{ margin }}</span>
                            </div>
                            <div class="control-item">
                                <label>X坐标:</label>
                                <input type="range" v-model.number="qrPosition.x" :min="0" :max="qrSize / 2"
                                    :step="1" />
                                <span>{{ qrPosition.x }}px</span>
                            </div>
                            <div class="control-item">
                                <label>Y坐标:</label>
                                <input type="range" v-model.number="qrPosition.y" :min="0" :max="qrSize / 2"
                                    :step="1" />
                                <span>{{ qrPosition.y }}px</span>
                            </div>
                            <div class="control-item">
                                <label>旋转:</label>
                                <input type="range" v-model.number="rotation" :min="0" :max="360" :step="90" />
                                <span>{{ rotation }}°</span>
                            </div>
                        </div>
                    </template>
                </Collapsible>
            </div>
            <div class="result-section" v-if="bgImagePreview && qrImagePreview">
                <h3>预览效果</h3>
                <div class="canvas-container" ref="canvasContainer">
                    <canvas ref="previewCanvas"></canvas>
                </div>
            </div>

            <Btn @click="mergePictures" :disabled="!canMerge">
                生成合并图片
            </Btn>
        </div>
        <Alert ref="alertRef" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import FileUpload from '@/components/FileUpload.vue'
import Btn from '@/components/Btn.vue'
import Alert from '@/components/Alert.vue'
import Collapsible from '@/components/Collapsible.vue'
import QrcodeParser from 'qrcode-parser'
import QRCode from 'qrcode'

const bgImageRef = ref()
const qrImageRef = ref()
const alertRef = ref()
const previewCanvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLDivElement>()

const bgImageName = ref('')
const qrImageName = ref('')
const bgImagePreview = ref('')
const qrImagePreview = ref('')
const qrSize_power = ref(7)
const qrSize = computed(() => Math.pow(2, qrSize_power.value))

// 位置状态 - 使用函数计算初始值
const qrPosition = ref({
    x: Math.floor(qrSize.value / 2),
    y: Math.floor(qrSize.value / 2)
})



const canMerge = ref(false)
const alipayQrContent = ref('')
const wechatQrContent = ref('')

const clearDirection = ref<'vertical' | 'horizontal'>('horizontal')
const clearRatio = ref(0.5)
const clearMode = ref<'outside-in' | 'inside-out'>('inside-out')
// 监听二维码大小变化，更新位置
watch(qrSize, (newSize) => {
    qrPosition.value = {
        x: Math.floor(newSize / 2),
        y: Math.floor(newSize / 2)
    }
})

// 监听位置和大小变化，更新画布
watch([qrSize, qrPosition], () => {
    updateCanvasPreview()
}, { deep: true })  // 添加 deep: true 以监听对象内部属性变化

// 监听清除区域相关的变化
watch([clearDirection, clearRatio, clearMode], () => {
    updateCanvasPreview()
})

// 添加旋转状态
const rotation = ref(180)  // 默认180度旋转

// 监听旋转变化，更新画布
watch(rotation, () => {
    updateCanvasPreview()
})

// 添加层级控制状态
const qrLayer = ref<'alipay' | 'wechat'>('alipay')

// 监听层级变化，更新画布
watch(qrLayer, () => {
    updateCanvasPreview()
})

// 添加边距控制状态
const margin = ref(2)  // 默认值为2

// 监听边距变化，更新画布
watch(margin, () => {
    updateCanvasPreview()
})

const parseQRCode = async (file: File, isAlipay: boolean) => {
    try {
        const result = await QrcodeParser(file)
        if (result) {
            if (isAlipay) {
                alipayQrContent.value = result
            } else {
                wechatQrContent.value = result
            }
        } else {
            throw new Error('未能识别二维码')
        }
    } catch (error) {
        alertRef.value.show('二维码解析失败，请确保上传的是有效的收款码图片')
    }
}

const handleAliImageSelected = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        bgImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    // 解析支付宝二维码
    await parseQRCode(file, true)
    updateCanvasPreview()
}

const handleWxImageSelected = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        qrImagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    // 解析微信二维码
    await parseQRCode(file, false)
    updateCanvasPreview()
}

const updateCanvasPreview = async () => {
    if (!bgImagePreview.value || !qrImagePreview.value || !previewCanvas.value) return
    const canvas = previewCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const bgImage = new Image()
    bgImage.onload = async () => {
        const picWidth = qrSize.value
        canvas.width = picWidth
        canvas.height = picWidth

        // 清空画布
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, picWidth, picWidth)

        try {
            // 根据层级选择绘制顺序
            if (qrLayer.value === 'wechat') {
                // 先绘制支付宝二维码
                await drawAlipayQR(ctx, picWidth)
                // 后绘制微信二维码
                await drawWechatQR(ctx, picWidth / 2)
            } else {
                // 先绘制微信二维码
                await drawWechatQR(ctx, picWidth)
                // 后绘制支付宝二维码
                await drawAlipayQR(ctx, picWidth / 2)
            }
            canMerge.value = true
        } catch (error) {
            console.error('Error generating QR codes:', error)
            alertRef.value.show('二维码生成失败')
            canMerge.value = false
        }
    }
    bgImage.src = bgImagePreview.value
}

// 修改绘制函数，添加清除区域处理
const clearTopRightCorner = (ctx: CanvasRenderingContext2D, width: number) => {
    // 根据方向和比例计算清除区域
    if (clearDirection.value === 'vertical') {
        const clearWidth = width / 2 * clearRatio.value
        if (clearMode.value === 'outside-in') {
            ctx.clearRect(
                width / 2,
                width / 2,
                clearWidth,
                width / 2
            )
        } else {
            ctx.clearRect(
                width - clearWidth,
                width / 2,
                clearWidth,
                width / 2
            )
        }
    } else {
        const clearHeight = width / 2 * clearRatio.value
        if (clearMode.value === 'outside-in') {
            ctx.clearRect(
                width / 2,
                width / 2,
                width / 2,
                clearHeight
            )
        } else {
            ctx.clearRect(
                width / 2,
                width - clearHeight,
                width / 2,
                clearHeight
            )
        }
    }
}

// 修改微信二维码绘制逻辑
const drawWechatQR = async (ctx: CanvasRenderingContext2D, picWidth: number) => {
    if (wechatQrContent.value) {
        const wechatQrCanvas = document.createElement('canvas')
        await QRCode.toCanvas(wechatQrCanvas, wechatQrContent.value, {
            errorCorrectionLevel: 'H',
            margin: qrLayer.value === 'wechat' ? margin.value / 2 : margin.value,  // 如果在上层则使用一半边距
            width: picWidth,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })

        // 创建临时画布
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = picWidth
        tempCanvas.height = picWidth
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
            tempCtx.drawImage(wechatQrCanvas, 0, 0, picWidth, picWidth)

            if (qrLayer.value === 'wechat') {
                clearTopRightCorner(tempCtx, picWidth)
                // 应用旋转和位置
                ctx.save()
                // 修改位置计算，使 (0,0) 时左上角对齐
                const x = qrPosition.value.x + picWidth / 2
                const y = qrPosition.value.y + picWidth / 2
                ctx.translate(x, y)
                ctx.rotate(rotation.value * Math.PI / 180)
                ctx.drawImage(tempCanvas, -picWidth / 2, -picWidth / 2, picWidth, picWidth)
                ctx.restore()
            } else {
                ctx.drawImage(tempCanvas, 0, 0, picWidth, picWidth)
            }
        }
    }
}

// 修改支付宝二维码绘制逻辑
const drawAlipayQR = async (ctx: CanvasRenderingContext2D, alipayPicWidth: number) => {
    if (alipayQrContent.value) {
        const alipayQrCanvas = document.createElement('canvas')
        await QRCode.toCanvas(alipayQrCanvas, alipayQrContent.value, {
            errorCorrectionLevel: 'H',
            margin: qrLayer.value === 'alipay' ? margin.value / 2 : margin.value,  // 如果在上层则使用一半边距
            width: alipayPicWidth,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        })

        // 创建临时画布
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = alipayPicWidth
        tempCanvas.height = alipayPicWidth
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
            tempCtx.drawImage(alipayQrCanvas, 0, 0, alipayPicWidth, alipayPicWidth)

            if (qrLayer.value === 'alipay') {
                clearTopRightCorner(tempCtx, alipayPicWidth)
                // 应用旋转和位置
                ctx.save()
                // 修改位置计算，使 (0,0) 时左上角对齐
                const x = qrPosition.value.x + alipayPicWidth / 2
                const y = qrPosition.value.y + alipayPicWidth / 2
                ctx.translate(x, y)
                ctx.rotate(rotation.value * Math.PI / 180)
                ctx.drawImage(tempCanvas, -alipayPicWidth / 2, -alipayPicWidth / 2, alipayPicWidth, alipayPicWidth)
                ctx.restore()
            } else {
                ctx.drawImage(tempCanvas, 0, 0, alipayPicWidth, alipayPicWidth)
            }
        }
    }
}

const handleDownload = () => {
    //支持桌面app
    if (window.download) {
        // 如果存在下载函数，则调用下载函数
        previewCanvas.value.toBlob(async (blob) => {
            if (blob) {
                // 将 blob 转换为 base64
                const reader = new FileReader()
                reader.onloadend = async () => {
                    const base64data = (reader.result as string).split(',')[1]
                    const info = await window.download(base64data, 'merged_qr.png')
                    alertRef.value.show(info)
                }
                reader.readAsDataURL(blob)
            }
        })
        return
    }

    // 普通下载逻辑
    const dataUrl = previewCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'merged_qr.png'
    link.href = dataUrl
    link.click()
}

const mergePictures = () => {
    if (!previewCanvas.value) return

    try {
        handleDownload()
    } catch (error) {
        alertRef.value.show('图片导出失败！')
    }
}

// 更新文件名
const updateBgImageName = (name: string) => {
    bgImageName.value = name
}

const updateQrImageName = (name: string) => {
    qrImageName.value = name
}
</script>

<style scoped>
.qr-merge {
    max-width: 800px;
    margin: 0 auto;
    padding: 15px;
}

.container {
    display: grid;
    gap: 20px;
}

h1 {
    text-align: center;
    margin-bottom: 20px;
}

.upload-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.upload-card {
    background: var(--c-bg);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

.preview {
    margin-top: 15px;
    text-align: center;
}

.preview img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
}

.controls {
    background: var(--c-bg);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
    display: grid;
    gap: 15px;
}

.control-group-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.control-panel {
    background: var(--c-bg-soft);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

.control-group {
    display: grid;
    gap: 10px;
}

.size-controls,
.clear-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}

.size-controls input {
    flex: 1;
}

.size-controls span {
    min-width: 4em;
    text-align: right;
}

.clear-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.clear-controls select {
    width: 100px;
    flex-shrink: 0;
}

.range-with-value {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.range-with-value input {
    flex: 1;
}

.range-with-value span {
    min-width: 3em;
    text-align: right;
}

.position-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.position-controls .range-with-value {
    display: flex;
    align-items: center;
    gap: 10px;
}

.position-controls .range-with-value label {
    min-width: 60px;
}

.position-controls .range-with-value input {
    flex: 1;
}

.position-controls .range-with-value span {
    min-width: 4em;
    text-align: right;
}

.result-section {
    background: var(--c-bg);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
}

.canvas-container {
    padding: 15px;
    text-align: center;
    background-color: var(--c-blue1);
}

canvas {
    max-width: 100%;
    height: auto;
}

@media (max-width: 640px) {
    .upload-section {
        grid-template-columns: 1fr;
    }
}

.qr-content {
    margin-top: 10px;
    padding: 8px;
    background: var(--c-bg-soft);
    border-radius: 4px;
    font-size: 0.9em;
    word-break: break-all;
}

.qr-label {
    color: var(--c-text-2);
    margin-right: 8px;
}

.qr-value {
    color: var(--c-text-1);
}

.upload-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.preview-container {
    background: var(--c-bg-soft);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.preview-image {
    text-align: center;
}

.preview-image img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
}

.qr-content {
    padding: 8px;
    background: var(--c-bg);
    border-radius: 4px;
    font-size: 0.9em;
    word-break: break-all;
}

.upload-area {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
}

.upload-area :deep(.file-upload) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: var(--c-bg-soft);
    transition: opacity 0.3s;
}

.preview-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--c-bg-soft);
}

.preview-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* 当有预览图时，悬停显示上传控件 */
.upload-area:hover :deep(.file-upload) {
    opacity: 0.9;
}

.upload-area:not(:hover) :deep(.file-upload) {
    opacity: 0;
}

/* 确保预览图片区域始终显示 */
.preview-image {
    z-index: 0;
}

.clear-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.clear-controls select {
    width: 100px;
    /* 固定选择框宽度 */
    flex-shrink: 0;
    /* 防止压缩 */
}

.range-with-value {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.range-with-value input {
    flex: 1;
}

.range-with-value span {
    min-width: 3em;
    text-align: right;
}

/* 确保两个选择框的样式一致 */
.clear-controls select+select {
    margin-left: 10px;
}

.position-controls .range-with-value input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--c-divider);
    outline: none;
    -webkit-appearance: none;
}

.position-controls .range-with-value input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--c-blue);
    cursor: pointer;
}

.layer-control {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.layer-control label {
    min-width: 60px;
}

.layer-select {
    flex: 1;
    padding: 6px;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    background: var(--c-bg);
    color: var(--c-text-1);
    cursor: pointer;
    max-width: 250px;
}

.layer-select:hover {
    border-color: var(--c-blue);
}

.advanced-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 10px;
}

.control-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 250px;
}

.control-item label {
    min-width: 60px;
}

.control-item input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--c-divider);
    outline: none;
    -webkit-appearance: none;
}

.control-item input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--c-blue);
    cursor: pointer;
}

.control-item span {
    min-width: 4em;
    text-align: left;
}

.advanced-header {
    font-size: 1em;
    font-weight: 500;
    color: var(--c-text-1);
}

/* 调整 Collapsible 内部样式 */
:deep(.collapsible) {
    border: none;
    padding: 0;
    margin: 0;
}

:deep(.header) {
    padding: 0;
    margin-bottom: 10px;
}

:deep(.content) {
    margin-top: 0;
    background: none;
}
</style>