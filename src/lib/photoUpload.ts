import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Converts a File object to a permanent Data URL (Base64).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a photo File to Supabase Storage if available, or converts it to Base64 (Data URL) as fallback.
 * Guarantees that the returned URL is PERMANENT and NEVER a temporary blob: URL.
 */
export async function uploadPhotoFile(file: File, galleryId: string = 'general'): Promise<string> {
  // If Supabase is configured, attempt upload to Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${galleryId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}_${sanitizedName}`;
      const bucketName = 'gallery-photos';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '36000',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path || fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      if (error) {
        console.error('[Storage Error] Supabase storage upload failed:', error.message);
        throw new Error(`Falha no upload da imagem "${file.name}": ${error.message}`);
      }
    } catch (err: any) {
      console.error('[Storage Error] Supabase storage upload exception:', err);
      throw err;
    }
  }

  // Fallback for local/mock when Supabase is unconfigured:
  // Convert File to Base64 Data URL so it persists across refreshes (NEVER a temporary blob: URL!)
  return await fileToDataUrl(file);
}

/**
 * Processes a list of files with controlled concurrency (default: 3 simultaneous uploads).
 * Iterates through ALL files without artificial limits and reports progress.
 */
export async function uploadPhotosInBatches<T extends { file: File }>(
  items: T[],
  galleryId: string,
  onProgress?: (completedCount: number, totalCount: number, item: T, resultUrl: string) => void,
  concurrencyLimit = 3
): Promise<{ item: T; url: string; success: boolean; error?: any }[]> {
  const results: { item: T; url: string; success: boolean; error?: any }[] = [];
  let completedCount = 0;
  const totalCount = items.length;

  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const chunk = items.slice(i, i + concurrencyLimit);
    const chunkPromises = chunk.map(async (item) => {
      try {
        const permanentUrl = await uploadPhotoFile(item.file, galleryId);
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, totalCount, item, permanentUrl);
        }
        return { item, url: permanentUrl, success: true };
      } catch (err) {
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, totalCount, item, '');
        }
        return { item, url: '', success: false, error: err };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}
