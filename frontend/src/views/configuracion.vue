<!-- src/views/Configuracion.vue -->
<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import {useGameStore} from "@/store/index.js";

const router = useRouter();
const authStore = useAuthStore();
const store = useGameStore();

const irACrearPartida = async () => {
  // 1) Creamos la partida en el backend y guardamos el nuevo ID en el store (que también actualiza localStorage)
  await store.startNewGame();
  // 2) Una vez creada, redirigimos a /game
  router.push("/game");
};

const irAIniciarPartida = () => {
  router.push("/partidas_reanudar");
};

const cerrarSesion = () => {
  authStore.logout();
  router.push("/");
};
</script>

<template>
  <div class="config-container">

    <h2 class="text-center my-4">
      Bienvenido: {{ authStore.username }}
    </h2>

    <div class="botones">
      <button class="btn btn-success" @click="irACrearPartida">Crear Partida</button>
      <button class="btn btn-primary" @click="irAIniciarPartida">Iniciar Partida</button>
      <button class="btn btn-danger" @click="cerrarSesion">Cerrar Sesión</button>
    </div>
  </div>
</template>

<style scoped>
.config-container {
  max-width: 400px;
  margin: 0 auto;
  padding-top: 50px;
}

.botones {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}
</style>
