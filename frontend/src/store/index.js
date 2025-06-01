import { defineStore } from "pinia";
import { useAuthStore } from '../store/authStore.js';
import api from "../services/api";

export const useGameStore = defineStore("game", {
  state: () => ({
    gamePhase: "waiting",
    gameStatus: "Waiting for players",
    playerBoard: [],
    opponentBoard: [],
    playerPlacedShips: [],
    opponentShips: [],
    availableShips: [],
    selectedShip: -1, // ID del barco seleccionado para colocar
    playersInGame: [],
    currentGameId: -1, // ID de la partida actual
    turnId: -1, // ID del jugador cuyo turno es
    firing: false, // Indica si se está disparando
    availableGames: [],
    owner: null, // ID del jugador que creó la partida
  }),

  actions: {
    getUser(id) {
      return api
        .getUser(id)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          const message = error.response?.data?.detail || error.message;
          throw new Error(message);
        });
    },
    async loadPlayersInGame(gameId) {
      try {
        const response = await api.getPlayersInGame(gameId);
        console.log("Jugadores en la partida:", response.data);
        this.playersInGame = response.data;
      } catch (error) {
        const message = error.response?.data?.detail || error.message;
        console.error("Error cargando jugadores de la partida:", message);
      }
    },


    async getGameState(gameId) {
      try {
        this.currentGameId = gameId;
        localStorage.setItem("currentGameId", gameId);
        const response = await api.getGameState(gameId);
        const gameData = response.data;
        this.owner = response.data.owner; // Guardar el propietario de la partida

        console.log("Datos completos del backend:", gameData);
        const player = gameData.extended_status.player;
        const opponent = gameData.extended_status.opponent;
        console.log("Player (extended_status):", player);
        console.log("Opponent (extended_status):", opponent);

        // PLAYER
        this.playerBoard = player.board;
        this.playerPlacedShips = player.placedShips;
        this.availableShips = player.availableShips;
        const isPrepared = player.prepared;

        // OPPONENT
        this.opponentBoard = opponent?.board;
        this.opponentShips = opponent?.placedShips;


        this.gamePhase = gameData.phase;
        this.turnId = gameData.turn;

        await this.loadPlayersInGame(gameId);

        if (this.gamePhase === "gameOver") {
          const winnerPlayer = this.playersInGame.find(p => p.id === gameData.winner);
          this.gameStatus = "Game Over - Winner: " + (winnerPlayer?.nickname || "Desconocido");
          console.log("  🏁 Ganador:", winnerPlayer ?? "Nadie");
          return;
        }

        if (this.gamePhase !== "playing" && isPrepared) {
          console.log("⏳ Esperando que el oponente esté listo...");
          setTimeout(() => this.getGameState(this.currentGameId), 1000);
        }

        console.log("📊 Estado actual del juego:");
        console.log("  ▶️ Fase:", gameData.phase);
        console.log("  👤 Turno del jugador ID:", gameData.turn);
        console.log("  🏁 Ganador (si hay):", gameData.winner);
        console.log("  🤖 Jugador actual (local):", player.username, "| ID:", player.id);
        console.log("  👥 Jugadores en la partida:", this.playersInGame.map(p => `${p.nickname} (${p.id})`).join(" - "));
        console.log("  🏁 Ganador:", gameData.winner ?? "Nadie");


        if (this.gamePhase === "playing") {
          this.gameStatus =
            gameData.turn === player.id ? "Your turn" : "Opponent's turn";
            console.log("Turno actual:", gameData.turn); //debug
        } else if (this.gamePhase === "placement") {
          this.gameStatus = "Place your ships";
        }

      } catch (error) {
        const message = error.response?.data?.detail || error.message;
        console.error("Error al obtener el estado del juego:", message);
        throw new Error(message);
      }
    },

    createEmptyBoard() {
      return Array(10)
        .fill()
        .map(() => Array(10).fill(0));
    },


    async startNewGame() {
      this.gamePhase = "placement";
      this.gameStatus = "Place your ships";
      this.playerBoard = this.createEmptyBoard();
      this.opponentBoard = this.createEmptyBoard();
      this.playerPlacedShips = [];
      this.opponentShips = [];
      this.selectedShip = null;

      try {
        // Crear partida
        const gameResponse = await api.createGame({
          width: 10,
          height: 10,
          multiplayer: false,
        });

        const gameId = gameResponse.data.id;
        this.currentGameId = gameId;
        localStorage.setItem("currentGameId", gameId);

        console.log("Partida creada con ID:", gameId);
        // Nos aseguramos de que los jugadores están cargados antes de seguir
        await this.loadPlayersInGame(gameId);

        // Cargar barcos reales del backend
        const vesselsResponse = await api.getAvailableShips();
        this.availableShips = vesselsResponse.data.map((v) => ({
          type: v.id,
          size: v.size,
          isVertical: true,
        }));

        //Función que guarda los barcos del bot
        await this.placeOpponentShips();
        //Refrescar el estado
        await this.getGameState(gameId);
      } catch (error) {
        const message = error.response?.data?.detail || error.message;
        console.error("Error al crear una nueva partida:", message);
        console.error("Detalles:", error.response?.data);
      }
    },
    async placeOpponentShips() {
      console.log("⛴️ Colocando barcos del bot y guardando en el backend...");
      const cpuPlayer = this.playersInGame.find(p => p.nickname === "cpu");
      if (!cpuPlayer) {
        console.warn("No se encontró el jugador CPU.");
        return;
      }
      console.log("Se encontró el jugador CPU:", cpuPlayer);

      const shipList = [1, 2, 3, 4, 5];

      for (let type of shipList) {
        const ship = this.availableShips.find((s) => s.type === type);
        if (!ship) continue;

        let placed = false;
        while (!placed) {
          const row = Math.floor(Math.random() * 10);
          const col = Math.floor(Math.random() * 10);
          const isVertical = Math.random() > 0.5;

          if (this.isValidPlacement(this.opponentBoard, row, col, ship.size, isVertical)) {
            this.placeShip(this.opponentBoard, row, col, ship.size, isVertical, ship.type);

            const { rf, cf } = this.getShipEndCoords(row, col, ship.size, isVertical);

            try {
              await api.placeVessel(this.currentGameId, cpuPlayer.id, {
                ri: row,
                ci: col,
                rf: rf,
                cf: cf,
                vessel: ship.type,
              });
            } catch (e) {
              console.error(`Error guardando barco ${type} del CPU`, e.message);
            }

            placed = true;
          }
        }
      }
    },

    placeShip(board, row, col, size, isVertical, type) {
      for (let i = 0; i < size; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col + i;
        board[r][c] = type;
      }
    },

    isValidPlacement(board, row, col, size, isVertical) {
      const inBounds = isVertical ? row + size <= 10 : col + size <= 10;
      if (!inBounds) return false;

      for (let i = 0; i < size; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col + i;
        if (board[r][c] !== 0) return false;
      }
      return true;
    },

    selectShip(ship) {
      this.selectedShip = { ...ship };
    },

    rotateSelectedShip() {
      if (this.selectedShip) {
        this.selectedShip.isVertical = !this.selectedShip.isVertical;
      }
    },
    getShipEndCoords(row, col, size, isVertical) {
      return {
        rf: isVertical ? row + size - 1 : row,
        cf: isVertical ? col : col + size - 1
      };
    },

    async handlePlayerBoardClick(row, col) {
      if (this.gamePhase !== "placement" || !this.selectedShip) return;

      const ship = this.selectedShip;
      const authStore = useAuthStore();
      if (
        !this.isValidPlacement(
          this.playerBoard,
          row,
          col,
          ship.size,
          ship.isVertical
        )
      )
        return;

      // Colocar en el tablero local
      this.placeShip(
        this.playerBoard,
        row,
        col,
        ship.size,
        ship.isVertical,
        ship.type
      );

      this.playerPlacedShips.push({ ...ship, position: { row, col } });

      // Enviar al backend
      const player = this.playersInGame.find(p => p.nickname === authStore.username);
      if (!player) {
        console.error("Jugador no encontrado en playersInGame con nickname:", authStore.username);
        return;
      }
      const gameId = this.currentGameId;
      const { rf, cf } = this.getShipEndCoords(row, col, ship.size, ship.isVertical);
      try {
        await api.placeVessel(gameId, player.id, {
          ri: row,
          ci: col,
          rf: rf,
          cf: cf,
          vessel: ship.type,
        });
        console.log("Barco colocado en backend");
      } catch (error) {
        console.error("Error al colocar el barco en el backend:", error.message);
      }

      // Actualizar estado local
      this.availableShips = this.availableShips.filter(
        (s) => s.type !== ship.type
      );
      this.selectedShip = null;

      if (this.availableShips.length === 0) {
        await this.getGameState(this.currentGameId);
      }
    },

    async handleOpponentBoardClick(row, col) {
      //Debugging
      console.log("📤 Jugador intentando disparar...");
      console.log("  ▶️ Fase actual:", this.gamePhase);

      if (this.gamePhase !== "playing") return;
      if (this.firing) return;

      // Validación básica de límites
      if (row < 0 || row >= 10 || col < 0 || col >= 10) {
        this.gameStatus = "Coordenadas fuera de los límites del tablero.";
        return;
      }
      if (this.opponentBoard[row][col] < 0) {
        this.gameStatus = "Already hit!";
        return;
      } else if (this.opponentBoard[row][col] === 11) {
        this.gameStatus = "Already missed!";
        return;
      }

      const player = this.playersInGame.find(p => p.nickname !== "cpu");
       console.log("Es tu turno:", this.turnId === player.id);
      const gameId = this.currentGameId;
      console.log("🚹 TURNO DEL JUGADOR");
      console.log("Fase actual:", this.gamePhase);
      console.log("Jugador PLAYER:", player);
      console.log("Es el turno del PLAYER:", this.turnId === player.id);
      this.firing = true;
      try {
        const response = await api.fireShot(gameId, player.id, { row, col });
        const result = response.data.result;


        if (result === 1) {
          this.opponentBoard[row][col] = -this.opponentBoard[row][col];
          this.gameStatus = "Hit!";
        } else {
          this.opponentBoard[row][col] = 11;
          this.gameStatus = "Miss!";
        }
        console.log(`🚹 Disparo del PLAYER en (${row}, ${col}) →`, result === 1 ? "Hit" : "Miss");
        // 🔄 Actualizar estado tras disparar
        await this.getGameState(this.currentGameId);

        // ✅ Solo si el juego sigue, hacer turno del CPU
        if (this.gamePhase !== "gameOver") {
          await this.opponentTurn();
        }

      } catch (error) {
        console.error("Error al disparar:", error.response?.data); // <-- Agrega esto
        const msg = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
        this.gameStatus = msg;
      }finally {
        this.firing = false;
      }

    },
    async opponentTurn() {
      if (this.gamePhase === "gameOver") {
        return
      }

      const cpuPlayer = this.playersInGame.find(p => p.nickname === "cpu");
      if (!cpuPlayer) {
        console.warn("No se encontró el jugador CPU.");
        return;
      }

      console.log("🤖 TURNO DEL CPU");
      console.log("Fase actual:", this.gamePhase);
      console.log("Jugador CPU:", cpuPlayer);
      console.log("Es el turno del CPU:", this.turnId === cpuPlayer.id);

      let result = 1;

      // El bucle se repite mientras el CPU acierte y no haya terminado el juego
      while (result === 1 && this.gamePhase !== "gameOver" && this.turnId == cpuPlayer.id) {
        let row, col, valid = false;

        while (!valid) {
          row = Math.floor(Math.random() * 10);
          col = Math.floor(Math.random() * 10);
          valid = this.playerBoard[row][col] >= 0 && this.playerBoard[row][col] < 10;
        }

        try {
          const response = await api.fireShot(this.currentGameId, cpuPlayer.id, { row, col });
          result = response.data.result;
          //console.log(🤖 Disparo del CPU en (${row}, ${col}) →, result === 1 ? "Hit" : "Miss");

          // 🔄 Actualizar estado tras disparo
          await this.getGameState(this.currentGameId);

          if (this.gamePhase === "gameOver") {
            console.log("🏁 Partida finalizada tras disparo del CPU");
            return;
          }

          if (result === 1) {
            this.gameStatus = "CPU hit your ship! - Again!";
          } else {
            this.gameStatus = "Your turn";
          }

        } catch (error) {
          const msg = error.response?.data?.detail || error.message;
          console.error("Error en turno del CPU:", msg);
          this.gameStatus = msg;
          break;
        }
      }
    },
    async fetchAvailableGames() {
      try {
        const response = await api.getAllGames();
        this.availableGames = response.data;

        console.log("📦 Partidas disponibles:", this.availableGames);
      } catch (error) {
        const message = error.response?.data?.detail || error.message;
        console.error("Error al obtener partidas disponibles:", message);
        this.availableGames = [];
      }
    },

    async deleteGame(gameId) {
      try {
        await api.deleteGame(gameId);
        console.log(`🗑️ Partida ${gameId} eliminada.`);
        await this.fetchAvailableGames();
      } catch (error) {
        const msg = error.response?.data?.detail || error.message;
        console.error("Error al eliminar partida:", msg);
        throw new Error(msg);
      }
    }
  },
});
