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
                    <label>上层图片清除区域</label>
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
            <div class="control-panel">
                <Collapsible>
                    <template #header>
                        <div class="advanced-header">背景选项</div>
                    </template>
                    <template #content>
                        <div class="background-controls">
                            <div class="control-item">
                                <label>启用背景:</label>
                                <input type="checkbox" v-model="bgEnabled">
                            </div>
                            <div class="control-item">
                                <label>自定义背景:</label>
                                <input type="checkbox" v-model="bgCustomEnabled" :disabled="!bgEnabled">
                            </div>
                            <template v-if="bgEnabled && bgCustomEnabled">
                                <div class="custom-bg-controls">
                                    <FileUpload ref="bgImageUploadRef" :modelValue="customBgName"
                                        placeholder="选择背景图片或拖拽至此" icon="🖼️" @file-selected="handleCustomBgSelected"
                                        class="upload-minwidth" />
                                    <div class="adjust-section">
                                        <div class="control-item">
                                            <label>背景缩放:</label>
                                            <input type="range" v-model.number="bgScale" :min="50" :max="200"
                                                :step="1" />
                                            <span>{{ bgScale }}%</span>
                                        </div>
                                        <div class="control-item">
                                            <label>二维码透明度:</label>
                                            <input type="range" v-model.number="qrOpacity" :min="0" :max="100"
                                                :step="1" />
                                            <span>{{ qrOpacity }}%</span>
                                        </div>
                                        <div class="control-item">
                                            <label>二维码位置X:</label>
                                            <input type="range" v-model.number="qrPositionX" :min="0" :max="100"
                                                :step="1" />
                                            <span>{{ qrPositionX }}%</span>
                                        </div>
                                        <div class="control-item">
                                            <label>二维码位置Y:</label>
                                            <input type="range" v-model.number="qrPositionY" :min="0" :max="100"
                                                :step="1" />
                                            <span>{{ qrPositionY }}%</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-else-if="bgEnabled">
                                <div class="control-item">
                                    <label>左右边距:</label>
                                    <input type="range" v-model.number="bgMarginX" :min="0" :max="qrSize" :step="1" />
                                    <span>{{ bgMarginX }}%</span>
                                </div>
                                <div class="control-item">
                                    <label>上边距:</label>
                                    <input type="range" v-model.number="bgMarginTop" :min="0" :max="qrSize" :step="1" />
                                    <span>{{ bgMarginTop }}%</span>
                                </div>
                                <div class="control-item">
                                    <label>下边距:</label>
                                    <input type="range" v-model.number="bgMarginBottom" :min="0" :max="qrSize"
                                        :step="1" />
                                    <span>{{ bgMarginBottom }}%</span>
                                </div>
                                <div class="control-item">
                                    <label>左侧颜色:</label>
                                    <input type="color" v-model="bgColorLeft">
                                </div>
                                <div class="control-item">
                                    <label>右侧颜色:</label>
                                    <input type="color" v-model="bgColorRight">
                                </div>
                                <div class="control-item">
                                    <label>渐变:</label>
                                    <input type="checkbox" v-model="bgGradient">
                                </div>
                                <div class="control-item">
                                    <label>文字内容:</label>
                                    <input type="text" v-model="bgText" placeholder="输入文字内容">
                                </div>
                                <div class="control-item">
                                    <label>字体:</label>
                                    <select v-model="bgFont">
                                        <option value="Arial">Arial</option>
                                        <option value="微软雅黑">微软雅黑</option>
                                        <option value="宋体">宋体</option>
                                        <option value="黑体">黑体</option>
                                    </select>
                                </div>
                                <div class="control-item">
                                    <label>字体大小:</label>
                                    <input type="range" v-model.number="bgFontSize" :min="12" :max="48" :step="1" />
                                    <span>{{ bgFontSize }}px</span>
                                </div>
                                <div class="control-item">
                                    <label>字体颜色:</label>
                                    <input type="color" v-model="bgTextColor">
                                </div>
                                <div class="control-item">
                                    <label>文字X:</label>
                                    <input type="range" v-model.number="bgTextX" :min="0" :max="100" :step="1" />
                                    <span>{{ bgTextX }}%</span>
                                </div>
                                <div class="control-item">
                                    <label>文字Y:</label>
                                    <input type="range" v-model.number="bgTextY" :min="0" :max="100" :step="1" />
                                    <span>{{ bgTextY }}%</span>
                                </div>
                                <div class="control-item">
                                    <label>圆角:</label>
                                    <input type="range" v-model.number="bgRadius" :min="0" :max="50" :step="1" />
                                    <span>{{ bgRadius }}px</span>
                                </div>
                            </template>
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
const qrSize_power = ref(8)
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

