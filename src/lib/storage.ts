import {
  Gallery,
  ClientSelectionData,
  Photo,
  PhotographerProfile,
  GalleryVoter,
  PhotoVote,
  PhotoCommentItem,
  Order
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_GALLERIES } from '../mockData';
import {
  notifyVoteEvent,
  notifyRatingEvent,
  notifyCommentEvent,
  notifyFinalizeEvent
} from './notifications';

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
  if (!Array.isArray(cachedGalleries) || cachedGalleries.length === 0) {
    cachedGalleries = INITIAL_GALLERIES;
  }
  const localProf = localStorage.getItem(PROFILE_CACHE_KEY);
  if (localProf) {
    cachedProfile = JSON.parse(localProf);
  }
} catch (e) {
  console.warn('Failed to parse local cache:', e);
  cachedGalleries = INITIAL_GALLERIES;
}

function clearOldCacheKeys(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key !== LOCAL_CACHE_KEY &&
        key !== PROFILE_CACHE_KEY &&
        (key.includes('cache') || key.startsWith('izylumna_') || key.startsWith('supabase_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[Cache Cleanup] Failed to remove old cache keys:', err);
  }
}

/**
 * Sanitizes gallery object for local storage to avoid QuotaExceededError.
 * Removes temporary blob: URLs while preserving valid photo objects.
 */
function sanitizeGalleryForCache(gallery: Gallery): Gallery {
  const isCoverInvalid =
    !gallery.coverPhotoUrl ||
    gallery.coverPhotoUrl.startsWith('blob:');

  const sanitizedCoverPhotoUrl = isCoverInvalid ? '' : gallery.coverPhotoUrl;

  const sanitizedPhotos = (gallery.photos || [])
    .filter((p) => p.url && !p.url.startsWith('blob:'))
    .map((p) => ({
      ...p,
      url: p.url || ''
    }));

  return {
    ...gallery,
    coverPhotoUrl: sanitizedCoverPhotoUrl,
    photos: sanitizedPhotos
  };
}

/**
 * Updates galleries local cache safely with try/catch, sanitization, and QuotaExceededError fallback.
 */
export function updateGalleriesCache(galleries: Gallery[]): void {
  cachedGalleries = galleries;
  try {
    const sanitized = galleries.map(sanitizeGalleryForCache);
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sanitized));
  } catch (e: any) {
    console.warn('[Cache Warning] Failed to update local galleries cache on first attempt:', e?.message || e);

    try {
      // 1. Clear old cache keys from localStorage
      clearOldCacheKeys();

      // 2. Retry setItem with sanitized galleries
      const sanitized = galleries.map(sanitizeGalleryForCache);
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(sanitized));
    } catch (retryErr: any) {
      console.warn('[Cache Warning] Storage failed after clearing old cache keys. Trying minimal metadata:', retryErr?.message || retryErr);

      try {
        // 3. Fallback: Save only essential metadata without photos
        const minimal = galleries.map((g) => ({
          id: g.id,
          title: g.title,
          clientName: g.clientName,
          clientEmail: g.clientEmail,
          clientPhone: g.clientPhone,
          eventDate: g.eventDate,
          status: g.status,
          privacy: g.privacy,
          pinCode: g.pinCode,
          coverPhotoUrl: g.coverPhotoUrl && !g.coverPhotoUrl.startsWith('data:') && g.coverPhotoUrl.length < 500 ? g.coverPhotoUrl : '',
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        }));
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(minimal));
      } catch (finalErr) {
        // Continue silently without crashing application flow
        console.warn('[Cache Warning] QuotaExceededError persisted. Continuing in-memory without localStorage cache.', finalErr);
      }
    }
  }
}

