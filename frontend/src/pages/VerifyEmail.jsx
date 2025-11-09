import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import '../components/forms/FormStyles.css';

const VerifyEmail = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(300);
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener el email del estado de navegación
    const email = location.state?.email || 'abigalicabelloarguello@gmail.com';
    const userData = location.state?.userData;

    useEffect(() => {
        if (!timeLeft) return;
        const timerId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleCodeChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newCode = [...code];
        newCode[index] = element.value;
        setCode(newCode);

        if (element.value !== '' && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !e.target.value && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const handleVerify = async () => {
        const verificationCode = code.join('');
        
        if (verificationCode.length !== 6) {
            setMessage({ type: 'error', text: 'Por favor ingresa el código completo de 6 dígitos' });
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.post('/verify-email', {
                email,
                code: verificationCode,
                userData
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: '¡Correo verificado exitosamente! Redirigiendo...' });
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Error al verificar el código. Intenta nuevamente.' 
            });
        }
        setLoading(false);
    };

    const handleResendCode = async () => {
        setLoading(true);
        try {
            await apiService.post('/resend-verification', { email });
            setMessage({ type: 'success', text: '¡Código reenviado exitosamente!' });
            setTimeLeft(300);
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Error al reenviar el código.' 
            });
        }
        setLoading(false);
    };

    const handleCancelRegistration = () => {
        if (window.confirm('¿Estás seguro de que quieres cancelar el registro? Se eliminarán todos los datos ingresados.')) {
            navigate('/register'); // Redirigir al formulario de registro
        }
    };

    return (
        <div className="home-container">
            {/* ✅ HEADER IDÉNTICO AL FORMULARIO DEL ESTUDIANTE */}
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
            </div>

            {/* HEADER EXACTO COMO EL DEL ESTUDIANTE */}
            <header className="premium-header">
                <div className="header-content">
                    <div className="logo-section">
                        <img 
                            src="/logo192.png" 
                            alt="StudySphere Logo" 
                            className="site-logo"
                        />
                        <h1>StudySphere</h1>
                    </div>
                    <nav className="nav-actions">
                        <button
                            className="nav-btn profile-nav-btn"
                            onClick={handleCancelRegistration}
                            disabled={loading}
                        >
                            <span className="btn-icon">✖</span>
                            <span>Cancelar Registro</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Sección principal */}
            <div className="form-section">
                <div className="form-container-custom">
                    <div className="form-card-custom">
                        {/* Header del formulario */}
                        <div className="form-header-custom">
                            <span className="form-emoji">📧</span>
                            <h2>Verificación de Correo</h2>
                            <p className="form-description-custom">
                                Hemos enviado un código de 6 dígitos a:<br />
                                <strong>{email}</strong>
                            </p>
                        </div>

                        {/* Mensajes */}
                        {message && (
                            <div className={`message-custom ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        {/* Sección de verificación */}
                        <div className="verification-section">
                            <div className="code-inputs-container">
                                <label className="code-label">Ingresa el código de verificación:</label>
                                <div className="code-inputs-group">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            className="code-input"
                                            value={code[index]}
                                            onChange={(e) => handleCodeChange(e.target, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            disabled={loading}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="timer-section">
                                <p className="timer-text">
                                    El código expira en: <strong>{formatTime(timeLeft)}</strong>
                                </p>
                            </div>

                            {/* Botones */}
                            <div className="verification-actions">
                                <button
                                    className={`verify-btn ${loading ? 'loading' : ''}`}
                                    onClick={handleVerify}
                                    disabled={loading || timeLeft === 0}
                                >
                                    {loading && <div className="spinner-custom"></div>}
                                    {loading ? 'Verificando...' : 'Verificar Código'}
                                </button>

                                <button
                                    className="resend-btn"
                                    onClick={handleResendCode}
                                    disabled={loading || timeLeft > 240}
                                >
                                    Reenviar Código
                                </button>
                            </div>
                        </div>

                        {/* Sección de ayuda */}
                        <div className="help-section">
                            <h4>¿Problemas con el código?</h4>
                            <ul>
                                <li>Revisa tu carpeta de <strong>spam</strong> o <strong>correo no deseado</strong></li>
                                <li>Asegúrate de haber ingresado el correo correctamente</li>
                                <li>El código expira en <strong>5 minutos</strong></li>
                                <li>Si no recibes el código, haz clic en <strong>"Reenviar Código"</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;