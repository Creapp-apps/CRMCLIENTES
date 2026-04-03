import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Target } from 'lucide-react';

// Solución al problema clásico de los íconos ocultos en React-Leaflet
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const icons = {
  uncontacted: createIcon('#ef4444'), // Rojo
  contacting: createIcon('#818cf8'), // Azul
  lost: createIcon('#9ca3af'), // Gris
  won: createIcon('#10b981'), // Verde
};

export default function InteractiveMap({ leads, onSelectLead, onToggleRoute, routeLeadIds = [] }) {
  const [geocodedLeads, setGeocodedLeads] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Memorizamos la geocodificación para no abusar de Nominatim o recalcular siempre
  useEffect(() => {
    let active = true;
    const processLeads = async () => {
      setIsGeocoding(true);
      try {
        const procesados = [];
        const cache = JSON.parse(localStorage.getItem('geocache_leads') || '{}');
        let cacheUpdated = false;

        // Extract coords either from map URL, DB, or Nominatim
        for (let lead of leads) {
          if (!lead.location) continue;

          let lat, lng;
          let queryStr = lead.location.trim();

          // 1. Is it a Google maps URL?
          const m1 = queryStr.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          const m2 = queryStr.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
          if (m1) { lat = parseFloat(m1[1]); lng = parseFloat(m1[2]); }
          else if (m2) { lat = parseFloat(m2[1]); lng = parseFloat(m2[2]); }
          
          // 2. Is it already in cache?
          else if (cache[queryStr]) {
            lat = cache[queryStr].lat;
            lng = cache[queryStr].lng;
          } 
          
          // 3. Ask Nominatim if we have an explicit text and it's not a random string
          else if (queryStr.length > 3 && !queryStr.startsWith('http')) {
            try {
              await new Promise(r => setTimeout(r, 1200)); // Respect Nominatim 1 request per sec
              if (!active) break;
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr + ', Argentina')}&limit=1`);
              const data = await res.json();
              if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lng = parseFloat(data[0].lon);
                cache[queryStr] = { lat, lng };
                cacheUpdated = true;
              } else {
                 // Mark as not found to avoid future API hits
                 cache[queryStr] = { lat: null, lng: null };
                 cacheUpdated = true;
              }
            } catch(err) {
              console.error('Nominatim Geocoding Error:', err);
            }
          }

          if (lat && lng) {
            procesados.push({ ...lead, lat, lng });
          }
        }

        if (cacheUpdated) {
          localStorage.setItem('geocache_leads', JSON.stringify(cache));
        }

        if (active) {
          setGeocodedLeads(procesados);
        }
      } catch (err) {
        console.error('Error procesando leads en InteractiveMap:', err);
      } finally {
        if (active) setIsGeocoding(false);
      }
    };

    if (leads.length > 0) {
      processLeads();
    } else {
      setGeocodedLeads([]);
    }

    return () => { active = false; };
  }, [leads]);

  // Munro, Buenos Aires: -34.5261, -58.5203
  const DEFAULT_CENTER = [-34.5261, -58.5203];
  const DEFAULT_ZOOM = 14;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 220px)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      {isGeocoding && geocodedLeads.length === 0 && (
         <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: 12 }}>
            <div className="spinner" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <p>Geocodificando y localizando leads...</p>
         </div>
      )}
      <MapContainer 
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {geocodedLeads.map((lead) => (
          <Marker 
            key={lead.id} 
            position={[lead.lat, lead.lng]}
            icon={icons[lead.status] || icons['uncontacted']}
            eventHandlers={{
              click: () => onSelectLead(lead),
            }}
          >
            <Popup>
              <div style={{ color: 'black', minWidth: 170 }}>
                 <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>{lead.name}</h3>
                 {lead.company && <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>{lead.company}</p>}
                 {lead.location && <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>{lead.location.length > 40 ? lead.location.slice(0, 40) + '…' : lead.location}</p>}
                 <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                   <button onClick={() => onSelectLead(lead)} style={{ width: '100%', padding: '6px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Gestionar Lead</button>
                   {onToggleRoute && (
                     routeLeadIds.includes(lead.id) ? (
                       <button onClick={() => onToggleRoute(lead)} style={{ width: '100%', padding: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>✖ Quitar de Ruta</button>
                     ) : (
                       <button onClick={() => onToggleRoute(lead)} style={{ width: '100%', padding: '6px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>+ Añadir a Ruta</button>
                     )
                   )}
                 </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.85)', padding: 12, borderRadius: 8, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs font-bold text-white mb-1">Estado</p>
        <div style={{display:'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'white'}}><div style={{width: 12, height:12, borderRadius:'50%', background:'#ef4444'}}></div> Sin contactar</div>
        <div style={{display:'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'white'}}><div style={{width: 12, height:12, borderRadius:'50%', background:'#818cf8'}}></div> En proceso</div>
        <div style={{display:'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'white'}}><div style={{width: 12, height:12, borderRadius:'50%', background:'#10b981'}}></div> Ganado</div>
        <div style={{display:'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'white'}}><div style={{width: 12, height:12, borderRadius:'50%', background:'#9ca3af'}}></div> Perdido</div>
      </div>
    </div>
  );
}