function updateLocalCache(galleries: Gallery[]) {
  updateGalleriesCache(galleries);
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
  const rawRatingsMap: Record<string, number> = selectionRow?.ratings_map || selectionRow?.ratingsMap || selectionRow?.ratings || {};

  const photos: Photo[] = (photosRows || [])
    .filter((p: any) => p.url && !p.url.startsWith('blob:'))
    .map((p: any) => ({
      id: p.id || crypto.randomUUID(),
      url: p.url || '',
      originalFileName: p.original_filename || p.originalFileName || '',
      isStarred: Boolean(p.is_starred ?? p.isStarred),
      rating: (typeof p.rating === 'number' && p.rating > 0)
        ? p.rating
        : (typeof p.rating_val === 'number' && p.rating_val > 0)
        ? p.rating_val
        : (typeof rawRatingsMap[p.id] === 'number' ? rawRatingsMap[p.id] : 0),
      metadata: p.metadata || null,
      votes: rawVotes[p.id] || [],
      commentsList: rawCommentsMap[p.id] || []
    }));

  const selectedPhotoIds: string[] =
    selectionRow?.selected_photo_ids || selectionRow?.selected_photos || [];
  const legacyComments: Record<string, string> = selectionRow?.comments || {};
  const isCompleted = row.status === 'completed';
  const votersList: GalleryVoter[] = Array.isArray(selectionRow?.voters)
    ? selectionRow.voters
    : Array.isArray(row.voters)
    ? row.voters
    : [];
  const approvedAt = selectionRow?.approved_at || selectionRow?.finalized_at || undefined;

  const rawCoverUrl = row.cover_photo_url;
  const coverPhotoUrl = (rawCoverUrl && !rawCoverUrl.startsWith('blob:'))
    ? rawCoverUrl
    : (photos[0]?.url || '');

  return {
    id: row.id,
    title: row.title || 'Galeria sem título',
    clientName: row.client_name || 'Cliente',
    clientEmail: row.client_email || '',
    clientPhone: row.client_phone || '',
    eventDate: row.event_date || new Date().toISOString().split('T')[0],
    description: row.description || '',
    coverPhotoUrl,
    status: row.status || 'awaiting_client',
    privacy: row.privacy || 'private',
    pinCode: row.pin_code || '1001',

    // Collaborative Consensus Configuration
    predefinedVoters: Array.isArray(row.predefined_voters) ? row.predefined_voters : [],
    consensusThreshold: Number(row.consensus_threshold) || 2,
    allowFreeVoterRegistration: Boolean(row.allow_free_voter_registration ?? true),
    voters: votersList,

    quotaIncluded: Number(row.quota_included) || 20,
    maxContractedPhotos: Number(row.max_contracted_photos ?? row.quota_included) || 20,
    excessPolicy: row.excess_policy || 'charge',
    extraPhotoPrice: Number(row.extra_photo_price) || 25,
    galleryClosureFee: Number(row.gallery_closure_fee) || 6.90,
    platformCommissionRate: Number(row.platform_commission_rate) || 0.08,
    paymentStatus: (row.payment_status as any) || 'pending',
    watermarkEnabled: Boolean(row.watermark_enabled ?? true),
    watermarkText: row.watermark_text || 'PROVA • LUMINA STUDIO • PROVA',
    watermarkPosition: row.watermark_position || 'both',
    watermarkOpacity: typeof row.watermark_opacity === 'number' ? row.watermark_opacity : 0.25,
    photos,
    clientSelection: {
      id: selectionRow?.id,
      selectedPhotoIds,
      comments: legacyComments,
      votes: rawVotes,
      commentsMap: rawCommentsMap,
      ratingsMap: rawRatingsMap,
      voters: votersList,
      completedAt: approvedAt,
      status: isCompleted ? 'submitted' : 'pending'
    },
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

/**
 * Sync photos array to Supabase with explicit photo ID generation.
 * Strictly excludes temporary blob: URLs from being stored in Supabase.
 */
export async function syncPhotos(galleryId: string, photos: Photo[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !photos || photos.length === 0) return;

  try {
    await supabase.from('photos').delete().eq('gallery_id', galleryId);

    // Filter out photos with temporary blob: URLs
    const validPhotos = photos.filter((p) => p.url && !p.url.startsWith('blob:'));
    if (validPhotos.length === 0) return;

    const photoPayload = validPhotos.map((p) => ({
      id: (p.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id))
        ? p.id
        : crypto.randomUUID(),
      gallery_id: galleryId,
      url: p.url,
      original_filename: p.originalFileName || (p as any).original_filename || '',
      is_starred: Boolean(p.isStarred ?? (p as any).is_starred),
      rating: typeof p.rating === 'number' ? p.rating : 0,
      metadata: p.metadata || null
    }));

    const { error } = await supabase.from('photos').insert(photoPayload);
    if (error) {
      console.warn('[Supabase Sync Warning] Failed to sync photos:', error.message || error);
    }
  } catch (e) {
    console.warn('[Supabase Sync Warning] Exception syncing photos:', e);
  }
}

/**
 * Save or update client selections in Supabase (populating both approved_at and finalized_at)
 * Includes graceful fallback if schema cache lacks optional columns like comments_map
 */
export async function saveClientSelection(
  galleryId: string,
  clientSelection: ClientSelectionData,
  status?: string,
  voters?: GalleryVoter[]
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const now = new Date().toISOString();
  const isFinalized =
    status === 'completed' ||
    clientSelection?.status === 'submitted' ||
    !!clientSelection?.completedAt;
  const timestamp = clientSelection?.completedAt || (isFinalized ? now : null);

  const selectedPhotoIdsList = Array.isArray(clientSelection?.selectedPhotoIds)
    ? clientSelection.selectedPhotoIds
    : Array.isArray((clientSelection as any)?.selectedPhotos)
    ? (clientSelection as any).selectedPhotos
    : [];

  const selectionId = clientSelection?.id || crypto.randomUUID();

  const fullPayload: any = {
    id: selectionId,
    gallery_id: galleryId,
    selected_photo_ids: selectedPhotoIdsList,
    selected_photos: selectedPhotoIdsList,
    comments: clientSelection?.comments || {},
    votes: clientSelection?.votes || {},
    comments_map: clientSelection?.commentsMap || {},
    ratings_map: clientSelection?.ratingsMap || {},
    voters: Array.isArray(voters || clientSelection?.voters)
      ? (voters || clientSelection?.voters)
      : [],
    approved_at: timestamp,
    finalized_at: timestamp,
    updated_at: now
  };

  // Strip any properties with value undefined
  Object.keys(fullPayload).forEach((key) => {
    if (fullPayload[key] === undefined) {
      delete fullPayload[key];
    }
  });

  try {
    let currentPayload: any = { ...fullPayload };
    let { error } = await supabase
      .from('client_selections')
      .upsert(currentPayload, { onConflict: 'gallery_id' });

    if (error) {
      // Dynamically strip missing columns reported by PostgREST schema cache without logging early warnings
      for (let attempt = 0; attempt < 6 && error; attempt++) {
        const match = error.message?.match(/Could not find the '([^']+)' column/i);
        if (match && match[1] && match[1] in currentPayload && match[1] !== 'gallery_id') {
          const missingCol = match[1];
          delete currentPayload[missingCol];
          const retryRes = await supabase
            .from('client_selections')
            .upsert(currentPayload, { onConflict: 'gallery_id' });
          error = retryRes.error;
        } else {
          break;
        }
      }
      if (error) {
        console.warn('[Supabase Sync Warning] Final client selection save attempt failed:', error.message || error);
      }
    }
  } catch (e) {
    console.warn('[Supabase Sync Warning] Exception saving client selection:', e);
  }
}

export const TRASH_RETENTION_DAYS = 15;

/**
 * Calculates remaining days before permanent deletion from trash.
 */
export function getDaysUntilPermanentDeletion(deletedAt?: string | null, retentionDays: number = TRASH_RETENTION_DAYS): number {
  if (!deletedAt) return retentionDays;
  const deletedTime = new Date(deletedAt).getTime();
  if (isNaN(deletedTime)) return retentionDays;
  const now = new Date().getTime();
  const elapsedMs = now - deletedTime;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const remaining = Math.ceil(retentionDays - elapsedDays);
  return remaining > 0 ? remaining : 0;
}

/**
 * Checks if a gallery in trash has exceeded the 15-day retention period.
 */
export function isTrashExpired(deletedAt?: string | null, retentionDays: number = TRASH_RETENTION_DAYS): boolean {
  if (!deletedAt) return false;
  return getDaysUntilPermanentDeletion(deletedAt, retentionDays) <= 0;
}

/**
 * Fetch all galleries (active and soft-deleted in trash) with resilient Supabase -> localStorage fallback,
 * automatically purging items that exceeded 15 days in trash.
 */
export async function getAllGalleriesWithTrashAsync(): Promise<Gallery[]> {
  if (!isSupabaseConfigured || !supabase) {
    const list = cachedGalleries.length > 0 ? cachedGalleries : INITIAL_GALLERIES;
    return list.filter((g) => !isTrashExpired(g.deletedAt));
  }
  try {
    const { data: dbGalleries, error: galErr } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (galErr || !dbGalleries) {
      console.warn('[Supabase Fallback] Error fetching galleries from DB (using localStorage):', galErr?.message || galErr);
      const list = cachedGalleries.length > 0 ? cachedGalleries : INITIAL_GALLERIES;
      return list.filter((g) => !isTrashExpired(g.deletedAt));
    }

    if (dbGalleries.length === 0) {
      const list = cachedGalleries.length > 0 ? cachedGalleries : INITIAL_GALLERIES;
      return list.filter((g) => !isTrashExpired(g.deletedAt));
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

    // Merge local-only galleries & preserve local photos
    const mergedMap = new Map<string, Gallery>();

    dbMappedGalleries.forEach((g) => {
      const localGal = cachedGalleries.find((cg) => cg.id === g.id);
      if (localGal && localGal.photos && localGal.photos.length > g.photos.length) {
        const dbPhotoIds = new Set(g.photos.map((p) => p.id));
        const extraLocalPhotos = localGal.photos.filter((lp) => lp.url && !dbPhotoIds.has(lp.id));
        mergedMap.set(g.id, {
          ...g,
          photos: [...g.photos, ...extraLocalPhotos],
          coverPhotoUrl: g.coverPhotoUrl || localGal.coverPhotoUrl
        });
      } else {
        mergedMap.set(g.id, g);
      }
    });

    cachedGalleries.forEach((cg) => {
      if (!mergedMap.has(cg.id)) {
        mergedMap.set(cg.id, cg);
      }
    });

    const mergedList = Array.from(mergedMap.values());

    // Auto-purge expired trash items (> 15 days)
    const expiredGalleries = mergedList.filter((g) => g.deletedAt && isTrashExpired(g.deletedAt));
    if (expiredGalleries.length > 0) {
      expiredGalleries.forEach((g) => {
        permanentlyDeleteGalleryAsync(g.id);
      });
    }

    const unexpiredList = mergedList.filter((g) => !isTrashExpired(g.deletedAt));
    updateLocalCache(unexpiredList);
    return unexpiredList;
  } catch (e) {
    console.warn('[Supabase Fallback] Exception loading galleries from Supabase:', e);
    const list = cachedGalleries.length > 0 ? cachedGalleries : INITIAL_GALLERIES;
    return list.filter((g) => !isTrashExpired(g.deletedAt));
  }
}

export async function getGalleriesAsync(): Promise<Gallery[]> {
  const all = await getAllGalleriesWithTrashAsync();
  return all.filter((g) => !g.deletedAt);
}

export function getGalleries(): Gallery[] {
  const list = cachedGalleries.length > 0 ? cachedGalleries : INITIAL_GALLERIES;
  return list.filter((g) => !g.deletedAt && !isTrashExpired(g.deletedAt));
}

export async function getTrashGalleriesAsync(): Promise<Gallery[]> {
  const all = await getAllGalleriesWithTrashAsync();
  return all.filter((g) => Boolean(g.deletedAt));
}

export function getTrashGalleries(): Gallery[] {
  return cachedGalleries.filter((g) => Boolean(g.deletedAt) && !isTrashExpired(g.deletedAt));
}

export function getGalleryById(id: string): Gallery | undefined {
  const gal = cachedGalleries.find((g) => g.id === id);
  if (gal && gal.deletedAt) return undefined;
  return gal;
}

export async function getGalleryByPinAsync(pinCode: string): Promise<Gallery | null> {
  const cleanPin = pinCode.trim();
  if (!cleanPin) return null;

  if (!isSupabaseConfigured || !supabase) {
    const gal = cachedGalleries.find((g) => g.pinCode === cleanPin);
    return gal && !gal.deletedAt ? gal : null;
  }

  try {
    const { data: dbGallery, error } = await supabase
      .from('galleries')
      .select('*')
      .eq('pin_code', cleanPin)
      .maybeSingle();

    if (error || !dbGallery || dbGallery.deleted_at) {
      const cached = cachedGalleries.find((g) => g.pinCode === cleanPin);
      return cached && !cached.deletedAt ? cached : null;
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

    const mapped = mapRowToGallery(dbGallery, dbPhotos || [], dbSelection || null);
    if (mapped.deletedAt) return null;
    return mapped;
  } catch (e) {
    console.warn('[Supabase Fallback] Error fetching gallery by PIN, trying local cache:', e);
    const cached = cachedGalleries.find((g) => g.pinCode === cleanPin);
    return cached && !cached.deletedAt ? cached : null;
  }
}

/**
 * Save or update a Gallery in Supabase with automatic local fallback.
 * Strictly guarantees gallery ID generation and creation order before photos.
 */
export async function saveGalleryAsync(gallery: Gallery): Promise<Gallery> {
  const now = new Date().toISOString();

  // Ensure gallery ID is a valid UUID
  const isUUID = gallery.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gallery.id);
  const galleryId = isUUID ? gallery.id : crypto.randomUUID();

  const existingPins = cachedGalleries.filter((g) => g.id !== gallery.id && g.id !== galleryId).map((g) => g.pinCode || '');
  let pinCode = gallery.pinCode?.trim();
  if (!pinCode || existingPins.includes(pinCode)) {
    pinCode = generateUniquePin(existingPins);
  }

  const cleanPhotos = (gallery.photos || []).filter((p) => p.url && !p.url.startsWith('blob:'));
  const cleanCoverUrl = (gallery.coverPhotoUrl && !gallery.coverPhotoUrl.startsWith('blob:'))
    ? gallery.coverPhotoUrl
    : (cleanPhotos[0]?.url || '');

  const updatedGallery: Gallery = {
    ...gallery,
    id: galleryId,
    coverPhotoUrl: cleanCoverUrl,
    photos: cleanPhotos,
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
      id: galleryId,
      title: gallery.title || 'Galeria sem título',
      client_name: gallery.clientName || 'Cliente',
      client_email: gallery.clientEmail || '',
      client_phone: gallery.clientPhone || '',
      event_date: gallery.eventDate || now.split('T')[0],
      description: gallery.description || '',
      status: gallery.status || 'awaiting_client',
      privacy: gallery.privacy || 'private',
      pin_code: pinCode,
      predefined_voters: Array.isArray(gallery.predefinedVoters) ? gallery.predefinedVoters : [],
      consensus_threshold: Number(gallery.consensusThreshold) || 2,
      allow_free_voter_registration: Boolean(gallery.allowFreeVoterRegistration ?? true),
      voters: Array.isArray(gallery.voters) ? gallery.voters : [],
      quota_included: Number(gallery.quotaIncluded) || 20,
      max_contracted_photos: Number(gallery.maxContractedPhotos ?? gallery.quotaIncluded) || 20,
      excess_policy: gallery.excessPolicy || 'charge',
      extra_photo_price: Number(gallery.extraPhotoPrice) || 25,
      gallery_closure_fee: Number(gallery.galleryClosureFee) || 6.90,
      platform_commission_rate: Number(gallery.platformCommissionRate) || 0.08,
      payment_status: gallery.paymentStatus || 'pending',
      watermark_enabled: Boolean(gallery.watermarkEnabled ?? true),
      watermark_text: gallery.watermarkText || 'PROVA • LUMINA STUDIO • PROVA',
      watermark_position: gallery.watermarkPosition || 'both',
      watermark_opacity: gallery.watermarkOpacity ?? 0.25,
      cover_photo_url: cleanCoverUrl,
      deleted_at: gallery.deletedAt || null,
      updated_at: now
    };

    // Upsert gallery row first
    const { error: galErr } = await supabase.from('galleries').upsert(galleryPayload, { onConflict: 'id' });
    if (galErr) {
      console.warn('[Supabase Sync Warning] Failed to upsert gallery (operating in local fallback):', galErr.message || galErr);
      return updatedGallery;
    }

    // Sync photos only after successful gallery upsert
    if (cleanPhotos && cleanPhotos.length > 0) {
      await syncPhotos(galleryId, cleanPhotos);
    }

    // Sync client selections only after successful gallery upsert
    if (gallery.clientSelection) {
      await saveClientSelection(galleryId, gallery.clientSelection, gallery.status, gallery.voters);
    }
  } catch (e) {
    console.warn('[Supabase Fallback] Network or RLS error saving gallery, saved locally:', e);
  }

  return updatedGallery;
}

