import React, { useEffect, useState } from 'react';
import { exchangeAdobeCodeForToken } from '../../lib/adobeLightroom';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface AdobeOAuthCallbackViewProps {
  onComplete: (status: 'success' | 'error', message: string) => void;
}

export const AdobeOAuthCallbackView: React.FC<AdobeOAuthCallbackViewProps> = ({ onComplete }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function processOAuthCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDesc = urlParams.get('error_description');

        if (error) {
          throw new Error(`Autorização Adobe negada ou cancelada: ${errorDesc || error}`);
        }

        if (!code) {
          throw new Error('Nenhum código de autorização encontrado na URL de retorno.');
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('Sessão do fotógrafo não encontrada. Por favor, faça login novamente.');
        }

        await exchangeAdobeCodeForToken(code, session.user.id);

        setStatus('success');
        setTimeout(() => {
          onComplete('success', 'Conta Adobe Lightroom conectada com sucesso!');
        }, 1500);

      } catch (err: any) {
        console.error('Adobe Callback Error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Falha ao processar autenticação com Adobe Lightroom.');
        setTimeout(() => {
          onComplete('error', err.message || 'Falha na conexão com a Adobe.');
        }, 3000);
      }
    }

    processOAuthCallback();
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex items-center justify-center p-4">
      <div className="bg-[#141618] border border-zinc-800/80 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
        {status === 'processing' && (
          <>
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Conectando ao Adobe Lightroom</h2>
              <p className="text-sm text-zinc-400">Trocando tokens com a Adobe e sincronizando o seu catálogo...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex p-4 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Conectado com Sucesso!</h2>
              <p className="text-sm text-emerald-300">Sua conta do Adobe Lightroom foi vinculada. Redirecionando...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex p-4 rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Falha na Autenticação</h2>
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
