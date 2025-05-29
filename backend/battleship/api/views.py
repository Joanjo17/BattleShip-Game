from rest_framework import viewsets, filters, status, permissions
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from . import models
from .models import Game, Player, Board, BoardVessel, Shot, Vessel
from . import serializers
from .serializers import UserSerializer, PlayerSerializer, GameSerializer, BoardSerializer, BoardVesselSerializer, ShotSerializer, VesselSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    This viewset automatically provides `list` and `retrieve` actions.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter] # Permite búsquedas en la lista de usuarios
    search_fields = ['username', 'email']
    permission_classes = [permissions.IsAdminUser]
    # Por defecto, SOLO los administradores pueden acceder a estas vistas (GET, PUT, DELETE, etc.)

    def get_permissions(self):
        if self.action == 'create': # Si se trata de un POST (registro de usuario), permitimos acceso a cualquiera
            return [AllowAny()]

        # Para lo demás, se requiere que el usuario sea administrador
        return [IsAdminUser()]


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nickname']

    def perform_create(self, serializer):
        game_id = self.kwargs.get('game_pk')
        if game_id:
            game = get_object_or_404(Game, pk=game_id)
            player = serializer.save()
            game.players.add(player)
            Board.objects.create(game=game, player=player)
            print(f"🛠️ Board creado para Player {player.id} en Game {game.id}")
        else:
            serializer.save() # fallback: creación general si no es nested

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        if game_id:
            return Player.objects.filter(games__id=game_id)
        return Player.objects.all()


class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['phase']
    ordering_fields = ['id']

    def perform_create(self, serializer):
        #player = get_object_or_404(Player, user=User.objects.first())  Sustituir con request.user si procede
        player = get_object_or_404(Player, user=self.request.user)
        game = serializer.save(owner=player, phase=Game.PHASE_PLACEMENT, turn=player)
        game.players.add(player)
        Board.objects.create(game=game, player=player)


        if not game.multiplayer:
            # Crear usuario y jugador CPU si no existen
            cpu_user, _ = User.objects.get_or_create(username="cpu")
            # obtener el jugador CPU
            cpu_player, _ = Player.objects.get_or_create(user=cpu_user, defaults={"nickname": "cpu"})
            game.players.add(cpu_player)
            Board.objects.get_or_create(game=game, player=cpu_player)
            print(f"🤖 Jugador CPU añadido con ID {cpu_player.id} a la partida {game.id}")

        print(f"🛠️ Board creado para el propietario {player.id} y CPU en la partida {game.id}")

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        qs = Board.objects.filter(game__id=game_id, player__id=player_id)
        print(f"📋 Buscando boards para Game={game_id}, Player={player_id} → {qs.count()} encontrados")
        return qs


class BoardVesselViewSet(viewsets.ModelViewSet):
    serializer_class = BoardVesselSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        return BoardVessel.objects.filter(board__game__id=game_id, board__player__id=player_id)

    def create(self, request, *args, **kwargs):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        print("BoardVessel | 🔍 Buscando board...")

        board = get_object_or_404(Board, game_id=game_id, player_id=player_id)
        print("BoardVessel | ✅ Board encontrado:", board.id)

        # Inserta el board manualmente en los datos del request
        data = request.data.copy()
        data['board'] = board.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        print("BoardVessel | 🚢 Barco guardado correctamente.")

        # Verificar si se han colocado todos los barcos
        total_placed = BoardVessel.objects.filter(board=board).count()
        expected = Vessel.objects.count()

        if total_placed == expected:
            board.prepared = True
            board.save()
            print(f"BoardVessel | 🟢 Board {board.id} marcado como preparado.")

            game = board.game
            game.refresh_from_db()
            # Si todos los boards del juego están preparados, pasar a "playing"
            all_prepared = all(b.prepared for b in game.boards.all())
            if all_prepared:
                game.phase = Game.PHASE_PLAYING
                game.save()
                print(f"🎮 Game {game.id} cambiado a fase 'playing'")

        return Response(serializer.data, status=201)


