# Beta Testing

## Testing scenarios

- Case A: The game is fully functional - i.e., frontend and backend are implemented and communicate correctly. In this case, the testing is performed on the frontend by playing the game.
- Case B: The game is partially functional - i.e., frontend is not fully connected to the backend. In this case, the testing is performed on the backend by sending requests to the API endpoints using the `api/v1/*/` endpoints or `docs/` url.
- Case C: The backend is partially functional - i.e., the backend is not fully implemented. In this case, the testers will interview the developers about what is working and what is not, and about the main issues they encountered and discuss/advise on how to fix them.

## Group Information

- Your group and team members:
  - Group: C08
  - Team members: Aiman M'ssali Doul y Joan Josep Lira Casanova

## Tested Group Information

### Test group 1

- Test group 1:
  - Group: C10
  - Team members: Paula Diez y José Antonio

### Case B checklist

- Initialization:
  - [x] you can get a token pair
  - [x] (**OPT**) registration is implemented  
  - [x] authorization is set up correctly for the Users API  
  - [x] game can be created 
- Gameplay:
  - [x] can place ships 
  - [x] can fire shots  
  - [x] can receive hits and misses 
  - [x] can play against a bot  
  - [] game ends correctly (win/loss)  
  - [] (**OPT**) multiplayer is implemented
  - [] multiplayer works correctly
- Post game:

  - [] (**OPT**) leaderboard is implemented

- Additional tests (please specify):
  - [] ...
    - [] ...
    - [] ...

### Observaciones

El grupo C10 tiene el frontend funcional, pero el backend no responde a las acciones del usuario. Aunque la interfaz permite disparar o colocar barcos, estas acciones no se comunican con el servidor ni actualizan el estado del juego. No es posible ganar o perder una partida.

Durante el registro o login, el sistema lanza un error, pero al actualizar la página el usuario aparece como autenticado. Además, el nombre del usuario no se actualiza tras iniciar sesión, lo que genera confusión.

Intentamos ayudarles a diagnosticar el problema durante unos 40 minutos, pero por falta de tiempo no pudimos resolverlo. Notamos que no usan métodos `GET` ni `POST` para comunicarse con la API, lo cual probablemente es la causa principal del problema. El sistema parece ser puramente visual, sin lógica de backend detrás.

Nos mantendremos en contacto con el grupo para seguir colaborando.



### Test group 2

- Test group 2:
  - Group: C09
  - Team members: Wu Lin Javier Hengda y Ignasio Martin

### Case A checklist

- Initialization:
  - [x] authentication works correctly
  - [x] (**OPT**) registration is implemented
  - [x] game can be created
- Gameplay:
  - [x] can place ships
  - [x] can fire shots
  - [x] can receive hits and misses
  - [x] can play against a bot
  - [x] game ends correctly (win/loss)
  - [x] (**OPT**) multiplayer is implemented
  - [x] multiplayer works correctly
- Stress Testing:
  - [x] can handle multiple concurrent games
  - [x] can handle multiple concurrent players
  - [x] game can be restarted (disconnected players can rejoin) // por seguiridad cuando te unes una partida reanudar, pero en teoria le funciona si lo desconecta.
  - [x] behaviour when cookies are disabled
- Post game:

  - [] (**OPT**) leaderboard is implemented

- Additional tests (please specify):
  - [] ...
    - [] ...
    - [] ...


### Observaciones

El sistema de C09 está completo y bien estructurado. La comunicación entre frontend y backend es fluida. No se ha producido ningún error durante las pruebas: las partidas se crean correctamente, y es posible jugar tanto contra la IA como en modo multijugador.

Realizamos diversas pruebas de estrés, incluyendo refrescar la página durante la partida, y el estado del juego se conservó perfectamente. Jugamos una partida multijugador contra nosotros mismos y el sistema respetó los turnos y reglas.

La interfaz es clara y fácil de entender. La experiencia de usuario es sólida, sin confusiones ni errores.
