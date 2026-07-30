// src/components/forms/EditarPerfil.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import AppHeader from '../AppHeader';
import './FormStyles.css';

const CAMPOS_POR_TIPO = {
  estudiante: [
    'nombre', 'apellido_paterno', 'apellido_materno',
    'carrera_actual', 'otra_carrera', 'semestre',
    'habilidades', 'area_interes',
  ],
  docente: [
    'nombre', 'apellido_paterno', 'apellido_materno',
    'carrera_egreso', 'carreras_imparte', 'grado_academico',
    'habilidades', 'logros',
  ],
  egresado: [
    'nombre', 'apellido_paterno', 'apellido_materno',
    'carrera_egreso', 'anio_egreso', 'ocupacion_actual',
    'perfil_linkedin', 'empresa', 'puesto', 'logros',
    'habilidades', 'competencias',
  ],
};

const EditarPerfil = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem('currentUserId');
  const currentUserType = localStorage.getItem('currentUserType');
  const esPropio = String(currentUserId) === String(id) && currentUserType === tipo;

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const tipoValido = CAMPOS_POR_TIPO.hasOwnProperty(tipo);

  useEffect(() => {
    if (!tipoValido) return;
    const cargar = async () => {
      try {
        const res = await apiService.getPerfil(tipo, id);
        if (res.success && res.data) {
          setFormData(res.data);
        } else {
          setMessage(res.message || 'No se pudo cargar el perfil.');
          setMessageType('error');
        }
      } catch (err) {
        setMessage(err.message || 'Error al cargar el perfil.');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [tipo, id, tipoValido]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => navigate(`/perfil/${tipo}/${id}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('');

    if (!formData.nombre?.trim() || !formData.apellido_paterno?.trim()) {
      setMessage('Nombre y apellido paterno son obligatorios.');
      setMessageType('error');
      setSaving(false);
      return;
    }

    try {
      const res = await apiService.actualizarPerfil(tipo, id, formData);
      if (res.success) {
        setMessage('¡Perfil actualizado! Redirigiendo...');
        setMessageType('success');
        setTimeout(() => navigate(`/perfil/${tipo}/${id}`), 1000);
      } else {
        setMessage(res.message || 'No se pudo actualizar el perfil.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err.message || 'Error al actualizar el perfil.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const LABELS = {
    nombre: 'Nombre(s)',
    apellido_paterno: 'Apellido Paterno',
    apellido_materno: 'Apellido Materno',
    carrera_actual: 'Carrera Actual',
    otra_carrera: 'Otra Carrera',
    semestre: 'Semestre',
    habilidades: 'Habilidades',
    area_interes: 'Área de interés',
    carrera_egreso: 'Carrera de Egreso',
    carreras_imparte: 'Carreras que imparte',
    grado_academico: 'Grado académico',
    logros: 'Logros',
    anio_egreso: 'Año de egreso',
    ocupacion_actual: 'Ocupación actual',
    perfil_linkedin: 'Perfil de LinkedIn',
    empresa: 'Empresa',
    puesto: 'Puesto',
    competencias: 'Competencias',
  };

  const CAMPOS_LARGOS = new Set(['habilidades', 'area_interes', 'logros', 'competencias']);
  const CAMPOS_REQUERIDOS = new Set(['nombre', 'apellido_paterno', 'carrera_actual', 'carrera_egreso']);

  if (!tipoValido) {
    return (
      <div className="form-section">
        <div className="form-container-custom">
          <div className="message-custom error">Tipo de perfil no válido.</div>
        </div>
      </div>
    );
  }

  if (!esPropio) {
    return (
      <div className="home-container">
        <div className="form-section">
          <div className="form-container-custom">
            <div className="form-card-custom">
              <div className="message-custom error">
                Solo puedes editar tu propio perfil.
              </div>
              <Link to={`/perfil/${tipo}/${id}`} className="back-btn-custom">
                ← Volver al perfil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="form-emoji">✏️</span>
              <h2>Editar Perfil</h2>
              <p className="form-description-custom">
                Actualiza tu información — esto es lo que usa StudySphere para recomendarte
                colaboradores afines.
              </p>
            </div>

            {message && <div className={`message-custom ${messageType}`}>{message}</div>}

            {loading ? (
              <p className="field-hint-custom">Cargando tu perfil...</p>
            ) : formData ? (
              <form onSubmit={handleSubmit} className="estudiante-form-custom">
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label htmlFor="nombre" className="required-custom">Nombre(s)</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre || ''}
                      onChange={handleChange}
                      required
                      disabled={saving}
                      className="form-input-custom"
                    />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="apellido_paterno" className="required-custom">Apellido Paterno</label>
                    <input
                      type="text"
                      id="apellido_paterno"
                      name="apellido_paterno"
                      value={formData.apellido_paterno || ''}
                      onChange={handleChange}
                      required
                      disabled={saving}
                      className="form-input-custom"
                    />
                  </div>
                  <div className="form-group-custom">
                    <label htmlFor="apellido_materno" className="optional-custom">Apellido Materno</label>
                    <input
                      type="text"
                      id="apellido_materno"
                      name="apellido_materno"
                      value={formData.apellido_materno || ''}
                      onChange={handleChange}
                      disabled={saving}
                      className="form-input-custom"
                    />
                  </div>
                </div>

                {CAMPOS_POR_TIPO[tipo]
                  .filter((c) => !['nombre', 'apellido_paterno', 'apellido_materno'].includes(c))
                  .map((campo) => (
                    <div className="form-group-custom" key={campo}>
                      <label
                        htmlFor={campo}
                        className={CAMPOS_REQUERIDOS.has(campo) ? 'required-custom' : 'optional-custom'}
                      >
                        {LABELS[campo] || campo}
                      </label>
                      {CAMPOS_LARGOS.has(campo) ? (
                        <textarea
                          id={campo}
                          name={campo}
                          value={formData[campo] || ''}
                          onChange={handleChange}
                          disabled={saving}
                          className="form-input-custom"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={campo === 'anio_egreso' ? 'number' : 'text'}
                          id={campo}
                          name={campo}
                          value={formData[campo] || ''}
                          onChange={handleChange}
                          required={CAMPOS_REQUERIDOS.has(campo)}
                          disabled={saving}
                          className="form-input-custom"
                        />
                      )}
                    </div>
                  ))}

                <div className="form-actions-custom">
                  <button
                    type="submit"
                    className={`submit-btn-custom ${saving ? 'loading' : ''}`}
                    disabled={saving}
                  >
                    {saving ? (<><span className="spinner-custom"></span> Guardando...</>) : '💾 Guardar cambios'}
                  </button>
                  <button
                    type="button"
                    className="back-btn-custom"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    ← Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarPerfil;