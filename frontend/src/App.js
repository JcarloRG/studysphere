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

import VerificarEmail from './pages/VerifyEmail.jsx';
import { apiService } from './services/api';

import './App.css';

/** Página simple para ver todos mis matches aceptados */
function MisMatchesPage() {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiService.obtenerMisMatches();
        if (res.success) {
          setMatches(res.matches || []);
        } else {
          setError(res.message || 'No se pudieron cargar los matches');
        }
      } catch (e) {
        setError(e.message || 'Error al obtener matches');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Cargando tus matches...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  if (!matches.length) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Mis matches</h2>
        <p>Todavía no tienes matches aceptados.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Mis matches</h2>
      <ul>
        {matches.map((m) => (
          <li key={m.id}>
            Match #{m.id} – estado: {m.estado}
          </li>
        ))}
      </ul>
    </div>
  );
}

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

          {/* Perfil de solo vista pública */}
          <Route path="/perfil_vista/:tipo/:id" element={<PerfilVista />} />

          {/* Proyectos: buscador / listado */}
          <Route path="/proyectos" element={<BuscarProyectos />} />

          {/* Mis matches (matches aceptados) */}
          <Route path="/mis-matches" element={<MisMatchesPage />} />

          {/* Si en algún momento quieres admin panel:
          <Route path="/admin" element={<AdminPanel />} /> 
          */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
