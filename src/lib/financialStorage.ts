import { FinancialTransaction, Gallery, TransactionStatus, Order } from '../types';
import {
  updateGalleryPaymentStatusAsync,
  getAllOrdersAsync,
  saveOrderAsync,
  deleteOrderAsync
} from './storage';

const FINANCIAL_CACHE_KEY = 'izylumna_financial_transactions_v2';

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'tx-101',
    galleryId: 'gal-1',
    galleryTitle: 'Casamento Marina & Guilherme',
    clientName: 'Marina Silva',
    clientPhone: '(11) 98765-4321',
    extraPhotosCount: 12,
    amount: 360,
    pixTxId: 'E00038166202509171240a1b2c3d4',
    status: 'pending',
    date: '17/09/2025 às 14:12',
    paymentMethod: 'pix',
    notes: 'Aguardando liquidação do banco parceiro (PIX QR Code).',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-102',
    galleryId: 'gal-2',
    galleryTitle: 'Editorial Moda Autoral - Vl. 04',
    clientName: 'Camila Valente',
    clientPhone: '(11) 91234-5678',
    extraPhotosCount: 15,
    amount: 525,
    pixTxId: 'E00038166202509170930f9e8d7c6',
    status: 'settled',
    date: '17/09/2025 às 10:42',
    paymentMethod: 'pix',
    notes: 'Pagamento de 15 fotos adicionais confirmado via webhook.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-103',
    galleryId: 'gal-3',
    galleryTitle: 'Ensaio Gestante - Helena & Theo',
    clientName: 'Helena Ramos',
    clientPhone: '(21) 99887-6655',
    extraPhotosCount: 8,
    amount: 240,
    pixTxId: 'E00038166202509161820x1y2z3a4',
    status: 'settled',
    date: '16/09/2025 às 18:20',
    paymentMethod: 'pix',
    notes: 'Pago via Chave PIX E-mail.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-104',
    galleryId: 'gal-4',
    galleryTitle: 'Formatura Medicina Turma XLVIII',
    clientName: 'Comissão Medicina Unifesp',
    clientPhone: '(11) 97766-5544',
    extraPhotosCount: 45,
    amount: 1350,
    pixTxId: 'E00038166202509151110m9n8b7v6',
    status: 'settled',
    date: '15/09/2025 às 11:10',
    paymentMethod: 'pix',
    notes: 'Lote de fotos extras aprovado em convenção.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-105',
    galleryId: 'gal-5',
    galleryTitle: 'Pre-Wedding Lucas & Beatriz',
    clientName: 'Lucas Lima',
    clientPhone: '(19) 98112-2334',
    extraPhotosCount: 20,
    amount: 600,
    pixTxId: 'E00038166202509141545p1o2i3u4',
    status: 'settled',
    date: '14/09/2025 às 15:45',
    paymentMethod: 'pix',
    notes: 'Pacote adicional de 20 fotos.',
    createdAt: new Date().toISOString()
  }
];

/**
 * Syncs and loads transactions from local storage + Supabase orders table + Live Galleries
 */
