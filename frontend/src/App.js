// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import EstudianteForm from './components/forms/estudiante.jsx';
import DocenteForm from './components/forms/docente.jsx';
import EgresadoForm from './components/forms/profesionista.jsx';
import HomePage from './components/HomePage.jsx';
import AdminPanel from './components/AdminPanel'; // si no lo usas, luego lo puedes quitar
import Perfil from './components/Perfil';
import Comunidad from './components/Comunidad';
import VerificationCode from './components/forms/VerificationCode.jsx';
import PerfilVista from './components/perfil_vista.jsx';
import BuscarProyectos from './components/BuscarProyectos';
import CrearProyecto from './components/forms/CrearProyecto.jsx';
import EditarPerfil from './components/forms/EditarPerfil.jsx';
import MisMatchesPage from './pages/MisMatchesPage.jsx';
import Mensajes from './pages/Mensajes.jsx';
import ChatConversacion from './pages/ChatConversacion.jsx';

import VerificarEmail from './pages/VerifyEmail.jsx';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Página principal */}
          <Route path="/" element={<HomePage />} />

          {/* Comunidad / feed */}
          <Route path="/comunidad" element={<Comunidad />} />

          {/* Formularios de registro */}
          <Route path="/estudiante" element={<EstudianteForm />} />
          <Route path="/docente" element={<DocenteForm />} />
          <Route path="/egresado" element={<EgresadoForm />} />

          {/* Verificación de email (según flujo que estés usando) */}
          <Route path="/verificar-email" element={<VerificationCode />} />
          {/* Si usas también esta página, déjala; si no, puedes borrarla después */}
          <Route path="/verify-email" element={<VerificarEmail />} />

          {/* Rutas legacy .html por si las usas en enlaces estáticos */}
          <Route path="/estudiante.html" element={<EstudianteForm />} />
          <Route path="/docente.html" element={<DocenteForm />} />
          <Route path="/profesionista.html" element={<EgresadoForm />} />

          {/* Perfil propio (con edición, borrar cuenta, cambiar foto, etc.) */}
          <Route path="/perfil/:tipo/:id" element={<Perfil />} />
          <Route path="/editar/:tipo/:id" element={<EditarPerfil />} />

          {/* Perfil de solo vista pública */}
          <Route path="/perfil_vista/:tipo/:id" element={<PerfilVista />} />

          {/* Proyectos: buscador / listado */}
          <Route path="/proyectos" element={<BuscarProyectos />} />
          <Route path="/proyectos/crear" element={<CrearProyecto />} />

          {/* Mis conexiones (solicitudes recibidas/enviadas + colaboraciones aceptadas) */}
          <Route path="/mis-matches" element={<MisMatchesPage />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/mensajes/:matchId" element={<ChatConversacion />} />

          {/* Panel de administración (tiene su propio login interno) */}
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;