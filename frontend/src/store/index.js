import { defineStore } from "pinia";
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
    selectedShip: null,
    playersInGame: [],
    currentGameId: null,
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
        const response = await api.getGameState(gameId);
        const gameData = response.data;

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
        this.opponentBoard = opponent?.board || this.createEmptyBoard();
        this.opponentShips = opponent?.placedShips || [];
        this.gamePhase = gameData.phase;

        if (isPrepared && this.gamePhase !== "playing") {
          console.log("⏳ Esperando que el oponente esté listo...");
          setTimeout(() => this.getGameState(this.currentGameId), 1000);
        }

        console.log("Fase del juego:", this.gamePhase); //debug
        if (this.gamePhase === "playing") {
          this.gameStatus =
            gameData.turn === player.id ? "Your turn" : "Opponent's turn";
            console.log("Turno actual:", gameData.turn); //debug
        } else if (this.gamePhase === "placement") {
          this.gameStatus = "Place your ships";
        } else if (this.gamePhase === "gameOver") {
          this.gameStatus =
            "Game Over - Winner: " + (gameData.winner ?? "None");
        }


        await this.loadPlayersInGame(gameId);

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
        await this.placeAndSaveOpponentShips();
        //Refrescar el estado
        await this.getGameState(gameId);
      } catch (error) {
        const message = error.response?.data?.detail || error.message;
        console.error("Error al crear una nueva partida:", message);
        console.error("Detalles:", error.response?.data);
      }
    },
    async placeAndSaveOpponentShips() {
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

            const rf = isVertical ? row + ship.size - 1 : row;
            const cf = isVertical ? col : col + ship.size - 1;

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
            /**
            this.opponentShips.push({
              ...ship,
              isVertical,
              position: { row, col },
            });
             */

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

    async handlePlayerBoardClick(row, col) {
      if (this.gamePhase !== "placement" || !this.selectedShip) return;

      const ship = this.selectedShip;
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
      const player = this.playersInGame[0]; // asumimos que el jugador local está primero
      const gameId = this.currentGameId;
      const rf = ship.isVertical ? row + ship.size - 1 : row;
      const cf = ship.isVertical ? col : col + ship.size - 1;

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
        //this.gamePhase = "playing";
        //this.gameStatus = "Your turn";
        setTimeout(() => this.getGameState(this.currentGameId), 500);
      }
    },

    async handleOpponentBoardClick(row, col) {
      if (this.gamePhase !== "playing") return;
      // Validación básica de límites (ya que no lo haces en el backend)
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
      const gameId = this.currentGameId;
      try {
        console.log("🔫 Disparando a:", row, col);
        const response = await api.fireShot(gameId, player.id, { row, col });
        const result = response.data.result;


        if (result === 1) {
          this.opponentBoard[row][col] = -this.opponentBoard[row][col];
          this.gameStatus = "Hit!";
        } else {
          this.opponentBoard[row][col] = 11;
          this.gameStatus = "Miss!";
        }

        // Esperar turno del oponente
        setTimeout(this.opponentTurn, 1000);
      } catch (error) {
        console.error("Error al disparar:", error.response?.data); // <-- Agrega esto
        const msg = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
        this.gameStatus = msg;
      }
    },
    async opponentTurn() {
      await this.getGameState(this.currentGameId);
      if (this.gamePhase === "gameOver") {
        console.log("🏁 La partida ha terminado. ¡Has perdido!");
      }

      const cpuPlayer = this.playersInGame.find(p => p.nickname === "cpu");
      if (!cpuPlayer) {
        console.warn("No se encontró el jugador CPU.");
        return;
      }

      let row, col, valid = false;
      while (!valid) {
        row = Math.floor(Math.random() * 10);
        col = Math.floor(Math.random() * 10);
        valid =
          this.playerBoard[row][col] >= 0 && this.playerBoard[row][col] < 10;
      }

      try {
        const response = await api.fireShot(this.currentGameId, cpuPlayer.id, { row, col });
        const result = response.data.result;

        if (result === 1) {
          this.playerBoard[row][col] = -this.playerBoard[row][col];
          this.gameStatus = "CPU hit your ship! - Your turn";
        } else {
          this.playerBoard[row][col] = 11;
          this.gameStatus = "Your turn";
        }

      } catch (error) {
        const msg = error.response?.data?.detail || error.message;
        console.error("Error en turno del CPU:", msg);
        this.gameStatus = msg;
      }
    }
  },
});