export async function getFinancialTransactionsAsync(galleries: Gallery[] = []): Promise<FinancialTransaction[]> {
  let stored: FinancialTransaction[] = [];
  try {
    const raw = localStorage.getItem(FINANCIAL_CACHE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Financial Storage] Error reading cached transactions:', e);
  }

  if (!Array.isArray(stored) || stored.length === 0) {
    stored = [...INITIAL_TRANSACTIONS];
  }

  const txMap = new Map<string, FinancialTransaction>();
  stored.forEach((tx) => txMap.set(tx.id, tx));

  // 1. Fetch real Supabase orders table rows
  try {
    const dbOrders = await getAllOrdersAsync();
    dbOrders.forEach((ord) => {
      const matchedGallery = galleries.find((g) => g.id === ord.galleryId);
      const isPaid = ord.status === 'paid';
      const statusMapped: TransactionStatus = isPaid
        ? 'settled'
        : ord.status === 'canceled' || ord.status === 'expired'
        ? 'canceled'
        : 'pending';

      const existingInMap = txMap.get(ord.id);
      txMap.set(ord.id, {
        id: ord.id,
        galleryId: ord.galleryId,
        galleryTitle: matchedGallery?.title || existingInMap?.galleryTitle || 'Ensaio Solicitado',
        clientName: matchedGallery?.clientName || existingInMap?.clientName || 'Cliente Lumina',
        clientPhone: matchedGallery?.clientPhone || existingInMap?.clientPhone || '(11) 99999-0000',
        extraPhotosCount: existingInMap?.extraPhotosCount || 10,
        amount: ord.totalAmount || existingInMap?.amount || 0,
        pixTxId: ord.externalId || ord.pixCopyPaste?.substring(0, 30) || existingInMap?.pixTxId || `E${ord.id}`,
        status: statusMapped,
        date: ord.createdAt
          ? new Date(ord.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : existingInMap?.date || new Date().toLocaleDateString('pt-BR'),
        paymentMethod: 'pix',
        notes: existingInMap?.notes || `Pedido Supabase ID: ${ord.id}`,
        createdAt: ord.createdAt || new Date().toISOString()
      });
    });
  } catch (e) {
    console.warn('[Financial Storage] Failed fetching orders from Supabase:', e);
  }

  // 2. Perceive live charges from galleries ("percebendo as cobranças do site")
  galleries.forEach((gallery) => {
    const selectedCount =
      gallery.clientSelection?.selectedPhotoIds?.length ||
      gallery.photos.filter((p) => (p.votes || []).length >= (gallery.consensusThreshold || 2)).length ||
      0;

    const quota = gallery.maxContractedPhotos || gallery.quotaIncluded || 20;
    const extrasCount = Math.max(0, selectedCount - quota);
    const price = gallery.extraPhotoPrice || 25;
    const extraTotal = extrasCount * price;

    if (extraTotal > 0 || gallery.galleryClosureFee) {
      const existing = Array.from(txMap.values()).find((t) => t.galleryId === gallery.id);
      const isPaid = gallery.paymentStatus === 'paid';
      const status: TransactionStatus = isPaid ? 'settled' : existing?.status || 'pending';
      const amount = extraTotal > 0 ? extraTotal : (gallery.galleryClosureFee || 6.90);

      if (existing) {
        txMap.set(existing.id, {
          ...existing,
          galleryTitle: existing.galleryTitle || gallery.title,
          clientName: existing.clientName || gallery.clientName,
          clientPhone: existing.clientPhone || gallery.clientPhone || '(11) 99999-0000',
          extraPhotosCount: existing.extraPhotosCount || extrasCount,
          amount: existing.amount || amount,
          status: isPaid ? 'settled' : existing.status
        });
      } else {
        const newPerceivedTx: FinancialTransaction = {
          id: `tx-gal-${gallery.id}`,
          galleryId: gallery.id,
          galleryTitle: gallery.title,
          clientName: gallery.clientName,
          clientPhone: gallery.clientPhone || '(11) 99999-0000',
          extraPhotosCount: extrasCount,
          amount,
          pixTxId: `E${Math.floor(10000000 + Math.random() * 90000000)}${Date.now().toString().slice(-10)}`,
          status,
          date: new Date(gallery.updatedAt || gallery.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(gallery.updatedAt || gallery.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          paymentMethod: 'pix',
          notes: `Cobrança automática da galeria ${gallery.title} (${extrasCount} fotos extras).`,
          createdAt: gallery.createdAt
        };
        txMap.set(newPerceivedTx.id, newPerceivedTx);
      }
    }
  });

  const finalTransactions = Array.from(txMap.values());
  saveFinancialTransactions(finalTransactions);
  return finalTransactions;
}

/**
 * Synchronous local getter for fast renders
 */
export function getFinancialTransactions(galleries: Gallery[] = []): FinancialTransaction[] {
  let stored: FinancialTransaction[] = [];
  try {
    const raw = localStorage.getItem(FINANCIAL_CACHE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Financial Storage] Error reading cached transactions:', e);
  }

  if (!Array.isArray(stored) || stored.length === 0) {
    stored = [...INITIAL_TRANSACTIONS];
  }

  const txMap = new Map<string, FinancialTransaction>();
  stored.forEach((tx) => txMap.set(tx.id, tx));

  galleries.forEach((gallery) => {
    const selectedCount =
      gallery.clientSelection?.selectedPhotoIds?.length ||
      gallery.photos.filter((p) => (p.votes || []).length >= (gallery.consensusThreshold || 2)).length ||
      0;

    const quota = gallery.maxContractedPhotos || gallery.quotaIncluded || 20;
    const extrasCount = Math.max(0, selectedCount - quota);
    const price = gallery.extraPhotoPrice || 25;
    const extraTotal = extrasCount * price;

    if (extraTotal > 0 || gallery.galleryClosureFee) {
      const existing = Array.from(txMap.values()).find((t) => t.galleryId === gallery.id);
      const isPaid = gallery.paymentStatus === 'paid';
      const status: TransactionStatus = isPaid ? 'settled' : existing?.status || 'pending';
      const amount = extraTotal > 0 ? extraTotal : (gallery.galleryClosureFee || 6.90);

      if (existing) {
        txMap.set(existing.id, {
          ...existing,
          galleryTitle: existing.galleryTitle || gallery.title,
          clientName: existing.clientName || gallery.clientName,
          clientPhone: existing.clientPhone || gallery.clientPhone || '(11) 99999-0000',
          extraPhotosCount: existing.extraPhotosCount || extrasCount,
          amount: existing.amount || amount,
          status: isPaid ? 'settled' : existing.status
        });
      } else {
        const newPerceivedTx: FinancialTransaction = {
          id: `tx-gal-${gallery.id}`,
          galleryId: gallery.id,
          galleryTitle: gallery.title,
          clientName: gallery.clientName,
          clientPhone: gallery.clientPhone || '(11) 99999-0000',
          extraPhotosCount: extrasCount,
          amount,
          pixTxId: `E${Math.floor(10000000 + Math.random() * 90000000)}${Date.now().toString().slice(-10)}`,
          status,
          date: new Date(gallery.updatedAt || gallery.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(gallery.updatedAt || gallery.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          paymentMethod: 'pix',
          notes: `Cobrança automática da galeria ${gallery.title} (${extrasCount} fotos extras).`,
          createdAt: gallery.createdAt
        };
        txMap.set(newPerceivedTx.id, newPerceivedTx);
      }
    }
  });

  const finalTransactions = Array.from(txMap.values());
  saveFinancialTransactions(finalTransactions);
  return finalTransactions;
}

/**
 * Persists transactions array to localStorage
 */
export function saveFinancialTransactions(transactions: FinancialTransaction[]): void {
  try {
    localStorage.setItem(FINANCIAL_CACHE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.warn('[Financial Storage] Error persisting transactions:', e);
  }
}

/**
 * Adds a new financial transaction and persists to Supabase orders + LocalStorage
 */
export async function addFinancialTransactionAsync(
  tx: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  allTransactions: FinancialTransaction[]
): Promise<FinancialTransaction[]> {
  const newTx: FinancialTransaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [newTx, ...allTransactions];
  saveFinancialTransactions(updated);

  // Persist order in Supabase
  if (newTx.galleryId) {
    await saveOrderAsync({
      id: newTx.id,
      galleryId: newTx.galleryId,
      payerType: 'client',
      totalAmount: newTx.amount,
      externalId: newTx.pixTxId,
      status: newTx.status === 'settled' ? 'paid' : newTx.status === 'canceled' ? 'canceled' : 'pending'
    });

    if (newTx.status === 'settled') {
      await updateGalleryPaymentStatusAsync(newTx.galleryId, 'paid');
    }
  }

  return updated;
}

/**
 * Updates an existing transaction and persists to Supabase orders + LocalStorage
 */
export async function updateFinancialTransactionAsync(
  updatedTx: FinancialTransaction,
  allTransactions: FinancialTransaction[]
): Promise<FinancialTransaction[]> {
  const now = new Date().toISOString();
  const nextList = allTransactions.map((tx) =>
    tx.id === updatedTx.id ? { ...updatedTx, updatedAt: now } : tx
  );

  saveFinancialTransactions(nextList);

  // Persist update to Supabase orders table
  if (updatedTx.galleryId) {
    await saveOrderAsync({
      id: updatedTx.id,
      galleryId: updatedTx.galleryId,
      payerType: 'client',
      totalAmount: updatedTx.amount,
      externalId: updatedTx.pixTxId,
      status: updatedTx.status === 'settled' ? 'paid' : updatedTx.status === 'canceled' ? 'canceled' : 'pending'
    });

    if (updatedTx.status === 'settled') {
      await updateGalleryPaymentStatusAsync(updatedTx.galleryId, 'paid');
    } else if (updatedTx.status === 'pending') {
      await updateGalleryPaymentStatusAsync(updatedTx.galleryId, 'pending');
    }
  }

  return nextList;
}

/**
 * Deletes a transaction by ID from Supabase orders + LocalStorage
 */
export async function deleteFinancialTransactionAsync(
  txId: string,
  allTransactions: FinancialTransaction[]
): Promise<FinancialTransaction[]> {
  const nextList = allTransactions.filter((tx) => tx.id !== txId);
  saveFinancialTransactions(nextList);

  // Attempt delete in Supabase
  await deleteOrderAsync(txId);

  return nextList;
}
