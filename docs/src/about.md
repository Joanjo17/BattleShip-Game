# About


| Equip | Membre 1            | Membre 2                  |
|-------|---------------------|---------------------------|
| C08   | M'ssali Doul, Aiman | Lira Casanova, Joan Josep | 


{{#authors AimanDoul04,Joanjo17}}

## 1. Objetivos cumplidos vs no cumplidos

**Objectius assolits:**
- Registre i autenticació d’usuaris.
- Creació de partides (mode individual contra bot).
- Possibilitat de col·locar vaixells i realitzar dispars, respectant torns i regles (tocat/aigua).
- Finalització correcta del joc amb detecció del guanyador.
- Persistència de partides: reanudació i eliminació de partides guardades.
- Gestió de múltiples partides i jugadors simultanis.
- Implementació del “Leaderboard” (tauler de lideratge).

**Objectius no assolits:**
- No s’ha implementat el mode multijugador real.
- No s’han creat proves unitàries ni d’integració per al backend i frontend.

---

## 2. Organització de l’equip

Durant la pràctica, l’equip es va organitzar de la següent manera:

### **Joan Josep Lira Casanova**
  - Implementació del backend.
  - Definició completa dels models: `Player`, `Game`, `Board`, `Vessel`, `BoardVessel`, `Shot`.
  - Creació de totes les vistes: `UserViewSet`, `PlayerViewSet`, `GameViewSet`, `BoardViewSet`, `BoardVesselViewSet`, `ShotViewSet`, `VesselViewSet`.
  - Desenvolupament dels serializers i de tota la lògica d’interacció de joc.
  - Configuració de les rutes amb nested routers.
  - Ús de Django Signals per crear un `Player` automàtic en registrar un `User`.
  - Participació activa en les sessions 3, 4 i 5 (serialització, permisos i rutes).

### **Aiman Doul**
  - Codificació inicial de models i serializers.
  - Creació y definició de models: `User`, `Player`, `Game`, `Board`, `BoardVessel`, `Shot`, `Vessel`.
  - Desenvolupament del frontend.
  - Creació i modificació de components Vue: `Home.vue`, `Configuracion.vue`, `Game.vue`, `partidas_reanudar.vue`, `Leaderboard.vue`.
  - Gestió de la comunicació amb l’API via `api.js`.
  - Correcció d’errors de col·locació i rotació de vaixells.
  - Participació activa en les sessions 2, 3, 5 i 6 centrades en disseny i usabilitat del frontend.


---

## 3. Descripción de las dificultades trobades

- La lògica de torns (un jugador continua si encerta) va requerir diverses iteracions i ajustos tant al backend com al frontend.
- La validació del format JSON entre frontend i backend va ser crítica, especialment per gestionar errors com col·locacions fora de límits o dispars repetits.
- La persistència d’estat amb `localStorage` no funcionava bé fins que es va afegir la crida a `getGameState(currentGameId)` dins `onMounted`.
- Gestionar partides simultànies va requerir fer ús correcte dels `game_id` i `player_id` dins de rutes anidades.
- Calcular les coordenades finals (`rf`, `cf`) en funció de `isVertical` va generar problemes inicials amb la col·locació.
- L’absència de proves automàtiques feia que la depuració fos totalment manual i basada en inspecció directa de peticions/respostes API.

---

## 4. Proves unitàries

    No s’han implementat proves unitàries específiques.
---

## 5. Proves creuades realitzades

**Ús dels fitxers `self_testing.md` i `beta_testing.md`**:  
Hem documentat exhaustivament els errors menors i detallat totes les proves realitzades.  
Això ens ha permès detectar i corregir problemes de la interfície, afegir funcionalitats noves (com el Leaderboard o l’eliminació de partides) i garantir una experiència d’usuari més sòlida i robusta.

---

## 6. Captures del funcionament final de la pràctica

1. **Pantalla d’inici / login i registre**  
   ![Home: Login](../images/home_login.png)
   ![Home: Registre](../images/home_register.png)

2. **Menú de configuració (Crear / Iniciar / Lideratge / Tancar Sessió)** 
   ![Configuració: botons](../images/configuracion_menu.png)

3. **Col·locació de vaixells (fase “placement”)**  
   ![Game: Col·locar vaixells](../images/game_placement.png)

4. **Interfície en fase “playing” (“Your Fleet” i “Enemy Fleet” ocult)**  
   ![Game: Playing (hit i miss)](../images/game_playing.png)

5. **Partida finalitzada amb “Game Over” i guanyador anunciat**  
   ![Game Over: Guanyador](../images/game_over.png)

6. **Reanudació de partides guardades (llista amb opcions)**  
   ![Partides disponibles](../images/partidas_reanudar.png)

7. **Leaderboard (top 5 jugadors amb percentatge de victòries)**  
   ![Leaderboard: Top 5](../images/leaderboard.png)


---

## 7. Informació de desplegament

### Backend (Django)

1. Navega a la carpeta `backend/`.
2. Crear i activar entorn virtual:
   ```powershell
   poetry shell
    ```
3. Aplicar migracions:
    ```bash
    python manage.py migrate
    ```
4. Iniciar servidor de desenvolupament:
    ```bash
    python manage.py runserver
    ```

### Frontend (Vue.js)

1. Navega a la carpeta `frontend/`.

2. Copia i reanomena el fitxer d’entorn .env
    ```bash
    cp env_sample .env
    ```
3. Instal·la les dependències:
    ```bash
    npm install
    ```

4. Inicia el servidor de desenvolupament:
    ```bash
    npm run dev
    ```