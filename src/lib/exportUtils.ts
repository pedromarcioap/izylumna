import { Photo, Gallery, ExportOptions } from '../types';

/**
 * Remove file extension from filename (e.g., "IMG_4021.CR3" -> "IMG_4021")
 */
export function stripFileExtension(filename: string): string {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.substring(0, lastDotIndex);
}

/**
 * Generates a formatted string of filenames for fast search filtering in Lightroom Classic.
 * 
 * Example output (comma-separated, without extension):
 * "IMG_1020, IMG_1045, IMG_1088"
 */
export function generateFilenamesList(photos: Photo[], options: ExportOptions = {}): string {
  const { commaSeparated = true, includeExtension = false } = options;

  if (!photos || photos.length === 0) {
    return '';
  }

  const processedNames = photos.map(photo => {
    const rawName = photo.originalFileName || photo.id;
    return includeExtension ? rawName : stripFileExtension(rawName);
  });

  const separator = commaSeparated ? ', ' : '\n';
  return processedNames.join(separator);
}

/**
 * Triggers automatic download of a text/plain Blob in the user's browser.
 */
export function downloadSelectionFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports photo list as CSV formatted for Adobe Lightroom Catalog import.
 */
export function exportToLightroomCSV(photos: Photo[], title: string = 'selecao'): void {
  const headers = 'Filename,OriginalFileName,Rating,PickFlag,Camera,Lens,ISO\n';
  const rows = photos
    .map(
      (p) =>
        `"${p.id}","${p.originalFileName}",${p.rating || 5},1,"${p.technicalDetails?.camera || p.cameraModel || ''}","${p.technicalDetails?.lens || ''}",${p.technicalDetails?.iso || 100}`
    )
    .join('\n');

  const content = headers + rows;
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadSelectionFile(`lightroom_export_${sanitizedTitle}.csv`, content);
}

/**
 * Exports photo filenames as TXT for Lightroom Smart Collection filtering.
 */
export function exportToLightroomTxt(photos: Photo[], title: string = 'selecao'): void {
  const filenames = generateFilenamesList(photos, { commaSeparated: true, includeExtension: false });
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  downloadSelectionFile(`lightroom_colecao_${sanitizedTitle}.txt`, filenames);
}

/**
 * Generates export selection summary string.
 */
export function exportSelectionSummary(photos: Photo[]): string {
  return `Exportação com ${photos.length} fotos selecionadas.`;
}

/**
 * Generates a complete, structured post-production text manifest for Lightroom / editing software.
 */
export function generateSelectionManifestText(gallery: Gallery, options: ExportOptions = {}): string {
  const { filterByVoterId, onlyConsensus } = options;

  let exportPhotos: Photo[] = gallery.photos;

  if (onlyConsensus) {
    const threshold = gallery.consensusThreshold || 2;
    exportPhotos = gallery.photos.filter(p => (p.votes?.length || 0) >= threshold);
  } else if (filterByVoterId) {
    exportPhotos = gallery.photos.filter(p => p.votes?.some(v => v.voterId === filterByVoterId));
  } else {
    // Default selected list
    exportPhotos = gallery.photos.filter(p => 
      gallery.clientSelection?.selectedPhotoIds?.includes(p.id) || (p.votes && p.votes.length > 0)
    );
  }

  const selectedCount = exportPhotos.length;
  const filenamesWithExt = generateFilenamesList(exportPhotos, { commaSeparated: true, includeExtension: true });
  const filenamesNoExt = generateFilenamesList(exportPhotos, { commaSeparated: true, includeExtension: false });

  const divider = '=================================================================\n';

  let manifest = `${divider}`;
  manifest += `IZY LUMNA - MANIFESTO DE SELEÇÃO E PÓS-PRODUÇÃO\n`;
  manifest += `${divider}`;
  manifest += `Galeria / Ensaio: ${gallery.title}\n`;
  manifest += `Cliente: ${gallery.clientName} (${gallery.clientEmail || 'E-mail não informado'})\n`;
  manifest += `Data do Ensaio: ${new Date(gallery.eventDate).toLocaleDateString('pt-BR')}\n`;
  manifest += `Data do Manifesto: ${new Date().toLocaleString('pt-BR')}\n`;
  manifest += `Status da Galeria: ${gallery.status.toUpperCase()} | Pagamento: ${(gallery.paymentStatus || 'paid').toUpperCase()}\n`;
  manifest += `Total de Fotos Selecionadas: ${selectedCount} fotos\n`;
  manifest += `${divider}\n`;

  manifest += `1. FILTRO PARA LIGHTROOM CLASSIC (SEM EXTENSÃO):\n`;
  manifest += `   Copie e cole a linha abaixo na barra de busca do Lightroom (Filtro de Texto -> Contém):\n\n`;
  manifest += `   ${filenamesNoExt || '(Nenhuma foto selecionada)'}\n\n`;

  manifest += `2. LISTA COM EXTENSÃO:\n`;
  manifest += `   ${filenamesWithExt || '(Nenhuma foto selecionada)'}\n\n`;

  manifest += `${divider}`;
  manifest += `3. DETALHAMENTO DE FOTOS E COMENTÁRIOS DOS VOTANTES:\n`;
  manifest += `${divider}`;

  if (exportPhotos.length === 0) {
    manifest += `Nenhuma foto encontrada para os critérios selecionados.\n`;
  } else {
    exportPhotos.forEach((photo, idx) => {
      manifest += `[${idx + 1}] ${photo.originalFileName}\n`;
      if (photo.votes && photo.votes.length > 0) {
        manifest += `    Votos (${photo.votes.length}): ${photo.votes.map(v => v.voterName).join(', ')}\n`;
      }
      if (photo.commentsList && photo.commentsList.length > 0) {
        manifest += `    Comentários:\n`;
        photo.commentsList.forEach(c => {
          manifest += `      - ${c.voterName}: "${c.text}"\n`;
        });
      }
      manifest += `\n`;
    });
  }

  manifest += `${divider}`;
  manifest += `Fim do manifesto - Izy Lumna Workflow System\n`;

  return manifest;
}

/**
 * Helper to download the manifest as a file directly.
 */
export function downloadApprovalManifest(
  gallery: Gallery,
  filterType: 'all' | 'consensus' | 'voter' = 'all',
  voterId?: string
): void {
  const isConsensus = filterType === 'consensus';
  const isVoter = filterType === 'voter';

  const content = generateSelectionManifestText(gallery, {
    onlyConsensus: isConsensus,
    filterByVoterId: isVoter ? voterId : undefined
  });

  const sanitizedTitle = gallery.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `izylumna_selecao_${sanitizedTitle}_${filterType}.txt`;

  downloadSelectionFile(filename, content);
}