export function saveGallery(gallery: Gallery): void {
  saveGalleryAsync(gallery);
}

export async function softDeleteGalleryAsync(id: string): Promise<void> {
  const now = new Date().toISOString();
  const idx = cachedGalleries.findIndex((g) => g.id === id);
  if (idx >= 0) {
    cachedGalleries[idx] = {
      ...cachedGalleries[idx],
      deletedAt: now,
      updatedAt: now
    };
    updateLocalCache(cachedGalleries);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ deleted_at: now, updated_at: now })
        .eq('id', id);
      if (error) {
        console.warn('[Supabase Sync Warning] Failed to soft-delete gallery in DB:', error.message);
      }
    } catch (e) {
      console.warn('[Supabase Fallback] Error soft-deleting gallery in Supabase:', e);
    }
  }
}

export async function deleteGalleryAsync(id: string): Promise<void> {
  return softDeleteGalleryAsync(id);
}

export function deleteGallery(id: string): void {
  softDeleteGalleryAsync(id);
}

export async function restoreGalleryAsync(id: string): Promise<Gallery | undefined> {
  const now = new Date().toISOString();
  let restored: Gallery | undefined;
  const idx = cachedGalleries.findIndex((g) => g.id === id);
  if (idx >= 0) {
    restored = {
      ...cachedGalleries[idx],
      deletedAt: null,
      updatedAt: now
    };
    cachedGalleries[idx] = restored;
    updateLocalCache(cachedGalleries);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ deleted_at: null, updated_at: now })
        .eq('id', id);
      if (error) {
        console.warn('[Supabase Sync Warning] Failed to restore gallery in DB:', error.message);
      }
    } catch (e) {
      console.warn('[Supabase Fallback] Error restoring gallery in Supabase:', e);
    }
  }

  return restored;
}

