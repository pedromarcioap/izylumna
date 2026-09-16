import exifr from 'exifr';
import { PhotoMetadata } from '../types';

/**
 * Extracts authentic EXIF technical metadata from a local image File before upload.
 */
export async function extractExif(fileOrUrl: File | Blob | ArrayBuffer | string): Promise<PhotoMetadata | null> {
  try {
    if (!fileOrUrl) return null;

    // Use full exifr parsing to extract tags across all IFDs (TIFF, EXIF, GPS, etc.)
    const data = await exifr.parse(fileOrUrl, {
      tiff: true,
      exif: true,
      gps: true,
      reviveValues: true,
      sanitize: true,
      mergeOutput: true
    });

    if (!data || typeof data !== 'object') return null;

    // Helper to format shutter speed cleanly (e.g. 0.004 -> 1/250s, 0.5 -> 0.5s, 2 -> 2s)
    const formatShutter = (timeVal: any): string | null => {
      if (typeof timeVal === 'string' && timeVal.trim()) {
        const str = timeVal.trim();
        return str.endsWith('s') ? str : `${str}s`;
      }
      const num = Number(timeVal);
      if (isNaN(num) || num <= 0) return null;
      if (num < 1) {
        const denominator = Math.round(1 / num);
        return `1/${denominator}s`;
      }
      const rounded = Number(num.toFixed(1)).toString().replace(/\.0$/, '');
      return `${rounded}s`;
    };

    // Camera Make & Model formatting across various camera manufacturers (Canon, Sony, Nikon, Apple, Fuji, etc.)
    const rawMake = data.Make || data.make || data.Manufacturer || data.manufacturer;
    const rawModel = data.Model || data.model || data.CameraModelName || data.UniqueCameraModel;
    const make = typeof rawMake === 'string' ? rawMake.trim() : '';
    const model = typeof rawModel === 'string' ? rawModel.trim() : '';

    let camera: string | null = null;
    if (model) {
      if (make && !model.toLowerCase().includes(make.toLowerCase())) {
        camera = `${make} ${model}`;
      } else {
        camera = model;
      }
    } else if (make) {
      camera = make;
    }

    // Lens Model formatting
    const rawLens =
      data.LensModel ||
      data.lensModel ||
      data.Lens ||
      data.lens ||
      data.LensInfo ||
      data.LensType ||
      data.LensSpecification ||
      data.LensID ||
      data.LensName;
    const lens = typeof rawLens === 'string' && rawLens.trim() ? rawLens.trim() : null;

    // Aperture f/stop formatting
    const rawFNum = data.FNumber ?? data.fNumber ?? data.ApertureValue ?? data.Aperture ?? data.ApertureFNumber;
    let f_stop: string | null = null;
    if (typeof rawFNum === 'number' && !isNaN(rawFNum) && rawFNum > 0) {
      f_stop = `f/${Number(rawFNum.toFixed(1)).toString().replace(/\.0$/, '')}`;
    } else if (typeof rawFNum === 'string' && rawFNum.trim()) {
      const cleanF = rawFNum.trim();
      f_stop = cleanF.startsWith('f/') ? cleanF : `f/${cleanF}`;
    }

    // Shutter speed formatting
    const rawExpTime = data.ExposureTime ?? data.exposureTime ?? data.ShutterSpeedValue ?? data.ShutterSpeed;
    const shutter_speed = formatShutter(rawExpTime);

    // ISO speed formatting
    const rawIso =
      data.ISO ??
      data.iso ??
      data.ISOSpeedRatings ??
      data.PhotographicSensitivity ??
      data.SensitivityType;
    let iso: string | null = null;
    if (rawIso) {
      const isoNum = Array.isArray(rawIso) ? rawIso[0] : rawIso;
      if (isoNum) {
        const isoStr = String(isoNum).trim();
        iso = isoStr.toUpperCase().startsWith('ISO') ? isoStr : `ISO ${isoStr}`;
      }
    }

    // Focal length formatting
    const rawFocal =
      data.FocalLength ??
      data.focalLength ??
      data.FocalLengthIn35mmFormat ??
      data.FocalLengthIn35mmFilm ??
      data.FocalLength35efl;
    let focal_length: string | null = null;
    if (typeof rawFocal === 'number' && !isNaN(rawFocal) && rawFocal > 0) {
      focal_length = `${Math.round(rawFocal)}mm`;
    } else if (typeof rawFocal === 'string' && rawFocal.trim()) {
      const cleanFocal = rawFocal.trim();
      focal_length = cleanFocal.endsWith('mm') ? cleanFocal : `${cleanFocal}mm`;
    }

    // Date & Time taken formatting
    const rawDate =
      data.DateTimeOriginal ??
      data.dateTimeOriginal ??
      data.CreateDate ??
      data.createDate ??
      data.DateTimeDigitized ??
      data.DateTime ??
      data.ModifyDate;
    let taken_at: string | null = null;
    if (rawDate) {
      try {
        if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
          taken_at = rawDate.toISOString();
        } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
          const parsedDate = new Date(rawDate);
          if (!isNaN(parsedDate.getTime())) {
            taken_at = parsedDate.toISOString();
          }
        }
      } catch {
        taken_at = null;
      }
    }

    const metadata: PhotoMetadata = {
      camera,
      lens,
      f_stop,
      shutter_speed,
      iso,
      focal_length,
      taken_at
    };

    const hasData = Object.values(metadata).some((val) => val !== null && val !== undefined && val !== '');
    return hasData ? metadata : null;
  } catch (err) {
    console.warn('[EXIF Extraction Warning] Failed to parse EXIF metadata:', err);
    return null;
  }
}

