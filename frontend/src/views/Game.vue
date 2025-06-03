<script setup>
import { onMounted } from "vue";
import { useGameStore } from "../store";
import { useAuthStore } from "../store/authStore";
import GameBoard from "../components/GameBoard.vue";
import DockingArea from "../components/DockingArea.vue";

import { useRouter } from 'vue-router';
// import { ref } from "vue";
// import api from "../services/api";'
const store = useGameStore();
const authStore = useAuthStore();

const router = useRouter();

// const user = ref(null);

// function getUsers() {
//   api
//     .getUser(1)
//     .then((response) => {
//       console.log(response.data);
//       user.value = response.data;
//     })
//     .catch((error) => {
//       console.error("Error fetching user data:", error);
//     });
//   console.log(user.value);
// }


/**
 * Al montar el componente, comprueba si existe un 'currentGameId' en localStorage.
 * Si existe, intenta restaurar el estado de la partida mediante 'getGameState(id)'.
 * - Si tiene éxito, muestra en consola “Partida restaurada ...”.
 * - Si falla (por ejemplo, la partida ya no existe), borra 'currentGameId'.
 */
onMounted(async () => {
  const savedGameId = localStorage.getItem("currentGameId");

  if (savedGameId) {
    try {
      await store.getGameState(savedGameId);
      console.log("🔁 Partida restaurada desde localStorage:", savedGameId);
    } catch (error) {
      console.error("❌ No se pudo restaurar la partida:", error.message);
      localStorage.removeItem("currentGameId");
    }
  }
});


const volverAConfiguracion = () => {
  router.go(-1); // vuelve una página atrás en el historial
};

</script>

<template>
  <!-- <pre>{{ user ? JSON.stringify(user, null, 2) : "Loading user data..." }}</pre> -->
  <div class="container-fluid">
    <h1 class="text-center my-2">
      Battleship (Hello: {{ authStore.username }})
      <button class="btn btn-sm btn-outline-danger ms-2" @click="volverAConfiguracion">
        Volver a Configuración
      </button>
    </h1>
    <div class="row">
      <!-- Player's Board -->
      <div class="col-lg-5 d-flex flex-column align-items-center">
        <h3 class="text-center">Your Fleet</h3>
        <GameBoard
          :board="store.playerBoard"
          :ships="store.playerPlacedShips"
          @cell-click="store.handlePlayerBoardClick"
        />
      </div>

      <!-- Docking Area -->
      <div v-if="store.gamePhase === 'placement'" class="col-lg-2">
        <h3 class="text-center">Dock</h3>
        <DockingArea
          :ships="store.availableShips"
          @ship-selected="store.selectShip"
          @rotate-ship="store.rotateSelectedShip"
        />
      </div>

      <!-- Controls -->
      <div v-else class="col-lg-2 d-flex flex-column justify-content-center">
        <div class="game-controls text-center">
          <div
            class="game-status mb-3"
            :style="store.gamePhase === 'gameOver' ? { color: 'red', fontSize: '1.5rem', fontWeight: 'bold' } : {}"
          >
            {{ store.gameStatus }}
          </div>
          <button
            class="btn btn-primary"
            v-if="store.gamePhase === 'waiting' || store.gamePhase === 'gameOver'"
            @click="store.startNewGame()"
          >
            New Game
          </button>
        </div>
      </div>

      <!-- Opponent Board -->
      <div class="col-lg-5 d-flex flex-column align-items-center">
        <h3 class="text-center">Enemy Fleet</h3>
        <GameBoard
          :board="store.opponentBoard"
          :ships="store.opponentShips"
          :hidden="true"
          @cell-click="store.handleOpponentBoardClick"
        />
      </div>
    </div>
  </div>
</template>

<style>
.game-controls {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.game-status {
  font-size: 1.2rem;
  font-weight: bold;
  word-break: break-word; /* Asegura que el texto no se desborde */
  text-align: center;
}
</style>
