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

      let uploadResult: { path: string } | null = null;
      let lastError: any = null;

      // Retry up to 3 times with exponential backoff to recover from transient network drops or ERR_FAILED
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: '36000',
              upsert: true
            });

          if (!error && data) {
            uploadResult = data;
            break;
          }
          lastError = error;
        } catch (fetchErr) {
          lastError = fetchErr;
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }

      if (uploadResult) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadResult.path || fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }

      if (lastError) {
        console.warn('[Storage Upload Warning] Storage upload failed after retries, falling back to Data URL:', lastError.message || lastError);
      }
    } catch (err: any) {
      console.warn('[Storage Upload Warning] Exception uploading to storage, falling back to Data URL:', err);
    }
  }

  // Fallback: Convert File to Base64 Data URL so photo upload ALWAYS succeeds and persists across refreshes
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
