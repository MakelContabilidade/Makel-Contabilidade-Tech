import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Filter, Check, MessageCircle, Zap, FileText, CreditCard, Loader2, Plus, QrCode, Trash2, Copy, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getBillings, deleteBilling } from "@/lib/storage";

export default function Cobrancas() {
  const [filter, setFilter] = useState('Todos');
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, appUser, selectedClientId } = useAuth();
  
  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;

  useEffect(() => {
    if (!targetUid) {
      setBillings([]);
      setLoading(false);
      return;
    }
    
    const loadBillings = () => {
      setBillings(getBillings(targetUid));
      setLoading(false);
    };
    
    loadBillings();
    
    window.addEventListener("transactionsUpdated", loadBillings);
    return () => window.removeEventListener("transactionsUpdated", loadBillings);
  }, [targetUid]);

  const filtered = billings.filter(b => {
    if (filter === 'Todos') return true;
    if (filter === 'Pendente') return b.status === "Pendente";
    if (filter === 'Vencido') return b.status === "Vencido";
    if (filter === 'Pago') return b.status === "Pago";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente": return "bg-warning/20 text-warning";
      case "Vencido": return "bg-destructive/20 text-destructive text-bold";
      case "Pago": return "bg-success/20 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDelete = async (id: string) => {
    if (!targetUid || !confirm("Deseja excluir esta cobrança?")) return;
    try {
      deleteBilling(id, targetUid);
      setBillings(getBillings(targetUid));
    } catch {
      alert("Erro ao excluir.");
    }
  };

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
  // Summaries
  const pendentes = billings.filter(b => b.status === 'Pendente').reduce((acc, b) => acc + b.amount, 0);
  const pendentesCount = billings.filter(b => b.status === 'Pendente').length;
  
  const vencidos = billings.filter(b => b.status === 'Vencido').reduce((acc, b) => acc + b.amount, 0);
  const vencidosCount = billings.filter(b => b.status === 'Vencido').length;
  
  const pagos = billings.filter(b => b.status === 'Pago').reduce((acc, b) => acc + b.amount, 0);
  const pagosCount = billings.filter(b => b.status === 'Pago').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Cobranças</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" className="w-9 h-9 rounded-lg bg-card">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Pendente</p>
          <p className="text-warning font-bold text-sm">{formatCurrency(pendentes)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{pendentesCount} cobranças</p>
        </Card>
        <Card className="p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Vencido</p>
          <p className="text-destructive font-bold text-sm">{formatCurrency(vencidos)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{vencidosCount} cobranças</p>
        </Card>
        <Card className="p-3 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-1">Recebido</p>
          <p className="text-success font-bold text-sm">{formatCurrency(pagos)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{pagosCount} cobranças</p>
        </Card>
      </div>

      {/* Filter Tags */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['Todos', 'Pendente', 'Vencido', 'Pago'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
              filter === f ? "bg-primary border border-primary text-white" : "bg-card border border-border text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3 pb-6">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-sm">Nenhuma cobrança encontrada.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <Card key={item.id} className="p-4 border border-border relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-white">{item.client}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold", getStatusColor(item.status))}>
                  {item.status}
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background px-2 py-1 rounded w-fit border border-border hover:bg-card">
                    {item.method === 'PIX' ? <Zap className="w-3 h-3 text-white" /> : <FileText className="w-3 h-3 text-white" />}
                    <span className="font-medium text-white">{item.method}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Venc. {formatDate(item.dueDate)}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleDelete(item.id)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-white rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <h3 className="font-bold text-base text-white">{formatCurrency(item.amount)}</h3>
                  </div>
                  {item.status === 'Pendente' && (
                    <button className="flex items-center gap-1 text-[10px] font-medium bg-card px-2 py-1 rounded-md text-white border border-border hover:bg-card/80 transition-colors">
                      <MessageCircle className="w-3 h-3" />
                      Cobrar
                    </button>
                  )}
                  {item.status === 'Vencido' && (
                    <button className="flex items-center gap-1 text-[10px] font-medium bg-card px-2 py-1 rounded-md text-white border border-border hover:bg-card/80 transition-colors">
                      <MessageCircle className="w-3 h-3 text-destructive" />
                      Lembrar Atraso
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
