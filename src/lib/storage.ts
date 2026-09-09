import { Gallery, ClientSelectionData, Photo, PhotographerProfile } from '../types';
import { supabase } from './supabase';

const LOCAL_CACHE_KEY = 'izylumna_supabase_galleries_cache_v1';
const PROFILE_CACHE_KEY = 'izylumna_supabase_profile_cache_v1';

// In-memory cache for immediate synchronous renders
let cachedGalleries: Gallery[] = [];
let cachedProfile: PhotographerProfile | null = null;

// Initialize cache from localStorage if available
try {
  const local = localStorage.getItem(LOCAL_CACHE_KEY);
  if (local) {
    cachedGalleries = JSON.parse(local);
  }
  const localProf = localStorage.getItem(PROFILE_CACHE_KEY);
  if (localProf) {
    cachedProfile = JSON.parse(localProf);
  }
} catch (e) {
  console.warn('Failed to parse local cache:', e);
}

function updateLocalCache(galleries: Gallery[]) {
  cachedGalleries = galleries;
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(galleries));
  } catch (e) {
    console.warn('Failed to update local galleries cache:', e);
  }
}

function updateProfileCache(profile: PhotographerProfile) {
  cachedProfile = profile;
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to update local profile cache:', e);
  }
}

/**
 * Generate a unique 4 to 6 digit numeric PIN for a gallery
 */
