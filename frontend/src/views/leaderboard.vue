<!-- frontend/src/views/Leaderboard.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/store";
import { useAuthStore } from "@/store/authStore";

const router = useRouter();
const gameStore = useGameStore();
const authStore = useAuthStore();


// Al montar, llamamos a la acción getLeaderBoard del store
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push("/");
    return;
  }

  try {
    await gameStore.getLeaderBoard();
    // Tras esto, gameStore.leaderboard contendrá el array con datos
    console.log("Leaderboard desde store:", gameStore.leaderboard);
  } catch (err) {
    // Capturamos mensaje de error para mostrar
    console.error("Error en componente Leaderboard:", err);
  }
});

const volverConfiguracion = () => {
  router.push("/configuracion");
};
</script>

<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Tauler de Lideratge</h2>

    <!-- 1) Estado de carga -->
    <div v-if="loading" class="text-center">
      Carregant dades...
    </div>

    <!-- 2) Mostrar error si existe -->
    <div v-if="error" class="alert alert-danger text-center">
      {{ error }}
    </div>

    <!-- 3) Mostrar tabla solo si no está cargando, no hay error y hay datos -->
    <table v-if="!loading && !error && gameStore.leaderboard.length > 0" class="table table-striped">
      <thead>
        <tr>
          <th>#</th>
          <th>Nickname</th>
          <th>Puntuació</th>
          <th>Victòries</th>
          <th>Partides Jugades</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(player, index) in gameStore.leaderboard" :key="player.nickname">
          <td>{{ index + 1 }}</td>
          <td>{{ player.nickname }}</td>
          <td>{{ (player.score * 100).toFixed(1) + "%" }}</td>
          <td>{{ player.wonGames }}</td>
          <td>{{ player.totalGames }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 4) Si no hay datos tras cargar, mostramos mensaje -->
    <div v-if="!loading && !error && gameStore.leaderboard.length === 0" class="text-center">
      Encara no hi ha dades per mostrar.
    </div>

    <!-- 5) Botón para volver -->
    <div class="text-center mt-3">
      <button class="btn btn-outline-danger btn-sm" @click="volverConfiguracion">
        ← Volver a Configuración
      </button>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 700px;
  margin: auto;
}
.table {
  margin-top: 20px;
}
.btn-sm {
  padding: 0.3em 0.75em;
  font-size: 0.85rem;
}
</style>
