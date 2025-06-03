import AuthService from "@/services/auth.js";

const axiosInstance = AuthService.getAxiosInstance();

export default {

  /**
   * Retorna la llista de vaixells disponibles (GET /api/v1/vessels/).
   */
  getAvailableShips() {
    return axiosInstance.get("/api/v1/vessels/");
  },

  /**
   * Crea una nova partida al backend (POST /api/v1/games/).
   * - 'payload' és un objecte amb camps { width, height, multiplayer }.
   * Retorna la resposta amb l’ID de la partida nova.
   */
  createGame(payload) {
    return axiosInstance.post(`/api/v1/games/`, payload);
  },

  /**
   * Recupera l’estat complet d’una partida (GET /api/v1/games/{gameId}/).
   * - Inclou informació d’extended_status, fase, torn, taulers i jugadors.
   */
  getGameState(gameId) {
  return axiosInstance.get(`/api/v1/games/${gameId}/`);
  },

  /**
   * Obté informació d’un usuari pel seu ID (GET /api/v1/user/{id}).
   * - Retorna camps de User (username, email, etc.).
   */
  getUser(id) {
    return axiosInstance.get(`/api/v1/user/${id}`);
  },

  /**
   * Llista els jugadors que ja s’han unit a una partida (GET /api/v1/games/{gameId}/players/).
   * - Retorna array de Player amb { id, nickname, user, ... }.
   * Necessari per saber si existeix el jugador CPU o per mostrar tots els jugadors.
   */
  getPlayersInGame(gameId) {
    return axiosInstance.get(`/api/v1/games/${gameId}/players/`);
  },

  /**
   * Col·loca un vaixell a la partida per a un jugador determinat (POST /api/v1/games/{gameId}/players/{playerId}/vessels/).
   * - `vesselData` conté { ri, ci, rf, cf, vessel } (coordenades i tipus de vaixell).
   * S’usa durant la fase “placement” per enviar al backend la posició del vaixell.
   */
  placeVessel(gameId, playerId, vesselData) {
    console.log(" Placing vessel: Game ID:"+ gameId+ "Player ID: "+ playerId+ "Vessel Data: "+ JSON.stringify(vesselData));
    return axiosInstance.post(`/api/v1/games/${gameId}/players/${playerId}/vessels/`, vesselData);
  },

  /**
   * Envia un dispar al backend (POST /api/v1/games/{gameId}/players/{playerId}/shots/).
   * - 'payload' conté { row, col }.
   * El backend retorna un objecte amb { result, impact, … } per indicar “hit” o “miss”.
   * S’executa durant la fase “playing” en clicar sobre el tauler de l’oponent.
   */
  fireShot(gameId, playerId, payload) {
    return axiosInstance.post(`/api/v1/games/${gameId}/players/${playerId}/shots/`, payload);
  },

  /**
   * Recupera la llista de totes les partides (GET /api/v1/games/).
   * - Retorna un array de Game amb informació bàsica (id, owner, phase, turn, winner).
   * Útil per a “Reanudar Partida” i per al Leaderboard.
   */
  getAllGames() {
    return axiosInstance.get(`/api/v1/games/`);
  },

  /**
   * Elimina una partida pel seu ID (DELETE /api/v1/games/{gameId}/).
   * S’usa en la vista “Reanudar partida” per permetre a l’usuari esborrar partides pròpies.
   */
  deleteGame(gameId) {
    return axiosInstance.delete(`/api/v1/games/${gameId}/`);
  }
};
