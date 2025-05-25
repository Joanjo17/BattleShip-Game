from rest_framework import viewsets, filters, status
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
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
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']


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

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['phase']
    ordering_fields = ['id']

    def perform_create(self, serializer):
        player = get_object_or_404(Player, user=User.objects.first())  # Sustituir con request.user si procede
        game = serializer.save(owner=player, phase=Game.PHASE_PLACEMENT, turn=player)
        game.players.add(player)
        Board.objects.create(game=game, player=player)


        if not game.multiplayer:
            # Crear usuario y jugador CPU si no existen
            cpu_user, _ = User.objects.get_or_create(username="cpu")
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

    def perform_create(self, serializer):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        game = get_object_or_404(Game, pk=game_id)
        player = get_object_or_404(Player, pk=player_id)

        if game.turn_id != player.id:
            raise ValidationError("No es tu turno.")

        row = self.request.data.get('row')
        col = self.request.data.get('col')
        if row is None or col is None:
            raise ValidationError("Debes proporcionar 'row' y 'col'.")

        # Buscar el board del oponente
        opponent_board = Board.objects.filter(game=game).exclude(player=player).first()
        if not opponent_board:
            raise ValidationError("No se encontró el tablero del oponente.")

        # Verificar si ya se disparó en esa casilla
        if Shot.objects.filter(board=opponent_board, row=row, col=col).exists():
            raise ValidationError("Ya se disparó en esta celda.")

        # Comprobar si impacta en un barco
        impact = BoardVessel.objects.filter(
            board=opponent_board,
            ri__lte=row, rf__gte=row,
            ci__lte=col, cf__gte=col,
            alive=True
        ).first()

        result = 1 if impact else 0

        if impact:
            impact.alive = False
            impact.save()

        # Guardar el disparo
        serializer.save(
            game=game,
            player=player,
            board=opponent_board,
            row=row,
            col=col,
            result=result,
            impact=impact if impact else None,
        )

        # Comprobar si se ganó la partida
        remaining = BoardVessel.objects.filter(board=opponent_board, alive=True).count()
        if remaining == 0:
            game.phase = Game.PHASE_GAMEOVER
            game.winner = player
            print(f"🏁 ¡Jugador {player.nickname} ha ganado la partida {game.id}!")
        else:
            # Cambiar el turno
            next_player = game.players.exclude(pk=player.id).first()
            game.turn = next_player
            print(f"🔁 Turno cambiado a {next_player.nickname} en la partida {game.id}")

        game.save()