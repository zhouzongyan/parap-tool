<template>
  <div class="toggle-container">
    <button class="toggle-button theme" @click="toggle">
      <div v-if="props.toggleValue">
        <slot name="open">Open</slot>
      </div>
      <div v-else>
        <slot>Close</slot>
      </div>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  toggleValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  emit('update:modelValue') // 传递新值
}
</script>

<style>


.toggle-button {
  margin: 0 2px;
  padding: 6px 12px;
  font-size: 18px;
  border: none; /* 去掉边框 */
  border-radius: 8px; /* 圆角效果 */
  cursor: pointer; /* 鼠标指针样式 */
  transition: background-color 0.3s, transform 0.2s; /* 动画效果 */
}

.toggle-button:hover {
  opacity: 0.8;
}

.toggle-button:active {
  transform: scale(0.95); /* 按下时缩小效果 */
}
.toggle-container{
  white-space: nowrap;
}
</style>
