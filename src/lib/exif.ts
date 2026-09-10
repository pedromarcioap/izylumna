import exifr from 'exifr';
import { PhotoMetadata } from '../types';

/**
 * Extracts EXIF technical metadata from a local image File before upload.
 */
export async function extractExif(file: File): Promise<PhotoMetadata | null> {
  try {
    const data = await exifr.parse(file, [
      'Make', 'Model', 'LensModel',
      'FNumber', 'ExposureTime', 'ISO',
      'FocalLength', 'DateTimeOriginal'
    ]);
    if (!data) return null;

    const formatShutter = (time: number) => {
      if (!time) return null;
      return time < 1 ? `1/${Math.round(1 / time)}s` : `${time}s`;
    };

    const rawCamera = data.Model
      ? `${data.Make || ''} ${data.Model}`.replace(/\bCanon\b|\bNikon\b|\bSony\b/gi, '').trim()
      : null;

    const metadata: PhotoMetadata = {
      camera: rawCamera || null,
      lens: data.LensModel || null,
      f_stop: data.FNumber ? `f/${data.FNumber}` : null,
      shutter_speed: formatShutter(data.ExposureTime),
      iso: data.ISO ? `ISO ${data.ISO}` : null,
      focal_length: data.FocalLength ? `${Math.round(data.FocalLength)}mm` : null,
      taken_at: data.DateTimeOriginal ? new Date(data.DateTimeOriginal).toISOString() : null
    };

    // Return null if no meaningful fields exist
    const hasData = Object.values(metadata).some((val) => val !== null && val !== '');
    return hasData ? metadata : null;
  } catch {
    return null;
  }
}
