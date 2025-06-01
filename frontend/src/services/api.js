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
    console.log(" Placing vessel: Game ID:"+ gameId+ "Player ID: "+ playerId+ "Vessel Data: "+ JSON.stringify(vesselData));
    return axiosInstance.post(`/api/v1/games/${gameId}/players/${playerId}/vessels/`, vesselData);
  },
  fireShot(gameId, playerId, payload) {
    return axiosInstance.post(`/api/v1/games/${gameId}/players/${playerId}/shots/`, payload);
  },

  getAllGames() {
    return axiosInstance.get(`/api/v1/games/`);
  },

  deleteGame(gameId) {
    return axiosInstance.delete(`/api/v1/games/${gameId}/`);
  }
};
