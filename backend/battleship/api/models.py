from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# Representa el perfil de jugador vinculado a un usuario del sistema
class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=50)


class Game(models.Model):
    # Fases posibles del juego
    PHASE_WAITING = "waiting"
    PHASE_PLACEMENT = "placement"
    PHASE_PLAYING = "playing"
    PHASE_GAMEOVER = "gameOver"
    PHASE_CHOICES = {
        PHASE_WAITING: "Waiting",
        PHASE_PLACEMENT: "Placement",
        PHASE_PLAYING: "Playing",
        PHASE_GAMEOVER: "Game Over",
    }

    players = models.ManyToManyField(Player, related_name="games")
    width = models.IntegerField(validators=[MinValueValidator(5), MaxValueValidator(200)], default=10)
    height = models.IntegerField(validators=[MinValueValidator(5), MaxValueValidator(200)], default=10)
    multiplayer = models.BooleanField(default=False)
    turn = models.ForeignKey(Player, related_name="turn", on_delete=models.SET_NULL, blank=True, null=True)
    phase = models.CharField(max_length=15, choices=PHASE_CHOICES.items(), default=PHASE_WAITING)
    winner = models.ForeignKey(Player, related_name="winner", on_delete=models.SET_NULL, blank=True, null=True)
    owner = models.ForeignKey(Player, related_name="owner", on_delete=models.SET_NULL, null=True)

# Representa el tablero individual de un jugador en una partida
class Board(models.Model):
    game = models.ForeignKey(Game, related_name="boards", on_delete=models.CASCADE)
    player = models.ForeignKey(Player, related_name="boards", on_delete=models.CASCADE)
    prepared = models.BooleanField(default=False)

# Representa un tipo de barco disponible
class Vessel(models.Model):
    size = models.PositiveIntegerField()
    name = models.CharField(max_length=50)
    image = models.URLField(blank = True)

# Representa la colocación de un barco sobre el tablero
class BoardVessel(models.Model):
    board = models.ForeignKey(Board, related_name="vessels", on_delete=models.CASCADE)
    vessel = models.ForeignKey(Vessel, related_name="placements", on_delete=models.CASCADE)
    ri = models.IntegerField()
    ci = models.IntegerField()
    rf = models.IntegerField()
    cf = models.IntegerField()
    alive = models.BooleanField(default=True)

# Representa un disparo realizado en la partida
class Shot(models.Model):
    impact = models.ForeignKey(BoardVessel, on_delete=models.SET_NULL, null=True, blank=True) # Barco impactado
    board = models.ForeignKey(Board, related_name="shots", on_delete=models.CASCADE)
    player = models.ForeignKey(Player, related_name="shots", on_delete=models.CASCADE, blank=True, null=True)
    game = models.ForeignKey(Game, related_name="shots", on_delete=models.CASCADE, blank=True, null=True)
    row = models.IntegerField()
    col = models.IntegerField()
    result = models.IntegerField()
