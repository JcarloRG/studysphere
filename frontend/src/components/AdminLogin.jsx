import React, { useState } from 'react';
import { adminService } from '../services/api';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError('Ingresa usuario y contraseña.');
            return;
        }
        try {
            setLoading(true);
            setError('');
            const { admin } = await adminService.login(username.trim(), password);
            onLoginSuccess(admin);
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <div className="admin-login-icon">🎓</div>
                <h1>Panel de Administración</h1>
                <p className="admin-login-subtitle">StudySphere</p>

                {error && <div className="admin-login-error">{error}</div>}

                <label className="admin-login-label">
                    Usuario
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                    />
                </label>

                <label className="admin-login-label">
                    Contraseña
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </label>

                <button type="submit" className="admin-login-btn" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <p className="admin-login-hint">
                    ¿No tienes cuenta? Créala desde la terminal del backend con{' '}
                    <code>python manage.py crear_admin</code>
                </p>
            </form>
        </div>
    );
};

export default AdminLogin;
