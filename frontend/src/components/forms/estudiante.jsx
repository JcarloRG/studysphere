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
    <div className="home-container">
      {/* Fondo idéntico al homepage */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Header idéntico al homepage */}
      <header className="premium-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🚀</div>
            <h1>StudySphere</h1>
          </div>
          <nav className="nav-actions">
            <button 
              className="nav-btn profile-nav-btn"
              onClick={handleBack}
              disabled={isLoading}
            >
              <span className="btn-icon">🏠</span>
              <span>Volver al Inicio</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido del formulario */}
      <div className="form-section">
        <div className="form-container-custom">
          <div className="form-card-custom">
            <div className="form-header-custom">
              <span className="form-emoji">🎓</span>
              <h2>Registro de Estudiante</h2>
              <p className="form-description-custom">
                Completa tus datos para unirte a nuestra comunidad académica y comenzar a colaborar en proyectos innovadores
              </p>
            </div>

            {message && (
              <div className={`message-custom ${messageType}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="estudiante-form-custom">
              <div className="form-group-custom">
                <label htmlFor="nombre_completo" className="required-custom">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Juan Pérez García"
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="correo_institucional" className="required-custom">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    id="correo_institucional"
                    name="correo_institucional"
                    value={formData.correo_institucional}
                    onChange={handleChange}
                    required
                    placeholder="Ej: juan.perez@institucion.edu"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="numero_control" className="required-custom">
                    Número de Control
                  </label>
                  <input
                    type="text"
                    id="numero_control"
                    name="numero_control"
                    value={formData.numero_control}
                    onChange={handleChange}
                    required
                    placeholder="Ej: 19210840"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>
              </div>

              {/* 🔐 Contraseñas */}
              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="password" className="required-custom">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="password2" className="required-custom">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    id="password2"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    required
                    placeholder="Repite la contraseña"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>
              </div>

              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="carrera_actual" className="required-custom">
                    Carrera Actual
                  </label>
                  <input
                    type="text"
                    id="carrera_actual"
                    name="carrera_actual"
                    value={formData.carrera_actual}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Ingeniería en Software"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="semestre" className="optional-custom">
                    Semestre
                  </label>
                  <input
                    type="text"
                    id="semestre"
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleChange}
                    placeholder="Ej: 7mo Semestre"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="otra_carrera" className="optional-custom">
                  ¿Cursas otra carrera?
                </label>
                <select
                  id="otra_carrera"
                  name="otra_carrera"
                  value={formData.otra_carrera}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="form-input-custom"
                >
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>

              <div className="form-group-custom">
                <label htmlFor="habilidades" className="optional-custom">
                  Habilidades Principales
                </label>
                <textarea
                  id="habilidades"
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej: Python, UX, Trabajo en equipo..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="area_interes" className="optional-custom">
                  Áreas de Interés
                </label>
                <textarea
                  id="area_interes"
                  name="area_interes"
                  value={formData.area_interes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej: IA, Web, Ciberseguridad..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-actions-custom">
                <button 
                  type="submit" 
                  className={`submit-btn-custom ${isLoading ? 'loading' : ''}`} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-custom"></span> 
                      Registrando...
                    </>
                  ) : (
                    '🎓 Registrar Estudiante'
                  )}
                </button>

                <button 
                  type="button" 
                  className="back-btn-custom" 
                  onClick={handleBack} 
                  disabled={isLoading}
                >
                  ← Volver al Inicio
                </button>
              </div>
            </form>

            <div className="form-footer-custom">
              <p className="required-note-custom">
                * Campos obligatorios
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstudianteForm;
