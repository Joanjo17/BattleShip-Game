# Self Testing

## Group Information

- Your group and team members:
  - Group: C08
  - Team members: Aiman M'ssal Doul y Joan Josep Lira Casanova

### Implementation checklist

- Initialization:
  - [x] authentication works correctly
  - [X] (**OPT**) registration is implemented
  - [X] game can be created
- Gameplay:
  - [X] can place ships
  - [X] can fire shots
  - [x] can receive hits and misses
  - [x] can play against a bot
  - [x] game ends correctly (win/loss)
  - [] (**OPT**) multiplayer is implemented
  - [] multiplayer works correctly
- Stress Testing:
  - [x] can handle multiple concurrent games
  - [x] can handle multiple concurrent players
  - [] game can be restarted (disconnected players can rejoin)
  - [x] behaviour when cookies are disabled
- Post game:

  - [] (**OPT**) leaderboard is implemented

- Additional features you implemented (please specify):
  - [] ...
    - [] ...
    - [] ...

### Encountered issues, how you solved them if you did.

1. **Error en la lógica de turnos**  
   - **Descripción:** Cuando un jugador acertaba con un disparo, el turno pasaba inmediatamente al bot en lugar de permitir que el mismo jugador continuara disparando (lo cual incumple las reglas de Battleship).  
   - **Solución:**  
     - En el frontend (`index.js`), ajustamos la lógica para que, si el disparo es un impacto (`result === 1`), el mismo jugador (o el CPU) conserve el turno hasta que falle o termine el juego.  
     - Ejemplo de código refactorizado:
       ```js
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
       ```

2. **No se podía recuperar la partida por ID**  
   - **Descripción:** El frontend no persistía ni recuperaba correctamente el ID de la partida actual, por lo que al refrescar o navegar de vuelta se reiniciaba todo en lugar de continuar desde el estado guardado.  
   - **Solución:**  
     - Añadimos `localStorage.setItem("currentGameId", gameId)` en el momento de crear o unirse a una partida.  
     - En `Game.vue`, al montarse el componente, leemos `localStorage.getItem("currentGameId")` y, si existe, llamamos a `getGameState` con ese ID para restaurar el estado (tableros, barcos, fase, etc.).

3. **Refrescar la pantalla reiniciaba la partida**  
   - **Descripción:** Al pulsar F5, la partida volvía al estado inicial, perdiendo las posiciones de los barcos y el historial de disparos.  
   - **Solución:**  
     - Con la persistencia en `localStorage`, al recargar la página volvemos a cargar el estado completo desde el backend usando `getGameState(currentGameId)`, de modo que el tablero, barcos colocados y tiros (hits/misses) se restauran correctamente.

4. **La lista de barcos (Vessels) no se mostraba al crear la partida**  
   - **Descripción:** Inicialmente no se ofrecía la lista de barcos porque la tabla `Vessel` estaba vacía en la base de datos.  
   - **Solución Inicial:**  
     - Ejecutamos un script en la shell de Django para poblar manualmente la tabla con los cinco tipos de barco predeterminados:
       ```python
       from battleship.models import Vessel

       vessels = [
           {"id": 1, "size": 1, "name": "Patrol Boat",  "image": "src/assets/SeaWarfareSet/PatrolBoat/ShipPatrolHull.png"},
           {"id": 2, "size": 2, "name": "Destroyer",    "image": "src/assets/SeaWarfareSet/Destroyer/ShipDestroyerHull.png"},
           {"id": 3, "size": 3, "name": "Cruiser",      "image": "src/assets/SeaWarfareSet/Cruiser/ShipCruiserHull.png"},
           {"id": 4, "size": 4, "name": "Submarine",    "image": "src/assets/SeaWarfareSet/Submarine/ShipSubmarineHull.png"},
           {"id": 5, "size": 5, "name": "Carrier",      "image": "src/assets/SeaWarfareSet/Carrier/ShipCarrierHull.png"},
       ]

       for v in vessels:
           Vessel.objects.update_or_create(
               id=v["id"],
               defaults={
                   "size": v["size"],
                   "name": v["name"],
                   "image": v["image"]
               }
           )
       ```

5. **Los barcos no se colocaban horizontalmente**  
   - **Descripción:** Algunos barcos se dibujaban siempre en vertical, sin respetar la opción de rotación, pero los usuarios que probaron nuestro juego no se dieron cuenta.

