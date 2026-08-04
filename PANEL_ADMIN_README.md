# Panel de Administración de StudySphere — cómo activarlo

Este documento explica qué cambió y los 3 pasos que necesitas hacer tú
(porque requieren tu base de datos real, a la que yo no tengo acceso) para
dejar el panel funcionando.

## ⚠️ Antes que nada: tu `venv` no sirve aquí

El `backend/venv` que traía el proyecto se creó en Windows
(`C:\Python314`), así que no funciona en otro sistema operativo. Si vas a
correr el backend en otra máquina, crea uno nuevo:

```bash
cd backend
python -m venv venv
# Windows:  venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

## Paso 1 — Crear la tabla de administradores

El proyecto no usa migraciones de Django (las tablas se crean con SQL
directo), así que la tabla nueva `admin_users` se crea igual. Ejecuta
**una sola vez** contra tu base Postgres:

```bash
psql -h 127.0.0.1 -U TU_USUARIO -d TU_BASE -f backend/apps/sql/admin_users_postgres.sql
```

(o corre el contenido de ese archivo desde pgAdmin/DBeaver/la extensión de
Postgres de tu editor — es solo un `CREATE TABLE`).

## Paso 2 — Crear tu usuario administrador

Con el backend activado:

```bash
cd backend
python manage.py crear_admin
```

Te va a pedir usuario, nombre (opcional) y contraseña (mínimo 6
caracteres). Puedes correrlo varias veces para crear más administradores,
o para resetear la contraseña de uno ya existente.

## Paso 3 — Correr todo y entrar

```bash
# Terminal 1
cd backend
python manage.py runserver

# Terminal 2
cd frontend
npm start
```

Entra a **`http://localhost:3000/admin`** e inicia sesión con lo que
creaste en el paso 2.

---

## Qué encontrarás en el panel

- **Dashboard**: conteos de estudiantes, docentes, egresados, proyectos,
  conexiones aceptadas/pendientes, y los últimos 8 registros de toda la
  plataforma.
- **Estudiantes / Docentes / Egresados**: listar, buscar (por nombre,
  correo, carrera, etc.) y **eliminar de verdad** cualquier perfil — antes
  esto no era posible para un admin.
- **Proyectos**: listar, buscar y eliminar.
- **Cerrar sesión** desde el propio panel.

## Qué arreglé en el camino (bugs que ya existían)

1. La ruta `/admin` estaba **comentada** en `App.js` → el panel no era
   accesible ni siquiera con datos correctos.
2. El borrado de perfiles (`eliminar_estudiante`, etc.) solo dejaba a un
   usuario borrarse **a sí mismo** — no existía ningún mecanismo para que
   un administrador borrara el perfil de otra persona. Los endpoints
   nuevos bajo `/api/admin/...` sí lo permiten, protegidos por login.
3. La búsqueda llamaba a `/api/estudiantes/buscar/` (y equivalentes), una
   ruta que **nunca existió** en el backend → siempre daba 404. Ahora la
   búsqueda vive en los mismos endpoints de listado (`?q=...`).
4. **Bug de datos**: `ListaEstudiantes.jsx`, `ListaDocentes.jsx` y
   `ListaEgresados.jsx` leían `result.estudiantes` / `result.docentes` /
   `result.egresados`, pero la API siempre devolvió todo bajo
   `result.data`. Por eso las tres tablas aparecían **siempre vacías**,
   sin importar cuántos registros hubiera.

## Detalles técnicos, por si los necesitas

- **Autenticación del panel**: token propio firmado con la `SECRET_KEY`
  de Django (`django.core.signing`), enviado en la cabecera
  `X-Admin-Token`. Expira a las 12 horas. No usa cookies ni sesiones en
  base de datos — es intencional, para no depender de una tabla de
  sesiones extra.
- **Contraseñas de admin**: usan el hasher fuerte de Django (PBKDF2, con
  sal), distinto del sha256 sin sal que usan Estudiante/Docente/Egresado
  — es una tabla nueva, así que no había razón para no usar algo mejor.
- Los endpoints nuevos están en `backend/apps/users/admin_views.py` y
  `admin_permissions.py` (antes existían vacíos, sin usar en ningún lado).
- El "logout" es solo del lado del cliente (borra el token guardado): no
  hay forma de invalidar un token ya emitido antes de que expire por sí
  solo. Para este alcance es una simplificación razonable; si más adelante
  quieres invalidación inmediata, se necesitaría una tabla de sesiones.