// 修改背景相关状态的声明顺序
const bgEnabled = ref(false)
const bgMarginX = ref(13)
const bgMarginTop = ref(41)
const bgMarginBottom = ref(17)
const bgColorLeft = ref('#07C160')
const bgColorRight = ref('#1677FF')
const bgGradient = ref(false)
const bgText = ref('支持微信和支付宝')
const bgFont = ref('微软雅黑')
const bgFontSize = ref(32)
const bgTextColor = ref('#FFFFFF')
const bgTextX = ref(50)
const bgTextY = ref(14)
const bgRadius = ref(20)

// 监听背景相关变化
watch([
    bgEnabled,
    bgMarginX,
    bgMarginTop,
    bgMarginBottom,
    bgColorLeft,
    bgColorRight,
    bgGradient,
    bgText,
    bgFont,
    bgFontSize,
    bgTextColor,
    bgTextX,
    bgTextY,
    bgRadius
], () => {
    updateCanvasPreview()
}, { deep: true })

// 圆角矩形绘制函数
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, roundLeft: boolean, roundRight: boolean) => {
    ctx.beginPath()

    // 左上角
    if (roundLeft) {
        ctx.moveTo(x + radius, y)
    } else {
        ctx.moveTo(x, y)
    }

    // 右上角
    if (roundRight) {
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    } else {
        ctx.lineTo(x + width, y)
    }

    // 右下角
    if (roundRight) {
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    } else {
        ctx.lineTo(x + width, y + height)
    }

    // 左下角
    if (roundLeft) {
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
    } else {
        ctx.lineTo(x, y + height)
        ctx.lineTo(x, y)
    }

    ctx.closePath()
}

// 添加自定义背景相关状态
const bgCustomEnabled = ref(false)
const customBgName = ref('')
const customBgImage = ref<HTMLImageElement | null>(null)
const qrPositionX = ref(50)  // 二维码在背景中的X位置（百分比）
const qrPositionY = ref(50)  // 二维码在背景中的Y位置（百分比）
const qrOpacity = ref(100)   // 二维码透明度（百分比）

// 处理自定义背景图片选择
const handleCustomBgSelected = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
            customBgImage.value = img
            updateCanvasPreview()
        }
        img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
}

// 添加背景缩放状态
const bgScale = ref(100)  // 默认 100%

