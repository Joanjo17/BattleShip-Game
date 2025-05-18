import { defineStore } from "pinia";
import api from "../services/api";

export const useGameStore = defineStore("game", {
  state: () => ({
    gamePhase: "placement",
    gameStatus: "Place your ships",
    playerBoard: [],
    opponentBoard: [],
    playerPlacedShips: [],
    opponentShips: [],
    availableShips: [],
    selectedShip: null,
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

    async getGameState(gameId) {
      return api
        .getGameState(gameId)
        .then((response) => {
          const gameData = response.data;
          console.log("Datos completos del backend:", gameData);

          const player = gameData.extended_status.player;
          console.log("Player (extended_status):", gameData.extended_status?.player);

          this.playerBoard = player.board;
          this.playerPlacedShips = player.placedShips;
          this.availableShips = player.availableShips;
          this.gamePhase = gameData.phase;

          if (this.gamePhase === "playing") {
            this.gameStatus =
              gameData.turn === player.username ? "Your turn" : "Opponent's turn";
          } else if (this.gamePhase === "placement") {
            this.gameStatus = "Place your ships";
          } else if (this.gamePhase === "gameOver") {
            this.gameStatus = "Game Over - Winner: " + (gameData.winner ?? "None");
          }

          this.opponentBoard = this.createEmptyBoard();
          this.opponentShips = [];
          this.placeOpponentShips();
        })
        .catch((error) => {
          const message = error.response?.data?.detail || error.message;
          console.error("Error al obtener el estado del juego:", message);
          throw new Error(message);
        });
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
      this.availableShips = await api.getAvailableShips(); // TODO check with axios on how to avoid await.

      this.placeOpponentShips();
    },

    placeShip(board, row, col, size, isVertical, type) {
      for (let i = 0; i < size; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col - i;
        board[r][c] = type;
      }
    },

    isValidPlacement(board, row, col, size, isVertical) {
      const inBounds = isVertical ? row + size <= 10 : col + 1 - size >= 0;
      if (!inBounds) return false;

      for (let i = 0; i < size; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col - i;
        if (board[r][c] !== 0) return false;
      }
      return true;
    },

    placeOpponentShips() {
      const shipList = [1, 2, 3, 4, 5];
      for (let type of shipList) {
        const ship = this.availableShips.find((s) => s.type === type);
        if (!ship) continue; //Evita que falli si no hi ha cap ship
        let placed = false;
        while (!placed) {
          const row = Math.floor(Math.random() * 10);
          const col = Math.floor(Math.random() * 10);
          const isVertical = Math.random() > 0.5;
          if (
            this.isValidPlacement(
              this.opponentBoard,
              row,
              col,
              ship.size,
              isVertical
            )
          ) {
            this.placeShip(
              this.opponentBoard,
              row,
              col,
              ship.size,
              isVertical,
              ship.type
            );
            this.opponentShips.push({
              ...ship,
              isVertical,
              position: { row, col },
            });
            placed = true;
          }
        }
      }
    },

    selectShip(ship) {
      this.selectedShip = { ...ship };
    },

    rotateSelectedShip() {
      if (this.selectedShip) {
        this.selectedShip.isVertical = !this.selectedShip.isVertical;
      }
    },

    handlePlayerBoardClick(row, col) {
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

      this.placeShip(
        this.playerBoard,
        row,
        col,
        ship.size,
        ship.isVertical,
        ship.type
      );

      this.playerPlacedShips.push({ ...ship, position: { row, col } });

      this.availableShips = this.availableShips.filter(
        (s) => s.type !== ship.type
      );
      this.selectedShip = null;

      if (this.availableShips.length === 0) {
        this.gamePhase = "playing";
        this.gameStatus = "Your turn";
      }
    },

    handleOpponentBoardClick(row, col) {
      if (this.gamePhase !== "playing") return;
      if (this.opponentBoard[row][col] < 0) {
        this.gameStatus = "Already hit!";
        return;
      } else if (this.opponentBoard[row][col] === 11) {
        this.gameStatus = "Already missed!";
        return;
      }
      // const isHit = api.checkHit(row, col);
      var isHit = false;
      if (
        this.opponentBoard[row][col] > 0 &&
        this.opponentBoard[row][col] < 10
      ) {
        isHit = true;
      }

      this.opponentBoard[row][col] = isHit ? -this.opponentBoard[row][col] : 11;
      this.gameStatus = isHit ? "Hit!" : "Miss!";

      setTimeout(this.opponentTurn, 1000);
    },

    opponentTurn() {
      let row,
        col,
        valid = false;
      while (!valid) {
        row = Math.floor(Math.random() * 10);
        col = Math.floor(Math.random() * 10);
        valid =
          this.playerBoard[row][col] >= 0 && this.playerBoard[row][col] < 10;
      }

      const isHit =
        this.playerBoard[row][col] > 0 && this.playerBoard[row][col] < 10;
      this.playerBoard[row][col] = isHit ? -this.playerBoard[row][col] : 11;
      this.gameStatus = "Your turn";
    },
  },
});
