from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Player, Game, Board, Vessel, BoardVessel, Shot


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']
        # exclude = ('password',)


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

    def get_extended_status(self, obj):
        player = obj.owner
        board = Board.objects.filter(game=obj, player=player).first()
        width, height = obj.width, obj.height
        vessels = BoardVessel.objects.filter(board=board).select_related("vessel")

        board_matrix = [[0 for _ in range(width)] for _ in range(height)]

        placed_ships = []
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
            "player": {
                "id": player.id,
                "username": player.nickname,
                "board": board_matrix,
                "placedShips": placed_ships,
                "availableShips": available_ships
            }
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