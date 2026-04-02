import { useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import { updateProject } from '../lib/api';

export default function EditProjectModal({ project, onClose, onProjectUpdated }) {
  const [name, setName] = useState(project.name);
  const [code, setCode] = useState(project.code);
  const [pricingType, setPricingType] = useState(project.pricing_type || 'monthly');
  const [basePrice, setBasePrice] = useState(project.base_price || 0);
  const [isActive, setIsActive] = useState(project.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProj = await updateProject(project.id, { 
        name, 
        code, 
        pricing_type: pricingType, 
        base_price: basePrice,
        is_active: isActive
      });
      onProjectUpdated(updatedProj);
      onClose();
    } catch (err) {
      alert('Error editando proyecto: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3><Edit3 size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/> Editar Proyecto</h3>
          <button className="btn-icon" type="button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Estado del Proyecto</label>
            <select className="form-control" value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
              <option value="true">Activo</option>
              <option value="false">Pausado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nombre del Proyecto / Cliente</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Código Interno (3 letras)</label>
            <input type="text" className="form-control" maxLength={3} value={code} onChange={e => setCode(e.target.value.toUpperCase())} required />
          </div>

          <div className="form-group">
            <label>Modelo de Facturación</label>
            <select className="form-control" value={pricingType} onChange={e => setPricingType(e.target.value)}>
              <option value="monthly">Suscripción Mensual (Abono)</option>
              <option value="one-time">Pago Único (One-time)</option>
              <option value="percentage">A Comisión (Porcentaje)</option>
            </select>
          </div>

          {pricingType !== 'percentage' && (
             <div className="form-group">
               <label>Precio Base / Setup ($)</label>
               <input type="number" className="form-control" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} required />
             </div>
          )}

          <div className="form-group" style={{marginTop: 24}}>
             <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={saving}>
               {saving ? 'Guardando Cambios...' : 'Guardar Cambios'}
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
