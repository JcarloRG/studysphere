from django.urls import path
from . import views

urlpatterns = [
    # Registro
    path('api/estudiante/registrar/', views.registrar_estudiante, name='registrar_estudiante'),
    path('api/docente/registrar/', views.registrar_docente, name='registrar_docente'),
    path('api/egresado/registrar/', views.registrar_egresado, name='registrar_egresado'),

    # Perfiles individuales
    path('api/estudiante/<int:estudiante_id>/', views.perfil_estudiante, name='perfil_estudiante'),
    path('api/docente/<int:docente_id>/', views.perfil_docente, name='perfil_docente'),
    path('api/egresado/<int:egresado_id>/', views.perfil_egresado, name='perfil_egresado'),
    
]