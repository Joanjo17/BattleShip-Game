from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import PlayerViewSet, GameViewSet, BoardViewSet, BoardVesselViewSet, VesselViewSet, ShotViewSet

# Create a router and register our ViewSets with it.
router = DefaultRouter()

router.register(r'user', views.UserViewSet, basename='user')

router.register(r'players', PlayerViewSet)
router.register(r'games', GameViewSet)

router.register(r'boards', BoardViewSet)
router.register(r'vessels', VesselViewSet)

router.register(r'board-vessels', BoardVesselViewSet)
router.register(r'shots', ShotViewSet)

urlpatterns = [
    path("", include(router.urls)),
]