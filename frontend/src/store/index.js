import { defineStore } from "pinia";
import { useAuthStore } from '../store/authStore.js';
import api from "../services/api";

export const useGameStore = defineStore("game", {
  state: () => ({
    gamePhase: "waiting",   // Fase actual: "waiting", "placement", "playing" o "gameOver"
    gameStatus: "Waiting for players",  // Mensaje de estado que se mostrará en UI
    playerBoard: [],  // Matriz 10×10 del tablero del jugador
    opponentBoard: [], // Matriz 10×10 del tablero del oponente (CPU)
    playerPlacedShips: [], // Lista de barcos colocados por el jugador
    opponentShips: [],  // Lista de barcos colocados por el CPU
    availableShips: [], // Barcos que aún quedan por colocar (durante “placement”)
    selectedShip: -1, // ID del barco seleccionado para colocar
    playersInGame: [],  // Lista de jugadores presentes en la partida actual
    currentGameId: -1, // ID de la partida actual
    turnId: -1, // ID del jugador cuyo turno es
    firing: false, // Indica si se está disparando
    availableGames: [],  // Array de partidas disponibles (para “reanudar partida”)
    owner: null, // ID del jugador que creó la partida
    leaderboard: [], // se llenará con { nickname, totalGames, wonGames, score }
  }),

  actions: {

    /**
     * Obtener información de un usuario a partir de su ID.
     * Usa el método api.getUser() que retorna los datos JSON del backend.
     */
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

    /**
     * Carga la lista de jugadores que ya están en una partida concreta.
     * Se llama tras crear la partida y en getGameState().
     */
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

    /**
     * Recupera el estado completo de la partida (tableros, barcos, fase, turno, etc.).
     * - Guarda currentGameId en localStorage para restaurar tras refresh.
     * - Asigna 'owner' según la respuesta JSON del backend.
     * - Extrae 'extended_status' para jugador (player) y CPU (opponent).
     * - Actualiza state: playerBoard, opponentBoard, playerPlacedShips, opponentShips.
     * - Si fase = "gameOver", muestra el ganador.
     * - Si fase != "playing" y el jugador actual ya está preparado, hace polling con setTimeout().
     */
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

    /**
     * Crea un tablero vacío 10×10 inicializado a 0.
     * Se usa en startNewGame() para inicializar playerBoard y opponentBoard.
     */
    createEmptyBoard() {
      return Array(10)
        .fill()
        .map(() => Array(10).fill(0));
    },


    /**
     * Inicia una nueva partida:
     * - Cambiamos fase a "placement" y reseteamos tableros y listas de barcos.
     * - Llamamos a api.createGame() para crear la partida en el backend.
     * - Guardamos currentGameId en localStorage y cargamos jugadores actuales.
     * - Obtenemos la llista de vaixells disponibles i les assignem a availableShips.
     * - Usem placeOpponentShips() per col·locar automàticament els vaixells del CPU.
     * - Finalment, cridem getGameState() per actualitzar l’estat complet.
     */
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

    /**
     * Col·loca aleatòriament els vaixells del CPU i desa cada posició en el backend amb placeVessel().
     * - Recupera jugador CPU de playersInGame (nickname === "cpu").
     * - Genera coordenades aleatòries fins a trobar una posició vàlida (usant isValidPlacement).
     */
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

    /**
     * Dibuixa un vaixell al tauler local en funció de si és vertical o horitzontal.
     * - 'board' és la matriu 10×10.
     * - 'row', 'col' és la cantonada inicial; 'size' longitud; 'type' ID del vaixell.
     * - Si isVertical=true, incrementa la fila; sinó, incrementa la columna.
     */
    placeShip(board, row, col, size, isVertical, type) {
      for (let i = 0; i < size; i++) {
        const r = isVertical ? row + i : row;
        const c = isVertical ? col : col + i;
        board[r][c] = type;
      }
    },

    /**
     * Valida si un vaixell pot col·locar-se en la posició indicada sense sortir
     * del tauler ni sobreposar-se a un altre vaixell.
     */
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

    /**
     * Guarda el vaixell 'ship' com a objecte seleccionat amb isVertical.
     * Després el frontend usarà selectShip() per marcar-lo i mostrar-ho a Pantalla.
     */
    selectShip(ship) {
      this.selectedShip = { ...ship };
    },

    /**
     * Gira el vaixell seleccionat (canvia isVertical de true a false o invers).
     */
    rotateSelectedShip() {
      if (this.selectedShip) {
        this.selectedShip.isVertical = !this.selectedShip.isVertical;
      }
    },

    /**
     * Donada la cantonada inicial (row, col), la mida i orientació,
     * retorna 'rf' (row final) i 'cf' (col final).
     */
    getShipEndCoords(row, col, size, isVertical) {
      return {
        rf: isVertical ? row + size - 1 : row,
        cf: isVertical ? col : col + size - 1
      };
    },

    /**
     * Manejador quan l’usuari fa clic sobre el seu propi tauler (fase “placement”).
     * - Si no és fase “placement” o no hi ha barco seleccionat, surt.
     * - Valida la col·locació localment i duplica el vaixell al backend.
     * - Actualitza `playerPlacedShips`, `availableShips` i, quan ja no queden vaixells,
     *   invoca getGameState() per actualitzar l’estat de la partida.
     */
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

    /**
     * Manejador quan l’usuari fa clic sobre el tauler de l’oponent (fase “playing”).
     * - Valida que sigui fase “playing” i que no estigui processant un altre disparo.
     * - No accepta clics si ja hi ha un disparo a aquesta casella (hit o miss).
     * - Envia la petició fireShot() i actualitza localment tauler i gameStatus.
     * - Després de disparar, fa getGameState() per refrescar. Si la partida no acaba,
     *   invoca opponentTurn() perquè el CPU jugui.
     */
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

    /**
     * Lògica del torn del CPU:
     * - Mentre el CPU encerti (‘result === 1’) i no sigui ‘gameOver’ i sigui el seu torn,
     *   es generen coordenades aleatòries vàlides, es fa fireShot() i després getGameState().
     * - Si hi ha impacte, el CPU continua jugant; si falla, passa el torn al jugador.
     */
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

    /**
     * Obtiene la llista de partides disponibles cridant a api.getAllGames().
     * Desa el resultat en availableGames per mostrar la vista “Reanudar partida”.
     */
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

    /**
     * Elimina una partida mitjançant l’endpoint 'api.deleteGame(gameId)' i
     * refresca la llista de partides cridant a fetchAvailableGames().
     * Llança excepció en cas d’error perquè ho gestioni el component.
     */
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
    },

    /**
     * Obté el “Leaderboard”:
     * 1) Crida a api.getAllGames() per obtenir totes les partides.
     * 2) Construeix un mapa d’ID de jugador -> nickname a partir de 'extended_status'.
     * 3) Comptabilitza, per a cada nickname:
     *    - 'totalGames': com a “owner” de la partida.
     *    - 'wonGames': si apareix com a 'winner' en la resposta.
     * 4) Converteix aquest mapa en un array d’objectes { nickname, totalGames, wonGames, score } on 'score = wonGames/totalGames'.
     * 5) Ordena descendent per 'score' i desa els 5 primers a 'this.leaderboard'.
     *
     * En cas d’error, es llancen perquè ho gestioni el component.
     */
    async getLeaderBoard() {
      try {
        // 1) Obtener todas las partidas
        const response = await api.getAllGames();
        const games = response.data;

        // 2) Construir mapa ID→nickname a partir de extended_status
        const idToNickname = {};
        for (const game of games) {
          const ext = game.extended_status;
          if (ext) {
            if (ext.player && ext.player.id) {
              idToNickname[ext.player.id] = ext.player.username;
            }
            if (ext.opponent && ext.opponent.id) {
              idToNickname[ext.opponent.id] = ext.opponent.username;
            }
          }
        }

        // 3) Acumular stats por nickname
        const statsMap = {};
        // 3.1) totalGames como “owner”
        for (const game of games) {
          const ownerNickname = game.owner;
          if (!statsMap[ownerNickname]) {
            statsMap[ownerNickname] = { totalGames: 0, wonGames: 0 };
          }
          statsMap[ownerNickname].totalGames += 1;
        }
        // 3.2) wonGames según game.winner (ID→nickname)
        for (const game of games) {
          const winnerId = game.winner;
          if (winnerId !== null) {
            const winnerNickname = idToNickname[winnerId];
            if (winnerNickname) {
              if (!statsMap[winnerNickname]) {
                statsMap[winnerNickname] = { totalGames: 0, wonGames: 0 };
              }
              statsMap[winnerNickname].wonGames += 1;
            }
          }
        }

        // 4) Convertir statsMap a array y calcular score
        const tempArray = [];
        for (const [nickname, { totalGames, wonGames }] of Object.entries(statsMap)) {
          if (totalGames > 0) {
            tempArray.push({
              nickname,
              totalGames,
              wonGames,
              score: wonGames / totalGames,
            });
          }
        }

        // 5) Ordenar descendente por score y quedarnos con los 5 primeros
        tempArray.sort((a, b) => b.score - a.score);
        this.leaderboard = tempArray.slice(0, 5);
      } catch (err) {
        console.error("Error obteniendo leaderboard en el store:", err);
        throw err; // Lo lanzamos para que el componente lo gestione
      }
    },
  },
});
