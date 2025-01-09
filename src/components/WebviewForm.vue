<template>
    <div class="webview-form">
        <!-- WebView内容输入 (通用部分) -->
        <div class="card">
            <h3>WebView内容</h3>
            <div class="input-tabs">
                <button v-for="tab in tabs" :key="tab.value" class="tab-btn"
                    :class="{ active: modelValue === tab.value }" @click="$emit('update:modelValue', tab.value)">
                    {{ tab.label }}
                </button>
            </div>

            <div class="input-panel" :class="{ active: modelValue === 'url' }">
                <input type="text" :value="url" @input="$emit('update:url', ($event.target as HTMLInputElement).value)"
                    placeholder="请输入网址" class="input-field">
            </div>

            <div class="input-panel" :class="{ active: modelValue === 'html' }">
                <div class="html-input">
                    <textarea :value="html" @input="$emit('update:html', ($event.target as HTMLTextAreaElement).value)"
                        @drop.prevent="handleHtmlDrop" @dragenter.prevent @dragover.prevent @dragleave.prevent
                        placeholder="请输入HTML源码或拖拽HTML文件至此" class="input-field textarea"
                        :class="{ 'drag-over': isDragging }"></textarea>
                </div>
            </div>

            <div class="input-panel" :class="{ active: modelValue === 'zip' }">
                <FileUpload ref="zipUploadRef" :modelValue="zipName" accept=".zip" placeholder="选择ZIP文件或拖拽至此" icon="📦"
                    @update:modelValue="$emit('update:zipName', $event)" @file-selected="handleZipFileSelected" />
            </div>
        </div>

        <!-- 配置信息输入 (使用插槽) -->
        <div class="card">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineEmits, ref } from 'vue'
import FileUpload from './FileUpload.vue'

const props = defineProps<{
    modelValue: 'url' | 'html' | 'zip'
    url: string
    html: string
    zipName: string
}>()

const emit = defineEmits<{
    'update:modelValue': ['url' | 'html' | 'zip']
    'update:url': [string]
    'update:html': [string]
    'update:zipName': [string]
    'zip-selected': [File]
    'html-file-selected': [File]
}>()

const tabs = [
    { value: 'url', label: '网址' },
    { value: 'html', label: 'HTML源码' },
    { value: 'zip', label: '压缩包' }
]

const isDragging = ref(false)

const handleHtmlDrop = async (e: DragEvent) => {
    isDragging.value = false
    const file = e.dataTransfer?.files[0]
    if (file && (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
        try {
            const text = await file.text()
            emit('update:html', text)
        } catch (error) {
            console.error('Failed to read HTML file:', error)
        }
    }
}

// 添加拖拽状态处理
const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
}

// 处理 ZIP 文件选择
const handleZipFileSelected = (file: File) => {
    emit('zip-selected', file)
}
</script>

<style scoped>
/* 只保留通用部分的样式 */
.webview-form {
    display: grid;
    gap: 15px;
}

.card {
    background: var(--c-bg);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid var(--c-divider);
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
    border: 2px dashed var(--c-divider);
    transition: border-color 0.3s;
}

.textarea:hover,
.textarea.drag-over {
    border-color: var(--c-blue);
}

.drag-over {
    background-color: var(--c-bg-soft);
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