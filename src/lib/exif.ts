import exifr from 'exifr';
import { PhotoMetadata } from '../types';

/**
 * Extracts authentic EXIF technical metadata from a local image File before upload.
 */
export async function extractExif(file: File): Promise<PhotoMetadata | null> {
  try {
    // exifr options MUST be an object with pick array, not a direct array
    const data = await exifr.parse(file, {
      pick: [
        'Make',
        'Model',
        'LensModel',
        'Lens',
        'LensInfo',
        'LensType',
        'FNumber',
        'ApertureValue',
        'ExposureTime',
        'ShutterSpeedValue',
        'ISO',
        'ISOSpeedRatings',
        'FocalLength',
        'FocalLengthIn35mmFormat',
        'DateTimeOriginal',
        'CreateDate'
      ]
    });

    if (!data) return null;

    // Helper to format shutter speed cleanly
    const formatShutter = (timeVal: any): string | null => {
      if (typeof timeVal !== 'number' || isNaN(timeVal) || timeVal <= 0) return null;
      if (timeVal < 1) {
        const denominator = Math.round(1 / timeVal);
        return `1/${denominator}s`;
      }
      const rounded = Number(timeVal.toFixed(1));
      return `${rounded}s`;
    };

    // Camera Make & Model formatting
    const make = typeof data.Make === 'string' ? data.Make.trim() : '';
    const model = typeof data.Model === 'string' ? data.Model.trim() : '';
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

    // Lens Model
    const rawLens = data.LensModel || data.Lens || data.LensInfo || data.LensType;
    const lens = typeof rawLens === 'string' && rawLens.trim() ? rawLens.trim() : null;

    // Aperture f/stop
    const fNum = data.FNumber || data.ApertureValue;
    const f_stop =
      typeof fNum === 'number' && !isNaN(fNum) && fNum > 0
        ? `f/${Number(fNum.toFixed(1)).toString().replace(/\.0$/, '')}`
        : null;

    // Shutter speed
    const expTime = data.ExposureTime || data.ShutterSpeedValue;
    const shutter_speed = formatShutter(expTime);

    // ISO
    const isoVal = data.ISO || (Array.isArray(data.ISOSpeedRatings) ? data.ISOSpeedRatings[0] : data.ISOSpeedRatings);
    const iso = isoVal ? `ISO ${isoVal}` : null;

    // Focal length
    const focalVal = data.FocalLength || data.FocalLengthIn35mmFormat;
    const focal_length = typeof focalVal === 'number' && !isNaN(focalVal) ? `${Math.round(focalVal)}mm` : null;

    // Date Taken
    const rawDate = data.DateTimeOriginal || data.CreateDate;
    let taken_at: string | null = null;
    if (rawDate) {
      try {
        taken_at = new Date(rawDate).toISOString();
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

    const hasData = Object.values(metadata).some((val) => val !== null && val !== '');
    return hasData ? metadata : null;
  } catch (err) {
    console.warn('[EXIF Extraction Warning] Failed to parse EXIF for file:', file.name, err);
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