class VesselViewSet(viewsets.ModelViewSet):
    queryset = Vessel.objects.all()
    serializer_class = VesselSerializer


class ShotViewSet(viewsets.ModelViewSet):
    serializer_class = ShotSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        return Shot.objects.filter(game_id=game_id, player_id=player_id)

    def get_vessel_cells(self, vessel):
        """Devuelve todas las celdas (tuplas) que ocupa un barco."""
        cells = []
        if vessel.ri == vessel.rf:  # Horizontal
            for col in range(vessel.ci, vessel.cf + 1):
                cells.append((vessel.ri, col))
        else:  # Vertical
            for row in range(vessel.ri, vessel.rf + 1):
                cells.append((row, vessel.ci))
        return cells

    def perform_create(self, serializer):
        print("ShotViewSet | 🔫 Procesando disparo...")
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        game = get_object_or_404(Game, pk=game_id)
        player = get_object_or_404(Player, pk=player_id)

        print("📌 ESTADO INICIAL DEL DISPARO")
        print(f"🔍 Game {game.id} | Phase: {game.phase} | Turn ID: {game.turn_id} | Winner: {game.winner_id}")
        print(f"🎯 Dispara el jugador: {player.id} ({player.nickname})")

        if game.turn_id != player.id:
            raise ValidationError("No es tu turno.")

        row = self.request.data.get('row')
        col = self.request.data.get('col')
        try:
            row = int(row)
            col = int(col)
        except (TypeError, ValueError):
            raise ValidationError("Coordenadas inválidas.")

        # Buscar el board del oponente
        opponent_board = Board.objects.filter(game=game).exclude(player=player).first()
        if not opponent_board:
            raise ValidationError("No se encontró el tablero del oponente.")

        print("📨 Data recibida para disparo:", self.request.data)
        print("📨 Jugador:", player.id, "Tablero del oponente:", opponent_board.id)

        # Validar celda disparada (por seguridad, ya lo hace el frontend)
        if Shot.objects.filter(board=opponent_board, row=row, col=col).exists():
            raise ValidationError("Ya se disparó en esta celda.")

        # Buscar si alguna celda de un barco activo coincide
        vessels = BoardVessel.objects.filter(board=opponent_board, alive=True)
        hit_vessel = None
        for vessel in vessels:
            if (row, col) in self.get_vessel_cells(vessel):
                hit_vessel = vessel
                break

        result = 1 if hit_vessel else 0
        print(f"🔫 Resultado: {'Impacto' if hit_vessel else 'Agua'}")

        # Guardar el disparo
        serializer.save(
            game=game,
            player=player,
            board=opponent_board,
            row=row,
            col=col,
            result=result,
            impact=hit_vessel if hit_vessel else None,
        )

        # Si se ha impactado, verificar si se ha hundido completamente
        if hit_vessel:
            vessel_cells = self.get_vessel_cells(hit_vessel)
            impacted_cells = Shot.objects.filter(
                board=opponent_board,
                impact=hit_vessel
            ).values_list('row', 'col')

            impacted_set = set(impacted_cells) # Convertir a set para eficiencia
            if all(cell in impacted_set for cell in vessel_cells):
                hit_vessel.alive = False
                hit_vessel.save()
                print(f"🚢 Barco {hit_vessel.id} hundido.")

        # Comprobar si ya no quedan barcos vivos
        remaining = BoardVessel.objects.filter(board=opponent_board, alive=True).count()
        if remaining == 0:
            game.phase = Game.PHASE_GAMEOVER
            game.winner = player
            print(f"🏆 Partida terminada. Ganador: {player.nickname} (ID {player.id})")
        else:
            next_player = game.players.exclude(pk=player.id).first()
            game.turn = next_player
            print(f"🔄 Próximo turno: Jugador {next_player.id} ({next_player.nickname})")
            print(f"⏳ Barcos restantes del oponente: {remaining}")

        game.save()