/**
 * Ensures photo metadata is populated.
 * - Returns authentic provided metadata if available.
 * - Returns null object if photo explicitly has no EXIF data (preventing fake camera models).
 * - Only generates demo fallback if metadata is strictly undefined (for demo/preset photos).
 */
export function getEffectiveExif(metadata?: PhotoMetadata | null, seed: string = ''): PhotoMetadata {
  if (metadata !== undefined && metadata !== null) {
    return {
      camera: metadata.camera || null,
      lens: metadata.lens || null,
      f_stop: metadata.f_stop || null,
      shutter_speed: metadata.shutter_speed || null,
      iso: metadata.iso || null,
      focal_length: metadata.focal_length || null,
      taken_at: metadata.taken_at || null
    };
  }

  // If metadata is explicitly null, return empty structure (no fake camera models)
  if (metadata === null) {
    return {
      camera: null,
      lens: null,
      f_stop: null,
      shutter_speed: null,
      iso: null,
      focal_length: null,
      taken_at: null
    };
  }

  // Deterministic seed hashing for fallback metadata only when metadata is completely undefined
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const cameras = ['Canon EOS R6 Mark II', 'Sony Alpha 7 IV', 'Nikon Z6 II', 'Fujifilm X-T5', 'Canon EOS R5'];
  const lenses = ['RF 50mm f/1.2L USM', 'FE 35mm f/1.4 GM', 'NIKKOR Z 85mm f/1.8 S', 'XF 23mm f/1.4 R LM WR', 'RF 24-70mm f/2.8L IS USM'];
  const fStops = ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4.0'];
  const shutters = ['1/250s', '1/500s', '1/1000s', '1/160s', '1/320s'];
  const isos = ['ISO 100', 'ISO 200', 'ISO 400', 'ISO 800', 'ISO 160'];
  const focals = ['35mm', '50mm', '85mm', '24mm', '70mm'];

  return {
    camera: cameras[posHash % cameras.length],
    lens: lenses[posHash % lenses.length],
    f_stop: fStops[posHash % fStops.length],
    shutter_speed: shutters[posHash % shutters.length],
    iso: isos[posHash % isos.length],
    focal_length: focals[posHash % focals.length],
    taken_at: new Date(Date.now() - (posHash % 30) * 86400000).toISOString()
  };
}

