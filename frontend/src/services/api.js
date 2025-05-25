import AuthService from "@/services/auth.js";
const axiosInstance = AuthService.getAxiosInstance();

export default {
  getAvailableShips() {
    return axiosInstance.get("/api/v1/vessels/");
  },
  createGame(payload) {
    return axiosInstance.post(`/api/v1/games/`, payload);
  },

  getGameState(gameId) {
  return axiosInstance.get(`/api/v1/games/${gameId}/`);
  },

  getUser(id) {
    return axiosInstance.get(`/api/v1/user/${id}`);
  },

  getPlayersInGame(gameId) {
    return axiosInstance.get(`/api/v1/games/${gameId}/players/`);
  },
  placeVessel(gameId, playerId, vesselData) {
    console.log(gameId, playerId, vesselData);
    return axiosInstance.post(`/api/v1/games/${gameId}/players/${playerId}/vessels/`, vesselData);
  }
};
