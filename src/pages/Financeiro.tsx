import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, CreditCard, Wallet, Receipt, Search, Filter, Plus, Loader2, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, deleteTransaction } from "@/lib/storage";

export default function Financeiro() {
  const [tab, setTab] = useState<'todos' | 'receitas' | 'despesas'>('todos');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const { user, appUser, selectedClientId, selectedClientData } = useAuth();
  
  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    if (!targetUid) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    
    const loadTx = () => {
      setTransactions(getTransactions(targetUid));
      setLoading(false);
    };

    loadTx();
    window.addEventListener("transactionsUpdated", loadTx);
    return () => window.removeEventListener("transactionsUpdated", loadTx);
  }, [targetUid]);

  const handleDelete = async (id: string) => {
    if (!targetUid) return;
    try {
      deleteTransaction(id, targetUid);
      setTransactions(getTransactions(targetUid));
      window.dispatchEvent(new Event("transactionsUpdated"));
      showToast("Lançamento excluído com sucesso.");
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      showToast("Erro ao excluir.");
      setConfirmDeleteId(null);
    }
  };

  const filtered = transactions.filter(tx => {
    if (tab === 'receitas') return tx.type === 'in';
    if (tab === 'despesas') return tx.type === 'out';
    return true;
  });

  const totalIn = transactions.filter(tx => tx.type === 'in').reduce((acc, tx) => acc + tx.amount, 0);
  const totalOut = transactions.filter(tx => tx.type === 'out').reduce((acc, tx) => acc + tx.amount, 0);
  const result = totalIn - totalOut;

  const inPct = totalIn + totalOut > 0 ? (totalIn / (totalIn + totalOut)) * 100 : 0;
  const outPct = totalIn + totalOut > 0 ? (totalOut / (totalIn + totalOut)) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (isInternal && !selectedClientId) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 border border-border shadow-lg">
          <Building2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Selecione um cliente para continuar.</h2>
        <p className="text-muted-foreground max-w-md">
          Selecione um cliente no cabeçalho superior para visualizar as informações.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
        <select className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-white outline-none">
          <option>Este mês</option>
          <option>Mês passado</option>
        </select>
      </header>

      {/* Summary Card */}
      <Card className="p-5 flex flex-col space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Entradas</p>
            <h3 className="text-success font-bold text-lg">{formatCurrency(totalIn)}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium mb-1">Saídas</p>
            <h3 className="text-destructive font-bold text-lg">{formatCurrency(totalOut)}</h3>
          </div>
        </div>
        
        {/* Progress bar visual */}
        <div className="h-1.5 w-full bg-destructive/20 rounded-full overflow-hidden flex">
          <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${inPct}%` }}></div>
          <div className="h-full bg-destructive rounded-full transition-all duration-500" style={{ width: `${outPct}%` }}></div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Resultado do período</span>
          <span className={cn("font-bold", result >= 0 ? "text-success" : "text-destructive")}>
            {result >= 0 ? "+" : ""}{formatCurrency(result)}
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex bg-card p-1 rounded-xl">
        <button 
          onClick={() => setTab('todos')}
          className={cn("flex-1 text-sm font-medium py-2 rounded-lg transition-colors", tab === 'todos' ? "bg-primary text-white" : "text-muted-foreground")}
        >
          Todos
        </button>
        <button 
          onClick={() => setTab('receitas')}
          className={cn("flex-1 text-sm font-medium py-2 rounded-lg transition-colors", tab === 'receitas' ? "bg-primary text-white" : "text-muted-foreground")}
        >
          Receitas
        </button>
        <button 
          onClick={() => setTab('despesas')}
          className={cn("flex-1 text-sm font-medium py-2 rounded-lg transition-colors", tab === 'despesas' ? "bg-primary text-white" : "text-muted-foreground")}
        >
          Despesas
        </button>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-muted-foreground">{filtered.length} transações</span>
        <button className="text-muted-foreground hover:text-white transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {filtered.map((tx) => (
            <Card key={tx.id} className={`p-4 flex items-center justify-between border-l-4 ${tx.type === 'in' ? 'border-l-success' : 'border-l-destructive'} group`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-background`}>
                  {tx.type === 'in' ? <DollarSign className="w-5 h-5 text-success" /> : <Wallet className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{tx.title}</h4>
                  <p className="text-xs text-muted-foreground">{tx.category} - {formatDate(tx.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-bold text-sm ${tx.type === 'in' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
                <button 
                  onClick={() => setConfirmDeleteId(tx.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">Excluir lançamento?</h3>
            <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita e o valor será removido de seus relatórios.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-border bg-transparent" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleDelete(confirmDeleteId)}>Sim, Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
