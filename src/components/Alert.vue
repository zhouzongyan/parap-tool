<template>
    <Teleport to="body">
        <Transition name="alert">
            <div v-if="isVisible" class="alert-overlay">
                <div class="alert-container">
                    <div class="alert-content">
                        <div class="alert-message">{{ message }}</div>
                        <button class="alert-button" @click="close">确定</button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)
let message = ref('')

// 显示alert
const show = (msg: string) => {
    message.value = msg
    isVisible.value = true
}

// 关闭alert
const close = () => {
    isVisible.value = false
}

// 暴露方法给父组件
defineExpose({
    show,
    close
})
</script>

<style scoped>
.alert-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.alert-container {
    background: var(--c-bg);
    border-radius: 8px;
    padding: 20px;
    min-width: 300px;
    max-width: 90%;
}

.alert-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.alert-message {
    color: var(--c-text-1);
    text-align: center;
}

.alert-button {
    background: var(--c-blue);
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.alert-button:hover {
    opacity: 0.9;
}

/* 过渡动画 */
.alert-enter-active,
.alert-leave-active {
    transition: opacity 0.2s ease;
}

.alert-enter-from,
.alert-leave-to {
    opacity: 0;
}
</style>