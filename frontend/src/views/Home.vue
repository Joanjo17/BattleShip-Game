<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const email = ref("");
const confirmPassword = ref("");
const isRegistering = ref(false);

onMounted(() => {
  authStore.initializeAuthStore();
  if (authStore.isAuthenticated) {
    authStore.getAllPlayers();
    router.push("/configuracion"); // redirige si ya está logeado
  }
});

const authenticateUser = async () => {
  if (!username.value || !password.value) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    });

    // Redireccionar tras login exitoso
    router.push("/configuracion");

  } catch (error) {
    console.error("Login failed", error);
  }
};

const registerUser = async () => {
  if (!username.value || !password.value || !confirmPassword.value || !email.value) {
    alert("Please fill in all fields.");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match.");
    return;
  }

  try {
    await authStore.register({
      username: username.value,
      email: email.value,
      password: password.value,
    });

  } catch (error) {
    console.error("Registration or login failed", error);
  }
};

const logOut = () => {
  authStore.logout();
};
</script>

<template>
  <div class="home text-center mt-4">
    <h1>Welcome to Battleship Game</h1>

    <div>
      <h3>{{ isRegistering ? "Register" : "Login" }}</h3>
      <form
        @submit.prevent="isRegistering ? registerUser() : authenticateUser()"
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
          v-model="email"
          v-if="isRegistering"
          type="email"
          placeholder="Email"
          class="form-control mb-2"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="form-control mb-2"
        />
        <input
          v-model="confirmPassword"
          v-if="isRegistering"
          type="password"
          placeholder="Confirm Password"
          class="form-control mb-2"
        />

        <button class="btn btn-primary w-100" :disabled="authStore.loading">
          {{
            authStore.loading
              ? isRegistering
                ? "Registering..."
                : "Logging in..."
              : isRegistering
              ? "Register"
              : "Log In"
          }}
        </button>

        <div v-if="authStore.error" class="text-danger mt-2">
          {{ authStore.error }}
        </div>

        <div class="mt-3">
          <a href="#" @click.prevent="isRegistering = !isRegistering">
            {{ isRegistering ? "Already have an account? Log in" : "Don't have an account? Register here" }}
          </a>
        </div>
      </form>
    </div>
  </div>
</template>


<style scoped>
.home {
  max-width: 600px;
  margin: 0 auto;
}
</style>
