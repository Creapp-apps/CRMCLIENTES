import { useState, useEffect } from 'react';
import { Users, BarChart3, Settings, Database, Smartphone, Plus, Upload, ArrowLeft, Search, Trash2, Edit3, MapPin, FileDigit, Menu, X } from 'lucide-react';
import { fetchGlobalStats, fetchTeam, fetchProjects, fetchLeads, bulkCreateLeads, deleteProject, fetchProjectPlans } from '../lib/api';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';

import AddProjectModal from '../components/AddProjectModal';
import EditProjectModal from '../components/EditProjectModal';
import AddSdrModal from '../components/AddSdrModal';
import AssignProjectModal from '../components/AssignProjectModal';
import AddPlanModal from '../components/AddPlanModal';
import LeadManagerModal from '../components/LeadManagerModal';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('metrics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSdr, setSelectedSdr] = useState(null);
  
  // Modals state
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddSdr, setShowAddSdr] = useState(false);
  const [showAssignSdr, setShowAssignSdr] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);

  // Data state
  const [stats, setStats] = useState({ totalLeadsMonth: 0, totalWon: 0, conversionRate: '0', mrr: 0 });
  const [team, setTeam] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectLeads, setProjectLeads] = useState([]); 
  const [projectPlans, setProjectPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Project Detail state
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneQuery, setZoneQuery] = useState('');
  const [uploadingData, setUploadingData] = useState(false);
  const [leadsFilterTab, setLeadsFilterTab] = useState('outbound'); // 'inbound', 'outbound'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'uncontacted', 'contacting', 'won', 'lost'
  
  // Lead Manager State
  const [managerLead, setManagerLead] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, teamData, projsData] = await Promise.all([
        fetchGlobalStats(),
        fetchTeam(),
        fetchProjects()
      ]);
      setStats(statsData);
      setTeam(teamData || []);
      setProjects(projsData || []);
    } catch (err) {
      console.error('Error cargando data Admin:', err);
    }
    setLoading(false);
  }

  const handleViewProject = async (proj) => {
    setSelectedProject(proj);
    setSearchQuery('');
    setProjectLeads([]); 
    setProjectPlans([]);
    setActiveView('project_details');
    
    try {
      const [leads, plans] = await Promise.all([
        fetchLeads(proj.id),
        fetchProjectPlans(proj.id)
      ]);
      setProjectLeads(leads || []);
      setProjectPlans(plans || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshPlans = async () => {
    if(!selectedProject) return;
    const plans = await fetchProjectPlans(selectedProject.id);
    setProjectPlans(plans || []);
  };

  const handleDeleteProject = async (projId) => {
    if (!window.confirm('¿Seguro que deseas ELIMINAR este proyecto y todas sus bases de datos asociadas? Es una acción destructiva e irreversible.')) return;
    try {
      setLoading(true);
      await deleteProject(projId);
      if (selectedProject?.id === projId) setActiveView('projects');
      await loadData();
    } catch (err) {
      alert('Error al eliminar proyecto: ' + err.message);
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const sourceElement = document.querySelector('input[name="leadSource"]:checked');
    const source = sourceElement ? sourceElement.value : 'outbound';
    
    if (!file) return;

    setUploadingData(true);

    // Mapeo Inteligente Basado en Valores (Heurística) para evadir cabeceras corruptas
    Papa.parse(file, {
      header: false, // Forzamos array de arrelgos para no depender de cabeceras sucias
      skipEmptyLines: true,
      complete: async (results) => {
        let data = results.data;
        if (data.length === 0) {
          setUploadingData(false);
          return alert('El CSV está vacío.');
        }

        // Si la primera fila parece ser cabecera, la saltamos
        const firstRowStr = data[0].join(' ').toLowerCase();
        const hasHeader = ['name', 'nombre', 'url', 'phone', 'teléfono', 'address', 'dirección'].some(h => firstRowStr.includes(h));
        if (hasHeader) data.shift();

        const leadsToCreate = data.map(rowCols => {
          // Limpiar comillas basura de los scrapers
          const cleanCols = rowCols.map(c => c ? c.toString().replace(/^"|"$/g, '').trim() : '');

          let finalName = '';
          let finalPhone = '';
          let finalWebsite = '';
          let finalLocation = '';

          cleanCols.forEach(val => {
            if (!val) return;
            const lowerVal = val.toLowerCase();
            if (lowerVal.startsWith('http') || lowerVal.startsWith('www.')) {
              if (lowerVal.includes('google.com/maps')) {
                if (!finalLocation) finalLocation = val; 
              } else {
                if (!finalWebsite) finalWebsite = val;
              }
            } else if (/^[\+0-9\s\-\(\)]+$/.test(val) && val.length >= 6 && val.length < 25) {
              if (!finalPhone) finalPhone = val;
            } else {
              // Asumimos que es texto
              if (!finalName && val.length > 2 && val.length < 150) {
                finalName = val;
              } else if (!finalLocation && val.length > 10) {
                finalLocation = val;
              }
            }
          });

          return {
            project_id: selectedProject.id,
            name: finalName || 'Sin Nombre',
            company: finalName, 
            phone: finalPhone || '',
            website: finalWebsite || '',
            location: finalLocation || '',
            source: source,
            channel: 'base_datos',
            status: 'uncontacted'
          };
        });

        try {
          await bulkCreateLeads(leadsToCreate);
          // Refrescar leads
          const leads = await fetchLeads(selectedProject.id);
          setProjectLeads(leads || []);
          // Seleccionar la tab a la que se acaba de subir para que el usuario las vea
          setLeadsFilterTab(source);
          alert(`${leadsToCreate.length} contactos cargados y filtrados correctamente.`);
        } catch (err) {
          alert('Error impactando la DB: ' + err.message);
        }
        setUploadingData(false);
        e.target.value = null; // reset
      },
      error: (err) => {
        alert('Error Parseando el archivo: ' + err.message);
        setUploadingData(false);
      }
    });
  };

  const filteredProjectLeads = projectLeads.filter(l => {
    // 1. Filtrar por Inbound / Outbound
    if (l.source !== leadsFilterTab) return false;
    
    // 2. Filtrar por Estado
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;

    // 3. Filtrar por Zona (Ubicación)
    if (zoneQuery) {
      if (!l.location || !l.location.toLowerCase().includes(zoneQuery.toLowerCase())) return false;
    }

    // 4. Filtrar por Búsqueda (Nombre/Teléfono/Empresa)
    if (searchQuery) {
      const sq = searchQuery.toLowerCase();
      const matchName = l.name && l.name.toLowerCase().includes(sq);
      const matchCompany = l.company && l.company.toLowerCase().includes(sq);
      const matchPhone = l.phone && l.phone.toLowerCase().includes(sq);
      return matchName || matchCompany || matchPhone;
    }
    return true;
  });

  const activeLeadsCount = projectLeads.filter(l => l.source === leadsFilterTab).length;

  const handleAdminInteraction = async (leadId, actionType, outcome, notes, nextDate, dealPlanId, promoCode) => {
    // Import createInteraction dynamically or ensure it's available from api.js if needed.
    // For simplicity, we can fetch it, but wait! We didn't import createInteraction/updateLeadStatus in AdminDashboard yet!
    // Since AdminDashboard might not have them imported, let's just alert for now, or I'll dynamically import.
    const { createInteraction, updateLeadStatus } = await import('../lib/api.js');
    try {
      await createInteraction({
        lead_id: leadId,
        sdr_id: (await import('../context/AuthContext.jsx')).useAuth?.()?.user?.id || leadId, // fallback if needed
        action_type: actionType,
        outcome,
        notes
      });
      let newStatus = 'contacting';
      if (outcome === 'lost') newStatus = 'lost';
      if (outcome === 'won') newStatus = 'won';
      await updateLeadStatus(leadId, newStatus, nextDate || null, { dealPlanId, promoCode });
      
      const leads = await fetchLeads(selectedProject.id);
      setProjectLeads(leads || []);
    } catch (err) {
      alert('Error guardando: ' + err.message);
    }
  };

  if (loading) return <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center'}}><div className="spinner" style={{width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite'}}></div></div>;

  const navItems = [
    { view: 'metrics', icon: <BarChart3 size={20} />, label: 'Métricas' },
    { view: 'team', icon: <Users size={20} />, label: 'Equipo' },
    { view: 'projects', icon: <Database size={20} />, label: 'Proyectos' },
    { view: 'config', icon: <Settings size={20} />, label: 'Config' },
  ];

  const handleNav = (view) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-container">
      {/* Mobile Top Bar */}
      <div className="admin-topbar">
        <h2 className="admin-logo">CreApp <span>SaaS</span></h2>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-sidebar glass-panel ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="logo-area">
          <h2>CreApp <span>SaaS</span></h2>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <button
              key={item.view}
              className={`nav-item ${(activeView === item.view || (item.view === 'projects' && activeView === 'project_details')) ? 'active' : ''}`}
              onClick={() => handleNav(item.view)}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <Link to="/sales" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setSidebarOpen(false)}>
            <Smartphone size={20} /> Ver App Vendedor
          </Link>
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {navItems.map(item => (
          <button
            key={item.view}
            className={`mobile-nav-item ${(activeView === item.view || (item.view === 'projects' && activeView === 'project_details')) ? 'active' : ''}`}
            onClick={() => handleNav(item.view)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <Link to="/sales" className="mobile-nav-item">
          <Smartphone size={20} />
          <span>Vendedor</span>
        </Link>
      </nav>

      <main className="admin-content">
        
        {/* VIEW: METRICS */}
        {activeView === 'metrics' && (
          <div className="animate-slide-up">
            <header className="admin-header">
              <h1>Métricas Generales</h1>
              <p>Visión global de todos los proyectos conectados a Supabase</p>
            </header>

            <section className="dashboard-grid">
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Total Leads (Mes)</h3>
                  <p className="kpi-value">{stats.totalLeadsMonth}</p>
                  <span className="badge badge-success">Cargados en la BD</span>
               </div>
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Conversión Glob.</h3>
                  <p className="kpi-value">{stats.conversionRate}%</p>
               </div>
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Cierres Totales (WON)</h3>
                  <p className="kpi-value text-accent">{stats.totalWon}</p>
                  <p className="text-sm">En {projects.length} proyectos</p>
               </div>
            </section>
          </div>
        )}

        {/* VIEW: TEAM */}
        {activeView === 'team' && (
          <div className="animate-slide-up">
             <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h1>Equipo de Ventas</h1>
                   <p>Gestión de cerradores, asignación de proyectos</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddSdr(true)}><Plus size={18}/> Nuevo Vendedor</button>
             </header>

             <div className="admin-panel glass-panel">
                <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Vendedor (SDR)</th>
                       <th>Proyectos Asignados</th>
                       <th>Acciones Rápidas</th>
                     </tr>
                   </thead>
                   <tbody>
                     {team.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:30}}>No hay vendedores. Crea el primero.</td></tr>}
                     {team.map(member => (
                       <tr key={member.id}>
                         <td><strong>{member.full_name}</strong><br/><span className="text-xs text-muted">Rol: {member.role.toUpperCase()}</span></td>
                         <td>
                            <div style={{display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8}}>
                               {member.sdr_project_commissions?.map(c => {
                                 return <span key={c.project_id} className="badge badge-inbound">{c.projects?.code}</span>
                               })}
                            </div>
                            <button className="btn btn-glass btn-sm text-xs" onClick={() => { setSelectedSdr(member); setShowAssignSdr(true); }}>+ Asignar a Proyecto</button>
                         </td>
                         <td>
                            <button className="btn btn-glass btn-sm" onClick={() => setActiveView('config')}>Ver Comisiones</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
             </div>
          </div>
        )}

        {/* VIEW: PROJECTS (GRID) */}
        {activeView === 'projects' && (
          <div className="animate-slide-up">
             <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <h1>Bases de Datos de Clientes</h1>
                   <p>Administración Multi-tenant de Proyectos en Supabase</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddProject(true)}><Plus size={18}/> Nuevo Proyecto SaaS</button>
             </header>

             <div className="dashboard-grid">
               {projects.length === 0 && <p className="text-muted" style={{gridColumn: '1 / -1'}}>No hay proyectos en la base de datos. Crea uno.</p>}
               {projects.map(proj => {
                 const projLeads = stats?.totalLeadsMonth ? [] : []; // We need a way to get project lead count, but stats is global. We will assume 0 if not fetched. Or we just show gamification inside the project!
                 return (
                 <div key={proj.id} className="glass-panel" style={{ padding: 20, cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => handleViewProject(proj)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                       <h3 style={{ fontSize: '1.2rem', color: 'white' }}>{proj.name}</h3>
                       <span className={`badge badge-${proj.is_active ? 'success' : 'warning'}`}>{proj.is_active ? 'Activo' : 'Pausado'}</span>
                    </div>
                    <p className="text-sm text-muted mb-3">Cobro: <strong className="text-main" style={{textTransform:'uppercase'}}>{proj.pricing_type}</strong></p>
                    
                    <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                       <button className="btn btn-glass btn-sm" style={{ width: '100%', pointerEvents: 'none' }}>Administrar Proyecto</button>
                    </div>
                 </div>
               )})}
             </div>
          </div>
        )}

        {/* VIEW: PROJECT DETAILS (CSV & LEADS VIEW) */}
        {activeView === 'project_details' && selectedProject && (
           <div className="animate-slide-up">
              <header className="admin-header">
                 <button className="btn-icon mb-3" onClick={() => setActiveView('projects')} style={{display:'flex', alignItems:'center', gap:4, marginBottom: 16}}><ArrowLeft size={16}/> Volver a Proyectos</button>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div>
                       <h1>{selectedProject.name} <span className="text-muted" style={{fontSize:'1rem'}}>({selectedProject.code})</span></h1>
                       <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                          <button className="btn btn-glass btn-sm" onClick={() => setShowEditProject(true)}><Edit3 size={14}/> Editar Proyecto</button>
                          <button className="btn-icon" style={{color: 'var(--danger)', padding: '6px 12px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4}} onClick={() => handleDeleteProject(selectedProject.id)}><Trash2 size={14}/> Eliminar</button>
                       </div>
                    </div>
                 </div>
              </header>

              {/* LISTADO DE PLANES CONFIGURADOS PARA ESTE PROYECTO */}
              <div className="glass-panel" style={{padding: 24, marginBottom: 32}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <div>
                      <h3>Planes de Facturación</h3>
                      <p className="text-sm text-muted mt-1">Estos son los paquetes que el SDR podrá venderle al cliente al cerrar un trato.</p>
                    </div>
                    <button className="btn btn-glass btn-sm" onClick={() => setShowAddPlan(true)}>+ Añadir Plan</button>
                  </div>
                  
                  {projectPlans.length === 0 ? (
                    <div className="text-center text-muted" style={{padding: '20px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8}}>
                      No hay planes pre-cargados. Los vendedores no tendrán qué ofrecer al marcar GANADO.
                    </div>
                  ) : (
                    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                      {projectPlans.map(plan => (
                        <div key={plan.id} style={{background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.2)', minWidth: 200}}>
                          <h4 style={{margin: 0, fontSize: '1rem'}}>{plan.name}</h4>
                          <p className="text-accent" style={{fontSize: '1.2rem', fontWeight: 'bold', margin: '4px 0'}}>${Number(plan.price).toLocaleString()}</p>
                          <p className="text-xs text-muted" style={{textTransform: 'uppercase'}}>{plan.billing_cycle}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* GAMIFICACIÓN Y ESTADO DEL PROYECTO */}
              <div className="glass-panel" style={{padding: 24, marginBottom: 32}}>
                 <h3 style={{marginBottom: 16}}>Rendimiento de Campaña</h3>
                 <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
                    <div style={{width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                       <svg width="80" height="80" style={{position:'absolute', top:-4, left:-4, transform: 'rotate(-90deg)'}}>
                          <circle cx="40" cy="40" r="38" fill="none" stroke="#4ade80" strokeWidth="4" strokeDasharray="238" strokeDashoffset={238 - (238 * (projectLeads.filter(l => l.status === 'won').length / Math.max(1, projectLeads.length)))} style={{transition: '1s ease-out'}} />
                       </svg>
                       <div style={{textAlign: 'center'}}>
                          <span style={{fontSize: '1.2rem', fontWeight: 800, color: 'white'}}>{projectLeads.length > 0 ? Math.round((projectLeads.filter(l => l.status === 'won').length / projectLeads.length) * 100) : 0}%</span>
                       </div>
                    </div>
                    <div style={{flex: 1}}>
                       <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
                          <span className="text-sm text-muted">Progreso de Ventas</span>
                          <span className="text-sm font-bold text-success">{projectLeads.filter(l => l.status === 'won').length} Cerrados / {projectLeads.length} Total</span>
                       </div>
                       <div className="progress-container" style={{background: 'rgba(0,0,0,0.3)', height: 8, borderRadius: 4, overflow: 'hidden'}}>
                          <div className="progress-bar" style={{width: `${projectLeads.length > 0 ? (projectLeads.filter(l => l.status === 'won').length / projectLeads.length) * 100 : 0}%`, background: '#4ade80', height: '100%'}}></div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="glass-panel" style={{padding: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h3>Cargar Prospectos Analíticamente</h3>
                    <p className="text-sm text-muted mt-2">Extrae: Nombre, Ubicación, Teléfono y Website automáticamente.</p>
                  </div>
                  <div style={{display: 'flex', gap: 32, alignItems: 'center'}}>
                      <div style={{display:'flex', gap: 16, alignItems:'center'}}>
                          <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:'0.9rem', color: 'white'}}>
                            <input type="radio" name="leadSource" value="inbound" /> 📥 Inbound
                          </label>
                          <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:'0.9rem', color: 'white'}}>
                            <input type="radio" name="leadSource" value="outbound" defaultChecked /> 📤 Outbound
                          </label>
                      </div>
                      <div className="file-upload-wrapper" style={{position:'relative', overflow:'hidden', display:'inline-block'}}>
                        <button className="btn btn-primary" style={{display:'flex', alignItems:'center', gap:8, padding: '12px 24px'}} disabled={uploadingData}>
                          <Upload size={18} /> {uploadingData ? 'Mapeando Base de Datos...' : 'Subir Bases de Google Maps (.csv)'}
                        </button>
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{fontSize: 100, position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', height: '100%'}} disabled={uploadingData} />
                      </div>
                  </div>
              </div>

              {/* TABS DE FILTRO & LISTADO DE LEADS MEJORADO */}
              <div style={{marginBottom: 24}}>
                  <div style={{display: 'flex', gap: 12, marginBottom: 20}}>
                     <button className={`btn ${leadsFilterTab === 'inbound' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setLeadsFilterTab('inbound')}>
                        📥 Base Inbound ({projectLeads.filter(l => l.source === 'inbound').length})
                     </button>
                     <button className={`btn ${leadsFilterTab === 'outbound' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setLeadsFilterTab('outbound')}>
                        📤 Base Outbound ({projectLeads.filter(l => l.source === 'outbound').length})
                     </button>
                  </div>

                  <div className="glass-panel" style={{padding: 24}}>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24}}>
                         <div className="search-box" style={{flex: 1, minWidth: 250}}>
                           <Search size={16} className="text-muted" />
                           <input type="text" placeholder={`Buscar en ${activeLeadsCount} prospectos...`} value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                         </div>
                         <div className="search-box" style={{flex: 1, minWidth: 200}}>
                           <MapPin size={16} className="text-muted" />
                           <input type="text" placeholder={`Filtrar por Zona/Ciudad...`} value={zoneQuery} onChange={(e)=>setZoneQuery(e.target.value)} />
                         </div>
                         <div style={{display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 8}}>
                           <button className={`btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none'}} onClick={()=>setStatusFilter('all')}>Todos</button>
                           <button className={`btn-sm ${statusFilter === 'uncontacted' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none'}} onClick={()=>setStatusFilter('uncontacted')}>⚠️ Sin Contactar</button>
                           <button className={`btn-sm ${statusFilter === 'contacting' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none'}} onClick={()=>setStatusFilter('contacting')}>🕒 En Proceso</button>
                           <button className={`btn-sm ${statusFilter === 'won' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none'}} onClick={()=>setStatusFilter('won')}>✅ Ganados</button>
                           <button className={`btn-sm ${statusFilter === 'lost' ? 'btn-primary' : 'btn-glass'}`} style={{border:'none'}} onClick={()=>setStatusFilter('lost')}>❌ Perdidos</button>
                         </div>
                      </div>

                      <div className="leads-list">
                         {filteredProjectLeads.length === 0 && (
                            <div className="text-center text-muted" style={{padding: '40px 0'}}>
                               <FileDigit size={40} style={{margin: '0 auto 16px auto', opacity: 0.5}} />
                               <p>No hay contactos que coincidan con estos filtros.</p>
                            </div>
                         )}
                         {filteredProjectLeads.map(lead => (
                            <div key={lead.id} className="lead-card" style={{cursor: 'pointer'}} onClick={() => setManagerLead(lead)}>
                               <div className="lead-card-header" style={{borderBottom: 'none', paddingBottom: 0}}>
                                  <div style={{flex: 1}}>
                                     <h3 style={{fontSize: '1.1rem', margin: 0, color: 'white'}}>{lead.name}</h3>
                                  </div>
                                  <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                                     <span className="text-sm text-muted">Clic para Expandir & Gestionar ➔</span>
                                     {lead.status === 'uncontacted' ? (
                                        <span className="badge-contact action-uncontacted">⚠️ Sin Contactar</span>
                                     ) : lead.status === 'won' ? (
                                        <span className="badge-contact action-won">✅ Ganado</span>
                                     ) : lead.status === 'lost' ? (
                                        <span className="badge-contact action-lost">❌ Perdido</span>
                                     ) : (
                                        <span className="badge-contact action-contacting">🕒 Siguiendo</span>
                                     )}
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                  </div>
              </div>
           </div>
        )}

        {/* VIEW: CONFIG */}
        {activeView === 'config' && (
          <div className="animate-slide-up">
             <header className="admin-header">
                <h1>Configuración de Comisiones (SDR)</h1>
                <p>Estructura confidencial de ganancias leídas de la BD</p>
             </header>
             <div className="admin-panel glass-panel">
                <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Vendedor</th>
                       <th>Reglas de Comisión Asignadas</th>
                     </tr>
                   </thead>
                   <tbody>
                     {team.length === 0 && <tr><td colSpan="2" style={{textAlign:'center', padding:30}}>Sin vendedores.</td></tr>}
                     {team.map(member => (
                       <tr key={member.id}>
                         <td><strong>{member.full_name}</strong></td>
                         <td>
                            {member.sdr_project_commissions?.length === 0 && <span className="text-muted text-sm">Sin proyectos.</span>}
                            {member.sdr_project_commissions?.map(c => (
                                <div key={c.project_id} style={{marginBottom: 6, fontSize: '0.85rem'}}>
                                  <span style={{color: 'var(--accent)'}}>{c.projects?.name}:</span> {c.commission_type === 'percentage' ? `${c.commission_value}% del precio base` : `$${Number(c.commission_value).toLocaleString()} fijo`}
                                </div>
                            ))}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
             </div>
          </div>
        )}

      </main>

      {/* Modals Injections */}
      {showAddProject && (
        <AddProjectModal onClose={() => setShowAddProject(false)} onProjectCreated={loadData} />
      )}
      {showEditProject && selectedProject && (
        <EditProjectModal project={selectedProject} onClose={() => setShowEditProject(false)} onProjectUpdated={(updated) => { setSelectedProject(updated); loadData(); }} />
      )}
      {showAddSdr && (
        <AddSdrModal onClose={() => setShowAddSdr(false)} />
      )}
      {showAssignSdr && selectedSdr && (
        <AssignProjectModal sdr={selectedSdr} projects={projects} onClose={() => setShowAssignSdr(false)} onAssigned={loadData} />
      )}
      {showAddPlan && selectedProject && (
        <AddPlanModal projectId={selectedProject.id} onClose={() => setShowAddPlan(false)} onPlanCreated={refreshPlans} />
      )}
      {managerLead && (
        <LeadManagerModal lead={managerLead} onClose={() => setManagerLead(null)} onSaveInteraction={handleAdminInteraction} />
      )}

      <style>{`
        /* ===== ADMIN LAYOUT - MOBILE FIRST ===== */
        .admin-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-bottom: 70px; /* space for mobile bottom nav */
        }

        /* --- Top Bar (mobile only) --- */
        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(10,10,30,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .admin-logo { font-size: 1.2rem; margin: 0; }
        .admin-logo span { color: var(--accent); }
        .hamburger-btn { background: transparent; border: none; color: white; cursor: pointer; padding: 4px; display: flex; align-items: center; }

        /* --- Sidebar (hidden on mobile, drawer when open) --- */
        .admin-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 280px;
          z-index: 200;
          padding: 24px;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        .admin-sidebar.sidebar-open { transform: translateX(0); }
        .sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199;
        }
        .logo-area h2 { font-size: 1.5rem; margin-bottom: 40px; }
        .logo-area span { color: var(--accent); }
        .admin-nav { display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; border: none;
          background: transparent; cursor: pointer; text-align: left; color: var(--text-muted);
          text-decoration: none; border-radius: 8px; transition: var(--transition);
          font-family: var(--font-family); font-size: 0.95rem; font-weight: 500;
        }
        .nav-item:hover, .nav-item.active { background: var(--accent-light); color: var(--text-main); }

        /* --- Mobile Bottom Nav --- */
        .mobile-bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(10,10,30,0.97);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
        }
        .mobile-nav-item {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: transparent; border: none; color: var(--text-muted);
          font-size: 0.65rem; font-family: var(--font-family); cursor: pointer;
          text-decoration: none; padding: 4px 0; transition: var(--transition);
        }
        .mobile-nav-item.active, .mobile-nav-item:hover { color: var(--accent); }

        /* --- Main Content --- */
        .admin-content { padding: 20px 16px; overflow-y: auto; }
        .admin-header { margin-bottom: 24px; }
        .admin-header h1 { font-size: 1.4rem; }

        /* --- Grids --- */
        .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .kpi-card { padding: 20px; }
        .kpi-value { font-size: 2rem; font-weight: 800; margin: 8px 0; }

        /* --- Tables (scrollable on mobile) --- */
        .admin-panel { padding: 16px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; min-width: 500px; }
        .admin-table th, .admin-table td {
          padding: 12px 10px; text-align: left; border-bottom: 1px solid var(--glass-border); color: var(--text-main);
        }
        .admin-table th { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }

        /* --- Misc --- */
        .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .btn-icon:hover { color: var(--text-main); }
        .search-box { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 0 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .search-box input { width: 100%; background: transparent; border: none; color: white; padding: 10px 0; outline: none; }
        .leads-list { display: flex; flex-direction: column; gap: 12px; }
        .lead-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; transition: var(--transition); }
        .lead-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(99, 102, 241, 0.4); }
        .lead-card-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; }
        .badge-contact { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
        .action-uncontacted { background: rgba(234,179,8,0.15); color: #facc15; border: 1px solid rgba(234,179,8,0.3); }
        .action-won { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
        .action-lost { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .action-contacting { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
        .info-blob { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; color: var(--text-muted); }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== DESKTOP OVERRIDES ===== */
        @media (min-width: 768px) {
          .admin-topbar { display: none; }
          .mobile-bottom-nav { display: none; }
          .admin-container {
            display: grid;
            grid-template-columns: 280px 1fr;
            padding-bottom: 0;
          }
          .admin-sidebar {
            position: sticky;
            top: 0;
            height: 100vh;
            transform: none !important;
          }
          .admin-content { padding: 40px; height: 100vh; }
          .admin-header { margin-bottom: 40px; }
          .admin-header h1 { font-size: 1.8rem; }
          .dashboard-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .kpi-value { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
