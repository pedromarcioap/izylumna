import { supabase } from './supabase';
import { 
  PhotographerIntegration, 
  LightroomCatalog, 
  LightroomAlbum, 
  LightroomAsset, 
  Gallery, 
  Photo 
} from '../types';

// ==============================================================================
// Adobe Lightroom Cloud API Configuration & Utilities
// ==============================================================================

const ADOBE_CLIENT_ID = import.meta.env.VITE_ADOBE_CLIENT_ID || '';
const ADOBE_REDIRECT_URI = import.meta.env.VITE_ADOBE_REDIRECT_URI || `${window.location.origin}/adobe/callback`;
const ADOBE_IMS_HOST = 'https://ims-na1.adobelogin.com';
const ADOBE_LR_HOST = 'https://lr.adobe.io';

/**
 * Generates the Adobe IMS OAuth 2.0 authorization URL
 */
export function getAdobeOAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: ADOBE_CLIENT_ID,
    response_type: 'code',
    scope: 'openid,lr_partner_apis',
    redirect_uri: ADOBE_REDIRECT_URI,
  });

  if (state) {
    params.append('state', state);
  }

  return `${ADOBE_IMS_HOST}/ims/authorize/v2?${params.toString()}`;
}

/**
 * Exchanges authorization code for access & refresh tokens securely.
 * Uses client-side or Edge Function proxy depending on environment setup.
 */
export async function exchangeAdobeCodeForToken(code: string, userId: string): Promise<PhotographerIntegration> {
  const clientSecret = import.meta.env.VITE_ADOBE_CLIENT_SECRET || '';

  let tokenData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    account_email?: string;
    account_name?: string;
  };

  try {
    // 1. Try Vercel Serverless Function /api/adobe-token first
    let vercelSuccess = false;
    try {
      const vercelRes = await fetch('/api/adobe-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: ADOBE_REDIRECT_URI }),
      });

      if (vercelRes.ok) {
        tokenData = await vercelRes.json();
        vercelSuccess = true;
      }
    } catch (vErr) {
      console.warn('[Adobe OAuth] Vercel Serverless Function /api/adobe-token not reached, checking fallback:', vErr);
    }

    if (!vercelSuccess) {
      // 2. Try Supabase Edge Function if available
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('adobe-token-exchange', {
        body: { code, redirect_uri: ADOBE_REDIRECT_URI }
      });

      if (!edgeError && edgeData?.access_token) {
        tokenData = edgeData;
      } else {
        // 3. Fallback to direct IMS call (for dev environments)
        const bodyParams = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ADOBE_CLIENT_ID,
          client_secret: clientSecret,
          code: code,
          redirect_uri: ADOBE_REDIRECT_URI,
        });

        const response = await fetch(`${ADOBE_IMS_HOST}/ims/token/v3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Adobe Token Exchange failed (${response.status}): ${errText}`);
        }

        tokenData = await response.json();
      }
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString();

    // Query photographer's Adobe catalog ID right away
    let catalogId: string | null = null;
    try {
      const catalog = await getLightroomCatalog(tokenData.access_token);
      catalogId = catalog.id;
    } catch (catErr) {
      console.warn('Could not auto-fetch Adobe catalog on auth callback:', catErr);
    }

    // Persist or update integration in Supabase database
    const payload = {
      user_id: userId,
      provider: 'adobe' as const,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      catalog_id: catalogId,
      account_email: tokenData.account_email || null,
      account_name: tokenData.account_name || null,
      updated_at: new Date().toISOString(),
    };

    const { data: savedData, error: dbError } = await supabase
      .from('photographer_integrations')
      .upsert(payload, { onConflict: 'user_id,provider' })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving Adobe integration to Supabase:', dbError);
      throw new Error(`Erro ao salvar credenciais da Adobe no banco de dados: ${dbError.message}`);
    }

    return savedData as PhotographerIntegration;
  } catch (err: any) {
    console.error('exchangeAdobeCodeForToken Error:', err);
    throw err;
  }
}

/**
 * Fetches the active Adobe integration record for a given user, auto-refreshing token if expired.
 */
export async function getValidAdobeAccessToken(userId: string): Promise<{ accessToken: string; catalogId?: string; integration: PhotographerIntegration } | null> {
  const { data: integration, error } = await supabase
    .from('photographer_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'adobe')
    .maybeSingle();

  if (error || !integration) {
    return null;
  }

  const expiresAt = new Date(integration.expires_at).getTime();
  const now = Date.now();
  
  // If token expires within 5 minutes, trigger automatic refresh
  if (expiresAt - now < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAdobeToken(integration);
      return {
        accessToken: refreshed.access_token,
        catalogId: refreshed.catalog_id || undefined,
        integration: refreshed,
      };
    } catch (refreshErr) {
      console.error('Failed to auto-refresh Adobe token:', refreshErr);
      return null;
    }
  }

  return {
    accessToken: integration.access_token,
    catalogId: integration.catalog_id || undefined,
    integration: integration as PhotographerIntegration,
  };
}

/**
 * Refresh expired Adobe Access Token using Refresh Token
 */
