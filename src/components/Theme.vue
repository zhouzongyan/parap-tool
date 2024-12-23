<script setup>
import { ref, onMounted, watch } from 'vue'
import Toggle from '@/components/Toggle.vue'

const theme = ref(false)

// 检测主题模式并动态设置 theme
function detectTheme() {
  theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches
}

// 切换主题状态
const update = () => {
  theme.value = !theme.value // 切换 theme 的值
}

// 初次加载时检测主题
onMounted(() => {
  detectTheme()
})

// 监听主题变化
watch(theme, () => {
  const themeName = theme.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', themeName)
})
</script>

<template>
  <Toggle :toggleValue="theme" @update:modelValue="update">
    <template #open>
      🌛 <!-- 夜间模式图标 -->
    </template>
      ☀️ <!-- 白天模式图标 -->
  </Toggle>
</template>

<style scoped>
/* 可以在这里添加样式 */
</style>