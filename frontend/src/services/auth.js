import axios from "axios";

class AuthService {

  /**
   * Inicia sesión enviando un POST a /api/token/ con username y password.
   * El backend devuelve access y refresh tokens si las credenciales son correctas.
   * - 'user': objeto { username, password }.
   */
  login(user) {
    return axios.post("/api/token/", {
      username: user.username,
      password: user.password,
    });
  }

  /**
   * Registra un nuevo usuario enviando un POST a /api/v1/user/ con los datos.
   * - 'userData': objeto { username, email, password }.
   * El backend crea el User y devuelve sus datos (sin contraseña).
   */
  register(userData) {
  return axios.post("/api/v1/user/", {
    username: userData.username,
    email: userData.email,
    password: userData.password,
  });
}

  /**
   * Refresca el token de acceso enviando el refresh token a /api/token/refresh/.
   * - 'refreshToken': string almacenado en localStorage.
   * Devuelve un nuevo access token si el refresh es válido.
   */
  refresh(refreshToken) {
    return axios.post("/api/token/refresh/", {
      refresh: refreshToken,
    });
  }

  /**
   * Cierra sesión borrando access y refresh tokens de localStorage.
   */
  logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }

  /**
   * Devuelve el access token almacenado en localStorage.
   */
  getAccessToken() {
    return localStorage.getItem("access");
  }

  /**
   * Devuelve el refresh token almacenado en localStorage.
   */
  getRefreshToken() {
    return localStorage.getItem("refresh");
  }

  /**
   * Comprueba si hay un access token en localStorage.
   * Retorna true si el usuario está logueado.
   */
  isLoggedIn() {
    return !!localStorage.getItem("access");
  }

  /**
   * Crea y devuelve una instancia de axios configurada con:
   * - baseURL: import.meta.env.VITE_API_URL (URL base de l’API).
   * - header Authorization: "Bearer <accessToken>".
   * Además, añade un interceptor a las respuestas:
   *   - Si la respuesta es 401 (token expirado) y el usuario está logueado,
   *     intenta hacer refresh del access token con el refresh token.
   *   - Si el refresh tiene éxito, actualiza localStorage y reintenta la petición original.
   *   - Si el refresh falla, llama a logout().
   */
  getAxiosInstance() {
    const apiUrl = import.meta.env.VITE_API_URL;
    const instance = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response.status === 401 && this.isLoggedIn()) {
          try {
            const response = await this.refresh(this.getRefreshToken());
            localStorage.setItem("access", response.data.access);
            error.config.headers["Authorization"] =
              "Bearer " + response.data.access;
            return axios.request(error.config);
          } catch (err) {
            this.logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Obtiene la lista de todos los jugadores (GET /api/v1/players/).
   * - Usa la instancia de axios con el token de autorización.
   * Retorna un array de Player (id, nickname, user, etc.).
   */
  getAllPlayers() {
  return this.getAxiosInstance().get("/api/v1/players/");
  };

}

export default new AuthService();
