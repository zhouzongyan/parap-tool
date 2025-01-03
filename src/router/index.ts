import { createRouter, createWebHistory } from 'vue-router'
import Pinterest from '@/views/Pinterest.vue';
import ImageData from '@/views/ImageData.vue';
import PhoneNumber from '@/views/PhoneNumber.vue';
import HtmlToApk from '@/views/HtmlToApk.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/pinterest',
      name: 'pinterest',
      component: Pinterest,
    },
    {
      path: '/image-data',
      name: 'image-data',
      component: ImageData,
    },
    {
      path: '/phone-number',
      name: 'phone-number',
      component: PhoneNumber,
    },
    {
      path: '/html-to-apk',
      name: 'html-to-apk',
      component: HtmlToApk
    }
  ],
})

export default router
