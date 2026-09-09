import { Gallery, ClientSelectionData, Photo } from '../types';
import { INITIAL_GALLERIES } from '../mockData';

const STORAGE_KEY = 'lumina_proofing_galleries_v1';

export function getGalleries(): Gallery[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GALLERIES));
      return INITIAL_GALLERIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_GALLERIES;
  } catch (e) {
    console.error('Failed to load galleries from localStorage:', e);
    return INITIAL_GALLERIES;
  }
}

export function getGalleryById(id: string): Gallery | undefined {
  const galleries = getGalleries();
  return galleries.find((g) => g.id === id);
}

export function saveGallery(gallery: Gallery): void {
  const galleries = getGalleries();
  const index = galleries.findIndex((g) => g.id === gallery.id);
  
  const updatedGallery = {
    ...gallery,
    updatedAt: new Date().toISOString()
  };

  let newGalleries: Gallery[];
  if (index >= 0) {
    newGalleries = [...galleries];
    newGalleries[index] = updatedGallery;
  } else {
    newGalleries = [updatedGallery, ...galleries];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newGalleries));
}

export function deleteGallery(id: string): void {
  const galleries = getGalleries();
  const filtered = galleries.filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function updateClientSelection(galleryId: string, selection: ClientSelectionData): Gallery | undefined {
  const galleries = getGalleries();
  const gallery = galleries.find((g) => g.id === galleryId);
  if (!gallery) return undefined;

  const isSubmitted = selection.status === 'submitted';
  const updatedGallery: Gallery = {
    ...gallery,
    clientSelection: selection,
    status: isSubmitted ? 'completed' : gallery.status,
    updatedAt: new Date().toISOString()
  };

  saveGallery(updatedGallery);
  return updatedGallery;
}

export function resetToDefaultData(): Gallery[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GALLERIES));
  return INITIAL_GALLERIES;
}

// Generate comma-separated filenames for Adobe Lightroom filter bar
// e.g. "IMG_4021, IMG_4024, IMG_4030" or without extensions if preferred
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

// Download .txt file with complete approval manifest
export function downloadApprovalManifest(gallery: Gallery): void {
  const selectedMap = new Set(gallery.clientSelection.selectedPhotoIds);
  const selectedPhotos = gallery.photos.filter((p) => selectedMap.has(p.id));
  
  const quota = gallery.quotaIncluded;
  const packagePhotos = selectedPhotos.slice(0, quota);
  const extraPhotos = selectedPhotos.slice(quota);

  let extraFinancialDetails = '';
  if (gallery.excessPolicy === 'charge' && extraPhotos.length > 0) {
    const totalExtra = extraPhotos.length * gallery.extraPhotoPrice;
    extraFinancialDetails = `
=== RESUMO FINANCEIRO DE FOTOS EXCEDENTES ===
Fotos Inclusas no Pacote: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
Fotos Extras: ${extraPhotos.length}
Valor Unitário por Extra: R$ ${gallery.extraPhotoPrice.toFixed(2)}
Total Adicional a Receber: R$ ${totalExtra.toFixed(2)}
`;
  } else if (gallery.excessPolicy === 'free_approval') {
    extraFinancialDetails = `
=== POLÍTICA DE EXCEDENTES: APROVAÇÃO PURA (SEM CUSTO ADICIONAL) ===
Fotos Contratadas na Cota: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
Fotos Adicionais Aprovadas para Tratamento: ${Math.max(0, selectedPhotos.length - quota)}
`;
  } else {
    extraFinancialDetails = `
=== POLÍTICA DE EXCEDENTES: BLOQUEIO RÍGIDO ===
Fotos Inclusas / Limite Máximo: ${quota}
Fotos Selecionadas: ${selectedPhotos.length}
`;
  }

  let commentsSection = '\n=== OBSERVAÇÕES E COMENTÁRIOS POR FOTO ===\n';
  const commentEntries = Object.entries(gallery.clientSelection.comments || {});
  if (commentEntries.length === 0) {
    commentsSection += 'Nenhum comentário específico adicionado nas fotos.\n';
  } else {
    commentEntries.forEach(([pId, text]) => {
      const ph = gallery.photos.find((p) => p.id === pId);
      if (ph) {
        commentsSection += `• ${ph.originalFileName}: "${text}"\n`;
      }
    });
  }

  const fileContent = `=====================================================
RELATÓRIO DE APROVAÇÃO DE FOTOS - ${gallery.title.toUpperCase()}
Cliente: ${gallery.clientName}
Data do Evento: ${gallery.eventDate}
Data da Seleção: ${gallery.clientSelection.completedAt ? new Date(gallery.clientSelection.completedAt).toLocaleString('pt-BR') : 'Em andamento'}
Status: ${gallery.status.toUpperCase()}
=====================================================

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Com extensão) ---
${generateLightroomSelectionString(selectedPhotos, false)}

--- FILTRO RÁPIDO PARA ADOBE LIGHTROOM (Sem extensão) ---
${generateLightroomSelectionString(selectedPhotos, true)}

${extraFinancialDetails}
=== LISTAGEM DETALHADA DOS ARQUIVOS SELECIONADOS (${selectedPhotos.length} fotos) ===
[1. Dentro do Pacote Contratado - ${packagePhotos.length} fotos]:
${packagePhotos.map((p, idx) => `  ${idx + 1}. ${p.originalFileName} ${gallery.clientSelection.comments[p.id] ? `[Comentário: ${gallery.clientSelection.comments[p.id]}]` : ''}`).join('\n')}

${extraPhotos.length > 0 ? `[2. Fotos Excedentes / Extras - ${extraPhotos.length} fotos]:\n${extraPhotos.map((p, idx) => `  +${idx + 1}. ${p.originalFileName} ${gallery.clientSelection.comments[p.id] ? `[Comentário: ${gallery.clientSelection.comments[p.id]}]` : ''}`).join('\n')}` : '[Nenhuma foto excedente]'}

${commentsSection}
=== MENSAGEM FINAL DO CLIENTE ===
${gallery.clientSelection.clientNotes || 'Nenhuma mensagem adicional informada.'}

=====================================================
Gerado via Photo Proofing Studio • Sistema de Seleção Fotográfica
=====================================================
`;

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aprovacao-${gallery.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
