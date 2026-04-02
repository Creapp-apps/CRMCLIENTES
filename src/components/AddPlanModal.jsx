import { useState } from 'react';
import { createProjectPlan } from '../lib/api';

export default function AddPlanModal({ projectId, onClose, onPlanCreated }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return alert('Completar todos los campos');

    setLoading(true);
    try {
      await createProjectPlan({
        project_id: projectId,
        name,
        price: Number(price),
        billing_cycle: billingCycle
      });
      onPlanCreated();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>Crear Nuevo Plan de Facturación</h3>
          <button onClick={onClose} className="btn-icon">✖</button>
        </div>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24}}>
          
          <div>
            <label className="text-sm text-muted">Nombre del Plan (Ej: Básico, Setup, Plan Full)</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Plan Pro 360"
            />
          </div>

          <div>
            <label className="text-sm text-muted">Valor / Precio (USD o ARS)</label>
            <input 
              type="number" 
              className="input-field" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              placeholder="Ej: 500"
            />
          </div>

          <div>
            <label className="text-sm text-muted">Ciclo de Cobro</label>
            <select className="input-field" value={billingCycle} onChange={e => setBillingCycle(e.target.value)}>
              <option value="monthly">Mensual (Recurrente)</option>
              <option value="one-time">Pago Único (Setup)</option>
              <option value="percentage">Porcentaje a Comisión</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear Plan'}
          </button>
        </form>
      </div>
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { width: 100%; max-width: 450px; padding: 24px; border-radius: 20px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem; }
        .input-field { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 8px; outline: none; margin-top: 4px; }
        .input-field:focus { border-color: var(--accent); }
      `}</style>
    </div>
  );
}
