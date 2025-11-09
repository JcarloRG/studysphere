import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import './FormStyles.css';

const VerificationCode = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [timeLeft, setTimeLeft] = useState(180);
    const [canResend, setCanResend] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    
    const inputRefs = useRef([]);
    
    const { email, tipo, id } = location.state || {};

    useEffect(() => {
        if (!email || !tipo) {
            navigate('/');
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [email, tipo, navigate]);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        if (newCode.every(digit => digit !== '') && index === 5) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
        
        if (digits.length === 6) {
            const newCode = [...Array(6).fill('')];
            digits.forEach((digit, index) => {
                newCode[index] = digit;
            });
            setCode(newCode);
            inputRefs.current[5].focus();
            handleSubmit(newCode.join(''));
        }
    };

    const handleSubmit = async (submittedCode = code.join('')) => {
        if (submittedCode.length !== 6) {
            setMessage('❌ El código debe tener 6 dígitos');
            setMessageType('error');
            return;
        }

        setLoading(true);
        setMessage('');
        setMessageType('');

        try {
            const result = await apiService.verifyCode(email, submittedCode, tipo);
            
            if (result.success) {
                setMessage('✅ ¡Código verificado exitosamente!');
                setMessageType('success');
                
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userType', tipo);
                localStorage.setItem('userId', id || result.data?.id);
                localStorage.setItem('userName', result.data?.nombre || 'Usuario');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('isVerified', 'true');

                setTimeout(() => {
                    navigate(`/perfil/${tipo}/${id || result.data?.id}`);
                }, 1500);
            } else {
                setMessage(result.message || '❌ Código incorrecto. Intenta nuevamente.');
                setMessageType('error');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            }
        } catch (error) {
            setMessage('❌ Error al verificar el código. Intenta nuevamente.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;

        setLoading(true);
        setMessage('');
        setMessageType('');

        try {
            const result = await apiService.resendCode(email, tipo);
            
            if (result.success) {
                setMessage('✅ ¡Código reenviado! Revisa tu correo.');
                setMessageType('success');
                setTimeLeft(180);
                setCanResend(false);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            } else {
                setMessage(result.message || '❌ Error al reenviar el código.');
                setMessageType('error');
            }
        } catch (error) {
            setMessage('❌ Error al reenviar el código. Intenta nuevamente.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleConfirmCancel = async () => {
        setLoading(true);
        try {
            // ✅ LLAMADA A LA NUEVA API PARA ELIMINAR DE LA BASE DE DATOS
            const result = await apiService.cancelRegistration(email, tipo);
            
            setShowCancelModal(false);
            
            if (result.success) {
                setMessage('✅ Registro cancelado exitosamente. Todos los datos han sido eliminados de la base de datos.');
                setMessageType('success');
                
                setTimeout(() => {
                    // Redirigir al formulario correspondiente
                    switch(tipo) {
                        case 'estudiante':
                            navigate('/estudiante');
                            break;
                        case 'docente':
                            navigate('/docente');
                            break;
                        case 'egresado':
                            navigate('/egresado');
                            break;
                        default:
                            navigate('/');
                    }
                }, 2000);
            } else {
                setMessage('⚠️ ' + result.message);
                setMessageType('error');
            }
        } catch (error) {
            console.error('Error al cancelar registro:', error);
            setShowCancelModal(false);
            setMessage('⚠️ Error al cancelar registro: ' + error.message);
            setMessageType('error');
            
            // Redirigir de todas formas después de mostrar el error
            setTimeout(() => {
                switch(tipo) {
                    case 'estudiante':
                        navigate('/estudiante');
                        break;
                    case 'docente':
                        navigate('/docente');
                        break;
                    case 'egresado':
                        navigate('/egresado');
                        break;
                    default:
                        navigate('/');
                }
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowCancelModal(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!email || !tipo) {
        return (
            <div className="home-container">
                <div className="background-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
                <div className="form-section">
                    <div className="form-container-custom">
                        <div className="form-card-custom">
                            <div className="error-message-custom">
                                Error: No se encontró información de verificación
                            </div>
                            <div className="form-actions-custom">
                                <button onClick={() => navigate('/')} className="submit-btn-custom">
                                    🏠 Volver al Inicio
                                </button>
                            </div>
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
                            onClick={handleCancelClick}
                            disabled={loading}
                        >
                            <span className="btn-icon">✖</span>
                            <span>Cancelar Registro</span>
                        </button>
                    </nav>
                </div>
            </header>

            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal-content-custom">
                        <div className="modal-header-custom">
                            <h3>¿Cancelar Registro?</h3>
                        </div>
                        <div className="modal-body-custom">
                            <p>¿Estás seguro de que quieres cancelar el registro? <strong>Se eliminarán permanentemente todos los datos ingresados de la base de datos</strong> y deberás comenzar de nuevo.</p>
                        </div>
                        <div className="modal-actions-custom">
                            <button 
                                className="cancel-btn-modal"
                                onClick={handleConfirmCancel}
                                disabled={loading}
                            >
                                {loading ? 'Eliminando...' : 'Sí, Eliminar Registro'}
                            </button>
                            <button 
                                className="confirm-btn-modal"
                                onClick={handleCloseModal}
                                disabled={loading}
                            >
                                No, Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-section">
                <div className="form-container-custom">
                    <div className="form-card-custom">
                        <div className="form-header-custom">
                            <div className="header-with-emoji">
                                <span className="form-emoji">🔐</span>
                                <h2>Verificación de Correo</h2>
                            </div>
                            <p className="form-description-custom">
                                Hemos enviado un código de 6 dígitos a:<br />
                                <strong>{email}</strong>
                            </p>
                        </div>

                        {message && (
                            <div className={`message-custom ${messageType}`}>
                                {message}
                            </div>
                        )}

                        <div className="verification-section">
                            <div className="code-inputs-container">
                                <label className="code-label">
                                    Ingresa el código de verificación:
                                </label>
                                <div 
                                    className="code-inputs-group"
                                    onPaste={handlePaste}
                                >
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => inputRefs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            disabled={loading}
                                            className="code-input"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="timer-section">
                                <p className="timer-text">
                                    Tiempo restante: <strong>{formatTime(timeLeft)}</strong>
                                </p>
                            </div>

                            <div className="verification-actions">
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={loading || code.some(digit => digit === '')}
                                    className={`verify-btn ${loading ? 'loading' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-custom"></span>
                                            Verificando...
                                        </>
                                    ) : (
                                        '✅ Verificar Código'
                                    )}
                                </button>

                                <button
                                    onClick={handleResendCode}
                                    disabled={loading || !canResend}
                                    className={`resend-btn ${canResend ? 'active' : ''}`}
                                >
                                    {canResend ? '🔄 Reenviar Código' : `Espera ${formatTime(timeLeft)}`}
                                </button>
                            </div>
                        </div>

                        <div className="help-section">
                            <h4>💡 ¿No recibiste el código?</h4>
                            <ul>
                                <li>Revisa tu carpeta de spam o correo no deseado</li>
                                <li>Asegúrate de que <strong>{email}</strong> sea correcto</li>
                                <li>Espera 3 minutos y podrás reenviar el código</li>
                                <li><strong>No podrás continuar sin verificar tu correo</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationCode;