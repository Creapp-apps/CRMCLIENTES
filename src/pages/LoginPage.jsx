import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="login-loading"><div className="spinner"></div></div>;
  if (user) return <Navigate to="/sales" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error.message);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-slide-up">
        <div className="login-header">
          <h1>CreApp <span className="text-accent">CRM</span></h1>
          <p className="text-muted">{isSignUp ? 'Crear cuenta nueva' : 'Ingresá a tu cuenta'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label>Nombre Completo</label>
              <input className="form-control" type="text" placeholder="Ej: Claudia López" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input className="form-control" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: 14, marginTop: 8 }} disabled={submitting}>
            {submitting ? 'Cargando...' : isSignUp ? 'Registrarme' : 'Ingresar'}
          </button>
        </form>

        <p className="toggle-text">
          {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button className="link-btn" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
            {isSignUp ? 'Iniciá Sesión' : 'Registrate'}
          </button>
        </p>
      </div>

      <style>{`
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .login-card { width: 100%; max-width: 420px; padding: 40px 32px; }
        .login-header { text-align: center; margin-bottom: 32px; }
        .login-header h1 { font-size: 2rem; }
        .text-accent { color: var(--accent); }
        .error-msg { color: var(--danger); font-size: 0.85rem; margin-bottom: 8px; padding: 8px; background: rgba(239,68,68,0.1); border-radius: 6px; }
        .toggle-text { text-align: center; margin-top: 24px; font-size: 0.9rem; color: var(--text-muted); }
        .link-btn { background: none; border: none; color: var(--accent); cursor: pointer; font-weight: 600; font-size: 0.9rem; }
        .login-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .spinner { width: 40px; height: 40px; border: 3px solid var(--glass-border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
