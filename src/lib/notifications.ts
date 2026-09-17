import { Order, Gallery, NotificationPayload } from '../types';

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
    payloads.forEach(p => {
      console.log(`[${p.recipientType.toUpperCase()}] -> Contact: ${p.recipientContact}\n${p.message}\n---`);
    });
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
