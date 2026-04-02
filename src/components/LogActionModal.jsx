import { useState } from 'react';
import { X, PhoneCall, MessageCircle, Mail, Calendar, CheckCircle } from 'lucide-react';

export default function LogActionModal({ lead, onClose, onSave }) {
  const [actionType, setActionType] = useState('whatsapp');
  const [outcome, setOutcome] = useState('contacted');
  const [notes, setNotes] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');

  if (!lead) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <div className="modal-header">
          <h3>Registrar Interacción</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="lead-subtitle">Lead: <strong>{lead.name}</strong> ({lead.company})</p>
          
          <div className="form-group">
             <label>¿Por dónde lo contactaste?</label>
             <div className="action-types">
               <button type="button" className={`btn-type ${actionType === 'whatsapp' ? 'active' : ''}`} onClick={() => setActionType('whatsapp')}><MessageCircle size={18}/> WP</button>
               <button type="button" className={`btn-type ${actionType === 'call' ? 'active' : ''}`} onClick={() => setActionType('call')}><PhoneCall size={18}/> Llama</button>
               <button type="button" className={`btn-type ${actionType === 'email' ? 'active' : ''}`} onClick={() => setActionType('email')}><Mail size={18}/> Email</button>
             </div>
          </div>

          <div className="form-group">
             <label>¿Cómo fue el contacto? (Efectividad)</label>
             <select className="form-control" value={outcome} onChange={e => setOutcome(e.target.value)}>
                <option value="contacted">Positivo / Avanza</option>
                <option value="busy">Ocupado / Pidió llamar luego</option>
                <option value="no_answer">No Contesta / Ignorado</option>
                <option value="lost">No Interesado (Perdido)</option>
             </select>
          </div>

          {outcome !== 'lost' && (
             <div className="form-group">
               <label><Calendar size={14} style={{display:'inline', marginRight:4}}/> Próximo Contacto (Follow-up)</label>
               <input 
                 type="datetime-local" 
                 className="form-control" 
                 value={nextContactDate}
                 onChange={e => setNextContactDate(e.target.value)}
                 required
               />
             </div>
          )}

          <div className="form-group">
             <label>Registro / Notas para la IA</label>
             <textarea 
               className="form-control" 
               rows="3" 
               placeholder="Ej: Le gustó la demo pero tiene que hablarlo con su socio. Llamar la semana próxima."
               value={notes}
               onChange={e => setNotes(e.target.value)}
             />
          </div>
        </div>

        <div className="modal-footer">
           <button className="btn btn-glass" onClick={onClose}>Cancelar</button>
           <button className="btn btn-success" onClick={() => { onSave(); onClose(); }}><CheckCircle size={18}/> Guardar Registro</button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center; z-index: 1000;
        }
        @media(min-width: 768px) {
          .modal-overlay { align-items: center; }
          .modal-content { border-radius: 24px !important; }
        }
        .modal-content {
          width: 100%; max-width: 500px; padding: 24px; border-radius: 24px 24px 0 0;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .lead-subtitle { font-size: 0.9rem; margin-bottom: 20px; color: var(--text-main); }
        .action-types { display: flex; gap: 8px; }
        .btn-type {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px;
          color: var(--text-muted); cursor: pointer; transition: var(--transition);
        }
        .btn-type.active { background: var(--accent-light); color: var(--text-main); border-color: var(--accent); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
      `}</style>
    </div>
  );
}
