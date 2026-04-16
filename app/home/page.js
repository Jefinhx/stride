'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const PRIMARY_COLOR = '#FF4500'; 
const ACCENT_GRADIENT = 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)';

function HomeContent() {
  const router = useRouter();
  const [filtro, setFiltro] = useState('Dia');
  const [userProfile, setUserProfile] = useState(null);
  const [metricas, setMetricas] = useState({ atividades: 0, distancia: 0, calorias: 0, cadencia: 0, velocidade: 0, tempoTotal: '0 min' });

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserProfile(user.user_metadata);

      // Resetar métricas ao trocar o filtro para evitar que dados antigos fiquem na tela enquanto carrega
      setMetricas({ atividades: 0, distancia: 0, calorias: 0, cadencia: 0, velocidade: 0, tempoTotal: '0 min' });

      let query = supabase.from('atividades').select('*').eq('user_id', user.id);
      const agora = new Date();
      
      // Ajuste para pegar o início exato do dia (meia-noite local)
      if (filtro === 'Dia') {
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();
        query = query.gte('data_corrida', hoje);
      } else if (filtro === 'Semana') {
        const dom = new Date(agora);
        dom.setDate(agora.getDate() - agora.getDay());
        dom.setHours(0, 0, 0, 0);
        query = query.gte('data_corrida', dom.toISOString());
      } else if (filtro === 'Mês') {
        const mes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        mes.setHours(0, 0, 0, 0);
        query = query.gte('data_corrida', mes.toISOString());
      }
      
      const { data, error } = await query;
      
      if (data && data.length > 0) {
        const total = data.length;
        const totalSegundos = data.reduce((acc, c) => acc + (Number(c.tempo_total_segundos) || 0), 0);
        const totalMinutos = Math.floor(totalSegundos / 60);
        
        setMetricas({
          atividades: total,
          distancia: data.reduce((acc, c) => acc + (Number(c.distancia_km) || 0), 0).toFixed(1),
          calorias: Math.round(data.reduce((acc, c) => acc + (Number(c.calorias_estimadas) || 0), 0)),
          cadencia: Math.round(data.reduce((acc, c) => acc + (Number(c.cadencia_media_ppm) || 0), 0) / total),
          velocidade: (data.reduce((acc, c) => acc + (Number(c.velocidade_kmh) || 0), 0) / total).toFixed(1),
          tempoTotal: totalMinutos >= 60 ? `${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m` : `${totalMinutos} min`
        });
      } else {
        // Se não houver dados, garante que o estado volte ao zero
        setMetricas({ atividades: 0, distancia: 0, calorias: 0, cadencia: 0, velocidade: 0, tempoTotal: '0 min' });
      }
    };
    carregarDados();
  }, [filtro]);

  const navItemStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', flex: 1 };

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#F8F9FB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
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
            <img src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ padding: '10px 25px 15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Dia', 'Semana', 'Mês'].map((p) => (
            <button key={p} onClick={() => setFiltro(p)} style={{ flex: 1, padding: '12px 0', borderRadius: '15px', border: 'none', background: filtro === p ? PRIMARY_COLOR : '#fff', color: filtro === p ? '#fff' : '#999', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.2s' }}>{p}</button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '12px', padding: '0 25px 100px' }}>
        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: ACCENT_GRADIENT, color: '#fff' }}>
          <i className="fa-solid fa-fire" style={{ fontSize: '22px', marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700' }}>Calorias</span>
          <b style={{ fontSize: '16px' }}>{metricas.calorias} <small style={{fontSize:'10px'}}>kcal</small></b>
        </div>

        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <i className="fa-solid fa-shoe-prints" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Cadência</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.cadencia} <small style={{fontSize:'10px', color:'#999'}}>PPM</small></b>
        </div>

        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <i className="fa-solid fa-gauge-high" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Vel. Média</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.velocidade} <small style={{fontSize:'10px', color:'#999'}}>km/h</small></b>
        </div>

        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <i className="fa-solid fa-clock" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Tempo Total</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.tempoTotal}</b>
        </div>

        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <i className="fa-solid fa-person-running" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Atividades</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.atividades}</b>
        </div>

        <div style={{ borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
          <i className="fa-solid fa-route" style={{ fontSize: '22px', color: PRIMARY_COLOR, marginBottom: '5px' }}></i>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Distância</span>
          <b style={{ fontSize: '16px', color: '#333' }}>{metricas.distancia} <small style={{fontSize:'10px', color:'#999'}}>km</small></b>
        </div>
      </div>

      {/* NAVBAR */}
      <div style={{ position: 'fixed', bottom: 0, width: '100%', height: '85px', background: '#fff', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 -5px 15px rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
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
        <div style={navItemStyle} onClick={() => router.push('/loja')}>
          <i className="fa-solid fa-bag-shopping" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Loja</span>
        </div>
        <div style={navItemStyle} onClick={() => router.push('/perfil')}>
          <i className="fa-solid fa-user" style={{ color: '#CCC', fontSize: '18px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#CCC' }}>Perfil</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() { return <Suspense fallback={null}><HomeContent /></Suspense>; }
