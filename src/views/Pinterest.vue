<template>
  <div>
    <div>由于浏览器的跨域阻止,你没有办法直接下载文件,只能获取全部的链接,如果你想下载全部的文件,请下载<a
        href="https://github.com/pzx521521/pinterest/releases/">程序</a></div>
    <div> Since the browser's cross-domain function prevents you from downloading files directly, you can only get all
      the links. If you want to download all the files, please download <a
        href="https://github.com/pzx521521/pinterest/releases/">the program</a></div>

    <input type="text" v-model="userName" placeholder="userName" />
    <input type="text" v-model="boardName" placeholder="boardName" />
    <Btn :loading="loading" @click="handleSubmit">Get all links</Btn>
    <Btn v-if="boardName" :loading="loading" @click="downloadZip">download zip</Btn>
    <Btn v-if="showClipboard" :loading="loading" @click="handleClipboard">Copy all links to clipboard</Btn>
  </div>
  <div v-if="data">
    <div v-for="respBoard in data">
      <Collapsible>
        <template #header>
          <div class="ct-lr">
            <span>{{ respBoard.board.url }}</span>
            <span>{{ respBoard.board.pin_count }}👇🏻</span>
          </div>

        </template>
        <template #content>
          <div v-for="url in respBoard.images">
            <img :src="url" />
          </div>
        </template>
      </Collapsible>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Btn from "@/components/Btn.vue";
import Collapsible from "@/components/Collapsible.vue";

const userName = ref('')
const boardName = ref('')
const loading = ref(false)
const showClipboard = ref(false)
const data = ref({})
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
if (isDev) {
  userName.value = 'parapeng'
  boardName.value = 'wallpaper2'
}
const hostName = (() => {
  return isDev ? '' : 'https://r.parap.us.kg'
})
const handleClipboard = (async () => {
  try {
    const images = data.value.flatMap(item => item.images || []);
    await navigator.clipboard.writeText(images.join('\n'));
    alert('total: ' + images.length + ' pictures in clipboard');
  } catch (err) {
    console.error('无法复制文本：', err);
    alert('无法复制文本，请尝试其他方法。');
  }
});
const handleSubmit = () => {
  if (userName.value === "") {
    return
  }
  getInfo()
}
async function getInfo() {
  try {
    loading.value = true
    const response = await fetch(hostName() + "/tool/pinterest", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        userName: userName.value,
        boardName: boardName.value
      }).toString()
    });
    if (response.ok) {
      const res = await response.json();
      data.value = res.boardImages;
      showClipboard.value = true
    }
  } catch (error) {
    console.error('Fetch error:', error);
  } finally {
    loading.value = false
  }
}
const downloadZip = async () => {
  try {
    loading.value = true
    // 发起 GET 请求到后端下载 ZIP 文件
    const response = await fetch(hostName() + "/tool/pinterest", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: userName.value,
        boardName: boardName.value,
        download: true
      })
    }); if (!response.ok) {
      throw new Error('下载失败');
    }
    // 获取 ZIP 文件的 Blob 数据
    const blob = await response.blob();
    // 创建一个临时 URL 并触发下载
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = userName.value + ".zip"; // 设置下载文件名
    document.body.appendChild(a);
    a.click();
    // 释放 URL 对象
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('下载 ZIP 失败:', error);
  } finally {
    loading.value = false
  }
};
</script>

<style scoped>
input {
  margin: 8px;
  padding: 8px;
}
</style>
