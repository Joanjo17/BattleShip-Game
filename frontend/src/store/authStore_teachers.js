import { defineStore } from "pinia";
import AuthService from "../services/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    username: null,  // Nombre de usuario del usuario logueado
    accessToken: null,  // JWT access token almacenado
    refreshToken: null,  // JWT refresh token almacenado
    isAuthenticated: false,  // Booleano que indica si el usuario está autenticado
    loading: false,  // Indicador para estado de carga (spinner, deshabilitar botones, etc.)
    error: null,  // Mensaje de error en caso de fallo en login
  }),
  actions: {

    /**
     * Inicializa el store de autenticación leyendo localStorage:
     * - username, accessToken y refreshToken.
     * - isAuthenticated pasa a true si existe accessToken.
     * Se debe invocar al iniciar la aplicación o antes de rutas protegidas.
     */
    initializeAuthStore() {
      this.username = localStorage.getItem("username");
      this.accessToken = localStorage.getItem("access");
      this.refreshToken = localStorage.getItem("refresh");
      this.isAuthenticated = !!this.accessToken;
    },

    /**
     * Realiza el login del usuario:
     * - user: objeto { username, password }
     * - Muestra spinner (loading = true) mientras espera la respuesta.
     * - Si es exitoso, guarda username y tokens en state y localStorage.
     * - Si falla, asigna mensaje a 'this.error' y marca isAuthenticated = false.
     * - Al finalizar, siempre setea loading = false.
     */
    login(user) {
      this.loading = true;
      this.error = null;

      return AuthService.login(user)
        .then((response) => {
          console.log("response", response);
          this.username = user.username;
          this.accessToken = response.data.access;
          this.refreshToken = response.data.refresh;
          this.isAuthenticated = true;

          localStorage.setItem("username", this.username);
          localStorage.setItem("access", this.accessToken);
          localStorage.setItem("refresh", this.refreshToken);
        })
        .catch((error) => {
          console.log("error", error);
          this.error =
            error.response?.data?.detail || "Login failed. Try again.";
          this.isAuthenticated = false;
        })
        .finally(() => {
          this.loading = false;
        });
    },

    /**
     * Cierra sesión:
     * - Borra tokens y username del state.
     * - Marca isAuthenticated = false.
     * - Elimina las claves correspondientes de localStorage.
     */
    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      localStorage.removeItem("username");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    },
  },
});
