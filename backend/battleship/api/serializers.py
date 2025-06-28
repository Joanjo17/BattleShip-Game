from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Player, Game, Board, Vessel, BoardVessel, Shot


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True}  # La contraseña solo se usará para entrada
        }

    def create(self, validated_data):
        # Cuando se llama a serializer.save(), este se ejecuta en registros nuevos
        # # Crea un usuario utilizando el metodo propio de Django que aplica hash a la contraseña
        return User.objects.create_user(**validated_data)


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'


class GameSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.user.username')
    extended_status = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = '__all__'
        extra_kwargs = {
            'turn': {'required': False, 'allow_null': True},
            'winner': {'required': False, 'allow_null': True},
            'players': {'required': False},
        }

    def get_extended_status(self, obj):
        owner = obj.owner
        players = list(obj.players.all())
        cpu_player = next((p for p in players if p != owner), None)

        def get_player_status(player):
            board = Board.objects.filter(game=obj, player=player).first()
            vessels = BoardVessel.objects.filter(board=board).select_related("vessel")

            width, height = obj.width, obj.height
            board_matrix = [[0 for _ in range(width)] for _ in range(height)]
            placed_ships = []

            # Añadir barcos colocados al tablero
            for bv in vessels:
                ship_type = bv.vessel.id
                ship_size = bv.vessel.size
                is_vertical = bv.ri != bv.rf
                placed_ships.append({
                    "type": ship_type,
                    "size": ship_size,
                    "position": {
                        "row": bv.ri,
                        "col": bv.ci
                    },
                    "isVertical": is_vertical
                })
                for i in range(ship_size):
                    r = bv.ri + i if is_vertical else bv.ri
                    c = bv.ci if is_vertical else bv.ci + i
                    board_matrix[r][c] = ship_type

            # Añadir disparos al tablero
            shots = Shot.objects.filter(board=board)
            for shot in shots:
                r, c = shot.row, shot.col
                # Verificar que las coordenadas están dentro del tablero
                if 0 <= r < height and 0 <= c < width:
                    if shot.result == 1:
                        # Impacto: marcar con valor negativo del tipo de barco
                        board_matrix[r][c] = -board_matrix[r][c]
                    else:
                        # Agua: marcar como 11
                        board_matrix[r][c] = 11

            # Calcular barcos restantes por colocar
            all_vessels = Vessel.objects.all()
            placed_types = {s["type"] for s in placed_ships}
            available_ships = [
                {
                    "type": v.id,
                    "size": v.size,
                    "isVertical": True
                }
                for v in all_vessels if v.id not in placed_types
            ]

            return {
                "id": player.id,
                "username": player.nickname,
                "board": board_matrix,
                "placedShips": placed_ships,
                "availableShips": available_ships,
                "prepared": board.prepared if board else False
            }

        return {
            "player": get_player_status(owner),
            "opponent": get_player_status(cpu_player) if cpu_player else None
        }


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = '__all__'


class VesselSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vessel
        fields = '__all__'


class BoardVesselSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardVessel
        fields = '__all__'


class ShotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shot
        fields = '__all__'
        extra_kwargs = {
            'result': {'required': False}, # Indica si el disparo fue impacto o agua
            'board': {'required': False},
            'player': {'required': False},
            'game': {'required': False},
            'impact': {'required': False}, # Barco impactado
        }