from django.urls import path
from . import views

urlpatterns = [
    # ✅ URLs para el registro
    path('api/estudiante/registrar/', views.registrar_estudiante, name='registrar_estudiante'),
    #path('api/docente/registrar/', views.registrar_docente, name='registrar_docente'),
    #path('api/egresado/registrar/', views.registrar_egresado, name='registrar_egresado'),
    
    # ... otras URLs que ya tengas ...
]