# About


| Equip | Membre 1            | Membre 2                  |
|-------|---------------------|---------------------------|
| C08   | M'ssali Doul, Aiman | Lira Casanova, Joan Josep | 


{{#authors AimanDoul04,Joanjo17}}

> [!CAUTION]
> Afegiu les pàgines que considereu oportunes. Cal que aquest document contingui tota la informació de la pràctica.
> **Com a mínim:**
> - Llistat d'objectius complerts i no complerts
> - Resum de l'organització de l'equip de treball durant la pràctica
> - Descripció de les dificultats trobades durant la pràctica
> - Proves unitàries realitzades
> - Proves creuades realitzades
> - Captures on es vegi el funcionament final de la pràctica
> - Informació de desplegament de la pràctica



### 1. Objetivos cumplidos vs no cumplidos

**Objetivos cumplidos:**
   - Registro y auntenticación de usuarios.
   - La partida puede ser creada correctamente y se puede jugar contra un bot.
   - Se permite colocar barcos y disparar respectivamente y respetando las reglas del juego (turnos, etc.), 
   además de recibir impactos y fallos, y sus respectivos mensajes.
   - El juego termian correctamente (se detecta victoria o derrota).
   - Se permite reanudar una partida guardada y eliminar una partida guardada correctamente.
   - Puede manejar varios juegos simultáneamente.
   - Puede manejar múltiples jugadores simultáneos
   - Se ha implementado el Leaderboard.
   
**Objetivos no cumplidos:**
    - No se ha implementado el modo multijugador.
    - No se han realizado pruebas unitarias ni de integración para el backend y el frontend.


### 2.Resumen de la organización del equipo

Durante la práctica, el equipo se organizó de la siguiente manera:

Joan Josep Lira Casanova se encargó de la implementación del backend, incluyendo la lógica del juego, el manejo de 
usuarios y la persistencia de datos. Implementó las funcionalidades de registro y autenticación de usuarios, así como la
creación y gestión de partidas. Además, se encargó del trabajo fuera de laboratorio de la sesion 3, 4 y 5 sobre los 
serializadores.


Aiman Doul se centró en el desarrollo del frontend, creando la interfaz de usuario y asegurándose de que
la experiencia del usuario fuera fluida y atractiva. También se encargó de arreglar los errores que surgieron durante
las pruebas cruzadas, añado la opción de poder unirse a una partida ya creada y de poder eliminar una partida guardada.
Además, s'encargó de la sesión 2, el tutorial de la sesión 3, la sesion 5 y 6.



### 3.Descripción de las dificultades encontradas

Durante la práctica, el equipo enfrentó varias dificultades:
   - La implementación de la lógica del juego fue más compleja de lo esperado, especialmente al manejar los turnos y 
   las reglas del juego.
   - La integración entre el frontend y el backend requirió ajustes y pruebas exhaustivas para asegurar que ambas partes 
   funcionaran correctamente juntas.
   - La gestión de múltiples partidas y usuarios simultáneos presentó desafíos adicionales en términos de persistencia de datos.
   - La falta de pruebas unitarias e integración dificultó la identificación de errores y la garantía de la calidad del código.
   - Cuando rotabas los barcos no se colocaba correctamente en el tablero, lo que requería ajustes en la lógica de colocación.


### 4.Pruebas unitarias realizadas


### 5.Pruebas cruzadas realizadas


### 6.Capturas del funcionamiento final de la práctica

Pantalla de inicio / login y registro.
Configuración de partida y colocación de barcos.
Interfaz de juego en fase “playing” (tablero del jugador y del oponente oculto).
Mensajes de “hit”, “miss” y “Game Over”.
Lista de partidas disponibles y botón “Unirse” / “Eliminar”.

### 7.Información de despliegue de la práctica

cd Backend:
Crear el entorno virtual
Activar el entorno virtual: "C:\Users\hassa\PycharmProjects\pr2-c08\backend\.venv\Scripts\Activate.ps1"
python manage.py migrate
pyton manage.py runserver

cd frontend:
copiar  .env_example a .env

Instala dependencias:
cd <your-project-name>
npm install 

Arranca el servidor de desarrollo: npm run dev
