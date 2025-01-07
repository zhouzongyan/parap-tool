<template>
  <button :class="['btn', variant, { loading }]" :disabled="loading">
    <span v-if="loading" class="spinner"></span>
    <span>
      <slot></slot>
    </span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value),
  },
})
</script>

<style scoped>
.btn {
  margin-right: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  color: var(--c-text);
  background-color: var(--c-green2);
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  position: relative;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  position: absolute;
  left: calc(50% - 8px);
  top: calc(50% - 8px);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.btn:hover {
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.7;
}
</style>