6. **Interfaz de usuario confusa**  
   - **Descripción:** El diseño y los mensajes no eran claros, lo que generaba dudas durante la configuración y el juego. Por lo que hemos tenido que explicar al usuario cada cosa que pasaba. 
   
7. **Recuperación de partida**
   - **Descripción:** No ofrecemos la opción de volver a unirse a una partida existente directamente desde el menú. 
   
---


### Post testing improvements


1. **Error en la lógica de turnos**  
   - La lógica de turnos se arreglo al momento durante los tests y todo funciona correctamente. 

2. **Persistencia del estado al refrescar**  
   - La persistencia del estado al refrescar se arreglo al momento durante los tests y todo funciona correctamente. 

3. **Refrescar la pantalla reiniciaba la partida**  
   - El problema de reinciar la partida una vez que refrescaba se arreglo al momento durante los tests y todo funciona correctamente. 

4. **La lista de barcos (Vessels) no se mostraba al crear la partida**  
   - **Solución Permanente (Futura Mejora):**  
     - Actualizamos el backend para que el `VesselViewSet` se encargue de asegurar los valores predeterminados automáticamente. Ahora, en `views.py`:
       ```python
       class VesselViewSet(viewsets.ModelViewSet):
           queryset = Vessel.objects.all()
           serializer_class = VesselSerializer

           def get_queryset(self):
               self.ensure_default_vessels()
               return super().get_queryset()

           def ensure_default_vessels(self):
               default_vessels = [
                   {"id": 1, "size": 1, "name": "Patrol Boat",
                    "image": "src/assets/SeaWarfareSet/PatrolBoat/ShipPatrolHull.png"},
                   {"id": 2, "size": 2, "name": "Destroyer",
                    "image": "src/assets/SeaWarfareSet/Destroyer/ShipDestroyerHull.png"},
                   {"id": 3, "size": 3, "name": "Cruiser",
                    "image": "src/assets/SeaWarfareSet/Cruiser/ShipCruiserHull.png"},
                   {"id": 4, "size": 4, "name": "Submarine",
                    "image": "src/assets/SeaWarfareSet/Submarine/ShipSubmarineHull.png"},
                   {"id": 5, "size": 5, "name": "Carrier",
                    "image": "src/assets/SeaWarfareSet/Carrier/ShipCarrierHull.png"},
               ]
               for vessel_data in default_vessels:
                   Vessel.objects.update_or_create(
                       id=vessel_data["id"],
                       defaults={
                           "size": vessel_data["size"],
                           "name": vessel_data["name"],
                           "image": vessel_data["image"]
                       }
                   )
       ```
     - Con este cambio, cada vez que el frontend solicite `/api/v1/vessels/`, el método `get_queryset()` ejecuta primero `ensure_default_vessels()`, garantizando que siempre existan los cinco barcos predeterminados sin necesitar importar manualmente.

5. **Los barcos no se colocaban horizontalmente**  
   - **Solución:**  
     - Revisamos la función de validación y colocación (`isValidPlacement` y `placeShip`) en el frontend.  
     - Corregimos el cálculo de las coordenadas finales (`rf`, `cf`) para que cuando `isVertical === false`, los barcos ocupen las celdas horizontales adecuadas.

6. **Interfaz de usuario confusa** 
   - **Solución:**  
     - Reorganizamos la disposición de botones y mensajes de estado usando clases de Bootstrap para mayor consistencia.  
     - Añadimos instrucciones y `placeholder` en los inputs (por ejemplo, “Introduce tu nombre de usuario”).  
     - Mostramos estados de carga (“Logging in…”, “Registrando…”) y errores contextuales (por ejemplo, “Error: correo ya registrado”).
     - Añadimos opciones para crear partida, unirse a la partida o cerrar sesión.

7. **Recuperación de partida**
- **Solución:**  
     - Añadimos en `partidas_reanudar.vue` la lista de partidas disponibles con su propietario.  
     - Validamos que solo el dueño pueda “Unirse” a su propia partida (comparando `game.owner === authStore.username`).  
     - Una vez validado, `getGameState(gameId)` carga todos los datos y permite retomar el juego donde se dejó.  
---