// 修改 updateCanvasPreview 函数中的自定义背景处理部分
const updateCanvasPreview = async () => {
    if (!previewCanvas.value) return
    const canvas = previewCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const picWidth = qrSize.value

    if (bgEnabled.value) {
        if (bgCustomEnabled.value && customBgImage.value) {
            // 使用自定义背景
            const img = customBgImage.value
            const aspectRatio = img.width / img.height

            // 设置画布基础尺寸
            const baseWidth = picWidth * 2
            const baseHeight = baseWidth / aspectRatio

            // 应用缩放
            const scale = bgScale.value / 100
            canvas.width = baseWidth * scale
            canvas.height = baseHeight * scale

            // 绘制背景图
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            // 创建临时画布绘制二维码
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = picWidth
            tempCanvas.height = picWidth
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
                // 在临时画布上绘制二维码
                if (qrLayer.value === 'wechat') {
                    await drawAlipayQR(tempCtx, picWidth)
                    await drawWechatQR(tempCtx, picWidth / 2)
                } else {
                    await drawWechatQR(tempCtx, picWidth)
                    await drawAlipayQR(tempCtx, picWidth / 2)
                }

                // 计算二维码位置
                const x = (canvas.width - picWidth) * (qrPositionX.value / 100)
                const y = (canvas.height - picWidth) * (qrPositionY.value / 100)

                // 设置透明度并绘制二维码
                ctx.globalAlpha = qrOpacity.value / 100
                ctx.drawImage(tempCanvas, x, y, picWidth, picWidth)
                ctx.globalAlpha = 1.0
            }
        } else {
            // 默认背景逻辑
            const totalWidth = picWidth + bgMarginX.value * picWidth / 100 * 2
            const totalHeight = picWidth + (bgMarginTop.value + bgMarginBottom.value) * picWidth / 100

            canvas.width = totalWidth
            canvas.height = totalHeight

            if (bgGradient.value) {
                // 创建从左到右的渐变
                const gradient = ctx.createLinearGradient(0, 0, totalWidth, 0)
                gradient.addColorStop(0, bgColorLeft.value)
                gradient.addColorStop(1, bgColorRight.value)
                ctx.fillStyle = gradient
                drawRoundedRect(ctx, 0, 0, totalWidth, totalHeight, bgRadius.value, true, true)
                ctx.fill()
            } else {
                // 分别绘制左右两侧
                ctx.fillStyle = bgColorLeft.value
                drawRoundedRect(ctx, 0, 0, totalWidth / 2, totalHeight, bgRadius.value, true, false)
                ctx.fill()

                ctx.fillStyle = bgColorRight.value
                drawRoundedRect(ctx, totalWidth / 2, 0, totalWidth / 2, totalHeight, bgRadius.value, false, true)
                ctx.fill()
            }

            // 绘制文字
            ctx.font = `${bgFontSize.value}px ${bgFont.value}`
            ctx.fillStyle = bgTextColor.value
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            const textX = totalWidth * (bgTextX.value / 100)
            const textY = totalHeight * (bgTextY.value / 100)
            ctx.fillText(bgText.value, textX, textY)

            // 绘制二维码
            ctx.save()
            ctx.translate(bgMarginX.value * picWidth / 100, bgMarginTop.value * picWidth / 100)
            try {
                if (qrLayer.value === 'wechat') {
                    await drawAlipayQR(ctx, picWidth)
                    await drawWechatQR(ctx, picWidth / 2)
                } else {
                    await drawWechatQR(ctx, picWidth)
                    await drawAlipayQR(ctx, picWidth / 2)
                }
                canMerge.value = true
            } catch (error) {
                console.error('Error generating QR codes:', error)
                alertRef.value.show('二维码生成失败')
                canMerge.value = false
            }
            ctx.restore()
        }
    } else {
        // 不启用背景时的逻辑
        canvas.width = picWidth
        canvas.height = picWidth

        // 清空画布
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, picWidth, picWidth)

        try {
            if (qrLayer.value === 'wechat') {
                await drawAlipayQR(ctx, picWidth)
                await drawWechatQR(ctx, picWidth / 2)
            } else {
                await drawWechatQR(ctx, picWidth)
                await drawAlipayQR(ctx, picWidth / 2)
            }
            canMerge.value = true
        } catch (error) {
            console.error('Error generating QR codes:', error)
            alertRef.value.show('二维码生成失败')
            canMerge.value = false
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

// 添加清除右上角的函数
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

// 添加到监听列表
watch([
    // ... 原有的监听项 ...
    bgCustomEnabled,
    qrPositionX,
    qrPositionY,
    qrOpacity,
    bgScale
], () => {
    updateCanvasPreview()
}, { deep: true })
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

.background-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 10px;
}

.control-item input[type="color"] {
    width: 50px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    cursor: pointer;
}

.control-item input[type="text"] {
    flex: 1;
    padding: 6px;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    background: var(--c-bg);
    color: var(--c-text-1);
}

.control-item select {
    flex: 1;
    padding: 6px;
    border: 1px solid var(--c-divider);
    border-radius: 4px;
    background: var(--c-bg);
    color: var(--c-text-1);
    cursor: pointer;
}

.control-item input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

.control-item .second-color {
    margin-left: 10px;
}

.control-item input[type="checkbox"] {
    margin: 0 10px;
}

.preview-image {
    margin-top: 10px;
    max-width: 100%;
    border-radius: 4px;
    overflow: hidden;
}

.preview-image img {
    width: 100%;
    height: auto;
    display: block;
}

.custom-bg-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}


.adjust-section {
    flex: 3;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.upload-minwidth {
    min-width: 300px;
}

.control-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.control-item label {
    min-width: 100px;
    text-align: left;
}

.control-item input[type="range"] {
    flex: 1;
}

.control-item span {
    min-width: 4em;
    text-align: left;
}

/* 修改 FileUpload 组件的样式 */
:deep(.file-upload-wrapper) {
    min-height: 200px;
    margin: 0;
}

:deep(.file-upload-label) {
    height: 100%;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>