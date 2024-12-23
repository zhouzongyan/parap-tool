import { createRouter, createWebHistory } from 'vue-router'
import Pinterest from '@/views/Pinterest.vue';
import ImageData from '@/views/ImageData.vue';

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
  ],
})

export default router
