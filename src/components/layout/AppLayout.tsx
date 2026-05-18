import * as React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, Receipt, BarChart2, Menu, Plus, Upload, QrCode, MessageSquare, Users, Building2, X, FileText, Check, Copy, Share, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { addTransaction, addBilling } from "@/lib/storage";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Financeiro", icon: Wallet, path: "/financeiro" },
  { label: "Cobranças", icon: Receipt, path: "/cobrancas" },
  { label: "Relatórios", icon: BarChart2, path: "/relatorios" },
  { label: "Contabilidade", icon: Building2, path: "/contabilidade" },
  { label: "Suporte", icon: Settings, path: "/suporte" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);
  const { appUser, user, changePassword, signOut, selectedClientId, setSelectedClientId } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clients = React.useMemo(() => {
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const usersObj = JSON.parse(usersStr);
    return Object.values(usersObj).filter((u: any) => u.role === "CLIENTE" && u.status === "aprovado");
  }, []);

  // General Form States
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [observation, setObservation] = useState("");
  const [clientName, setClientName] = useState("");
  const [attachment, setAttachment] = useState<{name: string, type: string, size: number} | null>(null);
  
  const [subModal, setSubModal] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    setPwdError("");
    try {
      await changePassword(newPassword);
      showToast("Senha atualizada com sucesso!");
    } catch {
      setPwdError("Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSubModal(null);
    setTitle("");
    setAmount("");
    setDate("");
    setCategory("");
    setPaymentMethod("PIX");
    setObservation("");
    setClientName("");
    setAttachment(null);
  };

  const handleCreateTx = async (e: React.FormEvent, type: "in" | "out") => {
    e.preventDefault();
    const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
    const targetUid = isInternal ? selectedClientId : user?.uid;
    
    if (!targetUid) {
      showToast("Selecione um cliente primeiro.");
      return;
    }
    setLoading(true);
    try {
      const numericAmount = parseFloat(amount.replace(/[^0-9,-]+/g,"").replace(",", ".") || "0");
      addTransaction(targetUid, {
        title,
        amount: numericAmount,
        type,
        date: date || new Date().toISOString().split('T')[0],
        category: category || "Outros",
        status: "paid",
        client: clientName,
        paymentMethod,
        observation,
        documentInfo: attachment,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      window.dispatchEvent(new Event("transactionsUpdated"));
      showToast(attachment ? "Lançamento salvo com sucesso. Documento anexado com sucesso." : "Lançamento salvo com sucesso.");
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const showFab = !(isInternal && !selectedClientId);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background text-foreground overflow-hidden">
      {appUser?.must_change_password ? (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Atualize sua senha</h2>
            <p className="text-sm text-muted-foreground mb-6">Como este é seu primeiro acesso, para a sua segurança, redefina a senha provisória.</p>
            
            {pwdError && <p className="text-sm text-destructive mb-4">{pwdError}</p>}
            
            <form onSubmit={handleChangePwd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="••••••••" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Confirmar Nova Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="••••••••" required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={signOut}>Sair</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar e Continuar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 flex items-center shrink-0">
              <img src="/logo-v3.png" alt="Makel" className="h-full w-auto object-contain drop-shadow-md" onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} />
              <span className="hidden font-bold text-white text-xl">M</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-muted-foreground truncate">{appUser?.role || 'Administrador'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-white font-semibold"
                  : "text-muted-foreground hover:bg-card hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden w-full">
        {/* Header with Client Selector */}
        {(appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR') && (
          <header className="h-16 border-b border-border bg-background flex items-center px-4 md:px-8 shrink-0 z-10 sticky top-0">
            <div className="flex-1 flex items-center justify-between">
              <div className="font-medium text-sm text-muted-foreground hidden md:block">
                Controle Administrativo
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-sm font-medium text-white whitespace-nowrap">Cliente:</span>
                <select 
                  value={selectedClientId || ""}
                  onChange={(e) => setSelectedClientId(e.target.value || null)}
                  className="bg-card border border-border text-white text-sm rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:border-primary"
                >
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.uid} value={c.uid}>{c.companyName || c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </header>
        )}
        
        <div className="flex-1 overflow-y-auto w-full relative pb-20 md:pb-0 scroll-smooth">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 pb-safe">
        <div className="flex items-center justify-around px-1 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 w-16 transition-colors rounded-xl",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Floating Action Menu */}
      {showFab && (
        <div className="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-[60] flex flex-col items-end gap-3">
          {fabOpen && (
            <div className="flex flex-col gap-2 items-end mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200 shadow-2xl max-h-[60vh] overflow-y-auto p-2 scrollbar-none rounded-2xl">
            <button 
              onClick={() => { setActiveModal("in"); setFabOpen(false); }}
              className="flex items-center justify-end gap-3 bg-card hover:bg-card/80 px-4 py-2.5 rounded-full border border-border transition-colors w-full whitespace-nowrap"
            >
              <span className="text-sm font-medium">Nova receita</span>
              <Wallet className="w-4 h-4 text-success shrink-0" />
            </button>
            <button 
              onClick={() => { setActiveModal("out"); setFabOpen(false); }}
              className="flex items-center justify-end gap-3 bg-card hover:bg-card/80 px-4 py-2.5 rounded-full border border-border transition-colors w-full whitespace-nowrap"
            >
              <span className="text-sm font-medium">Nova despesa</span>
              <Wallet className="w-4 h-4 text-destructive shrink-0" />
            </button>
            <a 
              href="https://wa.me/?text=Ol%C3%A1%2C%20preciso%20de%20suporte!"
              target="_blank"
              rel="noreferrer"
              onClick={() => setFabOpen(false)}
              className="flex items-center justify-end gap-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 border-[#25D366]/50 px-4 py-2.5 rounded-full border transition-colors w-full whitespace-nowrap text-[#25D366]"
            >
              <span className="text-sm font-medium">Suporte WhatsApp</span>
              <MessageSquare className="w-4 h-4 shrink-0" />
            </a>
          </div>
        )}
        <Button 
          size="icon" 
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white transition-transform duration-200 relative z-50 border-[3px] border-background"
          style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      )}
      
      {/* Overlay for FAB */}
      {fabOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55]"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Global Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 my-auto">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* IN / OUT MODAL */}
            {(activeModal === "in" || activeModal === "out") && (
              <>
                <h2 className="text-xl font-bold text-white mb-6">
                  {activeModal === "in" ? "Nova Receita" : "Nova Despesa"}
                </h2>
                {activeModal === "in" && subModal === "client" ? (
                  <form onSubmit={(e) => { e.preventDefault(); showToast("Cliente salvo e vinculado!"); setSubModal(null); setClientName("Novo Cliente Teste"); }} className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> Novo Cliente Rápido</h3>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Nome / Razão Social</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="Nome completo" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">CPF / CNPJ</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="000.000.000-00" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                      <input type="email" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="contato@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="(00) 00000-0000" />
                    </div>
                    <div className="flex gap-2 pt-2">
                       <Button type="button" variant="outline" className="w-full border-border bg-transparent" onClick={() => setSubModal(null)}>Voltar</Button>
                       <Button type="submit" className="w-full font-bold">Salvar e Voltar</Button>
                    </div>
                  </form>
                ) : activeModal === "out" && subModal === "supplier" ? (
                  <form onSubmit={(e) => { e.preventDefault(); showToast("Fornecedor salvo e vinculado!"); setSubModal(null); setClientName("Novo Fornecedor Teste"); }} className="space-y-4 animate-in slide-in-from-right-4">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Building2 className="w-4 h-4"/> Novo Fornecedor Rápido</h3>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Nome / Razão Social</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="Nome completo" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">CPF / CNPJ</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="000.000.000-00" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                      <input type="email" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="contato@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                      <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" placeholder="(00) 00000-0000" />
                    </div>
                    <div className="flex gap-2 pt-2">
                       <Button type="button" variant="outline" className="w-full border-border bg-transparent" onClick={() => setSubModal(null)}>Voltar</Button>
                       <Button type="submit" className="w-full font-bold">Salvar e Voltar</Button>
                    </div>
                  </form>
                ) : (
                <form onSubmit={(e) => handleCreateTx(e, activeModal as "in" | "out")} className="space-y-4 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Ex: Venda de serviço" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground flex justify-between">
                      {activeModal === "in" ? "Cliente" : "Fornecedor"}
                      <button type="button" onClick={() => setSubModal(activeModal === "in" ? "client" : "supplier")} className="text-primary hover:underline text-xs flex items-center gap-1">
                        <Plus className="w-3 h-3"/> Novo {activeModal === "in" ? "cliente" : "fornecedor"}
                      </button>
                    </label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Selecione ou digite..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Valor (R$)</label>
                      <input type="text" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="0,00" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">{activeModal === "out" ? "Vencimento" : "Data"}</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" required>
                        <option value="">Selecione...</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Vendas">Vendas</option>
                        <option value="Pessoal">Pessoal / Salários</option>
                        <option value="Instalações">Instalações</option>
                        <option value="TI">Software & TI</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Impostos">Impostos</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" required>
                        <option value="PIX">PIX</option>
                        <option value="Boleto">Boleto Bancário</option>
                        <option value="Transferência">Transferência</option>
                        <option value="Cartão">Cartão de Crédito</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <textarea value={observation} onChange={e => setObservation(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-none h-16" placeholder="Detalhes adicionais..." />
                  </div>
                  <div className="space-y-1.5 border border-dashed border-border rounded-xl p-4 bg-background/50 hover:bg-card transition-colors">
                    <label className="text-sm font-medium text-muted-foreground flex items-center justify-between mb-2">
                      <span>Anexar Documento / Comprovante</span>
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">Opcional</span>
                    </label>
                    <input type="file" onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                         const file = e.target.files[0];
                         setAttachment({ name: file.name, type: file.type, size: file.size });
                      }
                    }} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg,.xml,.xlsx" />
                    {attachment && (
                      <div className="mt-2 flex items-center justify-between bg-card p-2 rounded-lg border border-border animate-in fade-in">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-xs text-white truncate max-w-[200px]">{attachment.name}</span>
                        </div>
                        <button type="button" onClick={() => setAttachment(null)} className="p-1 hover:bg-destructive/20 text-destructive rounded-md transition-colors"><X className="w-3 h-3"/></button>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold mt-2" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Lançamento"}
                  </Button>
                </form>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 md:top-6 md:right-6 lg:left-auto left-4 right-4 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-success text-success-foreground px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 font-semibold w-full md:w-auto mt-safe">
            <Check className="w-5 h-5 shrink-0" />
            <p>{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

