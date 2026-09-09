import {
  Gallery,
  ClientSelectionData,
  Photo,
  PhotographerProfile,
  GalleryVoter,
  PhotoVote,
  PhotoCommentItem
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_CACHE_KEY = 'izylumna_supabase_galleries_cache_v2';
const PROFILE_CACHE_KEY = 'izylumna_supabase_profile_cache_v2';

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
    attempt = Math.floor(1000 + Math.random() * 9000).toString();
    if (!taken.has(attempt)) {
      return attempt;
    }
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Maps raw Supabase database rows into a full TypeScript Gallery object
 */
function mapRowToGallery(row: any, photosRows: any[] = [], selectionRow: any = null): Gallery {
  const rawVotes: Record<string, PhotoVote[]> = selectionRow?.votes || {};
  const rawCommentsMap: Record<string, PhotoCommentItem[]> = selectionRow?.comments_map || {};

  const photos: Photo[] = (photosRows || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    originalFileName: p.original_filename,
    isStarred: p.is_starred || false,
    votes: rawVotes[p.id] || [],
    commentsList: rawCommentsMap[p.id] || []
  }));

  const selectedPhotoIds: string[] = selectionRow?.selected_photo_ids || [];
  const legacyComments: Record<string, string> = selectionRow?.comments || {};
  const isCompleted = row.status === 'completed';
  const votersList: GalleryVoter[] = selectionRow?.voters || row.voters || [];

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

    // Collaborative Consensus Configuration
    predefinedVoters: row.predefined_voters || [],
    consensusThreshold: Number(row.consensus_threshold) || 2,
    allowFreeVoterRegistration: row.allow_free_voter_registration ?? true,
    voters: votersList,

    quotaIncluded: Number(row.quota_included) || 20,
    excessPolicy: row.excess_policy || 'charge',
    extraPhotoPrice: Number(row.extra_photo_price) || 30,
    watermarkEnabled: row.watermark_enabled ?? true,
    watermarkText: row.watermark_text || 'PROVA • LUMINA STUDIO • PROVA',
    photos,
    clientSelection: {
      selectedPhotoIds,
      comments: legacyComments,
      votes: rawVotes,
      commentsMap: rawCommentsMap,
      voters: votersList,
      completedAt: selectionRow?.approved_at || undefined,
      status: isCompleted ? 'submitted' : 'pending'
    },
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

/**
 * Fetch all galleries with resilient Supabase -> localStorage fallback
 */
