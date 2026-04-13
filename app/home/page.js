
'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const PRIMARY_COLOR = '#FF4500'; 
const ACCENT_GRADIENT = 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)';

function HomeContent() {
  const router = useRouter();
  const [filtro, setFiltro] = useState('Dia');
  const [metricas, setMetricas] = useState({ atividades: 0, distancia: 0, calorias: 0, cadencia: 0 });

  useEffect(() => {
    const carregarMetricas = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      let query = supabase.from('atividades').select('*').eq('user_id', user.id);
      const agora = new Date();
      
      if (filtro === 'Dia') {
        query = query.gte('data_corrida', `${agora.toISOString().split('T')[0]}T00:00:00Z`);
      } else if (filtro === 'Semana') {
        const dom = new Date(agora); dom.setDate(agora.getDate() - agora.getDay());
        query = query.gte('data_corrida', `${dom.toISOString().split('T')[0]}T00:00:00Z`);
      } else if (filtro === 'Mês') {
        const mes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        query = query.gte('data_corrida', `${mes.toISOString().split('T')[0]}T00:00:00Z`);
      }
      
      const { data } = await query;
      if (data) {
        // Cálculo da Cadência Média baseado nas atividades filtradas
        const cadenciaTotal = data.reduce((acc, c) => acc + (c.cadencia_media_ppm || 0), 0);
        const mediaCadencia = data.length ? Math.round(cadenciaTotal / data.length) : 0;

        setMetricas({
          atividades: data.length,
          distancia: data.reduce((acc, c) => acc + (c.distancia_km || 0), 0).toFixed(1),
          calorias: Math.round(data.reduce((acc, c) => acc + (c.calorias_estimadas || 0), 0)),
          cadencia: mediaCadencia
        });
      }
    };
    carregarMetricas();
  }, [filtro]);

  const cardBase = { 
    borderRadius: '28px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    boxShadow: '0 8px 25px rgba(0,0,0,0.05)', 
    textAlign: 'center',
    height: '180px', 
    width: '100%' 
  };
  
  const navItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 };

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#F8F9FB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <div style={{ padding: '30px 25px 15px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#333', margin: '0 0 15px 0' }}>Discovery</h1>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {['Dia', 'Semana', 'Mês'].map((p) => (
            <button key={p} onClick={() => setFiltro(p)} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: filtro === p ? PRIMARY_COLOR : '#eee', color: filtro === p ? '#fff' : '#666', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '15px', 
        padding: '0 25px',
        flex: 1,
        alignContent: 'center' 
      }}>
        {/* Card 1: Cadência Média (Substituído Batimento) */}
        <div style={{...cardBase, background: '#fff'}}>
          <i className="fa-solid fa-shoe-prints" style={{ fontSize: '28px', color: PRIMARY_COLOR, marginBottom: '12px' }}></i>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Cadência Média</span>
          <span style={{ color: '#999', fontSize: '12px' }}>{metricas.cadencia} PPM</span>
        </div>

        {/* Card 2: Calorias (Colorido) */}
        <div style={{...cardBase, background: ACCENT_GRADIENT, color: '#fff'}}>
          <i className="fa-solid fa-fire" style={{ fontSize: '28px', color: '#fff', marginBottom: '12px' }}></i>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Calorias</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{metricas.calorias} kcal</span>
        </div>

        {/* Card 3: Atividades */}
        <div style={{...cardBase, background: '#fff'}}>
          <i className="fa-solid fa-person-running" style={{ fontSize: '28px', color: PRIMARY_COLOR, marginBottom: '12px' }}></i>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Atividades</span>
          <span style={{ color: '#999', fontSize: '12px' }}>{metricas.atividades} treinos</span>
        </div>

        {/* Card 4: Distância */}
        <div style={{...cardBase, background: '#fff'}}>
          <i className="fa-solid fa-route" style={{ fontSize: '28px', color: PRIMARY_COLOR, marginBottom: '12px' }}></i>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Distância</span>
          <span style={{ color: '#999', fontSize: '12px' }}>{metricas.distancia} km</span>
        </div>
      </div>

      <div style={{ height: '100px', background: '#fff', borderTopLeftRadius: '35px', borderTopRightRadius: '35px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 -5px 20px rgba(0,0,0,0.03)', padding: '0 10px 15px' }}>
        <div style={navItemStyle} onClick={() => router.push('/home')}>
          <i className="fa-solid fa-house" style={{ color: PRIMARY_COLOR, fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: PRIMARY_COLOR }}>Home</span>
        </div>
        <div style={navItemStyle} onClick={() => router.push('/atividades')}>
          <i className="fa-solid fa-chart-line" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Atividades</span>
        </div>
        <div style={navItemStyle} onClick={() => router.push('/ranking')}>
          <i className="fa-solid fa-trophy" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Ranking</span>
        </div>
        <div style={navItemStyle} onClick={() => router.push('/perfil')}>
          <i className="fa-solid fa-user" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Perfil</span>
        </div>
        <div style={navItemStyle} onClick={() => router.push('/config')}>
          <i className="fa-solid fa-gear" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Configurações</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() { return <Suspense fallback={null}><HomeContent /></Suspense>; }
