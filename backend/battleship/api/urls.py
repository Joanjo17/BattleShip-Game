from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter
from . import views
from .views import PlayerViewSet, GameViewSet, BoardViewSet, BoardVesselViewSet, VesselViewSet, ShotViewSet

# Create a router and register our ViewSets with it.
router = DefaultRouter()
router.register(r'user', views.UserViewSet, basename='user')
router.register(r'players', PlayerViewSet)
router.register(r'games', GameViewSet)
router.register(r'vessels', VesselViewSet)

# Subrutas: /games/{game_id}/players/
players_router = NestedSimpleRouter(router, r'games', lookup='game')
players_router.register(r'players', PlayerViewSet, basename='game-players')

# Subrutas: /games/{game_id}/players/{player_id}/vessels/
vessels_router = NestedSimpleRouter(players_router, r'players', lookup='player')
vessels_router.register(r'vessels', BoardVesselViewSet, basename='game-player-vessels')

# Subrutas: /games/{game_id}/players/{player_id}/boards/
boards_router = NestedSimpleRouter(players_router, r'players', lookup='player')
boards_router.register(r'boards', BoardViewSet, basename='game-player-boards')

# Subrutas: /games/{game_id}/players/{player_id}/shots/
shots_router = NestedSimpleRouter(players_router, r'players', lookup='player')
shots_router.register(r'shots', ShotViewSet, basename='game-player-shots')


# Todas las rutas registradas en la API
urlpatterns = [
    path("", include(router.urls)),
    path("", include(players_router.urls)),
    path("", include(vessels_router.urls)),
    path("", include(shots_router.urls)),
    path("", include(boards_router.urls)),
]