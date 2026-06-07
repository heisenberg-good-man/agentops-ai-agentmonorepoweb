import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import DashboardPage from '@/views/DashboardPage.vue';
import TaskDetailPage from '@/views/TaskDetailPage.vue';
import AgentsPage from '@/views/AgentsPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardPage,
  },
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: TaskDetailPage,
  },
  {
    path: '/agents',
    name: 'Agents',
    component: AgentsPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
