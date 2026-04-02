import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export default function AddLeadModal({ projects, onClose, onSave }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [projectId, setProjectId] = useState('');
  const [source, setSource] = useState('outbound');
  const [channel, setChannel] = useState('presencial');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !projectId) {
      alert('Completá el nombre y seleccioná un proyecto.');
      return;
    }
    setSaving(true);
    await onSave({ project_id: projectId, name, company, source, channel });
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up" style={{ borderRadius: '24px 24px 0 0' }}>
        <div className="modal-header">
          <h3><UserPlus size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/> Crear Prospecto</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
             <label>Nombre del Contacto</label>
             <input type="text" className="form-control" placeholder="Ej: Marcos Silva" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-group">
             <label>Empresa (Opcional)</label>
             <input type="text" className="form-control" placeholder="Ej: CrossFit Alpha" value={company} onChange={e => setCompany(e.target.value)} />
          </div>

          <div className="form-group">
             <label>Asignar a Proyecto</label>
             <select className="form-control" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">-- Selecciona Proyecto --</option>
                {(projects || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
             </select>
          </div>

          <div className="form-group">
             <label>Tipo de Lead</label>
             <select className="form-control" value={source} onChange={e => setSource(e.target.value)}>
                <option value="outbound">Outbound (Prospección)</option>
                <option value="inbound">Inbound (Nos contactó)</option>
             </select>
          </div>

          <div className="form-group">
             <label>Canal Origen</label>
             <select className="form-control" value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="presencial">Presencial / Calle</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="cold_call">Cold Call</option>
             </select>
          </div>
        </div>

        <div className="modal-footer">
           <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
           </button>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; }
        @media(min-width: 768px) { .modal-overlay { align-items: center; } .modal-content { border-radius: 24px !important; } }
        .modal-content { width: 100%; max-width: 500px; padding: 24px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .modal-footer { margin-top: 16px; }
      `}</style>
    </div>
  );
}
