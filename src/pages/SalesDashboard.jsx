import { useState } from 'react';
import { Phone, Search, Filter, Home, List, Bell, UserCog, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { mockLeads, mockStats, mockProjects } from '../data/mockData';
import LogActionModal from '../components/LogActionModal';
import AddLeadModal from '../components/AddLeadModal';
import { Link } from 'react-router-dom';

export default function SalesDashboard() {
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); 
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectSubTab, setProjectSubTab] = useState('inbound'); // Filtro por defecto dentro del acordeón
  const [searchQuery, setSearchQuery] = useState('');
  const [isToContactExpanded, setIsToContactExpanded] = useState(true);

  const currentLeads = mockLeads.filter(l => new Date(l.nextContactDate) <= new Date('2026-04-03T00:00:00Z')); 

  const handleActionClick = (lead) => setSelectedLead(lead);
  const handleSaveAction = () => alert('Log de interacción guardado. Follow-up agendado y racha sumada.');

  return (
    <div className="sales-container">
      {/* TAB INICIO */}
      {activeTab === 'home' && (
        <div className="animate-slide-up">
          <header className="sales-header glass-panel">
            <div className="user-info">
              <img src="https://ui-avatars.com/api/?name=Clau&background=6366f1&color=fff" alt="User" />
              <div>
                <h2>Hola, Clau 👋</h2>
                <p className="text-muted text-sm">Resumen de rendimiento</p>
              </div>
            </div>
            
            <div className="gamification-card">
              <div className="g-stat">
                <span className="g-label">Ganancia Proyectada (MES)</span>
                <span className="g-value text-accent">${mockStats.projectedEarnings}</span>
              </div>
              <div className="g-progress">
                 <div className="progress-header">
                    <span className="text-sm">Objetivo Mensual Activos</span>
                    <span className="text-sm font-bold">14 / 20 leads</span>
                 </div>
                 <div className="progress-container">
                   <div className="progress-bar" style={{ width: `70%` }}></div>
                 </div>
              </div>
            </div>
          </header>

          <main className="leads-list">
             <h3 style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
               <Bell size={18} className="text-warning"/> Próximos Contactos
             </h3>
             {currentLeads.slice(0, 2).map((lead, idx) => (
                <LeadCard key={lead.id} lead={lead} idx={idx} onAction={handleActionClick} />
             ))}
             <button className="btn btn-glass" style={{width: '100%'}} onClick={() => setActiveTab('to_contact')}>
                Ver todos los pendientes
             </button>
          </main>
        </div>
      )}

      {/* TAB PROYECTOS (Acordeón y Filtros Inbound/Outbound) */}
      {activeTab === 'projects' && (
         <div className="animate-slide-up">
            <header className="page-header">
              <h2>Cuentas / Proyectos</h2>
              <p className="text-muted text-sm">Desglosado en Inbound/Outbound</p>
            </header>

            <div className="projects-accordion">
              {mockProjects.map(proj => {
                 const isExpanded = expandedProject === proj.id;
                 const projLeads = mockLeads.filter(l => l.projectId === proj.id);
                 const inboundCount = projLeads.filter(l => l.source === 'inbound').length;
                 const outboundCount = projLeads.filter(l => l.source === 'outbound').length;
                 
                 return (
                   <div key={proj.id} className="glass-panel" style={{marginBottom: 16, overflow: 'hidden'}}>
                      <div 
                         className="accordion-header" 
                         onClick={() => setExpandedProject(isExpanded ? null : proj.id)}
                      >
                         <div>
                            <h3 style={{fontSize: '1.1rem', color: 'white'}}>{proj.name}</h3>
                            <p className="text-xs text-muted">{projLeads.length} prospectos • {inboundCount} IN / {outboundCount} OUT</p>
                         </div>
                         {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {isExpanded && (
                        <div className="accordion-body">
                           <div className="search-box" style={{marginBottom: 16}}>
                             <Search size={16} className="text-muted" />
                             <input type="text" placeholder="Buscar empresa, persona..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                           </div>

                           <div className="sub-tabs">
                              <button className={`sub-tab ${projectSubTab === 'inbound' ? 'active' : ''}`} onClick={() => setProjectSubTab('inbound')}>
                                📥 Inbound ({inboundCount})
                              </button>
                              <button className={`sub-tab ${projectSubTab === 'outbound' ? 'active' : ''}`} onClick={() => setProjectSubTab('outbound')}>
                                📤 Outbound ({outboundCount})
                              </button>
                           </div>

                           <div style={{marginTop: 16}}>
                             {projLeads.filter(l => l.source === projectSubTab)
                               .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.company.toLowerCase().includes(searchQuery.toLowerCase()))
                               .map((lead, idx) => (
                               <LeadCard key={lead.id} lead={lead} idx={idx} onAction={handleActionClick} compact />
                             ))}
                             {projLeads.filter(l => l.source === projectSubTab).length === 0 && (
                                <p className="text-muted text-sm text-center" style={{padding: '24px 0'}}>
                                  No hay leads {projectSubTab} para este proyecto.
                                </p>
                             )}
                           </div>
                        </div>
                      )}
                   </div>
                 );
              })}
            </div>
         </div>
      )}

      {/* TAB A CONTACTAR (Acordes de Urgencia y Barras de progreso) */}
      {activeTab === 'to_contact' && (
         <div className="animate-slide-up">
            <header className="page-header">
              <h2>A Contactar Hoy</h2>
              <p className="text-muted text-sm">No dejes que se enfríen</p>
            </header>

            <main className="leads-list">
               <div className="glass-panel" style={{marginBottom: 16, overflow: 'hidden'}}>
                  <div className="accordion-header" onClick={() => setIsToContactExpanded(!isToContactExpanded)}>
                     <div>
                        <h3 style={{fontSize: '1.05rem', color: 'white', display: 'flex', alignItems: 'center', gap: 6}}>
                          <Bell size={16} className="text-warning"/> Prioridades Inmediatas
                        </h3>
                        <p className="text-xs text-muted">Prospectos que debes tocar hoy</p>
                     </div>
                     {isToContactExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  
                  <div style={{padding: '0 20px 16px 20px'}}>
                      <div className="progress-header">
                         <span className="text-xs text-muted">Progreso Diario</span>
                         <span className="text-xs font-bold">2 / {currentLeads.length + 2} Contactados</span>
                      </div>
                      <div className="progress-container" style={{height: 6}}>
                         <div className="progress-bar" style={{width: '20%'}}></div>
                      </div>
                  </div>
                  
                  {isToContactExpanded && (
                     <div className="accordion-body" style={{paddingTop: 16}}>
                        {currentLeads.map((lead, idx) => (
                           <LeadCard key={lead.id} lead={lead} idx={idx} onAction={handleActionClick} compact />
                        ))}
                     </div>
                  )}
               </div>
            </main>
         </div>
      )}

      {/* Floating Action Button */}
      <button className="fab-add" onClick={() => setIsAddingLead(true)}>
         <Plus size={24} />
      </button>

      {/* Navegación Inferior Mobile */}
      <nav className="bottom-nav glass-panel">
        <div className={`b-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span>Inicio</span>
        </div>
        <div className={`b-nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
          <List size={22} />
          <span>Proyectos</span>
        </div>
        <div className={`b-nav-item ${activeTab === 'to_contact' ? 'active' : ''}`} onClick={() => setActiveTab('to_contact')}>
          <Bell size={22} />
          <span>Contactar</span>
        </div>
        <Link to="/admin" className="b-nav-item">
          <UserCog size={22} />
          <span>Admin</span>
        </Link>
      </nav>

      {/* Modals */}
      {selectedLead && <LogActionModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSave={handleSaveAction} />}
      {isAddingLead && <AddLeadModal onClose={() => setIsAddingLead(false)} />}

      <style>{`
        .sales-container { width: 100%; min-height: 100vh; margin: 0 auto; padding: env(safe-area-inset-top, 16px) 16px 120px 16px; }
        @media(min-width: 600px) { .sales-container { max-width: 600px; padding-top: 32px; } }

        .sales-header { padding: 24px 20px; margin-bottom: 24px; }
        .page-header { margin-bottom: 24px; padding: 0 8px; }
        .page-header h2 { font-size: 1.5rem; }
        .user-info { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .user-info img { width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--glass-border); }
        .user-info h2 { font-size: 1.4rem; }
        
        .gamification-card { background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; }
        .g-stat { display: flex; flex-direction: column; margin-bottom: 16px; }
        .g-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;}
        .g-value { font-size: 2.5rem; font-weight: 800; color: var(--success); }
        .progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        
        .search-box { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 0 12px; border-radius: 8px; }
        .search-box input { width: 100%; background: transparent; border: none; color: white; padding: 10px 0; outline: none; }

        .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; cursor: pointer; user-select: none; }
        .accordion-body { padding: 0 20px 20px 20px; border-top: 1px solid var(--glass-border); padding-top: 16px; }

        /* Sub Tabs Inbound/Outbound */
        .sub-tabs { display: flex; gap: 8px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px; }
        .sub-tab { flex: 1; padding: 8px; text-align: center; border-radius: 6px; border: none; background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .sub-tab.active { background: var(--accent); color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

        .lead-card { padding: 20px; margin-bottom: 16px; opacity: 0; }
        .lead-card.compact { padding: 16px; margin-bottom: 12px; background: rgba(0,0,0,0.15); box-shadow: none; border-color: rgba(255,255,255,0.05); }
        .lead-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .lead-project { font-size: 0.85rem; color: var(--accent); font-weight: 600; margin-top: 4px; }
        .text-center { text-align: center; }
        .mt-1 { margin-top: 4px; }
        .mb-3 { margin-bottom: 12px; }
        .btn-block { width: 100%; padding: 14px; font-size: 0.95rem; }

        .fab-add {
          position: fixed; bottom: 100px; right: 20px; width: 56px; height: 56px; border-radius: 50%;
          background: var(--accent); color: white; border: none; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; z-index: 99;
        }
        .fab-add:active { transform: scale(0.9); }
        @media(min-width: 600px) { .fab-add { right: calc(50% - 300px + 20px); } }

        .bottom-nav { position: fixed; bottom: 16px; left: 16px; right: 16px; display: flex; justify-content: space-around; align-items: center; padding: 12px; border-radius: 20px; z-index: 100; }
        @media(min-width: 600px) { .bottom-nav { max-width: 568px; left: 50%; transform: translateX(-50%); } }
        .b-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-muted); text-decoration: none; font-size: 0.75rem; font-weight: 500; transition: var(--transition); cursor: pointer; }
        .b-nav-item.active, .b-nav-item:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}

function LeadCard({ lead, idx, onAction, compact }) {
  return (
    <div className={`lead-card glass-panel animate-slide-up ${compact ? 'compact' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
      <div className="lead-header">
         <div>
            <h4>{lead.name}</h4>
            <p className="lead-project" style={{color: 'var(--text-muted)'}}>{lead.company}</p>
         </div>
         <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
            <span className={`badge badge-${lead.source}`}>{lead.source}</span>
            {!compact && <span className="text-xs text-muted mt-1">{lead.projectName}</span>}
         </div>
      </div>
      
      <div className="lead-actions" style={{display: 'flex', gap: 8}}>
        <button className="btn btn-primary btn-block" onClick={() => onAction(lead)}>
          <Phone size={18} /> Call to Action
        </button>
      </div>
    </div>
  );
}
