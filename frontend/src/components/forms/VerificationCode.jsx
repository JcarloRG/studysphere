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
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
    const [canResend, setCanResend] = useState(false);
    
    const inputRefs = useRef([]);
    
    const { email, tipo, id } = location.state || {};

    useEffect(() => {
        if (!email || !tipo) {
            navigate('/');
            return;
        }

        // Timer para reenvío
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

        // Auto-focus siguiente input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        // Auto-enviar cuando esté completo
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
            console.log('🔐 Verificando código para:', email);
            
            const result = await apiService.verifyCode(email, submittedCode, tipo);
            
            if (result.success) {
                setMessage('✅ ¡Código verificado exitosamente!');
                setMessageType('success');
                
                // Guardar sesión
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userType', tipo);
                localStorage.setItem('userId', id || result.data?.id);
                localStorage.setItem('userName', result.data?.nombre || 'Usuario');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('isVerified', 'true');

                // Redirigir al perfil después de 1.5 segundos
                setTimeout(() => {
                    navigate(`/perfil/${tipo}/${id || result.data?.id}`);
                }, 1500);
            } else {
                setMessage(result.message || '❌ Código incorrecto. Intenta nuevamente.');
                setMessageType('error');
                
                // Limpiar inputs en caso de error
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            }
        } catch (error) {
            console.error('❌ Error en verificación:', error);
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
                setTimeLeft(300); // Reiniciar timer a 5 minutos
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

    const handleBackToHome = () => {
        navigate('/');
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
                                <button onClick={handleBackToHome} className="submit-btn-custom">
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
                            onClick={handleBackToHome}
                            disabled={loading}
                        >
                            <span className="btn-icon">🏠</span>
                            <span>Volver al Inicio</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Contenido de verificación */}
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
                                    ⏳ El código expira en: <strong>{formatTime(timeLeft)}</strong>
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
                                    className="resend-btn"
                                >
                                    {canResend ? '🔄 Reenviar Código' : '⏳ Espera para reenviar'}
                                </button>
                            </div>
                        </div>

                        <div className="help-section">
                            <h4>💡 ¿No recibiste el código?</h4>
                            <ul>
                                <li>Revisa tu carpeta de spam o correo no deseado</li>
                                <li>Asegúrate de que <strong>{email}</strong> sea correcto</li>
                                <li>Espera unos minutos y solicita un nuevo código</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationCode;