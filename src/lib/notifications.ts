import { Order, Gallery, NotificationPayload } from '../types';

export interface NotificationItem {
  id: string;
  type: 'vote' | 'payment' | 'comment' | 'user';
  title: string;
  message: string;
  timestamp: string;
  createdIso: string;
  isRead: boolean;
  galleryId?: string;
  photoId?: string;
}

const NOTIFICATION_STORAGE_KEY = 'izylumna_app_notifications_v1';
export const NOTIFICATION_EVENT_NAME = 'izylumna-notification-change';

const DEFAULT_INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-default-1',
    type: 'vote',
    title: 'Votação em Aberto',
    message: 'Marina Alencar adicionou novos votos na galeria "Casamento Marina & Lucas".',
    timestamp: 'há 10 min',
    createdIso: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'n-default-2',
    type: 'payment',
    title: 'Pagamento PIX Confirmado',
    message: 'Recebido R$ 360,00 (+12 fotos extras selecionadas) no Ensaio Casamento.',
    timestamp: 'há 25 min',
    createdIso: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'n-default-3',
    type: 'comment',
    title: 'Novo Comentário',
    message: 'Camila Rossi: "Poderia enviar uma versão em alta resolução desta foto?"',
    timestamp: 'há 1h',
    createdIso: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false
  }
];

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_NOTIFICATIONS));
      return DEFAULT_INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_INITIAL_NOTIFICATIONS;
  } catch (e) {
    return DEFAULT_INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(items: NotificationItem[]): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT_NAME, { detail: items }));
  } catch (e) {
    console.error('Failed to save notifications to localStorage:', e);
  }
}

export function addAppNotification(
  payload: Omit<NotificationItem, 'id' | 'timestamp' | 'createdIso' | 'isRead'> & { timestamp?: string }
): NotificationItem {
  const current = getStoredNotifications();
  const createdIso = new Date().toISOString();
  const newNotification: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    timestamp: payload.timestamp || 'Agora',
    createdIso,
    isRead: false,
    galleryId: payload.galleryId,
    photoId: payload.photoId
  };

  const updated = [newNotification, ...current].slice(0, 50); // Keep latest 50 notifications
  saveStoredNotifications(updated);
  return newNotification;
}

export function markAllNotificationsAsRead(): void {
  const current = getStoredNotifications();
  const updated = current.map((item) => ({ ...item, isRead: true }));
  saveStoredNotifications(updated);
}

export function toggleNotificationRead(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item));
  saveStoredNotifications(updated);
}

export function clearNotifications(): void {
  saveStoredNotifications([]);
}

/**
 * Event-driven dispatchers for platform interactions
 */
export function notifyVoteEvent(params: {
  galleryTitle: string;
  voterName: string;
  photoName?: string;
  action: 'add' | 'remove' | 'reset';
  galleryId?: string;
}) {
  let title = 'Novo Voto em Foto';
  let message = `${params.voterName} votou na foto "${params.photoName || 'Foto'}" na galeria "${params.galleryTitle}".`;

  if (params.action === 'remove') {
    title = 'Voto Removido';
    message = `${params.voterName} removeu o voto da foto "${params.photoName || 'Foto'}" na galeria "${params.galleryTitle}".`;
  } else if (params.action === 'reset') {
    title = 'Votação Zerada';
    message = `Votos de ${params.voterName} foram zerados na galeria "${params.galleryTitle}".`;
  }

  addAppNotification({
    type: 'vote',
    title,
    message,
    galleryId: params.galleryId
  });
}

export function notifyRatingEvent(params: {
  galleryTitle: string;
  raterName?: string;
  photoName: string;
  rating: number;
  galleryId?: string;
}) {
  const title = params.rating > 0 ? 'Nova Avaliação de Foto' : 'Avaliação Removida';
  const name = params.raterName || 'Um usuário';
  const message =
    params.rating > 0
      ? `${name} avaliou a foto "${params.photoName}" com ${params.rating}★ na galeria "${params.galleryTitle}".`
      : `${name} removeu a classificação da foto "${params.photoName}" na galeria "${params.galleryTitle}".`;

  addAppNotification({
    type: 'vote',
    title,
    message,
    galleryId: params.galleryId
  });
}

export function notifyCommentEvent(params: {
  galleryTitle: string;
  commenterName: string;
  photoName: string;
  commentText: string;
  galleryId?: string;
}) {
  addAppNotification({
    type: 'comment',
    title: 'Novo Comentário em Foto',
    message: `${params.commenterName}: "${params.commentText}" na foto "${params.photoName}" ("${params.galleryTitle}").`,
    galleryId: params.galleryId
  });
}

export function notifyFinalizeEvent(params: {
  galleryTitle: string;
  voterName: string;
  galleryId?: string;
}) {
  addAppNotification({
    type: 'user',
    title: 'Seleção Finalizada',
    message: `${params.voterName} finalizou a escolha de fotos na galeria "${params.galleryTitle}".`,
    galleryId: params.galleryId
  });
}

/**
 * Builds standard WhatsApp / Email notification template for the Photographer upon payment receipt.
 */
export function buildPhotographerNotificationMessage(order: Order, gallery: Gallery): string {
  const isExtraPhotos = order.payerType === 'client';
  const extraCount = Math.max(0, gallery.clientSelection.selectedPhotoIds.length - gallery.quotaIncluded);

  if (isExtraPhotos) {
    return (
      `📸 *Izy Lumna - Receita de Fotos Extras Recebida!*\n\n` +
      `Olá! O cliente *${gallery.clientName}* acabou de realizar o pagamento do PIX para finalizar a galeria *"${gallery.title}"*.\n\n` +
      `📌 *Resumo do Pedido:*\n` +
      `• Fotos Extras Adquiridas: *+${extraCount} fotos*\n` +
      `• Valor Total Pago: *R$ ${order.totalAmount.toFixed(2)}*\n` +
      `• Seu Repasse Líquido (92%): *R$ ${order.photographerAmount.toFixed(2)}*\n` +
      `• Taxa Plataforma (8%): R$ ${order.platformFee.toFixed(2)}\n\n` +
      `🎉 Sua galeria foi completada e liberada automaticamente para exportação no Lightroom!`
    );
  }

  return (
    `✅ *Izy Lumna - Taxa de Encerramento Quitada!*\n\n` +
    `A galeria *"${gallery.title}"* teve sua taxa de encerramento (R$ ${order.totalAmount.toFixed(2)}) quitada com sucesso.\n\n` +
    `🚀 As opções de exportação para Lightroom e manifestos de pós-produção já estão 100% liberadas no seu painel!`
  );
}

/**
 * Builds standard WhatsApp / Email notification template for the Client upon payment receipt.
 */
export function buildClientNotificationMessage(order: Order, gallery: Gallery): string {
  const selectedCount = gallery.clientSelection.selectedPhotoIds.length;

  return (
    `✨ *Izy Lumna - Confirmação de Pagamento e Seleção!*\n\n` +
    `Olá, *${gallery.clientName}*!\n` +
    `Confirmamos o recebimento do seu pagamento via PIX (R$ ${order.totalAmount.toFixed(2)}) referente ao projeto *"${gallery.title}"*.\n\n` +
    `📸 Suas *${selectedCount} fotos escolhidas* foram enviadas diretamente ao fotógrafo e estão prontas para a etapa final de edição em alta resolução.\n\n` +
    `Muito obrigado por utilizar o Izy Lumna!`
  );
}

/**
 * Sends automated notifications via external webhook APIs (WhatsApp Z-API, Evolution API, Resend, or generic webhooks).
 */
export async function sendPaymentNotificationsAsync(
  order: Order,
  gallery: Gallery,
  options?: { webhookEndpoint?: string }
): Promise<{ success: boolean; errors?: string[] }> {
  const webhookUrl = options?.webhookEndpoint || process.env.VITE_NOTIFICATION_WEBHOOK_URL;

  const photographerMessage = buildPhotographerNotificationMessage(order, gallery);
  const clientMessage = buildClientNotificationMessage(order, gallery);

  // Always add to local app notification drawer for instant UI update
  addAppNotification({
    type: 'payment',
    title: 'Pagamento PIX Confirmado',
    message: `Recebido R$ ${order.totalAmount.toFixed(2)} referente à galeria "${gallery.title}".`,
    galleryId: gallery.id
  });

  const payloads: NotificationPayload[] = [
    {
      recipientType: 'photographer',
      recipientName: 'Fotógrafo',
      recipientContact: gallery.clientEmail || 'fotografo@izylumna.com',
      channel: 'both',
      galleryTitle: gallery.title,
      orderId: order.id,
      amount: order.photographerAmount,
      extraPhotosCount: Math.max(0, gallery.clientSelection.selectedPhotoIds.length - gallery.quotaIncluded),
      message: photographerMessage
    }
  ];

  if (gallery.clientPhone || gallery.clientEmail) {
    payloads.push({
      recipientType: 'client',
      recipientName: gallery.clientName,
      recipientContact: gallery.clientPhone || gallery.clientEmail || '',
      channel: gallery.clientPhone ? 'whatsapp' : 'email',
      galleryTitle: gallery.title,
      orderId: order.id,
      amount: order.totalAmount,
      message: clientMessage
    });
  }

  const errors: string[] = [];

  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.settled_notifications',
          orderId: order.id,
          galleryId: gallery.id,
          notifications: payloads,
          sentAt: new Date().toISOString()
        })
      });

      if (!resp.ok) {
        errors.push(`Falha no envio de webhook externo: ${resp.statusText}`);
      }
    } catch (err: any) {
      errors.push(`Erro de rede ao enviar notificação: ${err.message}`);
    }
  } else {
    // Log for local development environment
    console.log('[Notification Dispatcher Local Mode] Payloads generated:');
    payloads.forEach((p) => {
      console.log(`[${p.recipientType.toUpperCase()}] -> Contact: ${p.recipientContact}\n${p.message}\n---`);
    });
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

