import { useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';
import { assignSdrToProject } from '../lib/api';

export default function AssignProjectModal({ sdr, projects, onClose, onAssigned }) {
  const [projectId, setProjectId] = useState('');
  const [commissionType, setCommissionType] = useState('percentage');
  const [commissionValue, setCommissionValue] = useState(10);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) return alert('Elige un proyecto.');
    
    setSaving(true);
    try {
      await assignSdrToProject(sdr.id, projectId, commissionType, commissionValue);
      onAssigned();
      onClose();
    } catch (err) {
      alert('Error asignando proyecto: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3><LinkIcon size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/> Asignar a {sdr?.full_name}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Seleccionar Proyecto</label>
            <select className="form-control" value={projectId} onChange={e => setProjectId(e.target.value)} required>
               <option value="">-- Seleccione Proyecto --</option>
               {projects.map(p => (
                 <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
               ))}
            </select>
          </div>

          <div className="form-group">
             <label>Tipo de Comisión para este Lead</label>
             <select className="form-control" value={commissionType} onChange={e => setCommissionType(e.target.value)}>
               <option value="percentage">% Porcentaje del Abono</option>
               <option value="fixed">$ Monto Fijo por cierre</option>
             </select>
          </div>

          <div className="form-group">
             <label>Valor de Comisión ({commissionType === 'percentage' ? '%' : '$'})</label>
             <input type="number" className="form-control" value={commissionValue} onChange={e => setCommissionValue(Number(e.target.value))} required />
          </div>

          <div className="form-group" style={{marginTop: 24}}>
             <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={saving}>
               {saving ? 'Asignando...' : 'Asignar Vendedor al Proyecto'}
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