export async function getGalleriesAsync(): Promise<Gallery[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getGalleries();
  }
  try {
    const { data: dbGalleries, error: galErr } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (galErr || !dbGalleries) {
      console.warn('[Supabase Fallback] Error fetching galleries from DB (using localStorage):', galErr?.message || galErr);
      return getGalleries();
    }

    if (dbGalleries.length === 0) {
      return cachedGalleries;
    }

    const galleryIds = dbGalleries.map((g) => g.id);

    const { data: dbPhotos } = await supabase
      .from('photos')
      .select('*')
      .in('gallery_id', galleryIds);

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

    const dbMappedGalleries: Gallery[] = dbGalleries.map((g) =>
      mapRowToGallery(g, photosByGallery[g.id] || [], selectionsByGallery[g.id] || null)
    );

    // Merge local-only galleries created in fallback mode
    const mergedMap = new Map<string, Gallery>();
    dbMappedGalleries.forEach((g) => mergedMap.set(g.id, g));
    cachedGalleries.forEach((cg) => {
      if (!mergedMap.has(cg.id)) {
        mergedMap.set(cg.id, cg);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    updateLocalCache(mergedList);
    return mergedList;
  } catch (e) {
    console.warn('[Supabase Fallback] Exception loading galleries from Supabase:', e);
    return getGalleries();
  }
}

export function getGalleries(): Gallery[] {
  return cachedGalleries;
}

export function getGalleryById(id: string): Gallery | undefined {
  return cachedGalleries.find((g) => g.id === id);
}

export async function getGalleryByPinAsync(pinCode: string): Promise<Gallery | null> {
  const cleanPin = pinCode.trim();
  if (!cleanPin) return null;

  if (!isSupabaseConfigured || !supabase) {
    return cachedGalleries.find((g) => g.pinCode === cleanPin) || null;
  }

  try {
    const { data: dbGallery, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('pin_code', cleanPin)
      .maybeSingle();

    if (error || !dbGallery) {
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
    console.warn('[Supabase Fallback] Error fetching gallery by PIN, trying local cache:', e);
    return cachedGalleries.find((g) => g.pinCode === cleanPin) || null;
  }
}

/**
 * Save or update a Gallery in Supabase with automatic local fallback
 */
export async function saveGalleryAsync(gallery: Gallery): Promise<Gallery> {
  const now = new Date().toISOString();

  const existingPins = cachedGalleries.filter((g) => g.id !== gallery.id).map((g) => g.pinCode || '');
  let pinCode = gallery.pinCode?.trim();
  if (!pinCode || existingPins.includes(pinCode)) {
    pinCode = generateUniquePin(existingPins);
  }

  let galleryId = gallery.id;
  const updatedGallery: Gallery = {
    ...gallery,
    id: galleryId,
    pinCode,
    updatedAt: now
  };

  // 1. Immediately update local cache & localStorage
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id || g.id === galleryId);
  let newGalleries: Gallery[];
  if (idx >= 0) {
    newGalleries = [...cachedGalleries];
    newGalleries[idx] = updatedGallery;
  } else {
    newGalleries = [updatedGallery, ...cachedGalleries];
  }
  updateLocalCache(newGalleries);

  // 2. Safely attempt Supabase synchronization if configured
  if (!isSupabaseConfigured || !supabase) {
    return updatedGallery;
  }

  try {
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
      predefined_voters: gallery.predefinedVoters || [],
      consensus_threshold: gallery.consensusThreshold || 2,
      allow_free_voter_registration: gallery.allowFreeVoterRegistration ?? true,
      voters: gallery.voters || [],
      quota_included: gallery.quotaIncluded,
      excess_policy: gallery.excessPolicy,
      extra_photo_price: gallery.extraPhotoPrice,
      watermark_enabled: gallery.watermarkEnabled,
      watermark_text: gallery.watermarkText || 'PROVA • LUMINA STUDIO • PROVA',
      cover_photo_url: gallery.coverPhotoUrl || (gallery.photos[0]?.url || ''),
      updated_at: now
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(galleryId);

    if (isUUID) {
      const { error } = await supabase.from('galleries').upsert({ id: galleryId, ...galleryPayload });
      if (error) {
        console.warn('[Supabase Sync Warning] Failed to upsert gallery (operating in local fallback):', error.message || error);
      }
    } else {
      const { data, error } = await supabase
        .from('galleries')
        .insert([galleryPayload])
        .select('id')
        .single();
      if (error) {
        console.warn('[Supabase Sync Warning] Failed to insert gallery (operating in local fallback):', error.message || error);
      } else if (data?.id) {
        galleryId = data.id;
        updatedGallery.id = galleryId;
        // update local cache with database UUID
        const finalIdx = cachedGalleries.findIndex((g) => g.id === gallery.id || g.id === galleryId);
        if (finalIdx >= 0) {
          cachedGalleries[finalIdx] = updatedGallery;
        } else {
          cachedGalleries = [updatedGallery, ...cachedGalleries];
        }
        updateLocalCache(cachedGalleries);
      }
    }

    // Sync photos
    if (gallery.photos && gallery.photos.length > 0) {
      await supabase.from('photos').delete().eq('gallery_id', galleryId);

      const photosPayload = gallery.photos.map((p) => ({
        id: p.id || crypto.randomUUID(),
        gallery_id: galleryId,
        url: p.url,
        original_filename: p.originalFileName,
        is_starred: p.isStarred || false
      }));

      const { error: photoErr } = await supabase.from('photos').insert(photosPayload);
      if (photoErr) {
        console.warn('[Supabase Sync Warning] Failed to sync photos:', photoErr.message || photoErr);
      }
    }

    // Sync client selections & voting state
    const selectionPayload = {
      gallery_id: galleryId,
      selected_photo_ids: gallery.clientSelection?.selectedPhotoIds || [],
      comments: gallery.clientSelection?.comments || {},
      votes: gallery.clientSelection?.votes || {},
      comments_map: gallery.clientSelection?.commentsMap || {},
      voters: gallery.voters || gallery.clientSelection?.voters || [],
      approved_at: gallery.clientSelection?.completedAt || null,
      updated_at: now
    };

    const { error: selErr } = await supabase
      .from('client_selections')
      .upsert(selectionPayload, { onConflict: 'gallery_id' });
    if (selErr) {
      console.warn('[Supabase Sync Warning] Failed to sync selections:', selErr.message || selErr);
    }
  } catch (e) {
    console.warn('[Supabase Fallback] Network or RLS error saving gallery, saved locally:', e);
  }

  return updatedGallery;
}

export function saveGallery(gallery: Gallery): void {
  saveGalleryAsync(gallery);
}

export async function deleteGalleryAsync(id: string): Promise<void> {
  const filtered = cachedGalleries.filter((g) => g.id !== id);
  updateLocalCache(filtered);

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('galleries').delete().eq('id', id);
    if (error) console.warn('[Supabase Sync Warning] Failed to delete gallery from DB:', error.message);
  } catch (e) {
    console.warn('[Supabase Fallback] Failed deleting gallery from Supabase, removing locally:', e);
  }
}

export function deleteGallery(id: string): void {
  deleteGalleryAsync(id);
}

/**
 * Toggle a vote for a specific photo by a voter with local fallback
 */
export async function togglePhotoVoteAsync(
  gallery: Gallery,
  photoId: string,
  voter: GalleryVoter
): Promise<Gallery> {
  const now = new Date().toISOString();
  const currentVotes: Record<string, PhotoVote[]> = { ...(gallery.clientSelection.votes || {}) };
  const photoVotes: PhotoVote[] = [...(currentVotes[photoId] || [])];

  const existingIdx = photoVotes.findIndex((v) => v.voterId === voter.id);
  if (existingIdx >= 0) {
    photoVotes.splice(existingIdx, 1);
  } else {
    photoVotes.push({
      voterId: voter.id,
      voterName: voter.name,
      createdAt: now
    });
  }

  currentVotes[photoId] = photoVotes;

  const selectedPhotoIds = Object.keys(currentVotes).filter(
    (pId) => (currentVotes[pId] || []).length > 0
  );

  const activeVoters: GalleryVoter[] = [...(gallery.voters || gallery.clientSelection.voters || [])];
  if (!activeVoters.some((v) => v.id === voter.id)) {
    activeVoters.push(voter);
  }

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    selectedPhotoIds,
    votes: currentVotes,
    voters: activeVoters
  };

  const updatedGallery: Gallery = {
    ...gallery,
    voters: activeVoters,
    clientSelection: updatedSelection,
    photos: gallery.photos.map((p) =>
      p.id === photoId ? { ...p, votes: photoVotes } : p
    ),
    updatedAt: now
  };

  // 1. Immediately update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // 2. Try Supabase if configured
  if (!isSupabaseConfigured || !supabase) {
    return updatedGallery;
  }

  try {
    await supabase
      .from('client_selections')
      .upsert(
        {
          gallery_id: gallery.id,
          selected_photo_ids: selectedPhotoIds,
          votes: currentVotes,
          comments_map: gallery.clientSelection.commentsMap || {},
          voters: activeVoters,
          updated_at: now
        },
        { onConflict: 'gallery_id' }
      );
  } catch (e) {
    console.warn('[Supabase Fallback] Error syncing vote to Supabase:', e);
  }

  return updatedGallery;
}

/**
 * Add a comment to a photo from a specific voter with local fallback
 */
export async function addPhotoCommentAsync(
  gallery: Gallery,
  photoId: string,
  voter: GalleryVoter,
  text: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const commentsMap: Record<string, PhotoCommentItem[]> = { ...(gallery.clientSelection.commentsMap || {}) };
  const photoComments: PhotoCommentItem[] = [...(commentsMap[photoId] || [])];

  const newComment: PhotoCommentItem = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    voterId: voter.id,
    voterName: voter.name,
    text: text.trim(),
    createdAt: now
  };

  photoComments.push(newComment);
  commentsMap[photoId] = photoComments;

  const legacyComments = { ...(gallery.clientSelection.comments || {}) };
  legacyComments[photoId] = text.trim();

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    commentsMap,
    comments: legacyComments
  };

  const updatedGallery: Gallery = {
    ...gallery,
    clientSelection: updatedSelection,
    photos: gallery.photos.map((p) =>
      p.id === photoId ? { ...p, commentsList: photoComments } : p
    ),
    updatedAt: now
  };

  // Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // Try Supabase if configured
  if (!isSupabaseConfigured || !supabase) {
    return updatedGallery;
  }

  try {
    await supabase
      .from('client_selections')
      .upsert(
        {
          gallery_id: gallery.id,
          comments: legacyComments,
          comments_map: commentsMap,
          updated_at: now
        },
        { onConflict: 'gallery_id' }
      );
  } catch (e) {
    console.warn('[Supabase Fallback] Error syncing comment to Supabase:', e);
  }

  return updatedGallery;
}

