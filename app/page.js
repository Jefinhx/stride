'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const PRIMARY_COLOR = '#FF4500'; 
const ACCENT_GRADIENT = 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [tela, setTela] = useState('inicial'); 
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [totalImportado, setTotalImportado] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    setMounted(true);
    const imp = searchParams.get('importado');
    if (imp) {
      setTotalImportado(imp);
      setTela('slide3');
    }
  }, [searchParams]);

  const mostrarToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  const handleDataChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 2 && value.length <= 4) value = value.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    else if (value.length > 4) value = value.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    setDataNasc(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    
    if (error) { 
      mostrarToast("E-mail ou senha incorretos!"); 
      setLoading(false); 
    } else {
      // Verifica se já tem o Strava conectado para decidir para onde mandar
      const { data: perfil } = await supabase.from('perfis').select('strava_access_token').eq('id', data.user.id).single();
      
      if (perfil?.strava_access_token) {
        router.push('/home'); // Vai para a nova página home
      } else {
        setTela('slide1'); // Inicia onboarding
      }
      setLoading(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dbDataNasc = dataNasc.split('/').reverse().join('-'); 
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: senha });
    
    if (authError) { 
      mostrarToast(authError.message); 
      setLoading(false); 
      return; 
    }
    
    if (authData.user) {
      await supabase.from('perfis').insert({ id: authData.user.id, data_nascimento: dbDataNasc });
      await supabase.auth.signOut();
      mostrarToast("Conta criada com sucesso!");
      setTimeout(() => setTela('login'), 2500);
    }
    setLoading(false);
  };

  const handleConectarStrava = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mostrarToast("Sessão expirada!");
    
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = window.location.origin + '/api/auth/callback';
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all&state=${user.id}`;
  };

  if (!mounted) return null;

  const LoadingDots = () => (
    <div style={{ display: 'flex', gap: '5px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: '8px', height: '8px', background: '#fff', borderRadius: '50%',
          animation: `bounce 0.6s infinite alternate ${i * 0.2}s`
        }} />
      ))}
    </div>
  );

  const SlideDots = ({ active }) => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '30px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          width: active === i ? '25px' : '8px', height: '8px',
          borderRadius: '10px', background: active === i ? PRIMARY_COLOR : '#DDD',
          transition: 'all 0.3s ease'
        }} />
      ))}
    </div>
  );

  const inputStyle = { width: '100%', height: '58px', padding: '0 50px 0 55px', borderRadius: '16px', border: `2px solid ${PRIMARY_COLOR}`, outline: 'none', fontSize: '16px', background: '#fff', boxSizing: 'border-box', color: '#333' };
  const buttonBase = { width: '100%', height: '58px', borderRadius: '30px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const iconStyle = { position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', color: PRIMARY_COLOR, fontSize: '18px' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: tela === 'inicial' ? ACCENT_GRADIENT : '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <style>{`
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>

      {toast.show && (
        <div style={{ position: 'fixed', top: '30px', background: '#fff', color: '#333', padding: '18px 30px', borderRadius: '16px', zIndex: 9999, boxShadow: '0 15px 35px rgba(255, 69, 0, 0.2)', border: `2px solid ${PRIMARY_COLOR}`, fontWeight: '700', minWidth: '280px', textAlign: 'center' }}>
          {toast.message}
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: ACCENT_GRADIENT, animation: 'progress 2.5s linear forwards', borderRadius: '0 0 16px 16px' }} />
        </div>
      )}

      {(tela === 'inicial' || tela === 'login' || tela === 'cadastro') && (
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: tela === 'inicial' ? 'rgba(255,255,255,0.15)' : '#fff', borderRadius: '20px', margin: '0 auto 30px', border: tela === 'inicial' ? '2px dashed #fff' : `1px solid ${PRIMARY_COLOR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <i className={`fa-solid ${tela === 'inicial' ? 'fa-bolt-lightning' : 'fa-fire'}`} style={{color: tela === 'inicial' ? '#fff' : PRIMARY_COLOR, fontSize: '28px'}}></i>
          </div>

          {tela === 'inicial' ? (
            <>
              <h1 style={{color: '#fff', fontWeight: '900', fontSize: '42px', margin: '0 0 10px 0'}}>STRIDE 2.0</h1>
              <p style={{color: '#fff', opacity: 0.9, marginBottom: '50px', fontWeight: '600'}}>Foco na Missão</p>
              <button onClick={() => setTela('login')} style={{ ...buttonBase, background: '#fff', color: PRIMARY_COLOR, marginBottom: '15px' }}>Entrar</button>
              <button onClick={() => setTela('cadastro')} style={{ ...buttonBase, background: 'transparent', color: '#fff', border: `2px solid #fff` }}>Cadastrar</button>
            </>
          ) : (
            <form onSubmit={tela === 'login' ? handleLogin : handleCadastro}>
              <h2 style={{color: PRIMARY_COLOR, fontWeight: '900', fontSize: '32px', marginBottom: '30px'}}>{tela === 'login' ? 'Entrar' : 'Cadastrar'}</h2>
              
              <div style={{position: 'relative', marginBottom: '15px'}}>
                <i className="fa-solid fa-envelope" style={iconStyle}></i>
                <input type="email" placeholder="E-mail" style={inputStyle} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div style={{position: 'relative', marginBottom: '15px'}}>
                <i className="fa-solid fa-lock" style={iconStyle}></i>
                <input type={verSenha ? "text" : "password"} placeholder="Senha" style={inputStyle} onChange={e => setSenha(e.target.value)} required />
                <i className={`fa-solid ${verSenha ? 'fa-eye-slash' : 'fa-eye'}`} style={{...iconStyle, left: 'auto', right: '20px', cursor: 'pointer'}} onClick={() => setVerSenha(!verSenha)}></i>
              </div>

              {tela === 'cadastro' && (
                <div style={{position: 'relative', marginBottom: '15px'}}>
                  <i className="fa-solid fa-calendar" style={iconStyle}></i>
                  <input type="text" placeholder="Data de Nascimento" style={inputStyle} value={dataNasc} onChange={handleDataChange} required />
                </div>
              )}

              <button type="submit" style={{ ...buttonBase, background: ACCENT_GRADIENT, color: '#fff', marginTop: '10px' }}>
                {loading ? <LoadingDots /> : (tela === 'login' ? 'ENTRAR' : 'CADASTRAR')}
              </button>
              <div onClick={() => setTela('inicial')} style={{marginTop: '40px', cursor: 'pointer'}}><i className="fa-solid fa-circle-arrow-left" style={{fontSize: '40px', color: PRIMARY_COLOR}}></i></div>
            </form>
          )}
        </div>
      )}

      {tela === 'slide1' && (
        <div style={{textAlign: 'center'}}>
           <div style={{fontSize: '60px', marginBottom: '20px'}}>👋</div>
           <h2 style={{color: PRIMARY_COLOR, fontWeight: '900', fontSize: '28px'}}>Bem-vindo!</h2>
           <p style={{color: '#666'}}>Sincronize seus dados para começar.</p>
           <button onClick={() => setTela('slide2')} style={{...buttonBase, background: ACCENT_GRADIENT, color: '#fff', marginTop: '40px', padding: '0 50px'}}>Próximo</button>
           <SlideDots active={1} />
        </div>
      )}

      {tela === 'slide2' && (
        <div style={{textAlign: 'center'}}>
           <i className="fa-brands fa-strava" style={{color: '#FC4C02', fontSize: '80px', marginBottom: '20px'}}></i>
           <h2 style={{fontWeight: '900'}}>Conectar Strava</h2>
           <p style={{color: '#666', marginBottom: '30px'}}>Importaremos suas atividades automaticamente.</p>
           <button onClick={handleConectarStrava} style={{...buttonBase, background: '#FC4C02', color: '#fff', padding: '0 60px'}}>Conectar Agora</button>
           <SlideDots active={2} />
        </div>
      )}

      {tela === 'slide3' && (
        <div style={{textAlign: 'center', maxWidth: '350px'}}>
           <div style={{fontSize: '60px'}}>🚀</div>
           <h2 style={{color: PRIMARY_COLOR, fontWeight: '900', fontSize: '32px', marginTop: '10px'}}>Tudo pronto!</h2>
           <p style={{color: '#666', fontSize: '18px', marginTop: '15px'}}>Suas <strong>{totalImportado}</strong> atividades foram importadas.</p>
           <button onClick={() => router.push('/home')} style={{...buttonBase, background: ACCENT_GRADIENT, color: '#fff', marginTop: '40px'}}>Entrar</button>
           <SlideDots active={3} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <Suspense fallback={<div>Carregando...</div>}><HomeContent /></Suspense>;
}
