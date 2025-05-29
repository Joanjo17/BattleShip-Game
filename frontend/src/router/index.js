import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Game from "../views/Game.vue";
import GameList from '../views/GameList.vue';

import { useAuthStore } from "../store/authStore";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/game",
    name: "Game",
    component: Game,
    meta: { requiresAuth: true },
  },
    {
    path: '/game/:id',
    name: 'GameList',
    component: GameList,
    meta: { requiresAuth: true },
    props: true, // 👈 para que el id se pase como prop (opcional si usas useRoute)
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  authStore.initializeAuthStore(); // Ensure state is up-to-date

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Home" });
  } else {
    next();
  }
});

export default router;
