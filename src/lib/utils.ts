export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60';

/**
 * Validates and sanitizes image URLs, blocking empty, null, or ephemeral blob: URLs
 * and returning a fallback image URL.
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }
  
  // Block ephemeral blob: URLs that cause net::ERR_FILE_NOT_FOUND errors in browser
  if (url.startsWith('blob:')) {
    return PLACEHOLDER_IMAGE;
  }
  
  return url;
}
