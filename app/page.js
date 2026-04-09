'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

// Cores do novo layout Stride Dark Cyan
const CYAN_P = '#00FFFF'; 
const DARK_BG = '#080808'; 

export default function Home() {
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checarAcesso = async () => {
      // 1. Verifica se existe algum perfil salvo no banco
      const { data: perfil } = await supabase.from('perfis').select('*').single()

      if (perfil) {
        // 2. Se achou o Jefin no banco, manda direto para o Dashboard Moderno
        router.push('/dashboard')
      } else {
        // 3. Se não achou, para de verificar e mostra a tela de login/boas-vindas
        setVerificando(false)
      }
    }
    checarAcesso()
  }, [router])

  const loginStrava = () => {
    const redirectUri = window.location.origin + '/api/auth/callback'
    // Aqui usamos o seu Client ID das variáveis de ambiente
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all`
  }

  // Enquanto ele checa o banco, mostra uma tela preta limpa
  if (verificando) {
    return <div style={{ background: DARK_BG, height: '100vh' }}></div>
  }

  return (
    <div style={{ 
      background: `radial-gradient(circle at center, #111 0%, ${DARK_BG} 100%)`, 
      color: '#fff', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'sans-serif' 
    }}>
      
      {/* Logo com Brilho Ciano */}
      <h1 style={{ 
        color: CYAN_P, 
        fontSize: '64px', 
        fontWeight: '900', 
        letterSpacing: '-3px', 
        margin: '0',
        textShadow: `0 0 20px ${CYAN_P}66`
      }}>
        STRIDE 2.0
      </h1>
      
      <p style={{ 
        color: '#888', 
        fontSize: '18px', 
        marginBottom: '40px', 
        letterSpacing: '1px' 
      }}>
        Sincronize sua evolução. Domine as pistas.
      </p>

      {/* Botão Estilizado */}
      <button 
        onClick={loginStrava}
        style={{ 
          background: CYAN_P, 
          color: '#000', 
          padding: '20px 50px', 
          border: 'none', 
          borderRadius: '50px', 
          fontWeight: '900', 
          fontSize: '18px', 
          cursor: 'pointer',
          boxShadow: `0 10px 30px ${CYAN_P}44`,
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        COMEÇAR AGORA COM STRAVA
      </button>

      <footer style={{ position: 'absolute', bottom: '30px', color: '#333', fontSize: '12px' }}>
        MURIAÉ - MG | POWERED BY NEXT.JS & SUPABASE
      </footer>
    </div>
  )
}
