// src/components/forms/estudiante.jsx
import React, { useState } from 'react';
import './FormStyles.css';

const EstudianteForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    carrera: '',
    semestre: '',
    habilidades: [],
    intereses: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del estudiante:', formData);
    // Aquí luego conectaremos con el backend
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="form-container">
      <h2>🎓 Registro de Estudiante</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre completo:</label>
          <input 
            type="text" 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-group">
          <label>Correo institucional:</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="usuario@itsx.edu.mx" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Carrera:</label>
          <select 
            name="carrera"
            value={formData.carrera}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona tu carrera</option>
            <option value="sistemas">Ing. en Sistemas</option>
            <option value="software">Ing. en Software</option>
            <option value="informatica">Ing. en Informática</option>
          </select>
        </div>

        <button type="submit">Crear Perfil</button>
      </form>
    </div>
  );
};

export default EstudianteForm;