/**
 * Delete a comment from a photo with local fallback
 */
export async function deletePhotoCommentAsync(
  gallery: Gallery,
  photoId: string,
  commentId: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const commentsMap: Record<string, PhotoCommentItem[]> = { ...(gallery.clientSelection.commentsMap || {}) };
  const photoComments = (commentsMap[photoId] || []).filter((c) => c.id !== commentId);

  commentsMap[photoId] = photoComments;

  const legacyComments = { ...(gallery.clientSelection.comments || {}) };
  if (photoComments.length === 0) {
    delete legacyComments[photoId];
  } else {
    legacyComments[photoId] = photoComments[photoComments.length - 1].text;
  }

  const updatedGallery: Gallery = {
    ...gallery,
    clientSelection: {
      ...gallery.clientSelection,
      commentsMap,
      comments: legacyComments
    },
    photos: gallery.photos.map((p) =>
      p.id === photoId ? { ...p, commentsList: photoComments } : p
    ),
    updatedAt: now
  };

  // Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // Try Supabase if configured
  if (!isSupabaseConfigured || !supabase) {
    return updatedGallery;
  }

  try {
    await supabase
      .from('client_selections')
      .upsert(
        {
          gallery_id: gallery.id,
          comments: legacyComments,
          comments_map: commentsMap,
          updated_at: now
        },
        { onConflict: 'gallery_id' }
      );
  } catch (e) {
    console.warn('[Supabase Fallback] Error deleting comment from Supabase:', e);
  }

  return updatedGallery;
}