export function restoreGallery(id: string): void {
  restoreGalleryAsync(id);
}

export async function permanentlyDeleteGalleryAsync(id: string): Promise<void> {
  const filtered = cachedGalleries.filter((g) => g.id !== id);
  updateLocalCache(filtered);

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    const { error } = await supabase.from('galleries').delete().eq('id', id);
    if (error) console.warn('[Supabase Sync Warning] Failed to permanently delete gallery from DB:', error.message);
  } catch (e) {
    console.warn('[Supabase Fallback] Failed permanently deleting gallery from Supabase:', e);
  }
}

export async function emptyTrashAsync(): Promise<void> {
  const trashItems = cachedGalleries.filter((g) => Boolean(g.deletedAt));
  const activeItems = cachedGalleries.filter((g) => !g.deletedAt);
  updateLocalCache(activeItems);

  if (isSupabaseConfigured && supabase && trashItems.length > 0) {
    try {
      const trashIds = trashItems.map((g) => g.id);
      const { error } = await supabase.from('galleries').delete().in('id', trashIds);
      if (error) console.warn('[Supabase Sync Warning] Failed to empty trash in DB:', error.message);
    } catch (e) {
      console.warn('[Supabase Fallback] Failed emptying trash in Supabase:', e);
    }
  }
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

  // 1. Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // 2. Save client selection to Supabase
  await saveClientSelection(gallery.id, updatedSelection, gallery.status, activeVoters);

  // 3. Dispatch interaction notification
  const targetPhoto = gallery.photos.find((p) => p.id === photoId);
  notifyVoteEvent({
    galleryTitle: gallery.title,
    voterName: voter.name,
    photoName: targetPhoto ? targetPhoto.originalFileName : 'Foto',
    action: existingIdx >= 0 ? 'remove' : 'add',
    galleryId: gallery.id
  });

  return updatedGallery;
}

