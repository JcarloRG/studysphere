import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import EstudianteForm from './components/forms/estudiante.jsx';
import DocenteForm from './components/forms/docente.jsx';
import EgresadoForm from './components/forms/profesionista.jsx';
import HomePage from './components/HomePage.jsx';
import AdminPanel from './components/AdminPanel';
import Perfil from './components/Perfil';
import Comunidad from './components/Comunidad';
import VerificationCode from './components/forms/VerificationCode.jsx';
import PerfilVista from './components/perfil_vista.jsx'; 


import VerificarEmail from './pages/VerifyEmail.jsx';

import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/comunidad" element={<Comunidad />} />

                    <Route path="/estudiante" element={<EstudianteForm />} />
                    <Route path="/docente" element={<DocenteForm />} />
                    <Route path="/egresado" element={<EgresadoForm />} />

                    
                    <Route path="/verificar-email" element={<VerificationCode />} />

                    <Route path="/estudiante.html" element={<EstudianteForm />} />
                    <Route path="/docente.html" element={<DocenteForm />} />
                    <Route path="/profesionista.html" element={<EgresadoForm />} />

                    {/* Ruta para el perfil propio/edición */}
                    <Route path="/perfil/:tipo/:id" element={<Perfil />} /> 
                    
                    {/* Ruta para el perfil de vista pública */}
                    <Route path="/perfil_vista/:tipo/:id" element={<PerfilVista />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;