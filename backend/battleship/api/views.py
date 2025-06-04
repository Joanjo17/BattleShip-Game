from rest_framework import viewsets, filters, status, permissions
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied
from . import models
from .models import Game, Player, Board, BoardVessel, Shot, Vessel
from . import serializers
from .serializers import UserSerializer, PlayerSerializer, GameSerializer, BoardSerializer, BoardVesselSerializer, ShotSerializer, VesselSerializer


# Vista per a gestionar usuaris (crear, llistar, consultar).
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para la gestión de usuarios. Solo accesible por administradores,
    excepto el registro de nuevos usuarios.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter] # Permite búsquedas en la lista de usuarios
    search_fields = ['username', 'email']
    permission_classes = [permissions.IsAdminUser]

    # Permet el registre d'usuaris sense ser administrador
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        # Per altres accions, només administradors
        return [IsAdminUser()]


# Vista per a gestionar jugadors
class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nickname']

    # Si la petició ve d'una URL anidada, afegeix el jugador a la partida i crea el seu tauler
    def perform_create(self, serializer):
        game_id = self.kwargs.get('game_pk')
        if game_id:
            game = get_object_or_404(Game, pk=game_id)
            player = serializer.save()
            game.players.add(player)
            Board.objects.create(game=game, player=player)
        else:
            serializer.save()

    # Si ve d'una URL anidada, filtra jugadors per partida
    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        if game_id:
            return Player.objects.filter(games__id=game_id)
        return Player.objects.all()


# Vista per a gestionar partides
class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['phase']
    ordering_fields = ['id']

    # Quan es crea una partida, s'assigna l'usuari com a propietari i es genera un tauler
    def perform_create(self, serializer):
        player = get_object_or_404(Player, user=self.request.user)
        game = serializer.save(owner=player, phase=Game.PHASE_PLACEMENT, turn=player)
        game.players.add(player)
        Board.objects.create(game=game, player=player)

        # Si no és multijugador, s'afegeix automàticament un jugador CPU
        if not game.multiplayer:
            # Crear usuario y jugador CPU si no existen
            cpu_user, _ = User.objects.get_or_create(username="cpu")
            cpu_player, _ = Player.objects.get_or_create(user=cpu_user, defaults={"nickname": "cpu"})
            game.players.add(cpu_player)
            Board.objects.get_or_create(game=game, player=cpu_player)

    # Només el propietari pot eliminar una partida
    def destroy(self, request, *args, **kwargs):
        game = self.get_object()
        if game.owner.user != request.user:
            raise PermissionDenied("Només el propietari pot eliminar aquesta partida.")
        return super().destroy(request, *args, **kwargs)


# Vista per a consultar taulers associats a jugadors dins d’una partida
class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        return Board.objects.filter(game__id=game_id, player__id=player_id)


# Vista per a gestionar la col·locació de vaixells al tauler
class BoardVesselViewSet(viewsets.ModelViewSet):
    serializer_class = BoardVesselSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        return BoardVessel.objects.filter(board__game__id=game_id, board__player__id=player_id)

    def create(self, request, *args, **kwargs):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')

        board = get_object_or_404(Board, game_id=game_id, player_id=player_id)

        # Inserta el board manualmente en los datos del request
        data = request.data.copy()
        data['board'] = board.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Comprovar si el jugador ha col·locat tots els vaixells
        total_placed = BoardVessel.objects.filter(board=board).count()
        expected = Vessel.objects.count()

        if total_placed == expected:
            board.prepared = True
            board.save()

            game = board.game
            game.refresh_from_db()

            # Si tots els jugadors han preparat el tauler, canviar a fase de joc ("playing")
            all_prepared = all(b.prepared for b in game.boards.all())
            if all_prepared:
                game.phase = Game.PHASE_PLAYING
                game.save()

        return Response(serializer.data, status=201)


