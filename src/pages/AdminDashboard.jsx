import { useState } from 'react';
import { Users, BarChart3, Settings, Database, MoreVertical, Smartphone, Plus, Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { mockTeam, mockProjects } from '../data/mockData';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('metrics'); // metrics, team, projects, config, project_details
  const [selectedProject, setSelectedProject] = useState(null);

  const handleViewProject = (proj) => {
    setSelectedProject(proj);
    setActiveView('project_details');
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar glass-panel">
        <div className="logo-area">
          <h2>CreApp <span>SaaS</span></h2>
        </div>
        <nav className="admin-nav">
          <button className={`nav-item ${(activeView === 'metrics') ? 'active' : ''}`} onClick={() => setActiveView('metrics')}><BarChart3 size={20} /> Métricas Generales</button>
          <button className={`nav-item ${activeView === 'team' ? 'active' : ''}`} onClick={() => setActiveView('team')}><Users size={20} /> Equipo de Ventas</button>
          <button className={`nav-item ${(activeView === 'projects' || activeView === 'project_details') ? 'active' : ''}`} onClick={() => setActiveView('projects')}><Database size={20} /> Proyectos (Tenants)</button>
          <button className={`nav-item ${activeView === 'config' ? 'active' : ''}`} onClick={() => setActiveView('config')}><Settings size={20} /> Configuración SaaS</button>
          
          <Link to="/sales" className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Smartphone size={20} /> Ver App Vendedor
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        
        {/* VIEW: METRICS */}
        {activeView === 'metrics' && (
          <div className="animate-slide-up">
            <header className="admin-header">
              <h1>Métricas Generales</h1>
              <p>Visión global de todos los proyectos de CreApp</p>
            </header>

            <section className="dashboard-grid">
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Total Leads (Mes)</h3>
                  <p className="kpi-value">1,245</p>
                  <span className="badge badge-success">+12% vs mes anterior</span>
               </div>
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Conversión Glob.</h3>
                  <p className="kpi-value">4.8%</p>
               </div>
               <div className="kpi-card glass-panel">
                  <h3 className="text-muted">Activos Mensuales</h3>
                  <p className="kpi-value text-accent">13</p>
                  <p className="text-sm">En {mockProjects.length} proyectos</p>
               </div>

               <div className="admin-panel glass-panel" style={{ gridColumn: '1 / -1' }}>
                  <div className="panel-header">
                     <h3>Rendimiento Resumido</h3>
                     <button className="btn btn-glass btn-sm" onClick={() => setActiveView('team')}>Ver Equipo Completo</button>
                  </div>
                  <p className="text-muted text-sm">Navega a la pestaña Equipo de Ventas para asignar y gestionar los perfiles.</p>
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
                <button className="btn btn-primary"><Plus size={18}/> Nuevo Vendedor</button>
             </header>

             <div className="admin-panel glass-panel">
                <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Vendedor</th>
                       <th>Proyectos Asignados</th>
                       <th>Clientes Activos</th>
                       <th>Acciones Rápidas</th>
                     </tr>
                   </thead>
                   <tbody>
                     {mockTeam.map(member => (
                       <tr key={member.id}>
                         <td><strong>{member.name}</strong><br/><span className="text-xs text-muted">ID: SDR-{member.id}</span></td>
                         <td>
                            <div style={{display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8}}>
                               {member.commissions.map(c => {
                                 const proj = mockProjects.find(p => p.id === c.projectId);
                                 return <span key={c.projectId} className="badge badge-inbound">{proj?.code}</span>
                               })}
                            </div>
                            <button className="btn btn-glass btn-sm text-xs" onClick={()=>alert('Abrir modal de asignación de nuevo proyecto a '+member.name)}>+ Asignar Proyecto</button>
                         </td>
                         <td>{member.totalActiveClients} vinculados</td>
                         <td>
                            <div style={{display: 'flex', gap: 8}}>
                               <button className="btn btn-glass btn-sm" onClick={() => setActiveView('config')}>Ver Comisiones</button>
                               <button className="btn-icon" title="Editar"><MoreVertical size={16}/></button>
                            </div>
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
                   <p>Administración Multi-tenant de Proyectos</p>
                </div>
                <button className="btn btn-primary"><Plus size={18}/> Nuevo Proyecto SaaS</button>
             </header>

             <div className="dashboard-grid">
               {mockProjects.map(proj => (
                 <div key={proj.id} className="glass-panel" style={{ padding: 20, cursor: 'pointer', transition: 'var(--transition)' }} onClick={() => handleViewProject(proj)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                       <h3 style={{ fontSize: '1.2rem', color: 'white' }}>{proj.name}</h3>
                       <span className={`badge badge-${proj.isActive ? 'success' : 'danger'}`}>{proj.isActive ? 'Activo' : 'Pausado'}</span>
                    </div>
                    <p className="text-sm text-muted mb-3">Modelo Cobro: <strong className="text-main" style={{textTransform:'uppercase'}}>{proj.pricingType}</strong></p>
                    <p className="text-sm text-muted">Abono Base / Setup: ${proj.basePrice.toLocaleString()}</p>
                    
                    <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                       <button className="btn btn-glass btn-sm" style={{ width: '100%', pointerEvents: 'none' }}>Administrar Base de Datos</button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* VIEW: PROJECT DETAILS (INSIDE PROYECTOS) */}
        {activeView === 'project_details' && selectedProject && (
           <div className="animate-slide-up">
              <header className="admin-header">
                 <button className="btn-icon mb-3" onClick={() => setActiveView('projects')} style={{display:'flex', alignItems:'center', gap:4, marginBottom: 16}}><ArrowLeft size={16}/> Volver a Proyectos</button>
                 <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div>
                       <h1>{selectedProject.name} <span className="text-muted" style={{fontSize:'1rem'}}>({selectedProject.code})</span></h1>
                       <p>Gestión de abonos, retorno de este proyecto y carga masiva de leads.</p>
                    </div>
                    <span className={`badge badge-${selectedProject.isActive ? 'success' : 'danger'}`} style={{fontSize: '1rem'}}>{selectedProject.isActive ? 'Status: Activo' : 'Status: Pausado'}</span>
                 </div>
              </header>

              <div className="dashboard-grid">
                 {/* Retorno y Abonos */}
                 <div className="glass-panel" style={{padding: 24}}>
                    <h3 className="text-muted" style={{marginBottom: 16}}>Retorno de este Proyecto</h3>
                    <p className="kpi-value text-accent">${(selectedProject.basePrice * 12).toLocaleString()}</p>
                    <p className="text-sm mb-3">Facturación estimada mensual</p>
                    {selectedProject.pricingType !== 'percentage' && (
                       <button className="btn btn-glass btn-sm">Editar Abonos Activos</button>
                    )}
                 </div>

                 {/* Carga Masiva de CSV */}
                 <div className="glass-panel" style={{padding: 24, gridColumn: 'span 2'}}>
                    <h3 style={{marginBottom: 16}}>Cargar Base de Datos (Upload Leads)</h3>
                    <p className="text-sm text-muted" style={{marginBottom: 20}}>Sube un archivo .CSV para alimentar la bandeja de Inbound u Outbound de este proyecto específico. Se asignará a los SDR encargados.</p>
                    
                    <div style={{display:'flex', gap: 16, alignItems:'center', marginBottom: 20}}>
                       <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                          <input type="radio" name="leadSource" value="inbound" defaultChecked />
                          <span>Mapear como Inbound 📥</span>
                       </label>
                       <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                          <input type="radio" name="leadSource" value="outbound" />
                          <span>Mapear como Outbound 📤</span>
                       </label>
                    </div>

                    <div style={{border: '2px dashed var(--glass-border)', padding: 32, borderRadius: 12, textAlign: 'center'}}>
                       <Upload size={32} className="text-muted" style={{marginBottom: 12}} />
                       <h4 style={{marginBottom: 8}}>Arrastra tu CSV aquí o haz clic</h4>
                       <p className="text-xs text-muted">Asegúrate de tener columnas para Nombre, Empresa y Email/Teléfono.</p>
                       <button className="btn btn-primary mt-3" onClick={() => alert('Simulador: CSV de Leads procesado y subido con éxito.')}>
                          Seleccionar Archivo
                       </button>
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
                <p>Estructura confidencial de ganancias del equipo</p>
             </header>
             <div className="admin-panel glass-panel">
                <p className="text-muted" style={{marginBottom: 24}}>Aquí defines cuánto percibe cada vendedor por campaña sin que se filtre al resto del dashboard.</p>
                <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Vendedor</th>
                       <th>Reglas de Comisión Específicas</th>
                       <th>Proyección Actual de Pago</th>
                       <th>Acciones</th>
                     </tr>
                   </thead>
                   <tbody>
                     {mockTeam.map(member => (
                       <tr key={member.id}>
                         <td><strong>{member.name}</strong></td>
                         <td>
                            {member.commissions.map(c => {
                              const proj = mockProjects.find(p => p.id === c.projectId);
                              return (
                                <div key={c.projectId} style={{marginBottom: 4, fontSize: '0.85rem'}}>
                                  <span style={{color: 'var(--accent)'}}>{proj?.code}:</span> {c.type === 'percentage' ? `${c.value}% del precio base` : `$${c.value.toLocaleString()} fijo`}
                                </div>
                              )
                            })}
                         </td>
                         <td className="text-success font-bold">${(member.totalActiveClients * 35000).toLocaleString()}</td>
                         <td><button className="btn btn-glass btn-sm">Editar Porcentajes</button></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
             </div>
          </div>
        )}

      </main>

      <style>{`
        /* ... Estilos base previos se mantienen y agregamos ajustes ... */
        .admin-container { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
        
        .admin-sidebar { padding: 24px; border-radius: 0; border-left: none; border-top: none; border-bottom: none; display: flex; flex-direction: column; }
        .logo-area h2 { font-size: 1.5rem; margin-bottom: 40px; }
        .logo-area span { color: var(--accent); }
        .admin-nav { display: flex; flex-direction: column; gap: 12px; flex: 1; }
        
        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; border: none; background: transparent; cursor: pointer; text-align: left;
          color: var(--text-muted); text-decoration: none; border-radius: 8px; transition: var(--transition); font-family: var(--font-family); font-size: 0.95rem; font-weight: 500;
        }
        .nav-item:hover, .nav-item.active { background: var(--accent-light); color: var(--text-main); }
        
        .admin-content { padding: 40px; overflow-y: auto; height: 100vh; }
        .admin-header { margin-bottom: 40px; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .kpi-card { padding: 24px; }
        .kpi-value { font-size: 2.5rem; font-weight: 800; margin: 12px 0; }
        
        .admin-panel { padding: 24px; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
        
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td {
          padding: 16px; text-align: left; border-bottom: 1px solid var(--glass-border); color: var(--text-main);
        }
        .admin-table th { color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .btn-icon { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .btn-icon:hover { color: var(--text-main); }
        .text-main { color: var(--text-main); }
        .mb-3 { margin-bottom: 12px; }
        .mt-3 { margin-top: 12px; }

        .glass-panel:hover {
          border-color: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
}
