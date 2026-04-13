import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  if (!code || !userId) {
    console.error("❌ Erro: Dados ausentes");
    return NextResponse.redirect(`${origin}/?error=true`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // 1. Troca tokens no Strava
    const responseToken = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, athlete } = responseToken.data;

    // 2. PASSO CRUCIAL: Garantir que o perfil existe antes das atividades
    // Sem isso, a chave estrangeira (aquela linha do print) bloqueia o insert
    const { error: perfError } = await supabase.from('perfis').upsert({ 
      id: userId, // O seu UUID do login
      nome: `${athlete.firstname} ${athlete.lastname}`,
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      updated_at: new Date().toISOString()
    });

    if (perfError) {
      console.error("❌ Erro ao salvar perfil:", perfError.message);
      throw new Error("Erro no Perfil");
    }

    // 3. Busca Atividades
    const resAtiv = await axios.get(
      `https://www.strava.com/api/v3/athlete/activities?per_page=100`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const atividades = resAtiv.data || [];

    // 4. Mapeamento fiel às colunas do seu print
    if (atividades.length > 0) {
      const formatadas = atividades.map(ativ => ({
        user_id: userId,
        titulo: ativ.name,
        distancia_km: Number((ativ.distance / 1000).toFixed(2)), // Garante float8
        tempo_total_segundos: parseInt(ativ.moving_time), // Garante int4
        velocidade_kmh: ativ.moving_time > 0 ? Number(((ativ.distance / 1000) / (ativ.moving_time / 3600)).toFixed(2)) : 0,
        ganho_elevacao: Number(ativ.total_elevation_gain || 0),
        data_corrida: ativ.start_date,
        calorias_estimadas: Number(((ativ.distance / 1000) * 65).toFixed(2)),
        ganho_elevacao_real: Number(ativ.total_elevation_gain || 0),
        cadencia_media_ppm: ativ.average_cadence ? Math.round(ativ.average_cadence * 2) : 0,
        created_at: new Date().toISOString()
      }));

      const { error: ativError } = await supabase.from('atividades').insert(formatadas);

      if (ativError) {
        console.error("❌ ERRO NO INSERT DAS ATIVIDADES:", ativError.message);
        console.error("DETALHES:", ativError.details);
      } else {
        console.log("✅ TUDO SALVO COM SUCESSO!");
      }
    }

    return NextResponse.redirect(`${origin}/?importado=${atividades.length}`);

  } catch (error) {
    console.error('🔥 ERRO CRÍTICO:', error.message);
    return NextResponse.redirect(`${origin}/?error=true`);
  }
}
