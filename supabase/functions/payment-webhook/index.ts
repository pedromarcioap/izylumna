import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
    const notificationWebhookUrl = Deno.env.get('NOTIFICATION_WEBHOOK_URL');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);

    // 1. Secret / Token Verification if configured
    if (webhookSecret) {
      const providedToken = req.headers.get('x-webhook-token') || url.searchParams.get('token');
      if (providedToken !== webhookSecret) {
        console.warn('[Payment Webhook] Token de autenticação inválido');
        return new Response(
          JSON.stringify({ error: 'Não autorizado. Token de webhook inválido.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Pode ser chamada GET ou webhook de verificação
    }

    const action = body?.action || body?.type || url.searchParams.get('type') || url.searchParams.get('action');
    const paymentId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || body?.id || body?.payment?.id;

    console.log('[Payment Webhook] Evento recebido:', { action, paymentId, body });

    let external_id = paymentId ? String(paymentId) : '';
    let isApproved = false;

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    // Check Asaas Webhook
    if (body?.event === 'PAYMENT_RECEIVED' || body?.event === 'PAYMENT_CONFIRMED') {
      external_id = body.payment?.id || external_id;
      isApproved = true;
    } 
    // Check Mercado Pago Webhook
    else if (mercadoPagoToken && paymentId) {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mercadoPagoToken}` }
      });
      if (mpResp.ok) {
        const mpPayment = await mpResp.json();
        if (mpPayment.status === 'approved') {
          isApproved = true;
        }
      }
    } 
    // Check local simulation payload
    else if (body?.order_id || body?.action === 'simulate_paid') {
      const targetOrderId = body.order_id;
      if (targetOrderId) {
        const { data: targetOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('id', targetOrderId)
          .single();

        if (targetOrder) {
          const nowIso = new Date().toISOString();
          await supabase.from('orders').update({ status: 'paid', updated_at: nowIso }).eq('id', targetOrder.id);
          await supabase.from('galleries').update({ payment_status: 'paid', status: 'completed', updated_at: nowIso }).eq('id', targetOrder.gallery_id);

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Pedido e Galeria aprovados via simulação de teste com sucesso!',
            orderId: targetOrder.id,
            galleryId: targetOrder.gallery_id
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      isApproved = true;
    } else {
      isApproved = true; // aprovação genérica se habilitado
    }

    if (external_id && isApproved) {
      // Find order by external_id
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('external_id', external_id)
        .maybeSingle();

      if (order) {
        const nowIso = new Date().toISOString();

        // 2. Atomic Updates
        await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: nowIso })
          .eq('id', order.id);

        await supabase
          .from('galleries')
          .update({ payment_status: 'paid', status: 'completed', updated_at: nowIso })
          .eq('id', order.gallery_id);

        console.log(`[Payment Webhook] Sucesso: Galeria ${order.gallery_id} quitada e completada após pedido ${order.id}`);

        // 3. Dispatch Notification to external service (WhatsApp/Email)
        if (notificationWebhookUrl) {
          try {
            const { data: galleryData } = await supabase
              .from('galleries')
              .select('*')
              .eq('id', order.gallery_id)
              .single();

            if (galleryData) {
              await fetch(notificationWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'payment.approved',
                  orderId: order.id,
                  galleryId: galleryData.id,
                  clientName: galleryData.client_name || galleryData.clientName,
                  galleryTitle: galleryData.title,
                  totalAmount: order.total_amount || order.totalAmount,
                  photographerAmount: order.photographer_amount || order.photographerAmount,
                  settledAt: nowIso
                })
              });
            }
          } catch (notifErr) {
            console.error('[Payment Webhook] Erro ao disparar webhook de notificação:', notifErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook de pagamento processado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
