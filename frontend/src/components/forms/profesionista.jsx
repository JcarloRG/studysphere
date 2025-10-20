import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const EgresadoForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo_institucional: '',
    password: '',
    password2: '',
    carrera_egreso: '',
    anio_egreso: '',
    ocupacion_actual: '',
    perfil_linkedin: '',
    empresa: '',
    puesto: '',
    logros: '',
    habilidades: '',
    competencias: ''
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // Requeridos
    if (
      !formData.nombre_completo ||
      !formData.correo_institucional ||
      !formData.carrera_egreso ||
      !formData.anio_egreso ||
      !formData.password ||
      !formData.password2
    ) {
      setMessage('❌ Por favor completa todos los campos obligatorios.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // Año de egreso
    const anioActual = new Date().getFullYear();
    const anioEgreso = parseInt(formData.anio_egreso, 10);
    if (isNaN(anioEgreso) || anioEgreso < 1900 || anioEgreso > anioActual) {
      setMessage(`❌ El año de egreso debe estar entre 1900 y ${anioActual}.`);
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // Contraseñas
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
      console.log('🔄 Enviando datos de egresado...', formData);
      const result = await apiService.createEgresado(formData);

      // ✅ Mensaje + redirección a verificación
      setMessage('✅ ¡Egresado registrado exitosamente! Revisa tu correo para el código.');
      setMessageType('success');

      setTimeout(() => {
        navigate('/verificar-email', {
          state: {
            email: formData.correo_institucional,
            tipo: 'egresado',
            id: result?.data?.id,
          },
        });
      }, 1000);
    } catch (error) {
      console.error('❌ Error completo:', error);
      setMessage(`❌ Error al registrar egresado: ${error.message}`);
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
              <div className="header-with-emoji">
                <span className="form-emoji">💡</span>
              </div>
              <h2>Registro de Egresado</h2>
              <p className="form-description-custom">
                Completa tus datos para compartir tu experiencia profesional y conectar con la comunidad
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
                  placeholder="Ej: Carlos Rodríguez Martínez"
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="correo_institucional" className="required-custom">
                    Correo
                  </label>
                  <input
                    type="email"
                    id="correo_institucional"
                    name="correo_institucional"
                    value={formData.correo_institucional}
                    onChange={handleChange}
                    required
                    placeholder="Ej: carlos.rodriguez@correo.com"
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
                    placeholder="Ej: Ingeniería en Tecnologías de la Información"
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
                  <label htmlFor="anio_egreso" className="required-custom">
                    Año de Egreso
                  </label>
                  <input
                    type="number"
                    id="anio_egreso"
                    name="anio_egreso"
                    value={formData.anio_egreso}
                    onChange={handleChange}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Ej: 2020"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="ocupacion_actual" className="optional-custom">
                    Ocupación Actual
                  </label>
                  <input
                    type="text"
                    id="ocupacion_actual"
                    name="ocupacion_actual"
                    value={formData.ocupacion_actual}
                    onChange={handleChange}
                    placeholder="Ej: Desarrollador Full Stack"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>
              </div>

              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="empresa" className="optional-custom">
                    Empresa
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    placeholder="Ej: Google, Microsoft, Startup XYZ"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>

                <div className="form-group-custom">
                  <label htmlFor="puesto" className="optional-custom">
                    Puesto
                  </label>
                  <input
                    type="text"
                    id="puesto"
                    name="puesto"
                    value={formData.puesto}
                    onChange={handleChange}
                    placeholder="Ej: Senior Software Engineer"
                    disabled={isLoading}
                    className="form-input-custom"
                  />
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="perfil_linkedin" className="optional-custom">
                  Perfil de LinkedIn
                </label>
                <input
                  type="url"
                  id="perfil_linkedin"
                  name="perfil_linkedin"
                  value={formData.perfil_linkedin}
                  onChange={handleChange}
                  placeholder="Ej: https://linkedin.com/in/tu-perfil"
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="habilidades" className="optional-custom">
                  Habilidades Técnicas
                </label>
                <textarea
                  id="habilidades"
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Ej: JavaScript, Python, React, Node.js, AWS, Docker..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="competencias" className="optional-custom">
                  Competencias Profesionales
                </label>
                <textarea
                  id="competencias"
                  name="competencias"
                  value={formData.competencias}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Ej: Liderazgo, Gestión de proyectos, Comunicación..."
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="logros" className="optional-custom">
                  Logros Profesionales
                </label>
                <textarea
                  id="logros"
                  name="logros"
                  value={formData.logros}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Ej: Proyectos destacados, Certificaciones, Reconocimientos..."
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
                    '💡 Registrar Egresado'
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

export default EgresadoForm;