/**
 * Finalize selection for a specific voter with local fallback
 */
export async function finalizeVoterSelectionAsync(
  gallery: Gallery,
  voterId: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const activeVoters = [...(gallery.voters || gallery.clientSelection.voters || [])];

  const voterIdx = activeVoters.findIndex((v) => v.id === voterId);
  if (voterIdx >= 0) {
    activeVoters[voterIdx] = {
      ...activeVoters[voterIdx],
      hasFinalized: true,
      finalizedAt: now
    };
  }

  const updatedGallery: Gallery = {
    ...gallery,
    voters: activeVoters,
    clientSelection: {
      ...gallery.clientSelection,
      voters: activeVoters
    },
    updatedAt: now
  };

  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  if (!isSupabaseConfigured || !supabase) {
    return updatedGallery;
  }

  try {
    await supabase.from('client_selections').upsert(
      {
        gallery_id: gallery.id,
        voters: activeVoters,
        approved_at: gallery.clientSelection?.completedAt || now,
        updated_at: now
      },
      { onConflict: 'gallery_id' }
    );
    await supabase.from('galleries').update({ voters: activeVoters }).eq('id', gallery.id);
  } catch (e) {
    console.warn('[Supabase Fallback] Error finalizing selection in Supabase:', e);
  }

  return updatedGallery;
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

  if (!isSupabaseConfigured || !supabase) {
    return cachedProfile || defaultProfile;
  }

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
  updateProfileCache(profile);

  if (!isSupabaseConfigured || !supabase) {
    return profile;
  }

  try {
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
  } catch (e) {
    console.warn('[Supabase Fallback] Failed to save profile to DB:', e);
  }

  updateProfileCache(profile);
  return profile;
}

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

