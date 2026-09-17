import React, { useState } from 'react';
import { Gallery } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CreditCard,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export interface FinancialExtrasViewProps {
  galleries: Gallery[];
  onShowToast: (title: string, description?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

interface Transaction {
  id: string;
  galleryId: string;
  galleryTitle: string;
  clientName: string;
  clientPhone: string;
  extraPhotosCount: number;
  amount: number;
  pixTxId: string;
  status: 'settled' | 'pending' | 'failed';
  date: string;
}

export const FinancialExtrasView: React.FC<FinancialExtrasViewProps> = ({
  galleries,
  onShowToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'pending'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Mock transactions calculated from galleries + default history
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-101',
      galleryId: galleries[0]?.id || '1',
      galleryTitle: 'Casamento Marina & Guilherme',
      clientName: 'Marina Silva',
      clientPhone: '(11) 98765-4321',
      extraPhotosCount: 12,
      amount: 360,
      pixTxId: 'E00038166202509171240a1b2c3d4',
      status: 'pending',
      date: '17/09/2025 às 14:12'
    },
    {
      id: 'tx-102',
      galleryId: galleries[1]?.id || '2',
      galleryTitle: 'Editorial Moda Autoral - Vl. 04',
      clientName: 'Camila Valente',
      clientPhone: '(11) 91234-5678',
      extraPhotosCount: 15,
      amount: 525,
      pixTxId: 'E00038166202509170930f9e8d7c6',
      status: 'settled',
      date: '17/09/2025 às 10:42'
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
      date: '16/09/2025 às 18:20'
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
      date: '15/09/2025 às 11:10'
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
      date: '14/09/2025 às 15:45'
    }
  ]);

  // Compute totals
  const totalSettled = transactions
    .filter((t) => t.status === 'settled')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPending = transactions
    .filter((t) => t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExtrasSold = transactions
    .filter((t) => t.status === 'settled')
    .reduce((acc, t) => acc + t.extraPhotosCount, 0);

  const handleSimulatePayment = (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status: 'settled' } : t))
    );
    onShowToast(
      'Pagamento PIX Confirmado!',
      'Webhook automático processou a confirmação da transação.',
      'success'
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.galleryTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pixTxId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'ID Transação,Cliente,Ensaio,Qtd Fotos Extras,Valor R$,Status,Data\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.pixTxId}","${t.clientName}","${t.galleryTitle}",${t.extraPhotosCount},${t.amount},"${t.status}","${t.date}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_financeiro_izylumna_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Relatório CSV Exportado!', 'Planilha financeira pronta para download.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FDBD00] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#FDBD00]">
              FATURAMENTO DE FOTOS EXTRAS & PIX
            </span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financeiro & Extras
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Acompanhe o faturamento de fotos adicionais vendidas nas galerias, extrato de transações PIX e baixas automáticas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs bg-[#120E22] border-white/10 text-zinc-200 hover:text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Exportar Planilha (CSV)</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#120E22] border border-[#FDBD00]/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>FATURAMENTO CONFIRMADO</span>
            <DollarSign className="w-4 h-4 text-[#FDBD00]" />
          </div>
          <div className="text-2xl font-extrabold text-[#FDBD00] font-sans">
            R$ {totalSettled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            +32% em relação ao mês anterior
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>PIX PENDENTES</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-sans">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-400 font-mono block">
            Aguardando confirmação do banco
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>FOTOS EXTRAS VENDIDAS</span>
            <TrendingUp className="w-4 h-4 text-[#46BDC6]" />
          </div>
          <div className="text-2xl font-extrabold text-white font-sans">
            {totalExtrasSold} <span className="text-xs text-zinc-400 font-normal">fotos</span>
          </div>
          <span className="text-[11px] text-[#46BDC6] font-mono block">
            Média de R$ 30,00 por foto extra
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>GATEWAY PIX</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-sans flex items-center gap-1.5">
            <span>Ativo</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            Baixa automática em &lt; 5 seg
          </span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTERS */}
      <div className="p-4 rounded-2xl bg-[#120E22] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, ensaio ou TxID PIX..."
            className="w-full py-2 px-3 pl-10 rounded-xl bg-[#0A0714] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FDBD00]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#FDBD00] text-[#160F29] shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'settled'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/5'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black font-bold shadow-md'
                : 'text-zinc-400 hover:text-amber-400 hover:bg-white/5'
            }`}
          >
            Pendentes
          </button>
        </div>
      </div>

      {/* 4. TRANSACTIONS TABLE */}
      <Card className="bg-[#120E22] border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0714] text-zinc-400 uppercase tracking-wider font-mono border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Cliente / Ensaio</th>
                <th className="py-3.5 px-4">Qtd Extras</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Identificador PIX (TxID)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{tx.clientName}</div>
                    <div className="text-zinc-400 text-xs">{tx.galleryTitle}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{tx.date}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    +{tx.extraPhotosCount} fotos
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[#FDBD00] text-sm">
                    R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 max-w-[180px] truncate">
                    {tx.pixTxId}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {tx.status === 'settled' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Pago via PIX</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                        <Clock className="w-3 h-3" />
                        <span>Aguardando PIX</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {tx.status === 'pending' ? (
                      <Button
                        variant="amber"
                        size="sm"
                        onClick={() => handleSimulatePayment(tx.id)}
                        className="text-[11px] font-bold"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        <span>Baixar PIX</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTx(tx)}
                        className="text-[11px] text-zinc-300 hover:text-white hover:bg-white/10"
                      >
                        <Receipt className="w-3.5 h-3.5 mr-1 text-[#46BDC6]" />
                        <span>Comprovante</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* COMPROVANTE MODAL */}
      {selectedTx && (
        <Dialog
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={
            <div className="flex items-center gap-2 text-emerald-400">
              <Receipt className="w-5 h-5" />
              <span>Comprovante de Recebimento PIX</span>
            </div>
          }
          description="Detalhamento financeiro da transação efetuada."
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-mono text-zinc-300">
            <div className="p-4 rounded-xl bg-[#0A0714] border border-white/10 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Cliente:</span>
                <strong className="text-white">{selectedTx.clientName}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Ensaio:</span>
                <strong className="text-white">{selectedTx.galleryTitle}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Fotos Extras Adicionadas:</span>
                <strong className="text-purple-300">+{selectedTx.extraPhotosCount} fotos</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Valor Total Pago:</span>
                <strong className="text-[#FDBD00] text-sm">
                  R$ {selectedTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Data & Hora:</span>
                <span className="text-zinc-400">{selectedTx.date}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>TxID Banco Central:</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                  {selectedTx.pixTxId}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onShowToast('Comprovante Impresso', 'Gerando arquivo PDF do recibo...', 'info');
                  setSelectedTx(null);
                }}
                className="text-xs bg-[#0A0714] border-white/10 text-white"
              >
                Imprimir Recibo PDF
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
