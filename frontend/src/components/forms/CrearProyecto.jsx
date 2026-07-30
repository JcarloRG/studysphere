// src/components/forms/CrearProyecto.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import AppHeader from '../AppHeader';
import './FormStyles.css';

const CrearProyecto = () => {
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('currentUserId');
  const currentUserType = localStorage.getItem('currentUserType');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'proyecto',
    modalidad: 'en linea',
    carrera: '',
    area_interes: '',
    habilidades_requeridas: '',
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => navigate('/proyectos');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    if (!currentUserId || !currentUserType) {
      setMessage('Debes iniciar sesión para publicar un proyecto.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      setMessage('Título y descripción son obligatorios.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiService.crearProyecto(formData);
      if (res.success) {
        setMessage('¡Proyecto publicado correctamente! Redirigiendo...');
        setMessageType('success');
        setTimeout(() => navigate('/proyectos'), 1200);
      } else {
        setMessage(res.message || 'No se pudo publicar el proyecto.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err.message || 'Error al publicar el proyecto.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <AppHeader />

      <div className="form-section">
        <div className="form-container-custom">
          <div className="form-card-custom">
            <div className="form-header-custom">
              <span className="form-emoji">🚀</span>
              <h2>Publicar un Proyecto</h2>
              <p className="form-description-custom">
                Describe qué necesitas y qué tipo de colaborador buscas. Tu proyecto
                aparecerá en el listado para que estudiantes, docentes y egresados
                puedan postularse.
              </p>
            </div>

            {message && <div className={`message-custom ${messageType}`}>{message}</div>}

            {!currentUserId && (
              <div className="message-custom error">
                Necesitas iniciar sesión antes de publicar un proyecto.
              </div>
            )}

            <form onSubmit={handleSubmit} className="estudiante-form-custom">
              <div className="form-group-custom">
                <label htmlFor="titulo" className="required-custom">Título</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Buscamos frontend para app de tutorías"
                  disabled={isLoading}
                  className="form-input-custom"
                  maxLength={200}
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="descripcion" className="required-custom">Descripción</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  placeholder="Cuenta de qué trata el proyecto, en qué etapa está y qué necesitas de un colaborador"
                  disabled={isLoading}
                  className="form-input-custom"
                  rows={5}
                />
              </div>

              <div className="form-row-custom">
                <div className="form-group-custom">
                  <label htmlFor="tipo" className="required-custom">Tipo</label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input-custom"
                  >
                    <option value="proyecto">Proyecto</option>
                    <option value="curso">Curso</option>
                    <option value="mentoria">Mentoría</option>
                  </select>
                </div>

                <div className="form-group-custom">
                  <label htmlFor="modalidad" className="required-custom">Modalidad</label>
                  <select
                    id="modalidad"
                    name="modalidad"
                    value={formData.modalidad}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-input-custom"
                  >
                    <option value="en linea">En línea</option>
                    <option value="presencial">Presencial</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </div>
              </div>

              <div className="form-group-custom">
                <label htmlFor="carrera" className="optional-custom">Carrera relacionada</label>
                <input
                  type="text"
                  id="carrera"
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  placeholder="Ej: Ingeniería en Sistemas Computacionales"
                  disabled={isLoading}
                  className="form-input-custom"
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="area_interes" className="optional-custom">Área de interés</label>
                <input
                  type="text"
                  id="area_interes"
                  name="area_interes"
                  value={formData.area_interes}
                  onChange={handleChange}
                  placeholder="Ej: Inteligencia artificial, desarrollo web, videojuegos"
                  disabled={isLoading}
                  className="form-input-custom"
                />
                <p className="field-hint-custom">
                  Sirve para que el proyecto aparezca en las recomendaciones de personas afines.
                </p>
              </div>

              <div className="form-group-custom">
                <label htmlFor="habilidades_requeridas" className="optional-custom">
                  Habilidades que buscas
                </label>
                <input
                  type="text"
                  id="habilidades_requeridas"
                  name="habilidades_requeridas"
                  value={formData.habilidades_requeridas}
                  onChange={handleChange}
                  placeholder="Ej: React, diseño UX, redacción académica"
                  disabled={isLoading}
                  className="form-input-custom"
                />
                <p className="field-hint-custom">Sepáralas con comas.</p>
              </div>

              <div className="form-actions-custom">
                <button
                  type="submit"
                  className={`submit-btn-custom ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || !currentUserId}
                >
                  {isLoading ? (<><span className="spinner-custom"></span> Publicando...</>) : '🚀 Publicar Proyecto'}
                </button>

                <button
                  type="button"
                  className="back-btn-custom"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  ← Cancelar
                </button>
              </div>
            </form>

            <div className="form-footer-custom">
              <p className="required-note-custom">* Campos obligatorios</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearProyecto;