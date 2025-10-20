import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../components/forms/FormStyles.css'; // <-- ajusta si es necesario

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Si vienes desde el formulario, estos valores llegan por state
  const presetEmail = (location.state?.email || '').toLowerCase();
  const presetTipo = location.state?.tipo || '';      // 'estudiante' | 'docente' | 'egresado' (opcional)
  const presetId = location.state?.id || null;        // id del perfil (opcional)

  const [email, setEmail] = useState(presetEmail);
  const [code, setCode] = useState('');
  const [tipo, setTipo] = useState(presetTipo);
  const [perfilId, setPerfilId] = useState(presetId);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState(''); // 'success' | 'error' | ''
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Si llegaron valores por state, los bloqueamos para evitar editar el email
  const emailBloqueado = Boolean(presetEmail);

  useEffect(() => {
    // Limpia mensajes al cambiar inputs
    setMsg('');
    setMsgType('');
  }, [email, code]);

  const normalizaEmail = (v) => (v || '').trim().toLowerCase();
  const normalizaCode = (v) => (v || '').trim();

  const handleResend = async () => {
    const e = normalizaEmail(email);
    if (!e) {
      setMsg('❌ Ingresa tu correo para enviar el código.');
      setMsgType('error');
      return;
    }

    setSending(true);
    setMsg('');
    setMsgType('');

    try {
      // Puedes pasar también tipo y perfil_id si los tienes para relacionar el registro
      // (el backend los trata como opcionales)
      await apiService.emailGenerarCodigo(e, tipo || 'signup', perfilId);
      setMsg('✅ Código enviado. Revisa tu bandeja (y spam).');
      setMsgType('success');
    } catch (err) {
      console.error('Reenviar código error:', err);
      const detalle =
        err?.preview
          ? `Servidor devolvió HTML (posible error).`
          : err?.message || 'No se pudo enviar el código.';
      setMsg(`❌ ${detalle}`);
      setMsgType('error');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (ev) => {
    ev.preventDefault();

    const e = normalizaEmail(email);
    const c = normalizaCode(code);

    if (!e || !c) {
      setMsg('❌ Ingresa correo y código.');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg('');
    setMsgType('');

    try {
      const res = await apiService.emailVerificarCodigo({
        email: e,
        code: c,
        // tipo y id no son obligatorios para verificar; si los pasas, mejor
        tipo: tipo || undefined,
        id: perfilId || undefined,
      });

      setMsg('✅ Correo verificado correctamente.');
      setMsgType('success');

      // Si sabemos a dónde regresar, redirigimos al perfil
      const finalTipo = res?.tipo || tipo;
      const finalId = res?.perfil_id || perfilId;

      if (finalTipo && finalId) {
        setTimeout(() => navigate(`/perfil/${finalTipo}/${finalId}`), 1000);
      }
    } catch (err) {
      console.error('Verificar código error:', err);

      // Mensaje claro si viene HTML del servidor (p. ej., 400 ó 500 con page)
      if (err?.preview) {
        setMsg(
          `❌ Código inválido o expirado: El servidor devolvió HTML (posible error). (${err.status ? 'HTTP ' + err.status : 'Ver consola'})`
        );
        setMsgType('error');
      } else {
        setMsg(`❌ ${err?.message || 'Código inválido o expirado.'}`);
        setMsgType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>📧 Verificar correo electrónico</h2>
          <p className="form-description">
            Ingresa el código que te enviamos por correo para activar tu cuenta.
          </p>
        </div>

        {msg && <div className={`message ${msgType}`}>{msg}</div>}

        <form onSubmit={handleVerify} className="verify-form">
          <div className="form-group">
            <label htmlFor="email" className="required">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              disabled={loading || emailBloqueado}
            />
          </div>

          <div className="form-group">
            <label htmlFor="code" className="required">Código de verificación</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: 123456"
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate('/')}
              disabled={loading || sending}
            >
              ← Volver al inicio
            </button>

            <button
              type="button"
              className="submit-btn"
              onClick={handleResend}
              disabled={loading || sending}
              style={{ marginRight: 'auto', marginLeft: '1rem' }}
            >
              {sending ? 'Enviando…' : 'Enviar / Reenviar código'}
            </button>

            <button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Verificando…' : '✅ Verificar'}
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

export default VerifyEmail;