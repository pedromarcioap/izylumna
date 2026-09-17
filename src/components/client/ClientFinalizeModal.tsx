import React, { useState, useEffect } from 'react';
import { Gallery, Photo, GalleryVoter } from '../../types';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Input';
import { SafeImage } from '../common/SafeImage';
import { CheckCheck, Lock, QrCode, Copy, Check, RefreshCw, Sparkles, CreditCard } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { updateGalleryPaymentStatusAsync } from '../../lib/storage';

export interface ClientFinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallery: Gallery;
  currentVoter: GalleryVoter | null;
  myVotedPhotos: Photo[];
  consensusCount: number;
  onConfirmSubmit: (clientNotes: string) => void;
}

export const ClientFinalizeModal: React.FC<ClientFinalizeModalProps> = ({
  isOpen,
  onClose,
  gallery,
  currentVoter,
  myVotedPhotos,
  consensusCount,
  onConfirmSubmit
}) => {
  const [clientNotes, setClientNotes] = useState(gallery.clientSelection.clientNotes || '');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'pix_payment' | 'completed'>('review');

  // PIX Checkout State
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixData, setPixData] = useState<{
    orderId?: string;
    copyPaste: string;
    qrCodeBase64: string;
    totalAmount: number;
    extrasCount: number;
    isMock?: boolean;
  } | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const threshold = gallery.consensusThreshold || 2;
  const isFinalized = Boolean(currentVoter?.hasFinalized);

  const maxPhotos = gallery.maxContractedPhotos || gallery.quotaIncluded || 20;
  // Consider total selected as either consensus count or my voted photos
  const selectedCount = Math.max(myVotedPhotos.length, consensusCount || 0);
  const extrasCount = Math.max(0, selectedCount - maxPhotos);
  const extraPrice = gallery.extraPhotoPrice || 25;
  const totalAmount = extrasCount * extraPrice;
  const requiresPayment = extrasCount > 0 && gallery.excessPolicy === 'charge' && gallery.paymentStatus !== 'paid';

  useEffect(() => {
    if (!isOpen) {
      setCheckoutStep('review');
      setPixData(null);
      setCopiedPix(false);
    }
  }, [isOpen]);

  // Realtime subscription / Polling for PIX Payment status
  useEffect(() => {
    if (checkoutStep !== 'pix_payment' || !pixData?.orderId) return;

    setIsCheckingPayment(true);

    let channel: any = null;
    let pollInterval: any = null;

    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`order_status_${pixData.orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${pixData.orderId}`
          },
          (payload) => {
            if (payload.new && payload.new.status === 'paid') {
              handlePaymentSuccess();
            }
          }
        )
        .subscribe();
    }

    // Polling fallback every 3.5s
    pollInterval = setInterval(async () => {
      if (isSupabaseConfigured && supabase && pixData.orderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('status')
          .eq('id', pixData.orderId)
          .maybeSingle();

        if (order && order.status === 'paid') {
          handlePaymentSuccess();
        }
      }
    }, 3500);

    return () => {
      if (channel && supabase) supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [checkoutStep, pixData]);

  const handlePaymentSuccess = async () => {
    setIsCheckingPayment(false);
    await updateGalleryPaymentStatusAsync(gallery.id, 'paid');
    setCheckoutStep('completed');
    onConfirmSubmit(clientNotes.trim());
  };

  const handleGeneratePixOrder = async () => {
    setIsGeneratingPix(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.functions.invoke('create-pix-order', {
          body: {
            gallery_id: gallery.id,
            payer_type: 'client',
            selected_photo_count: selectedCount
          }
        });

        if (!error && data && data.success) {
          setPixData({
            orderId: data.order_id,
            copyPaste: data.pix_copy_paste,
            qrCodeBase64: data.pix_qr_code_base64,
            totalAmount: data.total_amount || totalAmount,
            extrasCount,
            isMock: data.is_mock
          });
          setCheckoutStep('pix_payment');
          return;
        }
      }

      // Fallback if Supabase Edge Function is not active locally
      const mockOrderId = `mock_order_${Date.now()}`;
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0136izylumna-pix-${mockOrderId}5204000053039865405${totalAmount.toFixed(2)}5802BR5910IZY LUMNA6009SAO PAULO62070503***6304`;
      
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#030712"/>
        <rect x="15" y="15" width="170" height="170" rx="16" fill="#111827" stroke="#10b981" stroke-width="3"/>
        <path d="M 40 40 h 40 v 40 h -40 z M 120 40 h 40 v 40 h -40 z M 40 120 h 40 v 40 h -40 z" fill="#10b981"/>
        <path d="M 50 50 h 20 v 20 h -20 z M 130 50 h 20 v 20 h -20 z M 50 130 h 20 v 20 h -20 z" fill="#030712"/>
        <circle cx="100" cy="100" r="16" fill="#f59e0b"/>
        <text x="100" y="180" font-size="11" fill="#9ca3af" text-anchor="middle" font-family="sans-serif">PIX Izy Lumna (Modo Teste)</text>
      </svg>`;

      setPixData({
        orderId: mockOrderId,
        copyPaste: mockCopyPaste,
        qrCodeBase64: `data:image/svg+xml;base64,${btoa(svgString)}`,
        totalAmount,
        extrasCount,
        isMock: true
      });
      setCheckoutStep('pix_payment');
    } catch (e) {
      console.warn('Erro ao gerar código PIX:', e);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.copyPaste) return;
    navigator.clipboard.writeText(pixData.copyPaste);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSimulateApprovedPayment = () => {
    handlePaymentSuccess();
  };

  const handleConfirmDirect = () => {
    onConfirmSubmit(clientNotes.trim());
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-brand-emerald" />
          <span>
            {checkoutStep === 'pix_payment'
              ? 'Pagamento das Fotos Extras via PIX'
              : isFinalized
              ? `Seleção de ${currentVoter?.name || 'Votante'} Concluída`
              : `Finalizar Votação de ${currentVoter?.name || 'Votante'}`}
          </span>
        </div>
      }
      description={
        checkoutStep === 'pix_payment'
          ? 'Escaneie o QR Code com o app do seu banco para liberar a seleção imediatamente.'
          : isFinalized
          ? 'Sua escolha pessoal de fotos foi registrada e somada ao consenso do ensaio.'
          : 'Revise suas escolhas antes de concluir a sua parte na votação.'
      }
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {checkoutStep === 'review' && (
          <>
            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-walnut-950/60 border border-brand-dark/50">
                <span className="text-[11px] uppercase tracking-wider text-brand-primary font-mono font-bold">
                  Seus Votos Pessoais
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-walnut-100">
                    {myVotedPhotos.length}
                  </span>
                  <span className="text-xs text-walnut-400">fotos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-walnut-950/60 border border-brand-dark/50">
                <span className="text-[11px] uppercase tracking-wider text-brand-emerald font-mono font-bold">
                  Fotos em Consenso
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-brand-emerald">
                    {consensusCount}
                  </span>
                  <span className="text-xs text-walnut-400">/ {threshold}+ votos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-walnut-950/60 border border-brand-dark/50">
                <span className="text-[11px] uppercase tracking-wider text-brand-ochre font-mono font-bold">
                  Participantes Ativos
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-brand-ochre">
                    {(gallery.voters || []).length || 1}
                  </span>
                  <span className="text-xs text-walnut-400">pessoas</span>
                </div>
              </div>
            </div>

            {/* Quota & Extras Invoice Banner */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Contrato da Galeria:</span>
                <Badge variant={requiresPayment ? 'amber' : 'success'} className="font-bold">
                  {maxPhotos} fotos contratadas
                </Badge>
              </div>

              {requiresPayment ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center justify-between font-semibold text-amber-400">
                    <span>Fotos Selecionadas ({selectedCount}) - Excedente:</span>
                    <span className="font-mono text-sm">{extrasCount} fotos extras</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300 border-t border-amber-500/20 pt-2 font-mono">
                    <span>Valor ({extrasCount} × R$ {extraPrice.toFixed(2)}):</span>
                    <span className="text-base font-bold text-amber-400">R$ {totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    O pagamento é realizado de forma 100% segura via PIX dinâmico com liberação em tempo real.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Seleção dentro da cota contratada! Sem cobrança adicional.</span>
                  <Badge variant="success" size="sm">Gratuito</Badge>
                </div>
              )}
            </div>

            {/* Selected Photos Thumbnails Strip */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-walnut-300 block">
                Fotos Votadas por {currentVoter?.name} ({myVotedPhotos.length} fotos):
              </span>
              <div className="flex gap-2 overflow-x-auto p-2 bg-walnut-950/60 rounded-xl border border-brand-dark/40">
                {myVotedPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-brand-emerald/50"
                  >
                    <SafeImage
                      src={photo.url}
                      alt={photo.originalFileName}
                      fallbackText={photo.originalFileName}
                      className="w-full h-full object-cover protected-photo"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-walnut-950/90 text-[9px] font-mono text-center text-brand-emerald truncate px-0.5 font-bold">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voter Confirmation & Notes */}
            {!isFinalized ? (
              <div className="space-y-3">
                <Textarea
                  label="Mensagem ou orientações gerais para o fotógrafo (opcional)"
                  placeholder="ex: Gostamos muito das fotos espontâneas! Na diagramação, preferimos dar destaque às fotos de consenso..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={2}
                />

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-walnut-950/40 border border-brand-dark/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 text-brand-primary rounded border-brand-dark focus:ring-brand-primary"
                  />
                  <span className="text-xs text-walnut-300 leading-snug">
                    Estou ciente de que ao confirmar, minha votação como <strong>{currentVoter?.name}</strong> será finalizada e enviada para o relatório de consenso.
                  </span>
                </label>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-brand-emerald/15 border border-brand-emerald/40 text-xs text-brand-emerald space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Votação de {currentVoter?.name} Finalizada</span>
                </div>
                <p className="text-walnut-300">
                  Sua lista de preferências já foi enviada com sucesso!
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-dark/50">
              <Button variant="ghost" size="md" onClick={onClose}>
                {isFinalized ? 'Fechar' : 'Voltar e Revisar'}
              </Button>

              {!isFinalized && (
                requiresPayment ? (
                  <Button
                    variant="amber"
                    size="md"
                    disabled={!agreeTerms || isGeneratingPix}
                    onClick={handleGeneratePixOrder}
                    className="font-bold shadow-lg shadow-amber-500/20"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    <span>Pagar R$ {totalAmount.toFixed(2)} via PIX</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!agreeTerms}
                    onClick={handleConfirmDirect}
                    className="font-semibold shadow-lg shadow-[#01743F]/25"
                  >
                    <CheckCheck className="w-4 h-4 mr-1.5" />
                    <span>Finalizar Votação Gratuitamente</span>
                  </Button>
                )
              )}
            </div>
          </>
        )}

        {/* STEP 2: PIX Checkout View */}
        {checkoutStep === 'pix_payment' && pixData && (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>QR Code PIX Gerado com Sucesso</span>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center my-2">
                <div className="p-3 bg-white rounded-2xl border-4 border-zinc-800 shadow-xl inline-block">
                  <img
                    src={pixData.qrCodeBase64}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-400 block">Valor do Pagamento Excedente:</span>
                <span className="font-mono text-2xl font-extrabold text-emerald-400">
                  R$ {pixData.totalAmount.toFixed(2)}
                </span>
                <span className="text-[11px] text-zinc-500 block">({pixData.extrasCount} fotos extras selecionadas)</span>
              </div>

              {/* Copy-Paste PIX Code */}
              <div className="space-y-2 pt-2">
                <label className="text-xs text-zinc-300 font-semibold block text-left">
                  Código PIX Copia e Cola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.copyPaste}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 truncate focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant={copiedPix ? 'emerald' : 'secondary'}
                    size="sm"
                    onClick={handleCopyPix}
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4 mr-1 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Status Listener Banner */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-300">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Aguardando confirmação do pagamento pelo gateway em tempo real...</span>
              </div>

              {/* Developer Test Simulator Button */}
              {pixData.isMock && (
                <div className="pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSimulateApprovedPayment}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span>Simular Pagamento Aprovado (Modo de Teste)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setCheckoutStep('review')}>
                Voltar
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Completed View */}
        {checkoutStep === 'completed' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">Pagamento Confirmado & Seleção Concluída!</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Sua escolha de fotos extras foi totalmente quitada e registrada com sucesso. O fotógrafo já recebeu a notificação do seu projeto!
            </p>
            <Button variant="emerald" size="md" onClick={onClose} className="mx-auto font-bold px-8">
              Concluir
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
};
