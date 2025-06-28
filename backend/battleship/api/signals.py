from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Player

# Esta función se ejecuta automáticamente después de que se guarda un objeto User nuevo.
@receiver(post_save, sender=User)
def create_player(sender, instance, created, **kwargs):
    if created:
        # Se crea automáticamente un objeto Player asociado a ese usuario
        # y se le asigna como nickname el mismo nombre de usuario.
        Player.objects.create(user=instance, nickname=instance.username)