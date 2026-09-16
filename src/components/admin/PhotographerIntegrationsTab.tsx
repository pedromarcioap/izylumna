import React, { useEffect, useState } from 'react';
import { 
  getValidAdobeAccessToken, 
  getAdobeOAuthUrl, 
  disconnectAdobeIntegration 
} from '../../lib/adobeLightroom';
import { PhotographerIntegration } from '../../types';
import { Cloud, CheckCircle2, XCircle, ExternalLink, RefreshCw, Unplug, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface PhotographerIntegrationsTabProps {
  userId: string;
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PhotographerIntegrationsTab: React.FC<PhotographerIntegrationsTabProps> = ({
  userId,
  onShowToast,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [integration, setIntegration] = useState<PhotographerIntegration | null>(null);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await getValidAdobeAccessToken(userId);
      if (res) {
        setIntegration(res.integration);
      } else {
        setIntegration(null);
      }
    } catch (err) {
      console.error('Error checking Adobe status:', err);
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, [userId]);

  function handleConnectAdobe() {
    const url = getAdobeOAuthUrl();
    window.location.href = url;
  }

  async function handleDisconnectAdobe() {
    setDisconnecting(true);
    try {
      const success = await disconnectAdobeIntegration(userId);
      if (success) {
        setIntegration(null);
        onShowToast('Adobe Desconectado', 'Sua integração com o Adobe Lightroom foi removida.', 'info');
      } else {
        onShowToast('Erro ao Desconectar', 'Não foi possível desconectar a integração.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro', err.message || 'Falha ao desconectar.', 'error');
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
        <h4 className="text-sm font-semibold text-white">Integrações de Armazenamento & Nuvem</h4>
        <p className="text-xs text-zinc-400">
          Conecte sua conta do Adobe Lightroom Cloud para importar álbuns diretamente e sincronizar as escolhas e votos dos seus clientes em tempo real.
        </p>
      </div>

      {/* Adobe Lightroom Integration Card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Adobe Lightroom Cloud</h4>
              <p className="text-xs text-zinc-400">Sincronização bidirecional de álbuns, renditions e votação dos clientes (Pick / 5 Stars)</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </div>
          ) : integration ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold border border-zinc-700">
              <XCircle className="w-3.5 h-3.5" />
              Desconectado
            </span>
          )}
        </div>

        {integration && (
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>Catálogo Ativo:</span>
              <span className="font-mono text-amber-400 font-medium">{integration.catalog_id || 'Catálogo Padrão'}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Expira em:</span>
              <span className="text-zinc-300">
                {new Date(integration.expires_at).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {integration ? (
            <>
              <Button 
                type="button" 
                variant="ghost"
                onClick={checkStatus} 
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Status
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleDisconnectAdobe} 
                disabled={disconnecting}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Unplug className="w-3.5 h-3.5 mr-1.5" />}
                Desconectar
              </Button>
            </>
          ) : (
            <Button 
              type="button" 
              variant="amber" 
              onClick={handleConnectAdobe}
              className="text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Conectar com Adobe Lightroom
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