/**
 * Reset/clear ALL votes in a gallery (complete voting reset)
 */
export async function resetGalleryVotesAsync(gallery: Gallery): Promise<Gallery> {
  const now = new Date().toISOString();

  // Reset voter finalized statuses
  const resetVoters = (gallery.voters || gallery.clientSelection.voters || []).map((v) => ({
    ...v,
    hasFinalized: false,
    finalizedAt: undefined
  }));

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    selectedPhotoIds: [],
    votes: {},
    voters: resetVoters,
    completedAt: undefined,
    status: 'pending'
  };

  const updatedGallery: Gallery = {
    ...gallery,
    status: gallery.status === 'completed' ? 'awaiting_client' : gallery.status,
    voters: resetVoters,
    clientSelection: updatedSelection,
    photos: gallery.photos.map((p) => ({
      ...p,
      votes: []
    })),
    updatedAt: now
  };

  // Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // Save selection & gallery to Supabase
  await saveClientSelection(gallery.id, updatedSelection, 'pending', resetVoters);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('galleries')
        .update({ status: updatedGallery.status, voters: resetVoters, updated_at: now })
        .eq('id', gallery.id);
    } catch (e) {
      console.warn('[Supabase Fallback] Error resetting gallery status in Supabase:', e);
    }
  }

  notifyVoteEvent({
    galleryTitle: gallery.title,
    voterName: 'Todos os participantes',
    action: 'reset',
    galleryId: gallery.id
  });

  return updatedGallery;
}

/**
 * Sets or updates the 0-5 star rating of a photo within a gallery.
 */
export async function setPhotoRatingAsync(
  gallery: Gallery,
  photoId: string,
  rating: number
): Promise<Gallery> {
  const sanitizedRating = Math.max(0, Math.min(5, Math.round(rating)));
  const now = new Date().toISOString();

  const updatedPhotos = gallery.photos.map((p) =>
    p.id === photoId ? { ...p, rating: sanitizedRating } : p
  );

  const updatedRatingsMap: Record<string, number> = {
    ...(gallery.clientSelection?.ratingsMap || {})
  };
  if (sanitizedRating > 0) {
    updatedRatingsMap[photoId] = sanitizedRating;
  } else {
    delete updatedRatingsMap[photoId];
  }

  const updatedGallery: Gallery = {
    ...gallery,
    photos: updatedPhotos,
    clientSelection: {
      ...(gallery.clientSelection || { selectedPhotoIds: [], comments: {}, status: 'pending' }),
      ratingsMap: updatedRatingsMap
    },
    updatedAt: now
  };

  // 1. Update local memory cache & LocalStorage
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
  } else {
    cachedGalleries.push(updatedGallery);
  }
  updateLocalCache(cachedGalleries);

  // 2. Persist to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // Save to client_selections (ratings_map)
      await saveClientSelection(gallery.id, updatedGallery.clientSelection);

      // Save directly to photos table if column exists
      const { error } = await supabase
        .from('photos')
        .update({ rating: sanitizedRating })
        .eq('id', photoId);

      if (error) {
        console.warn('[Supabase Rating Notice] photos table rating column update skipped:', error.message);
      }
    } catch (e) {
      console.warn('[Supabase Fallback] Error persisting photo rating:', e);
    }
  }

  const targetPhoto = gallery.photos.find((p) => p.id === photoId);
  notifyRatingEvent({
    galleryTitle: gallery.title,
    photoName: targetPhoto ? targetPhoto.originalFileName : 'Foto',
    rating: sanitizedRating,
    galleryId: gallery.id
  });

  return updatedGallery;
}

