'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const CYAN_P = '#56cfd2'; 
const DARK_BG = '#000000'; 
const CARD_BG = '#080808'; 

export default function Dashboard() {
  const [atleta, setAtleta] = useState(null)
  const [atividades, setAtividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [distanciaSelecionada, setDistanciaSelecionada] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: perfil } = await supabase.from('perfis').select('*').single();
    if (!perfil) {
        router.push('/login');
        return;
    }
    setAtleta(perfil);
    const { data: ativs } = await supabase.from('atividades').select('*').order('data_corrida', { ascending: false });
    setAtividades(ativs || []);
    setTimeout(() => { setLoading(false); }, 5000);
  }

  const sincronizar = () => {
    const redirectUri = window.location.origin + '/api/auth/callback';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all`;
  };

  // --- FORMATAÇÕES SEM ERRO DE :60 ---
  const formatTime = (segundosTotais) => {
    if (!segundosTotais || segundosTotais === Infinity) return "0:00";
    let h = Math.floor(segundosTotais / 3600);
    let m = Math.floor((segundosTotais % 3600) / 60);
    let s = Math.round(segundosTotais % 60);
    if (s === 60) { m += 1; s = 0; }
    if (m === 60) { h += 1; m = 0; }
    return `${h > 0 ? h + ':' : ''}${h > 0 && m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatPace = (segundosPorKm) => {
    if (!segundosPorKm || segundosPorKm === Infinity || segundosPorKm === 0) return "0:00";
    let min = Math.floor(segundosPorKm / 60);
    let seg = Math.round(segundosPorKm % 60);
    if (seg === 60) { min += 1; seg = 0; }
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  // --- MÉTRICAS GERAIS ---
  const totalKm = atividades.reduce((sum, a) => sum + (a.distancia_km || 0), 0);
  const totalCalorias = totalKm * 65; 
  const pacesValidos = atividades.filter(a => a.tempo_total_segundos > 0 && a.distancia_km > 0.1).map(a => a.tempo_total_segundos / a.distancia_km);
  const menorPace = pacesValidos.length > 0 ? Math.min(...pacesValidos) : 0;
  const maiorPace = pacesValidos.length > 0 ? Math.max(...pacesValidos) : 0;
  const maiorDistancia = atividades.length > 0 ? Math.max(...atividades.map(a => a.distancia_km)) : 0;
  const menorDistancia = atividades.length > 0 ? Math.min(...atividades.filter(a => a.distancia_km > 0).map(a => a.distancia_km)) : 0;

  const MetricCard = ({ title, value, unit, cyanBorder }) => (
    <div style={{ background: CARD_BG, padding: '20px', borderRadius: '15px', border: cyanBorder ? `1px solid ${CYAN_P}` : '1px solid #1a1a1a', flex: '1', minWidth: '180px' }}>
      <p style={{ color: '#555', margin: '0 0 8px 0', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        <h3 style={{ color: cyanBorder ? CYAN_P : '#fff', fontSize: '28px', margin: 0, fontWeight: '800' }}>{value}</h3>
        <span style={{ color: '#444', fontSize: '12px', fontWeight: 'bold' }}>{unit}</span>
      </div>
    </div>
  )

  const distanciasRecordes = [
    { name: "400m", d: 0.4 }, { name: "1/2 Milha", d: 0.8 }, { name: "1KM", d: 1 },
    { name: "1 Milha", d: 1.6 }, { name: "2 Milhas", d: 3.2 }, { name: "5km", d: 5 },
    { name: "10km", d: 10 }, { name: "15km", d: 15 }, { name: "10 Milhas", d: 16.1 },
    { name: "20km", d: 20 }, { name: "Meia Maratona", d: 21.1 }, { name: "Maratona", d: 42.2 }
  ];

  if (loading) {
    return (
        <div style={{ background: CYAN_P, color: '#000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{fontSize: '60px', fontWeight: '900', letterSpacing: '-3px'}}>STRIDE 2.0</h1>
            <p style={{fontSize: '18px', fontWeight: 'bold'}}>SINCRONIZANDO RECORDES...</p>
        </div>
    );
  }

  return (
    <div style={{ background: DARK_BG, color: '#fff', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: CYAN_P, fontSize: '32px', fontWeight: '900' }}>STRIDE 2.0</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={sincronizar} style={{ background: CYAN_P, color: '#000', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer' }}>🔄 SINCRONIZAR</button>
            <button onClick={() => router.push('/login')} style={{ background: 'transparent', color: CYAN_P, border: `1px solid ${CYAN_P}`, padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>SAIR</button>
        </div>
      </div>

      {/* MÉTRICAS GERAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '60px' }}>
        <MetricCard title="Total Percorrido" value={totalKm.toFixed(1)} unit="km" cyanBorder />
        <MetricCard title="Total Calorias" value={totalCalorias.toFixed(0)} unit="kcal" />
        <MetricCard title="Maior Distancia" value={maiorDistancia.toFixed(2)} unit="km" cyanBorder />
        <MetricCard title="Menor Distancia" value={menorDistancia.toFixed(2)} unit="km" />
        <MetricCard title="Maior Pace" value={formatPace(maiorPace)} unit="min/km" />
        <MetricCard title="Menor Pace" value={formatPace(menorPace)} unit="min/km" />
      </div>

      {/* BOTÕES DE RECORDE */}
      <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '25px', textTransform: 'uppercase' }}>🏆 Recordes Pessoais</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {distanciasRecordes.map(dist => (
          <button 
            key={dist.name} 
            onClick={() => setDistanciaSelecionada(dist)}
            style={{ background: '#080808', color: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #1a1a1a', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            onMouseOver={(e) => e.target.style.borderColor = CYAN_P}
            onMouseOut={(e) => e.target.style.borderColor = '#1a1a1a'}
          >
            {dist.name}
          </button>
        ))}
      </div>

      {/* POP-UP */}
      {distanciaSelecionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#080808', width: '90%', maxWidth: '400px', borderRadius: '20px', border: `1px solid ${CYAN_P}`, padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ color: CYAN_P, margin: 0, fontSize: '22px', fontWeight: '900' }}>{distanciaSelecionada.name}</h3>
              <button onClick={() => setDistanciaSelecionada(null)} style={{ background: 'transparent', color: '#fff', border: `1px solid #333`, padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>FECHAR</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {atividades.filter(a => a.distancia_km >= distanciaSelecionada.d)
                .map(a => {
                   const pace = a.tempo_total_segundos / a.distancia_km;
                   return { tempo: pace * distanciaSelecionada.d, ritmo: pace, data: a.data_corrida, id: a.id };
                })
                .sort((a, b) => a.tempo - b.tempo).slice(0, 3).map((t, i) => (
                  <div key={t.id} style={{ background: '#000', padding: '15px', borderRadius: '12px', borderLeft: `4px solid ${i === 0 ? CYAN_P : '#222'}`, display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ color: i === 0 ? CYAN_P : '#555', fontWeight: 'bold', fontSize: '12px' }}>{i+1}º LUGAR</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(t.tempo)}</div>
                        <div style={{ fontSize: '13px', color: CYAN_P }}>{formatPace(t.ritmo)} min/km</div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#333' }}>{new Date(t.data).toLocaleDateString()}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
