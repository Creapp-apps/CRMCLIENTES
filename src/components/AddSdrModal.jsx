import { useState } from 'react';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddSdrModal({ onClose }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // NOTA: al crear usuario desde el cliente de supabase, cierra la sesión del Admin en v2
    const { error } = await signUp(email, password, fullName);
    if (error) {
      alert('Error creando vendedor: ' + error.message);
      setSaving(false);
    } else {
      alert('Vendedor creado. Tendrás que volver a iniciar sesión como Admin.');
      window.location.reload(); // Forzamos el flujo para que vuelva a loguear si se desloguea
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3><UserPlus size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/> Crear SDR (Vendedor)</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
             <p className="text-xs" style={{color: 'white', display: 'flex', gap: 6}}><AlertTriangle size={14} className="text-danger"/> Por validación de seguridad de Supabase, al crear un usuario desde aquí vas a cerrar tu sesión actual y tendrás que volver a loguearte con tu correo de Admin.</p>
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" className="form-control" placeholder="Ej: Juan Pérez" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Correo Electrónico (Para Login)</label>
            <input type="email" className="form-control" placeholder="sdr@creapp.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
             <label>Contraseña Provisional</label>
             <input type="text" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres"/>
          </div>

          <div className="form-group" style={{marginTop: 24}}>
             <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={saving}>
               {saving ? 'Registrando...' : 'Registrar Nuevo Vendedor'}
             </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;}
        .modal-content { width: 100%; max-width: 450px; padding: 24px; border-radius: 20px;}
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      `}</style>
    </div>
  );
}