export async function refreshAdobeToken(integration: PhotographerIntegration): Promise<PhotographerIntegration> {
  const clientSecret = import.meta.env.VITE_ADOBE_CLIENT_SECRET || '';

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: ADOBE_CLIENT_ID,
    client_secret: clientSecret,
    refresh_token: integration.refresh_token,
  });

  const response = await fetch(`${ADOBE_IMS_HOST}/ims/token/v3`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Falha ao renovar token Adobe: ${errText}`);
  }

  const tokenData = await response.json();
  const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString();

  const updatedPayload = {
    ...integration,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || integration.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('photographer_integrations')
    .update(updatedPayload)
    .eq('id', integration.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar token no banco: ${error.message}`);
  }

  return updated as PhotographerIntegration;
}

/**
 * Disconnects Adobe Lightroom integration by deleting integration row
 */
export async function disconnectAdobeIntegration(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('photographer_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'adobe');

  if (error) {
    console.error('Error disconnecting Adobe integration:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// Adobe Lightroom Cloud API Methods
// ==============================================================================

function getAdobeHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-API-Key': ADOBE_CLIENT_ID,
    'Accept': 'application/json',
  };
}

/**
 * GET /v2/catalogs - Retrieve photographer's default Lightroom catalog
 */
export async function getLightroomCatalog(accessToken: string): Promise<LightroomCatalog> {
  const response = await fetch(`${ADOBE_LR_HOST}/v2/catalogs`, {
    headers: getAdobeHeaders(accessToken),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao obter catálogo do Lightroom (${response.status}): ${text}`);
  }

  const data = await response.json();
  // Response may return catalog directly or inside a payload array
  if (data.id) return data;
  if (data.catalogs && data.catalogs.length > 0) return data.catalogs[0];
  
  throw new Error('Nenhum catálogo ativo encontrado na conta Adobe Lightroom.');
}

/**
 * GET /v2/catalogs/{catalog_id}/albums - List all albums in Lightroom Cloud
 */
export async function listLightroomAlbums(accessToken: string, catalogId: string): Promise<LightroomAlbum[]> {
  const response = await fetch(`${ADOBE_LR_HOST}/v2/catalogs/${catalogId}/albums`, {
    headers: getAdobeHeaders(accessToken),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao listar álbuns da Adobe (${response.status}): ${text}`);
  }

  const rawText = await response.text();
  // Adobe API prefix defense check (while(1);)
  const cleanJson = rawText.replace(/^while\s*\(\s*1\s*\)\s*;\s*/, '');
  const data = JSON.parse(cleanJson);

  const albums: LightroomAlbum[] = (data.resources || []).map((res: any) => ({
    id: res.id,
    type: res.type,
    subtype: res.subtype,
    created: res.created,
    updated: res.updated,
    payload: {
      name: res.payload?.name || 'Álbum Sem Nome',
      cover: res.payload?.cover,
    },
    assetCount: res.assetCount || 0,
  }));

  return albums;
}

/**
 * GET /v2/catalogs/{catalog_id}/albums/{album_id}/assets - Fetch assets inside album
 */
export async function getAlbumAssets(
  accessToken: string, 
  catalogId: string, 
  albumId: string
): Promise<LightroomAsset[]> {
  const response = await fetch(`${ADOBE_LR_HOST}/v2/catalogs/${catalogId}/albums/${albumId}/assets`, {
    headers: getAdobeHeaders(accessToken),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao obter fotos do álbum da Adobe (${response.status}): ${text}`);
  }

  const rawText = await response.text();
  const cleanJson = rawText.replace(/^while\s*\(\s*1\s*\)\s*;\s*/, '');
  const data = JSON.parse(cleanJson);

  const assets: LightroomAsset[] = (data.resources || []).map((res: any) => {
    const assetId = res.asset?.id || res.id;
    // Adobe 2048px web rendition URL
    const renditionUrl = `${ADOBE_LR_HOST}/v2/catalogs/${catalogId}/assets/${assetId}/renditions/2048`;

    return {
      id: assetId,
      type: res.asset?.type || res.type || 'image',
      created: res.created,
      updated: res.updated,
      payload: {
        fileName: res.asset?.payload?.importSource?.fileName || res.payload?.fileName || `adobe_${assetId}.jpg`,
        captureDate: res.asset?.payload?.captureDate,
        ratings: res.asset?.payload?.ratings,
        flags: res.asset?.payload?.flags,
      },
      renditionUrl,
    };
  });

  return assets;
}

/**
 * Sync Client votes back to Adobe Lightroom Cloud!
 * Sets 5-star rating and/or 'pick' flag on selected assets in Lightroom.
 */
export async function syncClientVotesToAdobe(
  accessToken: string,
  catalogId: string,
  photos: Photo[],
  selectedPhotoIds: string[]
): Promise<{ successCount: number; failedCount: number }> {
  let successCount = 0;
  let failedCount = 0;

  const targetPhotos = photos.filter(p => p.adobeAssetId && selectedPhotoIds.includes(p.id));

  for (const photo of targetPhotos) {
    try {
      const assetId = photo.adobeAssetId!;
      const url = `${ADOBE_LR_HOST}/v2/catalogs/${catalogId}/assets/${assetId}`;

      const payload = {
        subtype: 'image',
        payload: {
          ratings: {
            izylumna: { rating: 5 }
          },
          flags: {
            izylumna: { flag: 'pick' }
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAdobeHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        successCount++;
      } else {
        console.warn(`Failed to sync photo ${photo.originalFileName} to Lightroom:`, await response.text());
        failedCount++;
      }
    } catch (err) {
      console.error(`Error syncing asset ${photo.id} to Adobe:`, err);
      failedCount++;
    }
  }

  return { successCount, failedCount };
}
