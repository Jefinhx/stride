import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código de autorização não encontrado' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log("--- Iniciando Sincronização Completa ---");

    // 1. Troca o código pelo Token de Acesso
    const responseToken = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, athlete } = responseToken.data;
    const athleteIdStr = athlete.id.toString();

    // 2. Busca TODAS as atividades do Strava (Loop de paginação)
    let pagina = 1;
    let todasAtividadesRaw = [];
    let temMais = true;

    while (temMais) {
      const res = await axios.get(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${pagina}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (res.data.length > 0) {
        todasAtividadesRaw = [...todasAtividadesRaw, ...res.data];
        pagina++;
      } else {
        temMais = false;
      }
    }

    console.log(`Total capturado no Strava: ${todasAtividadesRaw.length} atividades.`);

    // 3. PASSO CRUCIAL: Salvar o Perfil PRIMEIRO (Devido ao vínculo user_id no seu banco)
    const { error: errorPerfil } = await supabase.from('perfis').upsert({ 
      id: athleteIdStr, 
      nome: athlete.firstname + " " + athlete.lastname,
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      updated_at: new Date().toISOString()
    });

    if (errorPerfil) throw new Error(`Erro ao salvar perfil: ${errorPerfil.message}`);

    // 4. Formata as atividades para bater com as colunas do seu print
    const atividadesParaSalvar = todasAtividadesRaw.map(ativ => ({
      id: ativ.id, // O banco deve ser bigint para aceitar esse ID
      user_id: athleteIdStr,
      titulo: ativ.name,
      distancia_km: ativ.distance / 1000,
      tempo_total_segundos: ativ.moving_time,
      velocidade_kmh: ativ.moving_time > 0 ? (ativ.distance / 1000) / (ativ.moving_time / 3600) : 0,
      ganho_elevacao: ativ.total_elevation_gain || 0,
      ganho_elevacao_real: ativ.total_elevation_gain || 0,
      calorias_estimadas: (ativ.distance / 1000) * 65, // Cálculo base
      cadencia_media_ppm: ativ.average_cadence ? Math.round(ativ.average_cadence * 2) : 0, // Estimativa se disponível
      data_corrida: ativ.start_date
    }));

    // 5. Salva as Atividades no Banco
    const { error: errorAtiv } = await supabase
      .from('atividades')
      .upsert(atividadesParaSalvar, { onConflict: 'id' });

    if (errorAtiv) throw new Error(`Erro ao salvar atividades: ${errorAtiv.message}`);

    console.log("Sincronização finalizada com sucesso!");

    // 6. Redireciona para o Dashboard Cyan
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('ERRO FATAL NA ROTA:', error.message);
    return NextResponse.json({ 
      error: 'Falha na sincronização dos dados',
      detalhes: error.message 
    }, { status: 500 });
  }
}
