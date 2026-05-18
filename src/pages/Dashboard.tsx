import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  TrendingUp, TrendingDown, DollarSign, AlertCircle, 
  Wallet, Eye, ChevronRight, Activity, Receipt, CreditCard, Loader2, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/lib/storage";

const IntelligenceCard = ({ title, description, type }: { title: string, description: string, type: 'success' | 'warning' | 'danger' | 'info' }) => {
  const iconMap = {
    success: <TrendingUp className="w-5 h-5 text-success" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
    danger: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Activity className="w-5 h-5 text-info" />
  };
  const borderMap = {
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-destructive",
    info: "border-l-info"
  };

  return (
    <Card className={`border-l-4 p-4 flex gap-4 ${borderMap[type]}`}>
      <div className="mt-1">{iconMap[type]}</div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
};

export default function Dashboard() {
  const { appUser, user, selectedClientId } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;

  useEffect(() => {
    if (!targetUid) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    
    const loadTx = () => {
      const txs = getTransactions(targetUid).slice(0, 5);
      setTransactions(txs);
      setLoading(false);
    };
    
    loadTx();
    
    window.addEventListener("transactionsUpdated", loadTx);
    return () => window.removeEventListener("transactionsUpdated", loadTx);
  }, [targetUid]);

  const totalIn = transactions.filter(tx => tx.type === 'in').reduce((acc, tx) => acc + tx.amount, 0);
  const totalOut = transactions.filter(tx => tx.type === 'out').reduce((acc, tx) => acc + tx.amount, 0);
  const result = totalIn - totalOut;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (isInternal && !selectedClientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 border border-border shadow-lg">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a) à Makel Contabilidade</h2>
        <p className="text-muted-foreground max-w-md">
          Selecione um cliente no cabeçalho superior para administrar seus dados fiscais e contábeis.
        </p>
      </div>
    );
  }
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">Visão geral da sua saúde financeira</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" className="rounded-full">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="md:hidden flex items-center bg-card rounded-full pl-3 pr-3 py-1 gap-2 border border-border">
            <div className="h-8 flex items-center shrink-0">
              <img src="/logo-v3.png" alt="Makel" className="h-full w-auto object-contain" onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} />
              <span className="hidden font-bold text-white text-xs">{appUser?.companyName?.charAt(0)?.toUpperCase() || 'M'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Card - Saldo */}
      <Card className="bg-primary border-none text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-20 hidden md:block">
          <Wallet className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-90">Saldo Atual (Cálculo em demonstração)</p>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold">{formatCurrency(result > 0 ? result : 0)}</h2>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 w-max">
          <div className="space-y-0.5">
            <p className="text-xs font-medium opacity-90">Saldo Projetado</p>
            <p className="text-sm font-bold">{formatCurrency(result + 1500)}</p>
          </div>
        </div>
      </Card>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">{formatCurrency(totalIn)}</h3>
            <p className="text-xs text-muted-foreground font-medium">Faturamento</p>
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">{formatCurrency(totalOut)}</h3>
            <p className="text-xs text-muted-foreground font-medium">Despesas</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between hidden md:flex">
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-info" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">{formatCurrency(result)}</h3>
            <p className="text-xs text-muted-foreground font-medium">Lucro</p>
          </div>
        </Card>
      </div>

      {/* Makel Intelligence */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Makel Intelligence</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <IntelligenceCard 
            type="success"
            title="Sua conta está ativa"
            description="Você já pode começar a lançar suas receitas e despesas."
          />
          <IntelligenceCard 
            type="info"
            title="Dica de gestão"
            description="Mantenha suas contas a pagar e a receber atualizadas diariamente."
          />
        </div>
      </section>

      {/* Quick Status */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">A Pagar</span>
          </div>
          <span className="font-bold text-destructive text-sm">{formatCurrency(totalOut > 0 ? totalOut / 2 : 0)}</span>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">A Receber</span>
          </div>
          <span className="font-bold text-success text-sm">{formatCurrency(totalIn > 0 ? totalIn / 2 : 0)}</span>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 mb-1">
            <Receipt className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Impostos</span>
          </div>
          <span className="font-bold text-warning text-sm">R$ 0,00</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Últimas Transações</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm">Nenhuma transação lançada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id} className={`p-4 flex items-center justify-between border-l-4 ${tx.type === 'in' ? 'border-l-success' : 'border-l-destructive'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-background`}>
                    {tx.type === 'in' ? <DollarSign className="w-5 h-5 text-success" /> : <Wallet className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{tx.title}</h4>
                    <p className="text-xs text-muted-foreground">{tx.category} - {formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${tx.type === 'in' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
