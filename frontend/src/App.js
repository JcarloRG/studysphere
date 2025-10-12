import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EstudianteForm from './components/forms/estudiante.jsx';
import DocenteForm from './components/forms/docente.jsx';
import EgresadoForm from './components/forms/profesionista.jsx';
import HomePage from './components/HomePage.jsx';
import AdminPanel from './components/AdminPanel';
import Perfil from './components/Perfil';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/estudiante" element={<EstudianteForm />} />
          <Route path="/docente" element={<DocenteForm />} />
          <Route path="/egresado" element={<EgresadoForm />} />
          {/* Redirección para las rutas antiguas */}
          <Route path="/estudiante.html" element={<EstudianteForm />} />
          <Route path="/docente.html" element={<DocenteForm />} />
          <Route path="/profesionista.html" element={<EgresadoForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/perfil/:tipo/:id" element={<Perfil />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;