export function generateUniquePin(existingPins: string[] = []): string {
  const taken = new Set(existingPins);
  let attempt = '';
  for (let i = 0; i < 100; i++) {
    // Generate 4-digit PIN between 1000 and 9999
    attempt = Math.floor(1000 + Math.random() * 9000).toString();
    if (!taken.has(attempt)) {
      return attempt;
    }
  }
  // Fallback to 6-digit PIN
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Maps raw Supabase database rows into a full TypeScript Gallery object
 */
function mapRowToGallery(row: any, photosRows: any[] = [], selectionRow: any = null): Gallery {
  const photos: Photo[] = (photosRows || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    originalFileName: p.original_filename,
    isStarred: p.is_starred || false
  }));

  const selectedPhotoIds: string[] = selectionRow?.selected_photo_ids || [];
  const comments: Record<string, string> = selectionRow?.comments || {};
  const isCompleted = row.status === 'completed';

  return {
    id: row.id,
    title: row.title || 'Galeria sem título',
    clientName: row.client_name || 'Cliente',
    clientEmail: row.client_email || '',
    clientPhone: row.client_phone || '',
    eventDate: row.event_date || new Date().toISOString().split('T')[0],
    description: row.description || '',
    coverPhotoUrl: row.cover_photo_url || (photos[0]?.url || ''),
    status: row.status || 'awaiting_client',
    privacy: row.privacy || 'private',
    pinCode: row.pin_code || '1001',
    quotaIncluded: Number(row.quota_included) || 20,
    excessPolicy: row.excess_policy || 'charge',
    extraPhotoPrice: Number(row.extra_photo_price) || 30,
    watermarkEnabled: row.watermark_enabled ?? true,
    watermarkText: row.watermark_text || 'PROVA • LUMINA STUDIO • PROVA',
    photos,
    clientSelection: {
      selectedPhotoIds,
      comments,
      completedAt: selectionRow?.approved_at || undefined,
      status: isCompleted ? 'submitted' : 'pending'
    },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

/**
 * Fetch all galleries directly from Supabase
 */
export async function getGalleriesAsync(): Promise<Gallery[]> {
  try {
    const { data: dbGalleries, error: galErr } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (galErr) {
      console.error('Error fetching galleries from Supabase:', galErr);
      return cachedGalleries;
    }

    if (!dbGalleries || dbGalleries.length === 0) {
      updateLocalCache([]);
      return [];
    }

    const galleryIds = dbGalleries.map((g) => g.id);

    // Fetch all photos for these galleries
    const { data: dbPhotos } = await supabase
      .from('photos')
      .select('*')
      .in('gallery_id', galleryIds);

    // Fetch all client selections for these galleries
    const { data: dbSelections } = await supabase
      .from('client_selections')
      .select('*')
      .in('gallery_id', galleryIds);

    const photosByGallery: Record<string, any[]> = {};
    (dbPhotos || []).forEach((p) => {
      if (!photosByGallery[p.gallery_id]) photosByGallery[p.gallery_id] = [];
      photosByGallery[p.gallery_id].push(p);
    });

    const selectionsByGallery: Record<string, any> = {};
    (dbSelections || []).forEach((s) => {
      selectionsByGallery[s.gallery_id] = s;
    });

    const galleries: Gallery[] = dbGalleries.map((g) =>
      mapRowToGallery(g, photosByGallery[g.id] || [], selectionsByGallery[g.id] || null)
    );

    updateLocalCache(galleries);
    return galleries;
  } catch (e) {
    console.error('Failed to load galleries from Supabase:', e);
    return cachedGalleries;
  }
}

/**
 * Synchronous getter returning local cached galleries
 */
export function getGalleries(): Gallery[] {
  return cachedGalleries;
}

/**
 * Synchronous getter for gallery by ID
 */
export function getGalleryById(id: string): Gallery | undefined {
  return cachedGalleries.find((g) => g.id === id);
}

/**
 * Fetch a single gallery by its UNIQUE PIN code from Supabase
 */
export async function getGalleryByPinAsync(pinCode: string): Promise<Gallery | null> {
  const cleanPin = pinCode.trim();
  if (!cleanPin) return null;

  try {
    const { data: dbGallery, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('pin_code', cleanPin)
      .maybeSingle();

    if (error || !dbGallery) {
      // Fallback check in cache
      const cached = cachedGalleries.find((g) => g.pinCode === cleanPin);
      return cached || null;
    }

    const { data: dbPhotos } = await supabase
      .from('photos')
      .select('*')
      .eq('gallery_id', dbGallery.id);

    const { data: dbSelection } = await supabase
      .from('client_selections')
      .select('*')
      .eq('gallery_id', dbGallery.id)
      .maybeSingle();

    return mapRowToGallery(dbGallery, dbPhotos || [], dbSelection || null);
  } catch (e) {
    console.error('Error fetching gallery by PIN:', e);
    return cachedGalleries.find((g) => g.pinCode === cleanPin) || null;
  }
}

/**
 * Save or update a Gallery in Supabase
 */
export async function saveGalleryAsync(gallery: Gallery): Promise<Gallery> {
  const now = new Date().toISOString();
  
  // Ensure PIN is unique across galleries
  const existingPins = cachedGalleries.filter((g) => g.id !== gallery.id).map((g) => g.pinCode || '');
  let pinCode = gallery.pinCode?.trim();
  if (!pinCode || existingPins.includes(pinCode)) {
    pinCode = generateUniquePin(existingPins);
  }

  const galleryPayload = {
    title: gallery.title,
    client_name: gallery.clientName,
    client_email: gallery.clientEmail || '',
    client_phone: gallery.clientPhone || '',
    event_date: gallery.eventDate || now.split('T')[0],
    description: gallery.description || '',
    status: gallery.status || 'awaiting_client',
    privacy: gallery.privacy || 'private',
    pin_code: pinCode,
    quota_included: gallery.quotaIncluded,
    excess_policy: gallery.excessPolicy,
    extra_photo_price: gallery.extraPhotoPrice,
    watermark_enabled: gallery.watermarkEnabled,
    watermark_text: gallery.watermarkText || 'PROVA • LUMINA STUDIO • PROVA',
    cover_photo_url: gallery.coverPhotoUrl || (gallery.photos[0]?.url || ''),
    updated_at: now
  };

  let galleryId = gallery.id;

  // Validate if id is valid UUID or generate/upsert
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(galleryId);

  if (isUUID) {
    const { error } = await supabase
      .from('galleries')
      .upsert({ id: galleryId, ...galleryPayload });
    if (error) console.error('Error upserting gallery:', error);
  } else {
    const { data, error } = await supabase
      .from('galleries')
      .insert([galleryPayload])
      .select('id')
      .single();
    if (error) {
      console.error('Error inserting new gallery:', error);
    } else if (data?.id) {
      galleryId = data.id;
    }
  }

  // Sync photos to Supabase
  if (gallery.photos && gallery.photos.length > 0) {
    // Remove old photos for this gallery and insert new set
    await supabase.from('photos').delete().eq('gallery_id', galleryId);

    const photosPayload = gallery.photos.map((p) => ({
      gallery_id: galleryId,
      url: p.url,
      original_filename: p.originalFileName,
      is_starred: p.isStarred || false
    }));

    const { error: photoErr } = await supabase.from('photos').insert(photosPayload);
    if (photoErr) console.error('Error inserting photos:', photoErr);
  }

  // Sync client_selection row
  const selectionPayload = {
    gallery_id: galleryId,
    selected_photo_ids: gallery.clientSelection?.selectedPhotoIds || [],
    comments: gallery.clientSelection?.comments || {},
    approved_at: gallery.clientSelection?.completedAt || null,
    updated_at: now
  };

  await supabase.from('client_selections').upsert(selectionPayload, { onConflict: 'gallery_id' });

  const updatedGallery: Gallery = {
    ...gallery,
    id: galleryId,
    pinCode,
    updatedAt: now
  };

  // Update local memory and cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id || g.id === galleryId);
  let newGalleries: Gallery[];
  if (idx >= 0) {
    newGalleries = [...cachedGalleries];
    newGalleries[idx] = updatedGallery;
  } else {
    newGalleries = [updatedGallery, ...cachedGalleries];
  }
  updateLocalCache(newGalleries);

  return updatedGallery;
}

/**
 * Synchronous wrapper for saveGallery (invokes async save in background)
 */
export function saveGallery(gallery: Gallery): void {
  saveGalleryAsync(gallery);
}

/**
 * Delete gallery from Supabase
 */
export async function deleteGalleryAsync(id: string): Promise<void> {
  const { error } = await supabase.from('galleries').delete().eq('id', id);
  if (error) {
    console.error('Error deleting gallery from Supabase:', error);
  }
  const filtered = cachedGalleries.filter((g) => g.id !== id);
  updateLocalCache(filtered);
}

export function deleteGallery(id: string): void {
  deleteGalleryAsync(id);
}

/**
 * Update client selection in Supabase
 */
export async function updateClientSelectionAsync(
  galleryId: string,
  selection: ClientSelectionData
): Promise<Gallery | undefined> {
  const isSubmitted = selection.status === 'submitted';
  const now = new Date().toISOString();

  // Update client_selections table
  const { error: selErr } = await supabase
    .from('client_selections')
    .upsert(
      {
        gallery_id: galleryId,
        selected_photo_ids: selection.selectedPhotoIds,
        comments: selection.comments,
        approved_at: isSubmitted ? now : null,
        updated_at: now
      },
      { onConflict: 'gallery_id' }
    );

  if (selErr) console.error('Error updating client_selection:', selErr);

  // If submitted, update gallery status to 'completed'
  if (isSubmitted) {
    await supabase
      .from('galleries')
      .update({ status: 'completed', updated_at: now })
      .eq('id', galleryId);
  }

  const gallery = cachedGalleries.find((g) => g.id === galleryId);
  if (gallery) {
    const updatedGallery: Gallery = {
      ...gallery,
      clientSelection: selection,
      status: isSubmitted ? 'completed' : gallery.status,
      updatedAt: now
    };
    const idx = cachedGalleries.findIndex((g) => g.id === galleryId);
    if (idx >= 0) {
      cachedGalleries[idx] = updatedGallery;
      updateLocalCache(cachedGalleries);
    }
    return updatedGallery;
  }

  return undefined;
}

export function updateClientSelection(
  galleryId: string,
  selection: ClientSelectionData
): Gallery | undefined {
  updateClientSelectionAsync(galleryId, selection);
  const gallery = cachedGalleries.find((g) => g.id === galleryId);
  if (gallery) {
    const isSubmitted = selection.status === 'submitted';
    return {
      ...gallery,
      clientSelection: selection,
      status: isSubmitted ? 'completed' : gallery.status
    };
  }
  return undefined;
}

/**
 * Photographer Profile Operations
 */
export async function getPhotographerProfileAsync(): Promise<PhotographerProfile> {
  const defaultProfile: PhotographerProfile = {
    id: 'default-profile',
    name: 'Lumina Studio',
    studioName: 'Lumina Photography',
    email: 'contato@luminastudio.com',
    phone: '(11) 99999-8888',
    defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
    defaultExtraPrice: 30
  };

  try {
    const { data, error } = await supabase
      .from('photographer_profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return cachedProfile || defaultProfile;
    }

    const profile: PhotographerProfile = {
      id: data.id,
      name: data.name || 'Lumina Studio',
      studioName: data.studio_name || 'Lumina Photography',
      email: data.email || 'contato@luminastudio.com',
      phone: data.phone || '(11) 99999-8888',
      defaultWatermarkText: 'PROVA • LUMINA STUDIO • PROVA',
      defaultExtraPrice: 30
    };

    updateProfileCache(profile);
    return profile;
  } catch (e) {
    return cachedProfile || defaultProfile;
  }
}

export async function savePhotographerProfileAsync(
  profile: PhotographerProfile
): Promise<PhotographerProfile> {
  const payload = {
    name: profile.name,
    studio_name: profile.studioName,
    email: profile.email,
    phone: profile.phone || '',
    updated_at: new Date().toISOString()
  };

  if (profile.id && profile.id !== 'default-profile') {
    await supabase.from('photographer_profiles').update(payload).eq('id', profile.id);
  } else {
    const { data } = await supabase.from('photographer_profiles').insert([payload]).select('id').single();
    if (data?.id) profile.id = data.id;
  }

  updateProfileCache(profile);
  return profile;
}

// Generate Lightroom selection string
export function generateLightroomSelectionString(photos: Photo[], stripExtension = false): string {
  return photos
    .map((p) => {
      if (stripExtension) {
        return p.originalFileName.replace(/\.[^/.]+$/, '');
      }
      return p.originalFileName;
    })
    .join(', ');
}

// Download .txt file with complete approval manifest
export function downloadApprovalManifest(gallery: Gallery): void {
  const selectedMap = new Set(gallery.clientSelection.selectedPhotoIds);
  const selectedPhotos = gallery.photos.filter((p) => selectedMap.has(p.id));
  
  const quota = gallery.quotaIncluded;
  const packagePhotos = selectedPhotos.slice(0, quota);
  const extraPhotos = selectedPhotos.slice(quota);

  let extraFinancialDetails = '';
  if (gallery.excessPolicy === 'charge' && extraPhotos.length > 0) {
    const totalExtra = extraPhotos.length * gallery.extraPhotoPrice;
    extraFinancialDetails = `
=== RESUMO FINANCEIRO DE FOTOS EXCEDENTES ===
Fotos Inclusas no Pacote: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
Fotos Extras: ${extraPhotos.length}
Valor Unitário por Extra: R$ ${gallery.extraPhotoPrice.toFixed(2)}
Total Adicional a Receber: R$ ${totalExtra.toFixed(2)}
`;
  } else if (gallery.excessPolicy === 'free_approval') {
    extraFinancialDetails = `
=== POLÍTICA DE EXCEDENTES: APROVAÇÃO PURA (SEM CUSTO ADICIONAL) ===
Fotos Contratadas na Cota: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
Fotos Adicionais Aprovadas para Tratamento: ${Math.max(0, selectedPhotos.length - quota)}
`;
  } else {
    extraFinancialDetails = `
=== POLÍTICA DE EXCEDENTES: BLOQUEIO RÍGIDO ===
Fotos Inclusas / Limite Máximo: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
`;
  }

  let commentsSection = '\n=== OBSERVAÇÕES E COMENTÁRIOS POR FOTO ===\n';
  const commentEntries = Object.entries(gallery.clientSelection.comments || {});
  if (commentEntries.length === 0) {
    commentsSection += 'Nenhum comentário específico adicionado nas fotos.\n';
  } else {
    commentEntries.forEach(([pId, text]) => {
      const ph = gallery.photos.find((p) => p.id === pId);
      if (ph) {
        commentsSection += `• ${ph.originalFileName}: "${text}"\n`;
      }
    });
  }

  const fileContent = `=====================================================
RELATÓRIO DE APROVAÇÃO DE FOTOS - ${gallery.title.toUpperCase()}
Cliente: ${gallery.clientName}
Data do Evento: ${gallery.eventDate}
Data da Seleção: ${gallery.clientSelection.completedAt ? new Date(gallery.clientSelection.completedAt).toLocaleString('pt-BR') : 'Em andamento'}
Status: ${gallery.status.toUpperCase()}
=====================================================

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Com extensão) ---
${generateLightroomSelectionString(selectedPhotos, false)}

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Sem extensão) ---
${generateLightroomSelectionString(selectedPhotos, true)}

${extraFinancialDetails}
=== LISTAGEM DETALHADA DOS ARQUIVOS SELECIONADOS (${selectedPhotos.length} fotos) ===
[1. Dentro do Pacote Contratado - ${packagePhotos.length} fotos]:
${packagePhotos.map((p, idx) => `  ${idx + 1}. ${p.originalFileName} ${gallery.clientSelection.comments[p.id] ? `[Comentário: ${gallery.clientSelection.comments[p.id]}]` : ''}`).join('\n')}

${extraPhotos.length > 0 ? `[2. Fotos Excedentes / Extras - ${extraPhotos.length} fotos]:\n${extraPhotos.map((p, idx) => `  +${idx + 1}. ${p.originalFileName} ${gallery.clientSelection.comments[p.id] ? `[Comentário: ${gallery.clientSelection.comments[p.id]}]` : ''}`).join('\n')}` : '[Nenhuma foto excedente]'}

${commentsSection}
=== MENSAGEM FINAL DO CLIENTE ===
${gallery.clientSelection.clientNotes || 'Nenhuma mensagem adicional informada.'}

=====================================================
Gerado via Photo Proofing Studio • Sistema de Seleção Fotográfica
=====================================================
`;

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aprovacao-${gallery.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
