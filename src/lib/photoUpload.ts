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
