import { createRouter, createWebHistory } from 'vue-router'
import Pinterest from '@/views/Pinterest.vue';
import ImageData from '@/views/ImageData.vue';
import PhoneNumber from '@/views/PhoneNumber.vue';

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
    }
  ],
})

export default router
