'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const ACCENT_GRADIENT = 'linear-gradient(45deg, #E9425B 0%, #E1306C 100%)';
const PRIMARY_COLOR = '#E9425B';

export default function Home() {
  const [tela, setTela] = useState('inicial'); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const router = useRouter();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: senha });
    
    if (!authError && authData.user) {
      await supabase.from('perfis').insert({
        id: authData.user.id,
        data_nascimento: dataNasc
      });
      router.push('/dashboard');
    }
    setLoading(false);
  };

  // --- ESTILOS RESPONSIVOS ---
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px', // Padding menor para mobile
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    width: '100%'
  };

  const formWrapper = {
    width: '100%',
    maxWidth: '400px', // Limita o tamanho em tablets/PC
    textAlign: 'center'
  };

  const inputStyle = {
    width: '100%',
    height: '55px', // Altura otimizada para toque
    padding: '0 20px',
    borderRadius: '15px',
    border: '1px solid #eee',
    marginBottom: '15px',
    outline: 'none',
    fontSize: '16px', // Evita o zoom automático no iPhone ao clicar
    background: '#f9f9f9',
    boxSizing: 'border-box',
    color: '#333',
    appearance: 'none'
  };

  const buttonBase = {
    width: '100%',
    height: '55px',
    borderRadius: '30px',
    border: 'none',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'transform 0.1s active',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  };

  return (
    <>
      {/* TELA 1: INICIAL (FUNDO COLORIDO) */}
      {tela === 'inicial' && (
        <div style={{ ...containerStyle, background: ACCENT_GRADIENT }}>
          
          <div style={{ 
            width: 'min(60vw, 200px)', // Responsivo: 60% da largura ou 200px
            height: 'min(60vw, 200px)', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '40px', 
            marginBottom: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: '2px dashed rgba(255,255,255,0.3)' 
          }}>
            <span style={{color: '#fff', fontSize: '12px', opacity: 0.8}}>IMAGEM CENTRADA</span>
          </div>

          <div style={formWrapper}>
            <h1 style={{color: '#fff', fontWeight: '900', fontSize: 'clamp(24px, 8vw, 32px)', marginBottom: '40px', letterSpacing: '-1px'}}>
              Stride 2.0
            </h1>
            
            <button 
              onClick={() => setTela('login')} 
              style={{ ...buttonBase, background: '#fff', color: PRIMARY_COLOR, marginBottom: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
            >
              ENTRAR
            </button>
            
            <button 
              onClick={() => setTela('cadastro')} 
              style={{ ...buttonBase, background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              CADASTRAR
            </button>
          </div>
        </div>
      )}

      {/* TELA 2: LOGIN OU CADASTRO (FUNDO BRANCO) */}
      {(tela === 'login' || tela === 'cadastro') && (
        <div style={{ ...containerStyle, background: '#fff' }}>
          
          <div style={{ width: '80px', height: '80px', background: '#f9f9f9', borderRadius: '20px', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
             <span style={{color: '#ccc', fontSize: '10px'}}>LOGO</span>
          </div>

          <div style={formWrapper}>
            <h2 style={{color: '#000', fontWeight: '900', marginBottom: '25px', fontSize: '24px'}}>
              {tela === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>

            <form onSubmit={(e) => { e.preventDefault(); if(tela === 'login') router.push('/dashboard'); else handleCadastro(e); }}>
              <input type="email" placeholder="E-mail" style={inputStyle} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Senha" style={inputStyle} onChange={e => setSenha(e.target.value)} required />
              
              {tela === 'cadastro' && (
                <div style={{textAlign: 'left', marginBottom: '15px'}}>
                  <label style={{fontSize: '11px', color: PRIMARY_COLOR, fontWeight: '800', marginLeft: '5px', textTransform: 'uppercase'}}>Data de Nascimento</label>
                  <input type="date" style={{...inputStyle, marginTop: '5px'}} onChange={e => setDataNasc(e.target.value)} required />
                </div>
              )}

              <button type="submit" style={{ ...buttonBase, background: ACCENT_GRADIENT, color: '#fff', marginTop: '10px', boxShadow: '0 10px 20px rgba(233, 66, 91, 0.2)' }} disabled={loading}>
                {loading ? 'PROCESSANDO...' : (tela === 'login' ? 'ENTRAR AGORA' : 'FINALIZAR CADASTRO')}
              </button>
            </form>

            <button 
              onClick={() => setTela('inicial')} 
              style={{ background: 'transparent', border: 'none', color: '#bbb', cursor: 'pointer', padding: '20px', fontSize: '14px', fontWeight: '600' }}
            >
              VOLTAR
            </button>
          </div>
        </div>
      )}
    </>
  );
}
