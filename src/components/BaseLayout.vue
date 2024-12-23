<script setup>


import Theme from "@/components/Theme.vue";
</script>

<template>
  <header class="fixed-header">
    <slot name="header"></slot>
    <Theme/>
  </header>
  <main class="main">
    <slot></slot>
  </main>
  <footer class="footer">
    <slot name="footer">
      para &copy; 2024
    </slot>
  </footer>
</template>

<style scoped>
.fixed-header {
  position: fixed;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--c-gray-4);
  color: var(--c-text);
  padding: 5px;
  height: var(--vt-p-header-height);
  transition: background 0.3s ease; /* 过渡效果 */
  z-index: 500;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;

}

.main {
  padding-top: var(--vt-p-header-height);
  width: 100%;
  min-height: calc(100vh - var(--vt-p-footer-height)) !important;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text);
  height: var(--vt-p-footer-height);
}

@media (min-width: 1024px) {
  /* 这里可以添加更多针对大屏幕的样式 */
}
</style>
