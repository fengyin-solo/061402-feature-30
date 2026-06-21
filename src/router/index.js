import { createRouter, createWebHistory } from 'vue-router';

const Index = () => import('../views/Index.vue');
const ExpeditionPrepare = () => import('../views/ExpeditionPrepare/index.vue');

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: {
      title: '海岛生存'
    }
  },
  {
    path: '/expedition/prepare',
    name: 'ExpeditionPrepare',
    component: ExpeditionPrepare,
    meta: {
      title: '远征准备'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;