/**
 * Reset/clear all votes cast by a specific voter
 */
export async function resetVoterVotesAsync(
  gallery: Gallery,
  voterId: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const currentVotes: Record<string, PhotoVote[]> = { ...(gallery.clientSelection.votes || {}) };

  // Remove votes from voterId across all photos
  Object.keys(currentVotes).forEach((pId) => {
    const filtered = (currentVotes[pId] || []).filter((v) => v.voterId !== voterId);
    if (filtered.length > 0) {
      currentVotes[pId] = filtered;
    } else {
      delete currentVotes[pId];
    }
  });

  const selectedPhotoIds = Object.keys(currentVotes);

  // Reset finalized status for this voter
  const activeVoters = (gallery.voters || gallery.clientSelection.voters || []).map((v) =>
    v.id === voterId ? { ...v, hasFinalized: false, finalizedAt: undefined } : v
  );

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
    photos: gallery.photos.map((p) => ({
      ...p,
      votes: currentVotes[p.id] || []
    })),
    updatedAt: now
  };

  // Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // Save to Supabase
  await saveClientSelection(gallery.id, updatedSelection, gallery.status, activeVoters);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('galleries').update({ voters: activeVoters }).eq('id', gallery.id);
    } catch (e) {
      console.warn('[Supabase Fallback] Error updating voters in Supabase:', e);
    }
  }

  const voter = (gallery.voters || gallery.clientSelection.voters || []).find((v) => v.id === voterId);
  notifyVoteEvent({
    galleryTitle: gallery.title,
    voterName: voter ? voter.name : 'Participante',
    action: 'reset',
    galleryId: gallery.id
  });

  return updatedGallery;
}

/**
 * Clear all votes for a single photo
 */
export async function clearPhotoVotesAsync(
  gallery: Gallery,
  photoId: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const currentVotes: Record<string, PhotoVote[]> = { ...(gallery.clientSelection.votes || {}) };
  delete currentVotes[photoId];

  const selectedPhotoIds = Object.keys(currentVotes).filter(
    (pId) => (currentVotes[pId] || []).length > 0
  );

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    selectedPhotoIds,
    votes: currentVotes
  };

  const updatedGallery: Gallery = {
    ...gallery,
    clientSelection: updatedSelection,
    photos: gallery.photos.map((p) =>
      p.id === photoId ? { ...p, votes: [] } : p
    ),
    updatedAt: now
  };

  // Update local cache
  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  await saveClientSelection(gallery.id, updatedSelection, gallery.status, gallery.voters);

  return updatedGallery;
}

/**
 * Delete a specific vote of a voter on a specific photo
 */
