import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Game from "../views/Game.vue";
import Configuracion from "../views/Configuracion.vue";
import partidas_reanudar from "../views/partidas_reanudar.vue";

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
    path: "/configuracion",
    name: "Configuracion",
    component: Configuracion,
    meta: { requiresAuth: true },
  },
    {
    path: "/partidas_reanudar",
    name: "Partidas_reanudar",
    component: partidas_reanudar,
    meta: { requiresAuth: true },
  },
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
