<template>
  <div class="collapsible">
    <div class="header" @click="toggleContent">
      <div class="header-content">
        <slot name="header">{{ isOpen ? '收起' : '展开' }}</slot>
      </div>
      <div class="arrow" :class="{ open: isOpen }">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 4L6 8L10 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    <div v-if="isOpen" class="content">
      <slot name="content">默认内容</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

const toggleContent = () => {
  isOpen.value = !isOpen.value
}
</script>

<style scoped>
.collapsible {
  border: 1px solid var(--c-divider);
  padding: 10px;
  margin: 10px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.header-content {
  flex: 1;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  color: var(--c-text-2);
}

.arrow.open {
  transform: rotate(-180deg);
}

.content {
  margin-top: 10px;
  background-color: var(--c-gray-2);
}
</style>
