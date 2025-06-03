<script setup>
import { useRouter } from "vue-router";
import { useGameStore } from "@/store";
import { useAuthStore } from '../store/authStore.js';
import { onMounted } from "vue";

const gameStore = useGameStore();
const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  gameStore.fetchAvailableGames();


});

const verificarYEntrarEnPartida = async (gameId, phase, owner) => {
  if (phase === "gameOver") {
    alert("⚠️ Esta partida ya ha terminado.");
    return;
  }

  // 2) Si el usuario logueado NO es el propietario, impedir la unión
  if (owner !== authStore.username) {
    alert("🚫 No puedes unirte a la partida de otro jugador.");
    return;
  }

  try {
    await gameStore.getGameState(gameId); // carga y valida estado
    router.push("/game"); // redirige a la partida
  } catch (error) {
    alert("❌ No se pudo entrar en la partida: " + error.message);
  }
};

// ← Nueva función: confirmar y eliminar
const confirmarYEliminar = async (gameId) => {
  const sure = confirm("¿Estás seguro de que quieres eliminar esta partida?");
  if (!sure) return;

  try {
    await gameStore.deleteGame(gameId);
    // Mostrar un pequeño mensaje
    alert(`🗑️ Partida ${gameId} eliminada satisfactoriamente.`);
  } catch (error) {
    alert("❌ Error al eliminar la partida: " + error.message);
  }
};

const volverAConfiguracion = () => {
  router.go(-1); // vuelve una página atrás en el historial
};

</script>


<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Partidas Disponibles de {{ authStore.username }}</h2>

    <div v-if="gameStore.availableGames.length === 0">
      <p class="text-center">No hay partidas disponibles para mostrar.</p>
    </div>

    <ul class="list-group mb-4">
      <li
        v-for="game in gameStore.availableGames"
        :key="game.id"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <div>
          <strong>Partida #{{ game.id }}</strong> —
          Estado: {{ game.phase }} —
          Propietario: {{ game.owner }}
        </div>

        <div class="d-flex justify-content-end align-items-center">
          <!-- Añadimos clase `me-3` al primer botón para separarlo -->
          <button
            class="btn btn-primary btn-sm me-3"
            @click="verificarYEntrarEnPartida(game.id, game.phase, game.owner)"
          >
            Unirse
          </button>

          <button
            class="btn btn-danger btn-sm"
            @click="confirmarYEliminar(game.id)"
          >
            Eliminar
          </button>
        </div>
      </li>
    </ul>

    <div class="text-center">
      <button class="btn btn-outline-danger btn-sm mt-3" @click="volverAConfiguracion">
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

/* Aseguramos que el margen funcione bien */
.me-3 {
  margin-right: 1rem !important;
}

.btn-sm {
  padding: 0.3em 0.75em;
  font-size: 0.85rem;
}
</style>