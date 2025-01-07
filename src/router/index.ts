import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import Pinterest from '@/views/Pinterest.vue';
import ImageData from '@/views/ImageData.vue';
import PhoneNumber from '@/views/PhoneNumber.vue';
import HtmlToApk from '@/views/HtmlToApk.vue'
import QRMerge from '@/views/QRMerge.vue'

const routes = [
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
  },
  {
    path: '/qr-merge',
    name: 'qr-merge',
    component: QRMerge
  }
]
if (CUSTOMPARAMS.singlefile) {
  routes.push({
    path: '/',
    redirect: '/' + CUSTOMPARAMS.singlefile
  })
}

const router = createRouter({
  history: CUSTOMPARAMS.singlefile ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})
export default router
