import { useState, useEffect, useMemo } from 'react';
import { Phone, Search, Home, List, Bell, UserCog, Plus, ChevronDown, ChevronUp, LogOut, Map, MapPin, Navigation, Trash2, Target, X } from 'lucide-react';
import { fetchLeads, fetchUrgentLeads, fetchProjects, createInteraction, updateLeadStatus, createLead as apiCreateLead, deleteLead as apiDeleteLead } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import LeadManagerModal from '../components/LeadManagerModal';
import AddLeadModal from '../components/AddLeadModal';
import { Link } from 'react-router-dom';

export default function SalesDashboard() {
  const { profile, user, signOut, isAdmin } = useAuth();
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [expandedProject, setExpandedProject] = useState(null);
  const [projectSubTab, setProjectSubTab] = useState('outbound');
  const [projectStatusFilter, setProjectStatusFilter] = useState('uncontacted');
  const [searchQuery, setSearchQuery] = useState('');
  const [isToContactExpanded, setIsToContactExpanded] = useState(true);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [dailyGoals, setDailyGoals] = useState(() => JSON.parse(localStorage.getItem(`dailyGoals_${user?.id}`)) || {});
  
  // Custom Modals para evitar bloqueos del navegador
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Routing State
  const [routeZoneFilter, setRouteZoneFilter] = useState('');
  const [routeLeads, setRouteLeads] = useState([]);

  const [allLeads, setAllLeads] = useState([]);
  const [urgentLeads, setUrgentLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [leadsData, projData] = await Promise.all([
        fetchLeads(),
        fetchProjects()
      ]);
      setAllLeads(leadsData || []);
      setProjects(projData || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  }

  // Effect para calcular el "Trabajo por Hacer" en base a la estrategia
  useEffect(() => {
    if (allLeads.length > 0 && projects.length > 0) {
      let computedLeads = [];
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      projects.forEach(proj => {
         const goal = dailyGoals[proj.id] !== undefined ? dailyGoals[proj.id] : 5; // Por defecto 5 leads nuevos
         const projLeads = allLeads.filter(l => l.project_id === proj.id);
         
         // 1. Prioridad Absoluta: Follow-ups agendados para hoy o atrasados
         const followUps = projLeads.filter(l => l.next_contact_date && new Date(l.next_contact_date) <= today && l.status !== 'won' && l.status !== 'lost');
         
         // 2. Leads Nuevos (Sin contactar)
         const uncontacted = projLeads.filter(l => l.status === 'uncontacted');
         const newToContact = goal > 0 ? uncontacted.slice(0, goal) : [];
         
         computedLeads = [...computedLeads, ...followUps, ...newToContact];
      });
      
      // Eliminar duplicados si los hubiera
      const unique = Array.from(new Set(computedLeads.map(l => l.id))).map(id => computedLeads.find(l => l.id === id));
      setUrgentLeads(unique.sort((a,b) => (a.status === 'uncontacted' ? 1 : -1))); // Pone los follow ups primero
    } else if (allLeads.length === 0) {
      setUrgentLeads([]);
    }
  }, [allLeads, projects, dailyGoals]);

  const saveDailyGoals = (newGoals) => {
    setDailyGoals(newGoals);
    localStorage.setItem(`dailyGoals_${user.id}`, JSON.stringify(newGoals));
    setIsStrategyModalOpen(false);
  };

  const handleSaveAction = async (leadId, actionType, outcome, notes, nextDate, dealPlanId, promoCode) => {
    try {
      await createInteraction({
        lead_id: leadId,
        sdr_id: user.id,
        action_type: actionType,
        outcome,
        notes
      });

      let newStatus = 'contacting';
      if (outcome === 'lost') newStatus = 'lost';
      if (outcome === 'won') newStatus = 'won';

      await updateLeadStatus(leadId, newStatus, nextDate || null, { dealPlanId, promoCode });

      await loadData(); // Refrescar
    } catch (err) {
      console.error('Error guardando interacción:', err);
      alert('Error al guardar: ' + err.message);
    }
  };

  const handleDeleteLead = (leadId) => {
    setLeadToDelete(leadId); // Abre el modal de confirmación
  };

  const executeDelete = async () => {
    if (!leadToDelete) return;
    try {
      await apiDeleteLead(leadToDelete);
      if (selectedLead?.id === leadToDelete) setSelectedLead(null);
      await loadData();
    } catch (err) {
      console.error('Error eliminando lead:', err);
      setDeleteError(err.message); // Muestra modal de error de Supabase RLS
    }
    setLeadToDelete(null);
  };

  const handleCreateLead = async (leadData) => {
    try {
      await apiCreateLead(leadData);
      await loadData();
    } catch (err) {
      console.error('Error creando lead:', err);
      alert('Error al crear lead: ' + err.message);
    }
  };

  const generateGoogleMapsRoute = () => {
    if (routeLeads.length === 0) return;

    const getCleanLocation = (lead) => {
       if(!lead.location) return lead.name;
       if(lead.location.startsWith('http')) {
          const m1 = lead.location.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (m1) return `${m1[1]},${m1[2]}`;
          const m2 = lead.location.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          if (m2) return `${m2[1]},${m2[2]}`;
          return lead.name;
       }
       return lead.location;
    };

    if (routeLeads.length === 1) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getCleanLocation(routeLeads[0]))}`, '_blank');
      return;
    }
    
    // El último de la lista es el "destination", los anteriores son "waypoints"
    const destination = getCleanLocation(routeLeads[routeLeads.length - 1]);
    const waypoints = routeLeads.slice(0, routeLeads.length - 1).map(getCleanLocation).join('|');

    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`, '_blank');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
    </div>
  );

  const wonCount = allLeads.filter(l => l.status === 'won').length;

  return (
    <div className="sales-container">
      {/* TAB INICIO */}
      {activeTab === 'home' && (
        <div className="animate-slide-up">
          <header className="sales-header glass-panel">
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=6366f1&color=fff`} alt="User" />
              <div style={{flex: 1}}>
                <h2>Hola, {profile?.full_name?.split(' ')[0] || 'Team'} 👋</h2>
                <p className="text-muted text-sm">Resumen de rendimiento</p>
              </div>
              <button className="btn-icon-glass" onClick={signOut} title="Cerrar Sesión"><LogOut size={18} /></button>
            </div>
            
            <div className="gamification-card">
              <div className="g-stat">
                <span className="g-label">Clientes Activos (WON)</span>
                <span className="g-value text-accent">{wonCount}</span>
              </div>
              <div className="g-progress">
                 <div className="progress-header">
                    <span className="text-sm">Leads Pendientes Hoy</span>
                    <span className="text-sm font-bold">{urgentLeads.length} por contactar</span>
                 </div>
                 <div className="progress-container">
                   <div className="progress-bar" style={{ width: allLeads.length > 0 ? `${(wonCount / allLeads.length) * 100}%` : '0%' }}></div>
                 </div>
              </div>
            </div>
          </header>

          <main className="leads-list">
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
               <h3 style={{display: 'flex', alignItems: 'center', gap: 8, margin: 0}}>
                 <Bell size={18} className="text-warning"/> Trabajo por Hacer
               </h3>
               <button className="btn-sm btn-glass" style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px'}} onClick={() => setIsStrategyModalOpen(true)}>
                 <Target size={14} /> Estrategia
               </button>
             </div>
             
             {urgentLeads.length === 0 && <p className="text-muted text-sm" style={{textAlign:'center', padding: 32}}>🎉 ¡No hay leads asignados hoy en tu estrategia!</p>}
             {urgentLeads.slice(0, 3).map((lead, idx) => (
                <LeadCard key={lead.id} lead={lead} idx={idx} onAction={setSelectedLead} onDelete={handleDeleteLead} />
             ))}
             {urgentLeads.length > 3 && (
               <button className="btn btn-glass" style={{width: '100%'}} onClick={() => setActiveTab('to_contact')}>
                  Ver todos los pendientes ({urgentLeads.length})
               </button>
             )}
          </main>
        </div>
      )}

      {/* TAB PROYECTOS */}
      {activeTab === 'projects' && (
         <div className="animate-slide-up">
            <header className="page-header">
              <h2>Cuentas / Proyectos</h2>
              <p className="text-muted text-sm">Desglosado en Inbound/Outbound</p>
            </header>

            {projects.length === 0 && <p className="text-muted text-sm" style={{textAlign:'center', padding:40}}>No tenés proyectos asignados aún. Pedile al Admin.</p>}

            <div className="projects-accordion">
              {projects.map(proj => {
                 const isExpanded = expandedProject === proj.id;
                 const projLeads = allLeads.filter(l => l.project_id === proj.id);
                 const inboundCount = projLeads.filter(l => l.source === 'inbound').length;
                 const outboundCount = projLeads.filter(l => l.source === 'outbound').length;
                 
                 return (
                   <div key={proj.id} className="glass-panel" style={{marginBottom: 16, overflow: 'hidden'}}>
                      <div className="accordion-header" onClick={() => setExpandedProject(isExpanded ? null : proj.id)}>
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

                           <div className="sub-tabs" style={{marginBottom: 16}}>
                              <button className={`sub-tab ${projectSubTab === 'inbound' ? 'active' : ''}`} onClick={() => setProjectSubTab('inbound')}>📥 Inbound ({inboundCount})</button>
                              <button className={`sub-tab ${projectSubTab === 'outbound' ? 'active' : ''}`} onClick={() => setProjectSubTab('outbound')}>📤 Outbound ({outboundCount})</button>
                           </div>

                           <div style={{display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 8, whiteSpace: 'nowrap'}} className="hide-scrollbar">
                             <button className={`btn-sm ${projectStatusFilter === 'all' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none', padding: '6px 12px', borderRadius: 20}} onClick={()=>setProjectStatusFilter('all')}>Todos</button>
                             <button className={`btn-sm ${projectStatusFilter === 'uncontacted' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none', padding: '6px 12px', borderRadius: 20, color: projectStatusFilter === 'uncontacted' ? 'white' : '#fca5a5'}} onClick={()=>setProjectStatusFilter('uncontacted')}>⚠️ Sin Contactar</button>
                             <button className={`btn-sm ${projectStatusFilter === 'contacting' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none', padding: '6px 12px', borderRadius: 20, color: projectStatusFilter === 'contacting' ? 'white' : '#a5b4fc'}} onClick={()=>setProjectStatusFilter('contacting')}>🕒 En Proceso</button>
                             <button className={`btn-sm ${projectStatusFilter === 'won' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none', padding: '6px 12px', borderRadius: 20, color: projectStatusFilter === 'won' ? 'white' : '#86efac'}} onClick={()=>setProjectStatusFilter('won')}>✅ Ganados</button>
                             <button className={`btn-sm ${projectStatusFilter === 'lost' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none', padding: '6px 12px', borderRadius: 20, color: projectStatusFilter === 'lost' ? 'white' : '#d1d5db'}} onClick={()=>setProjectStatusFilter('lost')}>❌ Perdidos</button>
                           </div>

                           <div style={{marginTop: 8}}>
                             {projLeads.filter(l => l.source === projectSubTab)
                               .filter(l => projectStatusFilter === 'all' || l.status === projectStatusFilter)
                               .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.company || '').toLowerCase().includes(searchQuery.toLowerCase()))
                               .slice(0, 50) /* Mostrar max 50 para rendimiento en movil */
                               .map((lead, idx) => (
                               <LeadCard key={lead.id} lead={lead} idx={idx} onAction={setSelectedLead} onDelete={handleDeleteLead} />
                             ))}
                             
                             {projLeads.filter(l => l.source === projectSubTab).filter(l => projectStatusFilter === 'all' || l.status === projectStatusFilter).length > 50 && (
                                <p className="text-muted text-sm text-center" style={{padding: '12px 0'}}>Mostrando 50 resultados. Usa el buscador para encontrar más.</p>
                             )}

                             {projLeads.filter(l => l.source === projectSubTab).filter(l => projectStatusFilter === 'all' || l.status === projectStatusFilter).length === 0 && (
                                <p className="text-muted text-sm text-center" style={{padding: '24px 0'}}>No hay leads en este estado/filtro.</p>
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

       {/* TAB A CONTACTAR */}
      {activeTab === 'to_contact' && (
         <div className="animate-slide-up">
            <header className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2>A Contactar Hoy</h2>
                <p className="text-muted text-sm">Tu trabajo por hacer simultáneo</p>
              </div>
              <button className="btn-icon-glass" onClick={() => setIsStrategyModalOpen(true)}>
                <Target size={18} className="text-accent" />
              </button>
            </header>

            <main className="leads-list">
               <div className="glass-panel" style={{marginBottom: 16, overflow: 'hidden'}}>
                  <div className="accordion-header" onClick={() => setIsToContactExpanded(!isToContactExpanded)}>
                     <div>
                        <h3 style={{fontSize: '1.05rem', color: 'white', display: 'flex', alignItems: 'center', gap: 6}}>
                          <Target size={16} className="text-accent"/> Estrategia a Seguir
                        </h3>
                        <p className="text-xs text-muted">{urgentLeads.length} leads en tu lote actual</p>
                     </div>
                     {isToContactExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  
                  {isToContactExpanded && (
                     <div className="accordion-body" style={{paddingTop: 16}}>
                        {urgentLeads.length === 0 && <p className="text-muted text-sm" style={{textAlign:'center', padding: 24}}>🎉 ¡Todo al día!</p>}
                        {urgentLeads.map((lead, idx) => (
                           <LeadCard key={lead.id} lead={lead} idx={idx} onAction={setSelectedLead} onDelete={handleDeleteLead} />
                        ))}
                     </div>
                  )}
               </div>
            </main>
         </div>
      )}

      {/* TAB RECORRIDO (RUTAS MAPPING) */}
      {activeTab === 'routing' && (
         <div className="animate-slide-up">
            <header className="page-header">
              <h2>Recorrido Presencial</h2>
              <p className="text-muted text-sm">Armá tu itinerario para visitar</p>
            </header>

            <main className="leads-list">
               {/* Zona Builder */}
               <div className="glass-panel" style={{marginBottom: 16, padding: 16}}>
                  <h3 style={{fontSize: '1.1rem', marginBottom: 12}}>Armar Ruta</h3>
                  <div className="search-box" style={{marginBottom: 16}}>
                    <MapPin size={16} className="text-muted" />
                    <input type="text" placeholder="Filtrar por Zona (Ej: Palermo)..." value={routeZoneFilter} onChange={(e)=>setRouteZoneFilter(e.target.value)} />
                  </div>

                  {routeZoneFilter.length > 2 && (
                    <div style={{maxHeight: 250, overflowY: 'auto', background: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8}} className="hide-scrollbar">
                      {allLeads.filter(l => l.location && l.location.toLowerCase().includes(routeZoneFilter.toLowerCase()) && !routeLeads.find(rl => rl.id === l.id)).map(lead => (
                        <div key={lead.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                           <div>
                             <p className="text-sm" style={{color:'white', margin:0, fontWeight:600}}>{lead.name}</p>
                             <p className="text-xs text-muted" style={{margin:0}}>{lead.location}</p>
                           </div>
                           <button className="btn-sm btn-primary" style={{border:'none', borderRadius:20, padding:'4px 12px'}} onClick={() => setRouteLeads([...routeLeads, lead])}>+ Añadir</button>
                        </div>
                      ))}
                      {allLeads.filter(l => l.location && l.location.toLowerCase().includes(routeZoneFilter.toLowerCase())).length === 0 && (
                        <p className="text-muted text-xs text-center" style={{padding: '12px 0'}}>No hay leads en esta zona.</p>
                      )}
                    </div>
                  )}
               </div>

               {/* Ruta Actual */}
               <div className="glass-panel" style={{padding: 16}}>
                  <h3 style={{fontSize: '1.1rem', marginBottom: 12, display:'flex', justifyContent:'space-between'}}>
                    <span>Mi Itinerario</span>
                    <span className="text-accent">{routeLeads.length} paradas</span>
                  </h3>
                  
                  {routeLeads.length === 0 ? (
                    <div className="text-center text-muted" style={{padding: '24px 0'}}>
                       <Navigation size={32} style={{margin: '0 auto 12px auto', opacity: 0.3}} />
                       <p className="text-sm">Buscá una zona arriba y añadí locales a tu ruta.</p>
                    </div>
                  ) : (
                    <>
                      <div className="timeline" style={{marginBottom: 20}}>
                        {routeLeads.map((lead, idx) => (
                           <div key={lead.id} style={{display: 'flex', gap: 12, marginBottom: 16}}>
                              <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'}}>{idx + 1}</div>
                              <div style={{flex: 1}}>
                                 <p style={{margin: 0, fontWeight: 600, color: 'white'}} onClick={() => setSelectedLead(lead)}>{lead.name}</p>
                                 <p className="text-xs text-muted" style={{margin: 0}}>{lead.location}</p>
                              </div>
                              <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => setRouteLeads(routeLeads.filter(l => l.id !== lead.id))}>✖</button>
                           </div>
                        ))}
                      </div>
                      
                      <button className="btn btn-success" style={{width: '100%', padding: 14}} onClick={generateGoogleMapsRoute}>
                         <Map size={18} /> INICIAR NAVEGACIÓN
                      </button>
                    </>
                  )}
               </div>
            </main>
         </div>
      )}

      {/* FAB */}
      <button className="fab-add" onClick={() => setIsAddingLead(true)}><Plus size={24} /></button>

      {/* Bottom Nav */}
      <nav className="bottom-nav glass-panel">
        <div className={`b-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><Home size={20} /><span>Inicio</span></div>
        <div className={`b-nav-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}><List size={20} /><span>Proyectos</span></div>
        <div className={`b-nav-item ${activeTab === 'to_contact' ? 'active' : ''}`} onClick={() => setActiveTab('to_contact')}><Bell size={20} /><span>Contactar</span></div>
        <div className={`b-nav-item ${activeTab === 'routing' ? 'active' : ''}`} onClick={() => setActiveTab('routing')}><Map size={20} /><span>Ruta</span></div>
        {isAdmin && <Link to="/admin" className="b-nav-item"><UserCog size={20} /><span>Admin</span></Link>}
      </nav>

      {selectedLead && <LeadManagerModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSaveInteraction={handleSaveAction} onDelete={handleDeleteLead} />}
      {isAddingLead && <AddLeadModal projects={projects} onClose={() => setIsAddingLead(false)} onSave={handleCreateLead} />}
      
      {isStrategyModalOpen && (
        <StrategyModal 
          projects={projects} 
          currentGoals={dailyGoals} 
          onSave={saveDailyGoals} 
          onClose={() => setIsStrategyModalOpen(false)} 
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      {leadToDelete && (
        <div className="modal-overlay" style={{zIndex: 9999, alignItems: 'center'}}>
          <div className="modal-content glass-panel animate-slide-up" style={{maxWidth: 320, padding: '32px 24px', textAlign: 'center', borderRadius: 24, margin: '0 auto'}}>
            <Trash2 size={48} className="text-danger" style={{margin: '0 auto 16px auto', opacity: 0.8}} />
            <h3 style={{color: 'white', marginBottom: 8}}>¿Estás seguro?</h3>
            <p className="text-sm text-muted" style={{marginBottom: 24}}>Esta acción eliminará el lead permanentemente de la base de datos. No se puede deshacer.</p>
            <div style={{display: 'flex', gap: 12}}>
              <button className="btn btn-glass" style={{flex: 1}} onClick={() => setLeadToDelete(null)}>Cancelar</button>
              <button className="btn" style={{flex: 1, background: 'var(--danger)', color: 'white'}} onClick={executeDelete}>Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ERROR DE PERMISOS RLS */}
      {deleteError && (
        <div className="modal-overlay" style={{zIndex: 9999, alignItems: 'center'}}>
          <div className="modal-content glass-panel animate-slide-up" style={{maxWidth: 350, padding: '32px 24px', textAlign: 'center', borderRadius: 24, margin: '0 auto', border: '2px solid rgba(239, 68, 68, 0.4)'}}>
            <h3 style={{color: '#fca5a5', marginBottom: 12}}>Acceso Denegado por Supabase</h3>
            <p className="text-sm" style={{color: 'white', marginBottom: 24}}>{deleteError}</p>
            <button className="btn btn-glass" style={{width: '100%'}} onClick={() => setDeleteError(null)}>Entendido</button>
          </div>
        </div>
      )}

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
        .sub-tabs { display: flex; gap: 8px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px; }
        .sub-tab { flex: 1; padding: 8px; text-align: center; border-radius: 8px; border: none; background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .sub-tab.active { background: var(--accent); color: white; box-shadow: var(--glass-shadow); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .text-center { text-align: center; }
        .mt-1 { margin-top: 4px; }
        .btn-block { width: 100%; padding: 14px; font-size: 0.95rem; }
        .fab-add { position: fixed; bottom: 100px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: white; border: none; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; z-index: 99; }
        .fab-add:active { transform: scale(0.9); }
        @media(min-width: 600px) { .fab-add { right: calc(50% - 300px + 20px); } }
        .bottom-nav { position: fixed; bottom: 16px; left: 16px; right: 16px; display: flex; justify-content: space-around; align-items: center; padding: 12px; border-radius: 20px; z-index: 100; }
        @media(min-width: 600px) { .bottom-nav { max-width: 568px; left: 50%; transform: translateX(-50%); } }
        .b-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-muted); text-decoration: none; font-size: 0.75rem; font-weight: 500; transition: var(--transition); cursor: pointer; }
        .b-nav-item.active, .b-nav-item:hover { color: var(--accent); }
        .btn-icon-glass { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-main); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 8px; cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function LeadCard({ lead, idx, onAction, onDelete }) {
  return (
    <div className={`glass-panel animate-slide-up`} style={{ animationDelay: `${idx * 0.05}s`, cursor: 'pointer', padding: '16px', background: 'rgba(0,0,0,0.22)', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => onAction(lead)}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{flex: 1, paddingRight: 10}}>
             <h4 style={{fontSize: '1.05rem', margin: 0, color: 'white'}}>{lead.name}</h4>
             {lead.company && lead.company !== lead.name && <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4}}>{lead.company}</p>}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
             {lead.status === 'uncontacted' ? (
                <span className="badge" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5'}}>⚠️ Sin Contactar</span>
             ) : lead.status === 'won' ? (
                <span className="badge" style={{background: 'rgba(34, 197, 94, 0.15)', color: '#86efac'}}>✅ Ganado</span>
             ) : lead.status === 'lost' ? (
                <span className="badge" style={{background: 'rgba(255, 255, 255, 0.1)', color: '#d1d5db'}}>❌ Perdido</span>
             ) : (
                <span className="badge" style={{background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc'}}>🕒 En Proceso</span>
             )}
             
             {onDelete && (
                <button 
                  style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4}} 
                  onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
                >
                  <Trash2 size={16} />
                </button>
             )}
          </div>
       </div>
    </div>
   );
}

function StrategyModal({ projects, currentGoals, onSave, onClose }) {
  const [goals, setGoals] = useState(currentGoals || {});

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up" style={{paddingBottom: 48}}>
        <div className="modal-header">
          <div>
            <h3 style={{color: 'var(--text-main)'}}>Estrategia Diaria</h3>
            <p className="text-sm text-muted">¿Cuántos leads visualizar hoy por proyecto?</p>
          </div>
          <button style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4}} onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
           <div style={{background: 'rgba(99, 102, 241, 0.15)', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid rgba(99, 102, 241, 0.3)'}}>
              <p className="text-xs" style={{color: 'var(--text-main)', margin: 0, lineHeight: 1.4, fontWeight: 500}}>
                💡 Los leads agendados previamente (Follow-ups) y los que están "En Proceso" aparecerán <strong>SIEMPRE de prioridad</strong> en tu lista diaria. <br/><br/>
                El número de abajo definirá <strong>a cuántos leads SIN CONTACTAR (Nuevos) querés agregar a tu lote de trabajo hoy</strong> para trabajar en simultáneo.
              </p>
           </div>
           
           {projects.length === 0 && <p className="text-muted text-sm text-center">No tenés proyectos asignados.</p>}
           
           {projects.map(proj => (
             <div key={proj.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 12, marginBottom: 8}}>
                <span style={{fontWeight: 600, color: 'white'}}>{proj.name}</span>
                <input 
                  type="number" 
                  min="0"
                  max="200"
                  className="form-control" 
                  style={{width: 80, textAlign: 'center', padding: '6px 8px'}} 
                  value={goals[proj.id] !== undefined ? goals[proj.id] : 5} 
                  onChange={e => setGoals({...goals, [proj.id]: parseInt(e.target.value) || 0})} 
                />
             </div>
           ))}
        </div>
        <div className="modal-footer" style={{marginTop: 20}}>
           <button className="btn btn-glass" onClick={onClose} style={{width: '100%', marginBottom: 8}}>Cancelar</button>
           <button className="btn btn-primary" onClick={() => onSave(goals)} style={{width: '100%'}}>Guardar Estrategia</button>
        </div>
      </div>
    </div>
  );
}
