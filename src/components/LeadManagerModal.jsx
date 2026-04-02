import { useState, useEffect } from 'react';
import { X, PhoneCall, MessageCircle, Mail, MapPin, Calendar, CheckCircle, Tag, Clock, User, Briefcase, Globe, Trash2 } from 'lucide-react';
import { fetchInteractionsForLead, fetchProjectPlans } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LeadManagerModal({ lead, onClose, onSaveInteraction, onDelete }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'history'
  
  // Log State
  const [actionType, setActionType] = useState('whatsapp');
  const [outcome, setOutcome] = useState('contacted');
  const [notes, setNotes] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Won State
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [promoCode, setPromoCode] = useState('');

  // History State
  const [interactions, setInteractions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (lead?.project_id) {
      fetchProjectPlans(lead.project_id).then(data => {
        setPlans(data || []);
        if (data && data.length > 0) setSelectedPlanId(data[0].id);
      }).catch(console.error);
    }
    
    if (lead?.id) {
      fetchInteractionsForLead(lead.id).then(data => {
        setInteractions(data || []);
        setLoadingHistory(false);
      }).catch(err => {
        console.error(err);
        setLoadingHistory(false);
      });
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    if (outcome === 'won' && !selectedPlanId) {
      return alert('Debes seleccionar un Plan de Facturación para cerrar la venta.');
    }
    setSaving(true);
    await onSaveInteraction(lead.id, actionType, outcome, notes, nextContactDate || null, selectedPlanId || null, promoCode || null);
    setSaving(false);
    onClose();
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'whatsapp': return <MessageCircle size={16} />;
      case 'call': return <PhoneCall size={16} />;
      case 'email': return <Mail size={16} />;
      case 'in_person': return <MapPin size={16} />;
      default: return <User size={16} />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up" style={{maxWidth: 600}}>
        <div className="modal-header">
          <div>
            <h3>Gestión de Lead</h3>
            <p className="text-sm text-accent">{lead.name}</p>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            {onDelete && (
               <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => onDelete(lead.id)}>
                 <Trash2 size={20} />
               </button>
            )}
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div style={{marginBottom: 20, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12}}>
          {lead.company && <p className="text-sm text-muted" style={{marginBottom: 12}}><Briefcase size={14} style={{display:'inline', marginRight:4}}/> {lead.company}</p>}
          
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {lead.phone && (
              <>
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{background: '#25D366', color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600}}>
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={`tel:${lead.phone}`} style={{background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)'}}>
                  <PhoneCall size={16} /> Llamar
                </a>
              </>
            )}
            {lead.location && (
              <a href={lead.location.startsWith('http') ? lead.location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.location)}`} target="_blank" rel="noreferrer" style={{background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)'}}>
                <MapPin size={16} /> Ver en Mapa
              </a>
            )}
            {lead.website && (
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" style={{background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)'}}>
                <Globe size={16} /> Sitio Web
              </a>
            )}
            {!lead.phone && !lead.location && !lead.website && (
              <span className="text-muted text-sm" style={{fontStyle:'italic'}}>No hay datos de contacto enriquecidos.</span>
            )}
          </div>
        </div>

        <div style={{display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12}}>
          <button className={`btn-tab ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>Registrar Acción</button>
          <button className={`btn-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Historial ({interactions.length})</button>
        </div>

        {activeTab === 'log' && (
          <div className="modal-body">
            <div className="form-group">
               <label>¿Por dónde lo contactaste?</label>
               <div className="action-types">
                 <button type="button" className={`btn-type ${actionType === 'whatsapp' ? 'active' : ''}`} onClick={() => setActionType('whatsapp')}><MessageCircle size={18}/> WApp</button>
                 <button type="button" className={`btn-type ${actionType === 'call' ? 'active' : ''}`} onClick={() => setActionType('call')}><PhoneCall size={18}/> Llama</button>
                 <button type="button" className={`btn-type ${actionType === 'email' ? 'active' : ''}`} onClick={() => setActionType('email')}><Mail size={18}/> Email</button>
                 <button type="button" className={`btn-type ${actionType === 'in_person' ? 'active' : ''}`} onClick={() => setActionType('in_person')}><MapPin size={18}/> Presencial</button>
               </div>
               
               {/* DYNAMIC HELPER PANEL */}
               {actionType === 'whatsapp' && (
                 <div style={{marginTop: 12, padding: 12, background: 'rgba(37, 211, 102, 0.1)', borderRadius: 8, border: '1px solid rgba(37, 211, 102, 0.2)'}}>
                    {lead.phone ? (
                       <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{color: '#4ade80', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem'}}><MessageCircle size={16}/> Abrir Chat de WhatsApp ahora</a>
                    ) : (
                       <p className="text-sm" style={{margin: 0, color: '#fca5a5'}}>⚠️ No hay celular registrado para WhatsApp.</p>
                    )}
                 </div>
               )}

               {actionType === 'call' && (
                 <div style={{marginTop: 12, padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)'}}>
                    {lead.phone ? (
                       <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} style={{color: '#fff', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem'}}><PhoneCall size={16}/> Llamar ahora ({lead.phone})</a>
                    ) : (
                       <p className="text-sm" style={{margin: 0, color: '#fca5a5'}}>⚠️ No hay teléfono registrado para llamar.</p>
                    )}
                 </div>
               )}

               {actionType === 'in_person' && (
                 <div style={{marginTop: 12, padding: 12, background: 'rgba(99, 102, 241, 0.15)', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.3)'}}>
                    {lead.location ? (
                       <a href={lead.location.startsWith('http') ? lead.location : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.location)}`} target="_blank" rel="noreferrer" style={{color: '#a5b4fc', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem'}}><MapPin size={16}/> Ver Ubicación en Maps para ir</a>
                    ) : (
                       <p className="text-sm" style={{margin: 0, color: '#fca5a5'}}>⚠️ No hay dirección registrada para visitar o buscar en el mapa.</p>
                    )}
                 </div>
               )}
            </div>

            <div className="form-group">
               <label>¿Qué sucedió?</label>
               <select className="form-control" value={outcome} onChange={e => setOutcome(e.target.value)}>
                  <option value="contacted">Positivo / Avanzando</option>
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
                     <div className="text-xs text-muted" style={{marginTop: 4}}>⚠️ No hay planes creados para este proyecto.</div>
                   ) : (
                     <select className="form-control mt-1" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                       {plans.map(p => (
                         <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toLocaleString()} ({p.billing_cycle})</option>
                       ))}
                     </select>
                   )}
                 </div>

                 <div>
                   <label className="text-sm" style={{display: 'flex', alignItems: 'center', gap: 6}}><Tag size={14}/> Código Promocional / Descuento</label>
                   <input type="text" className="form-control mt-1" placeholder="Ej: DESC20" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
                 </div>
              </div>
            )}

            {outcome !== 'lost' && outcome !== 'won' && (
               <div className="form-group">
                 <label><Calendar size={14} style={{display:'inline', marginRight:4}}/> Próximo Contacto (Follow-up)</label>
                 <input type="datetime-local" className="form-control" value={nextContactDate} onChange={e => setNextContactDate(e.target.value)} />
               </div>
            )}

            <div className="form-group">
               <label>Registro / Notas de Cierre</label>
               <textarea className="form-control" rows="3" placeholder="Ej: Fui presencialmente, le gustó la demo, coordinamos para la semana que viene." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="modal-footer">
               <button className="btn btn-glass" onClick={onClose}>Cancelar</button>
               <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                 <CheckCircle size={18}/> {saving ? 'Guardando...' : 'Guardar y Actualizar'}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="modal-body" style={{maxHeight: 400, overflowY: 'auto'}}>
            {loadingHistory ? (
              <p className="text-center text-muted">Cargando historial...</p>
            ) : interactions.length === 0 ? (
              <div className="text-center text-muted" style={{padding: '40px 0'}}>
                 <Clock size={32} style={{margin: '0 auto 16px auto', opacity: 0.5}} />
                 <p>Todavía no hubo interacciones con este lead.</p>
              </div>
            ) : (
              <div className="timeline">
                {interactions.map(int => (
                  <div key={int.id} className="timeline-item" style={{display: 'flex', gap: 16, marginBottom: 20}}>
                    <div className="timeline-icon" style={{width: 32, height: 32, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'}}>
                      {getActionIcon(int.action_type)}
                    </div>
                    <div className="timeline-content" style={{flex: 1, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                         <span className="text-sm font-bold">{int.profiles?.full_name || 'Agente'}</span>
                         <span className="text-xs text-muted">{new Date(int.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{marginBottom: 8}}>
                        <span className={`badge badge-${int.outcome === 'won' ? 'success' : int.outcome === 'lost' ? 'danger' : 'inbound'}`}>{int.outcome.toUpperCase()}</span>
                      </div>
                      <p className="text-sm" style={{color: 'rgba(255,255,255,0.8)'}}>{int.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; }
        @media(min-width: 768px) { .modal-overlay { align-items: center; } .modal-content { border-radius: 24px !important; } }
        .modal-content { width: 100%; padding: 24px; border-radius: 24px 24px 0 0; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .action-types { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-type { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: var(--transition); }
        .btn-type.active { background: var(--accent-light); color: var(--text-main); border-color: var(--accent); }
        .btn-tab { background: transparent; border: none; color: var(--text-muted); padding: 8px 16px; font-weight: 600; cursor: pointer; transition: 0.2s; border-bottom: 2px solid transparent; }
        .btn-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
      `}</style>
    </div>
  );
}
