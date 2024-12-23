import { createRouter, createWebHistory } from 'vue-router'
import Pinterest from '@/views/Pinterest.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/pinterest',
      name: 'pinterest',
      component: Pinterest,
    },
  ],
})

export default router
