import { useState, useEffect } from 'react';
import { X, PhoneCall, MessageCircle, Mail, Calendar, CheckCircle, Tag } from 'lucide-react';
import { fetchProjectPlans } from '../lib/api';

export default function LogActionModal({ lead, onClose, onSave }) {
  const [actionType, setActionType] = useState('whatsapp');
  const [outcome, setOutcome] = useState('contacted');
  const [notes, setNotes] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Venta Cerrada (WON) state
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    if (lead?.project_id) {
      fetchProjectPlans(lead.project_id).then(data => {
        setPlans(data || []);
        if (data && data.length > 0) setSelectedPlanId(data[0].id);
      }).catch(console.error);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    if (outcome === 'won' && !selectedPlanId) {
      return alert('Debes seleccionar un Plan de Facturación para cerrar la venta.');
    }
    setSaving(true);
    await onSave(lead.id, actionType, outcome, notes, nextContactDate || null, selectedPlanId || null, promoCode || null);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3>Registrar Interacción</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="lead-subtitle">Lead: <strong>{lead.name}</strong> ({lead.company || 'Sin empresa'})</p>
          
          <div className="form-group">
             <label>¿Por dónde lo contactaste?</label>
             <div className="action-types">
               <button type="button" className={`btn-type ${actionType === 'whatsapp' ? 'active' : ''}`} onClick={() => setActionType('whatsapp')}><MessageCircle size={18}/> WP</button>
               <button type="button" className={`btn-type ${actionType === 'call' ? 'active' : ''}`} onClick={() => setActionType('call')}><PhoneCall size={18}/> Llama</button>
               <button type="button" className={`btn-type ${actionType === 'email' ? 'active' : ''}`} onClick={() => setActionType('email')}><Mail size={18}/> Email</button>
             </div>
          </div>

          <div className="form-group">
             <label>¿Cómo fue el contacto?</label>
             <select className="form-control" value={outcome} onChange={e => setOutcome(e.target.value)}>
                <option value="contacted">Positivo / Avanza</option>
                <option value="busy">Ocupado / Pidió llamar luego</option>
                <option value="no_answer">No Contesta / Ignorado</option>
                <option value="lost">No Interesado (Perdido)</option>
                <option value="won">🎉 ¡VENTA CERRADA! (WON)</option>
             </select>
          </div>

          {outcome === 'won' && (
            <div className="won-panel animate-slide-up" style={{background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 16, borderRadius: 12, marginBottom: 16}}>
               <h4 style={{color: '#4ade80', marginBottom: 12}}>Configuración de Cobro</h4>
               
               <div style={{marginBottom: 12}}>
                 <label className="text-sm">Plan Vendido</label>
                 {plans.length === 0 ? (
                   <div className="text-xs text-muted" style={{marginTop: 4}}>⚠️ El Admin no ha cargado planes para este proyecto.</div>
                 ) : (
                   <select className="form-control mt-1" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                     {plans.map(p => (
                       <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toLocaleString()} ({p.billing_cycle})</option>
                     ))}
                   </select>
                 )}
               </div>

               <div>
                 <label className="text-sm" style={{display: 'flex', alignItems: 'center', gap: 6}}><Tag size={14}/> Código Promocional (Opcional)</label>
                 <input type="text" className="form-control mt-1" placeholder="Ej: DESC20" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
               </div>
            </div>
          )}

          {outcome !== 'lost' && (
             <div className="form-group">
               <label><Calendar size={14} style={{display:'inline', marginRight:4}}/> Próximo Contacto (Follow-up)</label>
               <input type="datetime-local" className="form-control" value={nextContactDate} onChange={e => setNextContactDate(e.target.value)} />
             </div>
          )}

          <div className="form-group">
             <label>Registro / Notas</label>
             <textarea className="form-control" rows="3" placeholder="Ej: Le gustó la demo pero tiene que hablarlo con su socio..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
           <button className="btn btn-glass" onClick={onClose}>Cancelar</button>
           <button className="btn btn-success" onClick={handleSave} disabled={saving}>
             <CheckCircle size={18}/> {saving ? 'Guardando...' : 'Guardar Registro'}
           </button>
        </div>
      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; }
        @media(min-width: 768px) { .modal-overlay { align-items: center; } .modal-content { border-radius: 24px !important; } }
        .modal-content { width: 100%; max-width: 500px; padding: 24px; border-radius: 24px 24px 0 0; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .lead-subtitle { font-size: 0.9rem; margin-bottom: 20px; color: var(--text-main); }
        .action-types { display: flex; gap: 8px; }
        .btn-type { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: var(--transition); }
        .btn-type.active { background: var(--accent-light); color: var(--text-main); border-color: var(--accent); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
      `}</style>
    </div>
  );
}
