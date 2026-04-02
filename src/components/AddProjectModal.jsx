import { useState } from 'react';
import { X, Database } from 'lucide-react';
import { createProject } from '../lib/api';

export default function AddProjectModal({ onClose, onProjectCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [pricingType, setPricingType] = useState('monthly');
  const [basePrice, setBasePrice] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newProj = await createProject({ name, code, pricing_type: pricingType, base_price: basePrice });
      onProjectCreated(newProj);
      onClose();
    } catch (err) {
      alert('Error creando proyecto: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3><Database size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/> Nuevo Proyecto SaaS</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre del Proyecto / Cliente</label>
            <input type="text" className="form-control" placeholder="Ej: GymFit System" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Código Interno (3 letras)</label>
            <input type="text" className="form-control" placeholder="Ej: GYM" maxLength={3} value={code} onChange={e => setCode(e.target.value.toUpperCase())} required />
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
               {saving ? 'Guardando...' : 'Crear Base de Datos del Proyecto'}
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
