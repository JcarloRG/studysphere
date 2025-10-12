from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'  # ✅ Esto es importante
    label = 'users'      # ✅ Agregar esta línea