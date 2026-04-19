import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  console.log("--- INICIANDO CALLBACK STRAVA (SEM STRAVA_ID) ---");

  if (!code || !userId) {
    console.error("❌ Erro: Code ou UserId ausentes");
    return NextResponse.redirect(`${origin}/?error=missing_data`);
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
    console.log("✅ Token obtido para o atleta:", athlete.id);

    // 2. Salva no Perfil (Removido strava_id conforme solicitado)
    const { error: perfError } = await supabase.from('perfis').upsert({ 
      id: userId, 
      nome: `${athlete.firstname} ${athlete.lastname}`,
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      updated_at: new Date().toISOString()
    });

    if (perfError) {
      console.error("❌ Erro no Supabase:", perfError.message);
      throw perfError;
    }

    // 3. Importação das Atividades (Loop total)
    let todasAtividades = [];
    let pagina = 1;
    let buscando = true;

    while (buscando) {
      const resAtiv = await axios.get(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${pagina}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      
      const dadosPagina = resAtiv.data || [];
      todasAtividades = [...todasAtividades, ...dadosPagina];

      if (dadosPagina.length < 200) {
        buscando = false; 
      } else {
        pagina++;
      }
    }

    if (todasAtividades.length > 0) {
      console.log(`💾 Salvando ${todasAtividades.length} atividades...`);
      const formatadas = todasAtividades.map(ativ => ({
        user_id: userId,
        strava_activity_id: ativ.id.toString(),
        titulo: ativ.name,
        distancia_km: Number((ativ.distance / 1000).toFixed(2)),
        tempo_total_segundos: parseInt(ativ.moving_time),
        velocidade_kmh: ativ.moving_time > 0 
          ? Number(((ativ.distance / 1000) / (ativ.moving_time / 3600)).toFixed(2)) 
          : 0,
        data_corrida: ativ.start_date,
        calorias_estimadas: Number(((ativ.distance / 1000) * 70).toFixed(2)),
        cadencia_media_ppm: ativ.average_cadence ? Math.round(ativ.average_cadence * 2) : 0
      }));

      // Garanta que a coluna 'strava_activity_id' ainda existe e é UNIQUE no banco!
      const { error: ativError } = await supabase.from('atividades').upsert(formatadas, { onConflict: 'strava_activity_id' });
      if (ativError) console.error("❌ Erro no upsert de atividades:", ativError.message);
    }

    console.log("🏁 Processo concluído!");
    return NextResponse.redirect(`${origin}/home?importado=${todasAtividades.length}`);

  } catch (error) {
    console.error('🔥 ERRO CRÍTICO:', error.message);
    return NextResponse.redirect(`${origin}/?error=true`);
  }
}
