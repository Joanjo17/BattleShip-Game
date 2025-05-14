<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../store/authStore";

const authStore = useAuthStore();

const username = ref("");
const password = ref("");

onMounted(() => {
  authStore.initializeAuthStore();
  authStore.getAllPlayers();
});

const startGame = () => {
  window.location.href = "/game";
};

const authenticateUser = () => {
  if (!username.value || !password.value) {
    alert("Please enter both username and password.");
    return;
  }
  authStore.login({ username: username.value, password: password.value });
};

const logOut = () => {
  authStore.logout();
};
</script>

<template>
  <div class="home text-center mt-4">
    <h1>Welcome to Battleship Game</h1>

    <div v-if="authStore.isAuthenticated" class="mt-5">
      <h3>You're logged in!</h3>
      <div class="mb-3">
        Access Token: {{ authStore.accessToken.slice(0, 20) }}...
      </div>
      <button class="btn btn-primary mr-2" @click="startGame">
        Start New Game
      </button>
      <button class="btn btn-secondary" @click="logOut">Log Out</button>
    </div>

    <div v-else>
      <h3>Please log in to play</h3>
      <form
        @submit.prevent="authenticateUser"
        class="mx-auto"
        style="max-width: 300px"
      >
        <input
          v-model="username"
          type="text"
          placeholder="Username"
          class="form-control mb-2"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="form-control mb-2"
        />
        <button class="btn btn-primary w-100" :disabled="authStore.loading">
          {{ authStore.loading ? "Logging in..." : "Log In" }}
        </button>
        <div v-if="authStore.error" class="text-danger mt-2">
          {{ authStore.error }}
        </div>
      </form>
    </div>
  </div>

  <div v-if="authStore.playersList.length > 0" class="mt-5">
    <h3>Jugadors disponibles</h3>
    <ul class="list-group">
      <li
        v-for="player in authStore.playersList"
        :key="player.id"
        class="list-group-item"
      >
        {{ player.nickname }}
      </li>
    </ul>
  </div>

</template>

<style scoped>
.home {
  max-width: 600px;
  margin: 0 auto;
}
</style>
