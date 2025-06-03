import { defineStore } from "pinia";
import AuthService from "../services/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    username: null,  // Nombre de usuario del usuario logueado
    accessToken: null,  // JWT access token
    refreshToken: null,  // JWT refresh token
    isAuthenticated: false,  // Booleano que indica si el usuario está autenticado
    loading: false,  // Indicador de carga para mostrar spinners o deshabilitar botones
    error: null,  // Mensaje de error en caso de fallo en login/registro
    playersList: [],  // Lista de jugadores obtenida del backend
    userid: null,  // ID del usuario (opcional, si se necesita)
  }),
  actions: {

    /**
     * Inicializa el estado de autenticación a partir de localStorage.
     * - Carga username, accessToken y refreshToken.
     * - Marca isAuthenticated en true si existe un accessToken.
     * Se debe llamar al arrancar la app o antes de rutas protegidas.
     */
    initializeAuthStore() {
      this.username = localStorage.getItem("username");
      this.accessToken = localStorage.getItem("access");
      this.refreshToken = localStorage.getItem("refresh");
      this.isAuthenticated = !!this.accessToken;
    },

    /**
     * Intenta hacer login con usuario y contraseña.
     * - 'user' es objeto { username, password }.
     * - Muestra spinner (loading = true) mientras espera la respuesta.
     * - Si el login es exitoso, guarda tokens en state y en localStorage.
     * - Luego llama a getAllPlayers() para poblar playersList.
     * - En caso de error, asigna mensaje a this.error y marca isAuthenticated = false.
     */
    login(user) {
      this.loading = true;
      this.error = null;

      return AuthService.login(user)
        .then((response) => {
          console.log("response", response);
          //response = JSON.parse(response); // this is a mock, in real case it will be axios response
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
          // Cargar jugadores después del login
          return this.getAllPlayers();
        });
    },

    /**
     * Registra un nuevo usuario.
     * - 'userData' es objeto { username, email, password }.
     * - Si el registro es exitoso, llama automáticamente a login() para iniciar sesión.
     * - En caso de error, asigna mensaje a this.error y lanza excepción para el componente.
     */
    register(userData) {
      this.loading = true;
      this.error = null;

      return AuthService.register(userData)
        .then(() => {
          // El registro fue exitoso, ahora puedes hacer login automáticamente
          return this.login({
            username: userData.username,
            password: userData.password,
          });
        })
        .catch((error) => {
          console.log("error", error);
          this.error = error.response?.data || "Registration failed.";
          this.isAuthenticated = false;
          throw error; // opcional: para poder capturar en el componente si hace falta
        })
        .finally(() => {
          this.loading = false;
        });
    },

    /**
     * Cierra sesión:
     * - Limpia tokens y username del state.
     * - Marca isAuthenticated = false.
     * - Elimina datos relacionados de localStorage (username, access, refresh, currentGameId).
     */
    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      localStorage.removeItem("username");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("currentGameId");
    },

    /**
     * Obtiene la lista de todos los jugadores (GET /api/v1/players/).
     * - Llama a AuthService.getAllPlayers() que retorna un array de objetos Player.
     * - Mapea cada jugador a { id, nickname } y lo añade a this.playersList.
     * - Si hay error, lanza excepción con el mensaje correspondiente.
     */
    async getAllPlayers() {
          try {
            this.playersList = [];
            const response = await AuthService.getAllPlayers();
            for (const player of response.data) {
              this.playersList.push({
                id: player.id,
                nickname: player.nickname,
              });
            }
          } catch (error) {
            const message = error.response?.data?.detail || error.message;
            throw new Error(message);
          }
    },
  },
});
