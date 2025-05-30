import axios from "axios";

class AuthService {
  login(user) {
    return axios.post("/api/token/", {
      username: user.username,
      password: user.password,
    });
  }
  register(userData) {
  return axios.post("/api/v1/user/", {
    username: userData.username,
    email: userData.email,
    password: userData.password,
  });
}

  refresh(refreshToken) {
    return axios.post("/api/token/refresh/", {
      refresh: refreshToken,
    });
  }


  logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }

  getAccessToken() {
    return localStorage.getItem("access");
  }

  getRefreshToken() {
    return localStorage.getItem("refresh");
  }

  isLoggedIn() {
    return !!localStorage.getItem("access");
  }

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


  getAllPlayers() {
  return this.getAxiosInstance().get("/api/v1/players/");
  };

}

export default new AuthService();
