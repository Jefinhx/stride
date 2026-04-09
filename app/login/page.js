'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

// Cor principal inspirada no print: Ciano/Azul Neon
const CYAN_P = '#00FFFF'; 
const DARK_BG = '#080808'; 

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loginStrava = async () => {
    setLoading(true)
    const redirectUri = window.location.origin + '/api/auth/callback'
    const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all`
    window.location.href = stravaUrl
  }

  // Login de e-mail (simples por enquanto)
  const loginEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de login para a demo
    setTimeout(() => {
        router.push('/dashboard'); // Manda para o dashboard direto
    }, 1000);
  }

  return (
    <div style={{ background: DARK_BG, color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: CYAN_P, fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '10px' }}>STRIDE 2.0</h1>
      <p style={{ color: '#888', marginBottom: '50px' }}>Sincronize sua evolução.</p>

      {loading ? (
        <p style={{color: CYAN_P}}>Carregando...</p>
      ) : (
        <div style={{ background: '#111', padding: '40px', borderRadius: '15px', width: '350px', border: `1px solid ${CYAN_P}33`, textAlign: 'center' }}>
          
          <button onClick={loginStrava} style={{ background: CYAN_P, color: '#000', padding: '15px', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '20px' }}>
            CONECTAR COM STRAVA
          </button>

          <div style={{ color: '#444', marginBottom: '20px' }}>— ou —</div>

          <form onSubmit={loginEmail} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} style={{padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff'}} required />
            <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} style={{padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff'}} required />
            <button type="submit" style={{ background: '#000', color: CYAN_P, padding: '12px', border: `1px solid ${CYAN_P}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Entrar com E-mail
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
