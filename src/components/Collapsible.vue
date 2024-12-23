<template>
  <div class="collapsible">
    <div class="header" @click="toggleContent">
      <slot name="header">{{ isOpen ? '收起' : '展开' }}</slot>
    </div>
    <div v-if="isOpen" class="content">
      <slot name="content">默认内容</slot>
    </div>
  </div>
</template>

<script setup>
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
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.content {
  margin-top: 10px;
  background-color: var(--c-gray-2);
}
</style>