export async function deleteVoteAsync(
  gallery: Gallery,
  photoId: string,
  voterId: string
): Promise<Gallery> {
  const now = new Date().toISOString();
  const currentVotes: Record<string, PhotoVote[]> = { ...(gallery.clientSelection.votes || {}) };
  const photoVotes = (currentVotes[photoId] || []).filter((v) => v.voterId !== voterId);

  if (photoVotes.length > 0) {
    currentVotes[photoId] = photoVotes;
  } else {
    delete currentVotes[photoId];
  }

  const selectedPhotoIds = Object.keys(currentVotes);

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    selectedPhotoIds,
    votes: currentVotes
  };

  const updatedGallery: Gallery = {
    ...gallery,
    clientSelection: updatedSelection,
    photos: gallery.photos.map((p) =>
      p.id === photoId ? { ...p, votes: photoVotes } : p
    ),
    updatedAt: now
  };

  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  await saveClientSelection(gallery.id, updatedSelection, gallery.status, gallery.voters);

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

  // Save client selection to Supabase
  await saveClientSelection(gallery.id, updatedSelection, gallery.status, gallery.voters);

  const targetPhoto = gallery.photos.find((p) => p.id === photoId);
  notifyCommentEvent({
    galleryTitle: gallery.title,
    commenterName: voter.name,
    photoName: targetPhoto ? targetPhoto.originalFileName : 'Foto',
    commentText: text.trim(),
    galleryId: gallery.id
  });

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

  // Save client selection to Supabase
  await saveClientSelection(gallery.id, updatedSelection, gallery.status, gallery.voters);

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

  const updatedSelection: ClientSelectionData = {
    ...gallery.clientSelection,
    voters: activeVoters,
    completedAt: gallery.clientSelection.completedAt || now,
    status: 'submitted'
  };

  const updatedGallery: Gallery = {
    ...gallery,
    voters: activeVoters,
    clientSelection: updatedSelection,
    updatedAt: now
  };

  const idx = cachedGalleries.findIndex((g) => g.id === gallery.id);
  if (idx >= 0) {
    cachedGalleries[idx] = updatedGallery;
    updateLocalCache(cachedGalleries);
  }

  // Save client selection to Supabase with approved_at and finalized_at
  await saveClientSelection(gallery.id, updatedSelection, 'completed', activeVoters);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('galleries').update({ voters: activeVoters }).eq('id', gallery.id);
    } catch (e) {
      console.warn('[Supabase Fallback] Error updating gallery voters in Supabase:', e);
    }
  }

  const voterName = activeVoters.find((v) => v.id === voterId)?.name || gallery.clientName;
  notifyFinalizeEvent({
    galleryTitle: gallery.title,
    voterName,
    galleryId: gallery.id
  });

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

// ==========================================
// Order Management & Financial Helpers
// ==========================================

export async function getGalleryOrdersAsync(galleryId: string): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      galleryId: row.gallery_id,
      payerType: row.payer_type,
      totalAmount: Number(row.total_amount) || 0,
      platformFee: Number(row.platform_fee) || 0,
      photographerAmount: Number(row.photographer_amount) || 0,
      externalId: row.external_id,
      status: row.status,
      pixCopyPaste: row.pix_copy_paste,
      pixQrCodeBase64: row.pix_qr_code_base64,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (e) {
    console.warn('[Supabase Fallback] Failed fetching orders for gallery:', e);
    return [];
  }
}

export async function getAllOrdersAsync(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      galleryId: row.gallery_id,
      payerType: row.payer_type || 'client',
      totalAmount: Number(row.total_amount) || 0,
      platformFee: Number(row.platform_fee) || 0,
      photographerAmount: Number(row.photographer_amount) || 0,
      externalId: row.external_id,
      status: row.status || 'pending',
      pixCopyPaste: row.pix_copy_paste,
      pixQrCodeBase64: row.pix_qr_code_base64,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (e) {
    console.warn('[Supabase Fallback] Failed fetching all orders:', e);
    return [];
  }
}

export async function saveOrderAsync(order: Partial<Order>): Promise<Order | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  try {
    const payload = {
      ...(order.id ? { id: order.id } : {}),
      gallery_id: order.galleryId,
      payer_type: order.payerType || 'client',
      total_amount: order.totalAmount || 0,
      platform_fee: order.platformFee || 0,
      photographer_amount: order.photographerAmount || order.totalAmount || 0,
      external_id: order.externalId,
      status: order.status || 'pending',
      pix_copy_paste: order.pixCopyPaste,
      pix_qr_code_base64: order.pixQrCodeBase64,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .upsert(payload)
      .select()
      .single();

    if (error || !data) {
      console.warn('[Supabase] Error saving order:', error);
      return null;
    }

    return {
      id: data.id,
      galleryId: data.gallery_id,
      payerType: data.payer_type,
      totalAmount: Number(data.total_amount) || 0,
      platformFee: Number(data.platform_fee) || 0,
      photographerAmount: Number(data.photographer_amount) || 0,
      externalId: data.external_id,
      status: data.status,
      pixCopyPaste: data.pix_copy_paste,
      pixQrCodeBase64: data.pix_qr_code_base64,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (e) {
    console.warn('[Supabase Fallback] Failed saving order:', e);
    return null;
  }
}

export async function deleteOrderAsync(orderId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Error deleting order:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase Fallback] Failed deleting order:', e);
    return false;
  }
}

export async function updateGalleryPaymentStatusAsync(
  galleryId: string,
  status: 'pending' | 'paid' | 'waived'
): Promise<void> {
  const galleries = getGalleries();
  const idx = galleries.findIndex((g) => g.id === galleryId);
  if (idx >= 0) {
    galleries[idx].paymentStatus = status;
    updateGalleriesCache(galleries);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('galleries')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', galleryId);
    } catch (e) {
      console.warn('[Supabase Fallback] Failed updating gallery payment_status:', e);
    }
  }
}

