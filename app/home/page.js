'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const PRIMARY_COLOR = '#FF4500'; 
const ACCENT_GRADIENT = 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)';

function HomeContent() {
  const router = useRouter();
  const [filtro, setFiltro] = useState('Dia');
  const [userProfile, setUserProfile] = useState(null);
  
  const [metricas, setMetricas] = useState({ 
    atividades: 0, distancia: 0, calorias: 0, cadenciaMin: 0, cadenciaMax: 0, velMin: 0, velMax: 0, tempoTotal: '0 min' 
  });

  const carregarMetricasLocais = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('atividades').select('*').eq('user_id', user.id);
    const agora = new Date();
    
    if (filtro === 'Dia') {
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
      query = query.gte('data_corrida', hoje);
    } else if (filtro === 'Semana') {
      const dom = new Date(agora); dom.setDate(agora.getDate() - agora.getDay()); dom.setHours(0,0,0,0);
      query = query.gte('data_corrida', dom.toISOString());
    } else if (filtro === 'Mês') {
      const mes = new Date(agora.getFullYear(), agora.getMonth(), 1); mes.setHours(0,0,0,0);
      query = query.gte('data_corrida', mes.toISOString());
    }
    
    const { data } = await query;
    if (data && data.length > 0) {
      const vels = data.map(c => Number(c.velocidade_kmh) || 0);
      const cads = data.map(c => Number(c.cadencia_media_ppm) || 0).filter(c => c > 0);
      const totalSegundos = data.reduce((acc, c) => acc + (Number(c.tempo_total_segundos) || 0), 0);
      const totalMinutos = Math.floor(totalSegundos / 60);
      setMetricas({
        atividades: data.length,
        distancia: data.reduce((acc, c) => acc + (Number(c.distancia_km) || 0), 0).toFixed(1),
        calorias: Math.round(data.reduce((acc, c) => acc + (Number(c.calorias_estimadas) || 0), 0)),
        cadenciaMin: cads.length ? Math.min(...cads) : 0,
        cadenciaMax: cads.length ? Math.max(...cads) : 0,
        velMin: vels.length ? Math.min(...vels).toFixed(1) : 0,
        velMax: vels.length ? Math.max(...vels).toFixed(1) : 0,
        tempoTotal: totalMinutos >= 60 ? `${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m` : `${totalMinutos} min`
      });
    } else {
      setMetricas({ atividades: 0, distancia: 0, calorias: 0, cadenciaMin: 0, cadenciaMax: 0, velMin: 0, velMax: 0, tempoTotal: '0 min' });
    }
  }, [filtro]);

  const sincronizarSilencioso = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: perfil } = await supabase.from('perfis').select('strava_access_token').eq('id', user.id).single();
    if (!perfil?.strava_access_token) return;
    try {
      const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=30`, {
        headers: { 'Authorization': `Bearer ${perfil.strava_access_token}` }
      });
      const stravaData = await res.json();
      if (stravaData && stravaData.length > 0) {
        const formatadas = stravaData.map(ativ => ({
          user_id: user.id,
          strava_activity_id: ativ.id.toString(),
          titulo: ativ.name,
          distancia_km: Number((ativ.distance / 1000).toFixed(2)),
          tempo_total_segundos: parseInt(ativ.moving_time),
          velocidade_kmh: ativ.moving_time > 0 ? Number(((ativ.distance / 1000) / (ativ.moving_time / 3600)).toFixed(2)) : 0,
          data_corrida: ativ.start_date,
          calorias_estimadas: Number(((ativ.distance / 1000) * 70).toFixed(2)),
          cadencia_media_ppm: ativ.average_cadence ? Math.round(ativ.average_cadence * 2) : 0
        }));
        await supabase.from('atividades').upsert(formatadas, { onConflict: 'strava_activity_id' });
        await carregarMetricasLocais(); 
      }
    } catch (e) { console.error(e); }
  }, [carregarMetricasLocais]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserProfile(user.user_metadata);
      await carregarMetricasLocais();
      sincronizarSilencioso();
    };
    init();
  }, [filtro, carregarMetricasLocais, sincronizarSilencioso]);

  const navItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 };
  
  // AQUI É ONDE VOCÊ VAI MEXER:
  const cardStyle = { 
    borderRadius: '20px', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#fff', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)', 
    height: '195px' // <--- ALTERE ESTE VALOR (ex: 135px, 130px...) PARA AJUSTAR A TELA
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#F8F9FB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <div style={{ padding: '20px 25px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', background: PRIMARY_COLOR, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-bolt" style={{ color: '#fff', fontSize: '18px' }}></i>
          </div>
          <span style={{ fontWeight: '900', fontSize: '18px', color: '#333' }}>RUNNER</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <i className="fa-regular fa-bell" style={{ fontSize: '20px', color: '#666' }}></i>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${PRIMARY_COLOR}` }}>
            <img src={userProfile?.avatar_url || ""} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 25px 15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Dia', 'Semana', 'Mês'].map((p) => (
            <button key={p} onClick={() => setFiltro(p)} style={{ flex: 1, padding: '12px 0', borderRadius: '15px', border: 'none', background: filtro === p ? PRIMARY_COLOR : '#fff', color: filtro === p ? '#fff' : '#999', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '0 25px 100px', alignContent: 'start' }}>
        
        <div style={{ ...cardStyle, background: ACCENT_GRADIENT, color: '#fff' }}>
          <i className="fa-solid fa-fire" style={{ fontSize: '22px', marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Total Calorias</span>
          <b style={{ fontSize: '16px' }}>{metricas.calorias} <small style={{fontSize:'10px'}}>kcal</small></b>
        </div>

        <div style={cardStyle}>
          <i className="fa-solid fa-route" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Total Distância</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.distancia} <small style={{fontSize:'10px', color:'#999'}}>km</small></b>
        </div>

        <div style={cardStyle}>
          <i className="fa-solid fa-shoe-prints" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Cadência</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#333' }}>{metricas.cadenciaMin} <small style={{fontSize:'9px', color:'#999'}}>min</small></span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#333' }}>{metricas.cadenciaMax} <small style={{fontSize:'9px', color:'#999'}}>max</small></span>
          </div>
        </div>

        <div style={cardStyle}>
          <i className="fa-solid fa-gauge-high" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Velocidade</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#333' }}>{metricas.velMin} <small style={{fontSize:'9px', color:'#999'}}>min</small></span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#333' }}>{metricas.velMax} <small style={{fontSize:'9px', color:'#999'}}>max</small></span>
          </div>
        </div>

        <div style={cardStyle}>
          <i className="fa-solid fa-person-running" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Atividades</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.atividades}</b>
        </div>

        <div style={cardStyle}>
          <i className="fa-solid fa-clock" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Tempo Total</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.tempoTotal}</b>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, width: '100%', height: '85px', background: '#fff', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 -5px 15px rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
        <div style={navItemStyle} onClick={() => router.push('/home')}><i className="fa-solid fa-house" style={{ color: PRIMARY_COLOR, fontSize: '18px' }}></i><span style={{ fontSize: '10px', fontWeight: '800', color: PRIMARY_COLOR }}>Home</span></div>
        <div style={navItemStyle} onClick={() => router.push('/atividades')}><i className="fa-solid fa-chart-line" style={{ color: '#CCC', fontSize: '18px' }}></i><span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Treinos</span></div>
        <div style={navItemStyle} onClick={() => router.push('/ranking')}><i className="fa-solid fa-trophy" style={{ color: '#CCC', fontSize: '18px' }}></i><span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Ranking</span></div>
        <div style={navItemStyle} onClick={() => router.push('/loja')}><i className="fa-solid fa-bag-shopping" style={{ color: '#CCC', fontSize: '18px' }}></i><span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Loja</span></div>
        <div style={navItemStyle} onClick={() => router.push('/perfil')}><i className="fa-solid fa-user" style={{ color: '#CCC', fontSize: '18px' }}></i><span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Perfil</span></div>
      </div>
    </div>
  );
}

export default function Home() { return <Suspense fallback={null}><HomeContent /></Suspense>; }


Achei a altura certinha, mas não quero que a pagina tenha rolagem pra baixo e está tendo, como faço para não, masss, manter de acordo como está, sem tirar nada
