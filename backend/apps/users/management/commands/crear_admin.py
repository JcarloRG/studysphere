# apps/users/management/commands/crear_admin.py
"""
Crea (o actualiza la contraseña de) una cuenta del panel de administración.

Uso interactivo, igual que 'createsuperuser' de Django:

    python manage.py crear_admin

O sin prompts, útil para scripts:

    python manage.py crear_admin --username ana --password "algo-seguro" --nombre "Ana Admin"

Requiere que ya exista la tabla admin_users (ver
apps/sql/admin_users_postgres.sql).
"""
import getpass

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import DatabaseError


class Command(BaseCommand):
    help = "Crea una cuenta de administrador para el panel de StudySphere."

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default=None)
        parser.add_argument('--password', type=str, default=None)
        parser.add_argument('--nombre', type=str, default=None)

    def handle(self, *args, **options):
        from apps.users.models import AdminUser

        username = options.get('username') or input('Usuario para el panel de admin: ').strip()
        if not username:
            raise CommandError('El usuario no puede estar vacío.')

        nombre = options.get('nombre')
        if nombre is None:
            nombre = input('Nombre a mostrar (opcional, Enter para omitir): ').strip() or None

        password = options.get('password')
        if not password:
            password = getpass.getpass('Contraseña: ')
            password2 = getpass.getpass('Confirma la contraseña: ')
            if password != password2:
                raise CommandError('Las contraseñas no coinciden.')
        if not password or len(password) < 6:
            raise CommandError('La contraseña debe tener al menos 6 caracteres.')

        try:
            admin, creado = AdminUser.objects.get_or_create(
                username__iexact=username,
                defaults={'username': username, 'password_hash': make_password(password), 'nombre': nombre},
            )
        except DatabaseError as e:
            raise CommandError(
                "No se pudo guardar el administrador. ¿Ya ejecutaste "
                "apps/sql/admin_users_postgres.sql contra tu base de datos? "
                f"Detalle: {e}"
            )

        if not creado:
            admin.password_hash = make_password(password)
            if nombre:
                admin.nombre = nombre
            admin.save(update_fields=['password_hash', 'nombre'])
            self.stdout.write(self.style.SUCCESS(f"Contraseña actualizada para el admin '{username}'."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Administrador '{username}' creado correctamente."))
