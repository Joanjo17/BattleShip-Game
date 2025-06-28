<!-- src/views/Configuracion.vue -->
<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import {useGameStore} from "@/store/index.js";

const router = useRouter();
const authStore = useAuthStore();
const store = useGameStore();

/**
 * Crea una nueva partida:
 * 1) Llama a 'store.startNewGame()' para solicitar al backend la creación.
 *    Esta acción actualiza 'store.currentGameId' y guarda el ID en localStorage.
 * 2) Redirige a la ruta '/game' para que el usuario inicie la fase de colocación.
 */
const irACrearPartida = async () => {
  // Creamos la partida en el backend y guardamos el nuevo ID en el store (que también actualiza localStorage)
  await store.startNewGame();
  // Una vez creada, redirigimos a /game
  router.push("/game");
};

/**
 * Navega a la vista “Reanudar Partida”, donde se muestra la lista de partidas disponibles.
 */
const irAIniciarPartida = () => {
  router.push("/partidas_reanudar");
};

/**
 * Navega a la vista “Leaderboard” para mostrar los 5 mejores jugadores.
 */
const leaderBoard = () => {
  router.push("/leaderboard");
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
      <button class="btn btn-info" @click="leaderBoard">Mejores Jugadores</button>
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
