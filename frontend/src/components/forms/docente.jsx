import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const DocenteForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo_institucional: '',
    password: '',
    password2: '',
    carrera_egreso: '',
    carreras_imparte: '',
    grado_academico: '',
    habilidades: '',
    logros: ''
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // Validaciones básicas
    if (
      !formData.nombre_completo ||
      !formData.correo_institucional ||
      !formData.carrera_egreso ||
      !formData.password ||
      !formData.password2
    ) {
      setMessage('❌ Por favor completa todos los campos obligatorios');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setMessage('❌ La contraseña debe tener al menos 8 caracteres');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    if (formData.password !== formData.password2) {
      setMessage('❌ Las contraseñas no coinciden');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Enviando datos de docente...', formData);
      const result = await apiService.createDocente(formData);

      // ✅ Mensaje y redirección a verificación
      setMessage('✅ ¡Docente registrado exitosamente! Revisa tu correo para el código.');
      setMessageType('success');

      setTimeout(() => {
        navigate('/verificar-email', {
          state: {
            email: formData.correo_institucional,
            tipo: 'docente',
            id: result?.data?.id,
          },
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Error completo:', error);
      setMessage(`❌ Error al registrar docente: ${error.message}`);
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
              <div className="header-with-emoji"></div>
              <span className="form-emoji">📚</span>
              <h2> Registro de Docente</h2>
              <p className="form-description-custom">
                Completa tus datos para compartir tu experiencia y conectar con estudiantes
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
                  placeholder="Ej: Dra. María González López"
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
                    placeholder="Ej: maria.gonzalez@institucion.edu"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="carrera_egreso" className="required-custom">
                    Carrera de Egreso
                  </label>
                  <input
                    type="text"
                    id="carrera_egreso"
                    name="carrera_egreso"
                    value={formData.carrera_egreso}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Ingeniería en Sistemas Computacionales"
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
                  <label htmlFor="carreras_imparte" className="optional-custom">
                    Carreras que Imparte
                  </label>
                  <input
                    type="text"
                    id="carreras_imparte"
                    name="carreras_imparte"
                    value={formData.carreras_imparte}
                    onChange={handleChange}
                    placeholder="Ej: Ingeniería Software, Sistemas Computacionales"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="grado_academico" className="optional-custom">
                    Grado Académico
                  </label>
                  <select
                    id="grado_academico"
                    name="grado_academico"
                    value={formData.grado_academico}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input-custom"
                  >
                    <option value="">Selecciona un grado</option>
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                    <option value="Especialización">Especialización</option>
                  </select>
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="habilidades" className="optional-custom">
                  Habilidades y Especialidades
                </label>
                <textarea
                  id="habilidades"
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej: Inteligencia Artificial, Base de Datos, Metodologías Ágiles, Investigación..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
                <div className="help-text-custom">
                  Áreas en las que tienes experiencia y especialización
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="logros" className="optional-custom">
                  Logros Académicos y Profesionales
                </label>
                <textarea
                  id="logros"
                  name="logros"
                  value={formData.logros}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej: Publicaciones, Proyectos de investigación, Reconocimientos, Certificaciones..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
                <div className="help-text-custom">
                  Logros destacados en tu carrera académica y profesional
                </div>
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
                    '📚 Registrar Docente'
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

export default DocenteForm;