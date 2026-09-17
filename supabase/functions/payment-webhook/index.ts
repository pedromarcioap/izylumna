import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Pode ser chamada GET ou webhook com querystring
    }

    const url = new URL(req.url);
    const action = body?.action || body?.type || url.searchParams.get('type') || url.searchParams.get('action');
    const paymentId = body?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || body?.id || body?.payment?.id;

    console.log('[Payment Webhook] Evento recebido:', { action, paymentId, body });

    // Se for um evento do Mercado Pago (ex: payment.updated) ou Asaas (PAYMENT_RECEIVED)
    let external_id = paymentId ? String(paymentId) : '';
    let isApproved = false;

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    if (body?.event === 'PAYMENT_RECEIVED' || body?.event === 'PAYMENT_CONFIRMED') {
      // Evento Asaas
      external_id = body.payment?.id || external_id;
      isApproved = true;
    } else if (mercadoPagoToken && paymentId) {
      // Consultar status no Mercado Pago
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mercadoPagoToken}` }
      });
      if (mpResp.ok) {
        const mpPayment = await mpResp.json();
        if (mpPayment.status === 'approved') {
          isApproved = true;
        }
      }
    } else {
      // Se for chamada de teste / simulação direta no webhook com { order_id, action: 'simulate_paid' }
      if (body?.order_id || body?.action === 'simulate_paid') {
        const targetOrderId = body.order_id;
        if (targetOrderId) {
          const { data: targetOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', targetOrderId)
            .single();

          if (targetOrder) {
            await supabase.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', targetOrder.id);
            await supabase.from('galleries').update({ payment_status: 'paid', updated_at: new Date().toISOString() }).eq('id', targetOrder.gallery_id);
            return new Response(JSON.stringify({ success: true, message: 'Pedido aprovado via simulação de teste' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
      }
      isApproved = true; // aprovação padrão se for webhook genérico ativo
    }

    if (external_id && isApproved) {
      // Buscar pedido por external_id no Supabase
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('external_id', external_id)
        .maybeSingle();

      if (order) {
        // Atualizar status do pedido para 'paid'
        await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', order.id);

        // Atualizar payment_status da galeria para 'paid'
        await supabase
          .from('galleries')
          .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', order.gallery_id);

        console.log(`[Payment Webhook] Sucesso: Galeria ${order.gallery_id} quitada após confirmação do pedido ${order.id}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