export function downloadApprovalManifest(
  gallery: Gallery,
  filterType: 'consensus' | 'all_voted' | 'voter' = 'consensus',
  selectedVoterId?: string
): void {
  const votesMap = gallery.clientSelection.votes || {};
  const threshold = gallery.consensusThreshold || 2;

  let exportPhotos: Photo[] = [];
  let filterTitle = '';

  if (filterType === 'consensus') {
    exportPhotos = gallery.photos.filter((p) => (votesMap[p.id] || []).length >= threshold);
    filterTitle = `FOTOS EM CONSENSO (Mínimo de ${threshold} Votos)`;
  } else if (filterType === 'voter' && selectedVoterId) {
    const voterName = gallery.voters?.find((v) => v.id === selectedVoterId)?.name || 'Votante';
    exportPhotos = gallery.photos.filter((p) =>
      (votesMap[p.id] || []).some((v) => v.voterId === selectedVoterId)
    );
    filterTitle = `SELEÇÃO ISOLADA - ${voterName.toUpperCase()}`;
  } else {
    exportPhotos = gallery.photos.filter((p) => (votesMap[p.id] || []).length > 0);
    filterTitle = `TODAS AS FOTOS COM PELO MENOS 1 VOTO (${exportPhotos.length} fotos)`;
  }

  let commentsSection = '\n=== OBSERVAÇÕES E COMENTÁRIOS DA EQUIPE/CLIENTES ===\n';
  const commentsMap = gallery.clientSelection.commentsMap || {};
  let totalCommentsCount = 0;

  gallery.photos.forEach((p) => {
    const cList = commentsMap[p.id] || [];
    if (cList.length > 0) {
      commentsSection += `\n📷 ${p.originalFileName}:\n`;
      cList.forEach((c) => {
        totalCommentsCount++;
        commentsSection += `   - [${c.voterName}] ("${c.text}") às ${new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
      });
    }
  });

  if (totalCommentsCount === 0) {
    commentsSection += 'Nenhum comentário específico foi adicionado nas fotos.\n';
  }

  const fileContent = `=====================================================
RELATÓRIO DE CONSENSO E APROVAÇÃO - ${gallery.title.toUpperCase()}
Cliente Principal: ${gallery.clientName}
Data do Evento: ${gallery.eventDate}
Regra de Consenso: Mínimo ${threshold} votos por foto
Filtro de Exportação: ${filterTitle}
=====================================================

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Com extensão) ---
${generateLightroomSelectionString(exportPhotos, false)}

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Sem extensão) ---
${generateLightroomSelectionString(exportPhotos, true)}

=== PARTICIPANTES DA VOTAÇÃO ===
${(gallery.voters || []).map((v) => `• ${v.name} ${v.isDecisionMaker ? '[Tomador Principal]' : ''} - Status: ${v.hasFinalized ? '✅ Finalizou Seleção' : '⏳ Em Votação'}`).join('\n') || 'Nenhum participante registrado ainda.'}

=== LISTAGEM DAS FOTOS DA EXPORTAÇÃO (${exportPhotos.length} fotos) ===
${exportPhotos.map((p, idx) => {
  const vList = votesMap[p.id] || [];
  const votersWhoVoted = vList.map((v) => v.voterName).join(', ');
  return `${idx + 1}. ${p.originalFileName} (❤️ ${vList.length} votos ${votersWhoVoted ? `por ${votersWhoVoted}` : ''})`;
}).join('\n')}

${commentsSection}

=====================================================
Gerado via IzyLumna • Sistema Colaborativo de Prova Fotográfica
=====================================================
`;

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `consenso-${gallery.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
