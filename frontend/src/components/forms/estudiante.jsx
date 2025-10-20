import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const EstudianteForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo_institucional: '',
    password: '',
    password2: '',
    numero_control: '',
    carrera_actual: '',
    otra_carrera: 'No',
    semestre: '',
    habilidades: '',
    area_interes: ''
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // ✅ Validaciones
    if (
      !formData.nombre_completo ||
      !formData.correo_institucional ||
      !formData.numero_control ||
      !formData.carrera_actual ||
      !formData.password ||
      !formData.password2
    ) {
      setMessage('❌ Por favor completa todos los campos obligatorios.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setMessage('❌ La contraseña debe tener al menos 8 caracteres.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.password2) {
      setMessage('❌ Las contraseñas no coinciden.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Enviando datos de estudiante...', formData);
      const result = await apiService.createEstudiante(formData);

      // ✅ Mensaje informativo
      setMessage('✅ ¡Estudiante registrado exitosamente! Revisa tu correo para el código.');
      setMessageType('success');

      // ✅ Redirigir a pantalla de verificación
      setTimeout(() => {
        navigate('/verificar-email', {
          state: {
            email: formData.correo_institucional,
            tipo: 'estudiante',
            id: result.data?.id,
          },
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Error completo:', error);
      setMessage(`❌ Error al registrar estudiante: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => navigate('/');

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>👨‍🎓 Registro de Estudiante</h2>
          <p className="form-description">
            Completa tus datos para conectar con proyectos innovadores y colaborar con otros estudiantes
          </p>
        </div>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="estudiante-form">
          <div className="form-group">
            <label htmlFor="nombre_completo" className="required">Nombre Completo</label>
            <input
              type="text"
              id="nombre_completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              required
              placeholder="Ej: Juan Pérez García"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="correo_institucional" className="required">Correo Institucional</label>
              <input
                type="email"
                id="correo_institucional"
                name="correo_institucional"
                value={formData.correo_institucional}
                onChange={handleChange}
                required
                placeholder="Ej: juan.perez@institucion.edu"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="numero_control" className="required">Número de Control</label>
              <input
                type="text"
                id="numero_control"
                name="numero_control"
                value={formData.numero_control}
                onChange={handleChange}
                required
                placeholder="Ej: 19210840"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 🔐 Contraseñas */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="required">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password2" className="required">Confirmar Contraseña</label>
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
                placeholder="Repite la contraseña"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="carrera_actual" className="required">Carrera Actual</label>
              <input
                type="text"
                id="carrera_actual"
                name="carrera_actual"
                value={formData.carrera_actual}
                onChange={handleChange}
                required
                placeholder="Ej: Ingeniería en Software"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="semestre">Semestre</label>
              <input
                type="text"
                id="semestre"
                name="semestre"
                value={formData.semestre}
                onChange={handleChange}
                placeholder="Ej: 7mo Semestre"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="otra_carrera">¿Cursas otra carrera?</label>
            <select
              id="otra_carrera"
              name="otra_carrera"
              value={formData.otra_carrera}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="No">No</option>
              <option value="Sí">Sí</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="habilidades">Habilidades Principales</label>
            <textarea
              id="habilidades"
              name="habilidades"
              value={formData.habilidades}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: Python, UX, Trabajo en equipo..."
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="area_interes">Áreas de Interés</label>
            <textarea
              id="area_interes"
              name="area_interes"
              value={formData.area_interes}
              onChange={handleChange}
              rows="3"
              placeholder="Ej: IA, Web, Ciberseguridad..."
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className={`submit-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span> Registrando...
                </>
              ) : (
                '📚 Registrar Estudiante'
              )}
            </button>

            <button type="button" className="back-btn" onClick={handleBack} disabled={isLoading}>
              ← Volver al Inicio
            </button>
          </div>
        </form>

        <div className="form-footer">
          <p className="required-note">* Campos obligatorios</p>
        </div>
      </div>
    </div>
  );
};

export default EstudianteForm;
