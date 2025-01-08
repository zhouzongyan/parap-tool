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

            <div v-if="false" class="control-group">
                <label>位置调整</label>
                <div class="position-controls">
                    <input type="number" v-model="qrPosition.x" placeholder="X坐标" />
                    <input type="number" v-model="qrPosition.y" placeholder="Y坐标" />
                </div>
            </div>

            <div class="upload-section">
                <div class="upload-card">
                    <h3>支付宝收款码</h3>
                    <div class="upload-content">
                        <div class="upload-area">
                            <FileUpload ref="bgImageRef" v-model="bgImageName" accept="image/*"
                                placeholder="选择支付宝收款码或拖拽至此" icon="🟦" @file-selected="handleAliImageSelected" />
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
                            <FileUpload ref="qrImageRef" v-model="qrImageName" accept="image/*"
                                placeholder="选择微信收款码图片或拖拽至此" icon="🟩" @file-selected="handleWxImageSelected" />
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

const qrPosition = ref({ x: 0, y: 0 })

const canMerge = ref(false)
const alipayQrContent = ref('')
const wechatQrContent = ref('')

const clearDirection = ref<'vertical' | 'horizontal'>('horizontal')
const clearRatio = ref(0.5)
const clearMode = ref<'outside-in' | 'inside-out'>('inside-out')

const qrSize = computed(() => Math.pow(2, qrSize_power.value));
// 解析二维码内容
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
    const picMargin = 2
    bgImage.onload = async () => {
        const picWidth = qrSize.value
        canvas.width = picWidth
        canvas.height = picWidth
        qrPosition.value.x = picWidth / 2
        qrPosition.value.y = picWidth / 2

        // 清空画布
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, picWidth, picWidth)

        try {
            // 先绘制微信二维码（不旋转）
            if (wechatQrContent.value) {
                const wechatQrCanvas = document.createElement('canvas')
                await QRCode.toCanvas(wechatQrCanvas, wechatQrContent.value, {
                    errorCorrectionLevel: 'H',
                    margin: picMargin,
                    width: canvas.width,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                })
                // 直接绘制完整的微信二维码
                ctx.drawImage(wechatQrCanvas, 0, 0, picWidth, picWidth)
            }

            // 绘制支付宝二维码（旋转180度并裁剪）
            const alipayPicWidth = qrSize.value / 2
            if (alipayQrContent.value) {
                const alipayQrCanvas = document.createElement('canvas')
                await QRCode.toCanvas(alipayQrCanvas, alipayQrContent.value, {
                    errorCorrectionLevel: 'H',
                    margin: picMargin / 2,
                    width: alipayPicWidth,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                })

                // 创建临时画布来处理支付宝二维码
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = alipayPicWidth
                tempCanvas.height = alipayPicWidth
                const tempCtx = tempCanvas.getContext('2d')
                if (tempCtx) {
                    // 绘制原始支付宝二维码
                    tempCtx.drawImage(alipayQrCanvas, 0, 0, alipayPicWidth, alipayPicWidth)

                    // 根据方向和比例计算清除区域
                    if (clearDirection.value === 'vertical') {
                        const clearWidth = alipayPicWidth / 2 * clearRatio.value
                        if (clearMode.value === 'outside-in') {
                            tempCtx.clearRect(
                                alipayPicWidth / 2,
                                alipayPicWidth / 2,
                                clearWidth,
                                alipayPicWidth / 2
                            )
                        } else {
                            tempCtx.clearRect(
                                alipayPicWidth - clearWidth,
                                alipayPicWidth / 2,
                                clearWidth,
                                alipayPicWidth / 2
                            )
                        }
                    } else {
                        const clearHeight = alipayPicWidth / 2 * clearRatio.value
                        if (clearMode.value === 'outside-in') {
                            tempCtx.clearRect(
                                alipayPicWidth / 2,
                                alipayPicWidth / 2,
                                alipayPicWidth / 2,
                                clearHeight
                            )
                        } else {
                            tempCtx.clearRect(
                                alipayPicWidth / 2,
                                alipayPicWidth - clearHeight,
                                alipayPicWidth / 2,
                                clearHeight
                            )
                        }
                    }

                    // 保存当前状态
                    ctx.save()

                    // 设置旋转中心点并旋转
                    ctx.translate(qrPosition.value.x + alipayPicWidth / 2,
                        qrPosition.value.y + alipayPicWidth / 2)
                    ctx.rotate(Math.PI)
                    ctx.translate(-(qrPosition.value.x + alipayPicWidth / 2),
                        -(qrPosition.value.y + alipayPicWidth / 2))

                    // 绘制处理后的支付宝二维码
                    ctx.drawImage(tempCanvas,
                        qrPosition.value.x,
                        qrPosition.value.y,
                        alipayPicWidth,
                        alipayPicWidth
                    )

                    // 恢复画布状态
                    ctx.restore()
                }
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

const mergePictures = () => {
    if (!previewCanvas.value) return

    try {
        const dataUrl = previewCanvas.value.toDataURL('image/png')
        const link = document.createElement('a')
        // 使用支付宝用户名作为文件名的一部分（如果有的话）
        const alipayInfo = alipayQrContent.value ? '_alipay' : ''
        const wechatInfo = wechatQrContent.value ? '_wechat' : ''
        link.download = `merged${alipayInfo}${wechatInfo}_qr.png`
        link.href = dataUrl
        link.click()
    } catch (error) {
        alertRef.value.show('图片导出失败！')
    }
}

watch([qrSize, qrPosition], () => {
    updateCanvasPreview()
})

watch([clearDirection, clearRatio, clearMode], () => {
    updateCanvasPreview()
})

onMounted(() => {
    updateCanvasPreview()
})
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.position-controls input {
    padding: 8px;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    background: var(--c-bg);
    color: var(--c-text-1);
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
</style>