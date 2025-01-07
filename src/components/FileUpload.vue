<template>
    <div class="file-upload-wrapper" @drop.prevent="handleDrop" @dragover.prevent @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false" :class="{ 'dragging': isDragging }">
        <label class="file-upload-label">
            <div class="upload-icon">{{ icon }}</div>
            <div>{{ placeholder }}</div>
        </label>
        <input type="file" :accept="accept" @change="handleFileChange" style="display: none;">
        <div class="file-name" v-if="modelValue">{{ modelValue }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    modelValue: string
    accept?: string
    placeholder?: string
    icon?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'file-selected': [file: File]
}>()

const isDragging = ref(false)

const selectedFile = ref<File | null>(null)

const handleDrop = (e: DragEvent) => {
    isDragging.value = false
    const file = e.dataTransfer?.files[0]
    if (file && (!props.accept || file.type.match(props.accept))) {
        selectedFile.value = file
        emit('update:modelValue', file.name)
        emit('file-selected', file)
    }
}

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
        selectedFile.value = input.files[0]
        emit('update:modelValue', input.files[0].name)
        emit('file-selected', input.files[0])
    }
}

defineExpose({ selectedFile })
</script>

<style scoped>
.file-upload-wrapper {
    position: relative;
    margin-bottom: 20px;
    border: 2px dashed var(--c-divider);
    border-radius: 12px;
    transition: all 0.3s ease;
    text-align: center;
}

.file-upload-wrapper.dragging {
    border-color: var(--c-blue);
    background: var(--c-bg-soft);
}

.upload-icon {
    font-size: 2em;
    margin-bottom: 10px;
}

.file-upload-label {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    cursor: pointer;
}

.file-upload-label:hover {
    background: var(--c-bg-soft);
}

.file-name {
    margin-top: 8px;
    font-size: 0.9em;
    color: var(--c-text-2);
}
</style>