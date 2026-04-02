import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { mockProjects } from '../data/mockData';

export default function AddLeadModal({ onClose }) {
  // En fase mock, no guardamos real, solo cerramos
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
             <input type="text" className="form-control" placeholder="Ej: Marcos Silva" />
          </div>

          <div className="form-group">
             <label>Asignar a Proyecto (Tenant)</label>
             <select className="form-control">
                <option value="">-- Selecciona Cliente --</option>
                {mockProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
             </select>
          </div>

          <div className="form-group">
             <label>Canal Origen</label>
             <select className="form-control">
                <option value="presencial">Presencial / Calles</option>
                <option value="instagram">Instagram (DM)</option>
                <option value="linkedin">LinkedIn</option>
                <option value="cold_call">Cold Call (Tel)</option>
             </select>
          </div>

        </div>

        <div className="modal-footer">
           <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={onClose}>
              Guardar en Base de Datos
           </button>
        </div>
      </div>

      {/* Reutilizamos el estilo del LogActionModal o agregamos extras */}
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
          width: 100%; max-width: 500px; padding: 24px;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
      `}</style>
    </div>
  );
}
