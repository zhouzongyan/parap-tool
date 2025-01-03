<script setup lang="ts">
import BaseLayout from "@/components/BaseLayout.vue";
</script>

<template>
  <BaseLayout>
    <template #header>
      <div>
        <h1>Para's Tool</h1>
      </div>
      <div class="right ct">
        <router-link to="/pinterest">Pinterest</router-link>|
        <router-link to="/image-data">Image Data</router-link>|
        <router-link to="/phone-number">Phone Number</router-link>|
        <router-link to="/html-to-apk">HtmlToApk</router-link>|
        <a href="https://wallpaper.parap.us.kg">wallpaper</a>
      </div>
    </template>
    <div>
      <router-view></router-view>
    </div>
  </BaseLayout>
</template>


<style scoped>
.right {
  margin-left: auto;
}

h1 {
  user-select: none;
}

@media (max-width: 767px) {
  h1 {
    display: none;
  }
}
</style>