# Vista per a consultar o assegurar els vaixells disponibles al joc
class VesselViewSet(viewsets.ModelViewSet):
    queryset = Vessel.objects.all()
    serializer_class = VesselSerializer

    def get_queryset(self):
        self.ensure_default_vessels()
        return super().get_queryset()

    # Assegura que hi hagi un conjunt de vaixells definits per defecte
    def ensure_default_vessels(self):
        default_vessels = [
            {"id": 1, "size": 1, "name": "Patrol Boat",
             "image": "src/assets/SeaWarfareSet/PatrolBoat/ShipPatrolHull.png"},
            {"id": 2, "size": 2, "name": "Destroyer",
             "image": "src/assets/SeaWarfareSet/Destroyer/ShipDestroyerHull.png"},
            {"id": 3, "size": 3, "name": "Cruiser", "image": "src/assets/SeaWarfareSet/Cruiser/ShipCruiserHull.png"},
            {"id": 4, "size": 4, "name": "Submarine",
             "image": "src/assets/SeaWarfareSet/Submarine/ShipSubmarineHull.png"},
            {"id": 5, "size": 5, "name": "Carrier", "image": "src/assets/SeaWarfareSet/Carrier/ShipCarrierHull.png"},
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


# Vista per gestionar dispars durant la partida
class ShotViewSet(viewsets.ModelViewSet):
    serializer_class = ShotSerializer

    def get_queryset(self):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        return Shot.objects.filter(game_id=game_id, player_id=player_id)

    def get_vessel_cells(self, vessel):
        """Retorna totes les cel·les ocupades pel vaixell."""
        cells = []
        if vessel.ri == vessel.rf:  # Horizontal
            for col in range(vessel.ci, vessel.cf + 1):
                cells.append((vessel.ri, col))
        else:  # Vertical
            for row in range(vessel.ri, vessel.rf + 1):
                cells.append((row, vessel.ci))
        return cells

    def perform_create(self, serializer):
        game_id = self.kwargs.get('game_pk')
        player_id = self.kwargs.get('player_pk')
        game = get_object_or_404(Game, pk=game_id)
        player = get_object_or_404(Player, pk=player_id)

        if game.turn_id != player.id:
            raise ValidationError("No és el teu torn.")

        row = self.request.data.get('row')
        col = self.request.data.get('col')
        try:
            row = int(row)
            col = int(col)
        except (TypeError, ValueError):
            raise ValidationError("Coordenades no vàlides.")

        # Obtenir el tauler de l'oponent
        opponent_board = Board.objects.filter(game=game).exclude(player=player).first()
        if not opponent_board:
            raise ValidationError("No s'ha trobat el tauler de l'oponent.")

        # Verificar que no s'hagi disparat ja a aquesta cel·la
        if Shot.objects.filter(board=opponent_board, row=row, col=col).exists():
            raise ValidationError("Ja s'ha disparat a aquesta cel·la.")

        # Buscar si alguna celda de un barco activo coincide
        # Determinar si el dispar ha impactat
        vessels = BoardVessel.objects.filter(board=opponent_board, alive=True)
        hit_vessel = next(
            (v for v in vessels if (row, col) in self.get_vessel_cells(v)), None
        )

        result = 1 if hit_vessel else 0

        # Registrar el dispar
        serializer.save(
            game=game,
            player=player,
            board=opponent_board,
            row=row,
            col=col,
            result=result,
            impact=hit_vessel if hit_vessel else None,
        )

        # Verificar si el vaixell ha estat completament enfonsat
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

        # Comprovar si la partida ha acabat
        remaining = BoardVessel.objects.filter(board=opponent_board, alive=True).count()
        if remaining == 0:
            game.phase = Game.PHASE_GAMEOVER
            game.winner = player
        elif result == 0:
            # Si no hi ha impacte, canvia el torn
            next_player = game.players.exclude(pk=player.id).first()
            game.turn = next_player

        game.save()
