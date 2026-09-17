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
    const { gallery_id, payer_type, selected_photo_count } = await req.json();

    if (!gallery_id || !payer_type) {
      return new Response(
        JSON.stringify({ error: 'gallery_id e payer_type são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Buscar dados da galeria no Supabase
    const { data: gallery, error: galErr } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', gallery_id)
      .single();

    if (galErr || !gallery) {
      return new Response(
        JSON.stringify({ error: 'Galeria não encontrada', details: galErr }),
        { status: 444, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Cálculo dos valores de pagamento e comissão
    let total_amount = 0;
    let platform_fee = 0;
    let photographer_amount = 0;

    if (payer_type === 'client') {
      const maxContracted = Number(gallery.max_contracted_photos ?? gallery.quota_included ?? 20);
      const selectedCount = Number(selected_photo_count || 0);
      const extrasCount = Math.max(0, selectedCount - maxContracted);
      const pricePerExtra = Number(gallery.extra_photo_price || 25.00);

      total_amount = Number((extrasCount * pricePerExtra).toFixed(2));
      const commissionRate = Number(gallery.platform_commission_rate || 0.08);
      platform_fee = Number((total_amount * commissionRate).toFixed(2));
      photographer_amount = Number((total_amount - platform_fee).toFixed(2));

      if (total_amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma foto extra a ser cobrada.', total_amount: 0 }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (payer_type === 'photographer') {
      total_amount = Number((gallery.gallery_closure_fee || 6.90).toFixed(2));
      platform_fee = total_amount;
      photographer_amount = 0;
    }

    // 3. Integração com Mercado Pago ou Asaas ou Mock
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    const asaasKey = Deno.env.get('ASAAS_API_KEY');

    let pix_copy_paste = '';
    let pix_qr_code_base64 = '';
    let external_id = '';
    let is_mock = false;

    if (mercadoPagoToken) {
      // Chamada oficial API Mercado Pago PIX
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${gallery_id}-${payer_type}-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: total_amount,
          description: payer_type === 'client' 
            ? `Izy Lumna - Seleção Extra (${gallery.title})` 
            : `Izy Lumna - Taxa de Encerramento (${gallery.title})`,
          payment_method_id: 'pix',
          payer: {
            email: gallery.client_email || 'cliente@izylumna.com.br',
            first_name: gallery.client_name || 'Cliente',
          },
          notification_url: `${supabaseUrl}/functions/v1/payment-webhook`
        })
      });

      const mpData = await mpResponse.json();
      if (mpResponse.ok && mpData.point_of_interaction?.transaction_data) {
        pix_copy_paste = mpData.point_of_interaction.transaction_data.qr_code || '';
        pix_qr_code_base64 = mpData.point_of_interaction.transaction_data.qr_code_base64 || '';
        external_id = String(mpData.id);
      } else {
        console.warn('[Mercado Pago Warning] Fallback para modo simulado devido a erro da API:', mpData);
        is_mock = true;
      }
    } else if (asaasKey) {
      // Chamada oficial API Asaas PIX
      const asaasResponse = await fetch('https://api.asaas.com/v3/payments', {
        method: 'POST',
        headers: {
          'access_token': asaasKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: 'cus_000005112234',
          billingType: 'PIX',
          value: total_amount,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          description: `Izy Lumna - ${gallery.title}`
        })
      });
      const asaasData = await asaasResponse.json();
      if (asaasResponse.ok && asaasData.id) {
        external_id = asaasData.id;
        // Obter QR Code PIX
        const qrResp = await fetch(`https://api.asaas.com/v3/payments/${external_id}/pixQrCode`, {
          headers: { 'access_token': asaasKey }
        });
        const qrData = await qrResp.json();
        pix_copy_paste = qrData.payload || '';
        pix_qr_code_base64 = qrData.encodedImage || '';
      } else {
        is_mock = true;
      }
    } else {
      is_mock = true;
    }

    if (is_mock || !pix_copy_paste) {
      // Gerar QR Code PIX de Teste / Desenvolvimento Local
      external_id = `mock_order_${Date.now()}`;
      pix_copy_paste = `00020126580014br.gov.bcb.pix0136izylumna-pix-${external_id}5204000053039865405${total_amount.toFixed(2)}5802BR5910IZY LUMNA6009SAO PAULO62070503***630489A1`;
      
      // QR Code Base64 simulado em SVG URI simples
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#030712"/>
        <rect x="15" y="15" width="170" height="170" rx="16" fill="#111827" stroke="#10b981" stroke-width="3"/>
        <path d="M 40 40 h 40 v 40 h -40 z M 120 40 h 40 v 40 h -40 z M 40 120 h 40 v 40 h -40 z" fill="#10b981"/>
        <path d="M 50 50 h 20 v 20 h -20 z M 130 50 h 20 v 20 h -20 z M 50 130 h 20 v 20 h -20 z" fill="#030712"/>
        <circle cx="100" cy="100" r="16" fill="#f59e0b"/>
        <text x="100" y="180" font-size="12" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">PIX Izy Lumna (Modo Teste)</text>
      </svg>`;
      pix_qr_code_base64 = `data:image/svg+xml;base64,${btoa(svgString)}`;
    }

    // 4. Salvar pedido na tabela public.orders
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        gallery_id,
        payer_type,
        total_amount,
        platform_fee,
        photographer_amount,
        external_id,
        status: 'pending',
        pix_copy_paste,
        pix_qr_code_base64
      })
      .select()
      .single();

    if (orderErr) {
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar pedido no banco de dados', details: orderErr }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        total_amount,
        platform_fee,
        photographer_amount,
        pix_copy_paste,
        pix_qr_code_base64,
        status: 'pending',
        is_mock
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
