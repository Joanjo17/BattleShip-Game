<script setup>
import { onMounted } from "vue";
import { useGameStore } from "../store";
import { useAuthStore } from "../store/authStore";
import GameBoard from "../components/GameBoard.vue";
import DockingArea from "../components/DockingArea.vue";
// import { ref } from "vue";
// import api from "../services/api";

const store = useGameStore();
const authStore = useAuthStore();

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

onMounted(() => {
  // To start a new game, uncomment the line below
   //store.startNewGame();
  // To fetch the game state, uncomment the line below
   //store.getGameState("59");
  // getUsers();
});

const onLogout = () => {
  if (confirm("Are you sure you want to log out?")) {
    authStore.logout();
    window.location.href = "/";
  }
};
</script>

<template>
  <!-- <pre>{{ user ? JSON.stringify(user, null, 2) : "Loading user data..." }}</pre> -->
  <div class="container-fluid">
    <h1 class="text-center my-2">
      Battleship (Hello: {{ authStore.username }})
      <button class="btn btn-sm btn-outline-danger ms-2" @click="onLogout">
        Logout
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
          <div class="game-status mb-3">{{ store.gameStatus }}</div>
          <button class="btn btn-primary" @click="store.startNewGame()">
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
}
</style>
