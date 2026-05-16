import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Bell, Shield, MessageSquare, HelpCircle, LogOut, ChevronRight, Edit2, KeyRound, MessageCircle, Library, Tag, Send, X, Loader2, ArrowLeft, Paperclip, CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Suporte() {
  const { appUser, signOut, changePassword, user, selectedClientId } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'menu' | 'tickets' | 'ticket_detail'>('menu');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const isInternal = appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR';
  const targetUid = isInternal ? selectedClientId : user?.uid;

  useEffect(() => {
    if (currentView === 'tickets') {
      loadTickets();
    }
  }, [currentView, targetUid]);

  const loadTickets = () => {
    if (!targetUid && !isInternal) return; // Se admin não tem cliente, talvez mostre todos. Mas vamos focar no targetUid.
    const all = JSON.parse(localStorage.getItem("@Makel:chamados") || "[]");
    
    // Se for interno e não tiver cliente selecionado, mostrar todos os chamados abertos?
    // O ideal é mostrar apenas do targetUid se estiver setado.
    if (isInternal && !targetUid) {
      setTickets(all.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    } else {
      setTickets(all.filter((t: any) => t.userId === targetUid).sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    }
  };

  // Form States
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const navigate = useNavigate();

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      showToast("Configuração salva com sucesso!");
      setActiveModal(null);
    } catch {
      showToast("Erro ao salvar.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      showToast("As senhas não coincidem.", "error");
      return;
    }
    if (newPwd.length < 6) {
      showToast("A nova senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    setLoading(true);
    try {
      await changePassword(newPwd);
      showToast("Senha alterada com sucesso!");
      setActiveModal(null);
    } catch {
      showToast("Erro ao alterar senha.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid) {
      showToast("Você precisa selecionar um cliente primeiro.", "error");
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const all = JSON.parse(localStorage.getItem("@Makel:chamados") || "[]");
      const protocol = `#MK-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;
      const newTicket = {
        id: "ticket_" + Date.now(),
        protocol,
        subject,
        priority,
        status: "Aberto",
        userId: targetUid,
        userName: appUser?.name || "Usuário",
        messages: [{
          id: "msg_" + Date.now(),
          sender: "client",
          senderName: appUser?.name || "Usuário",
          text: message,
          createdAt: Date.now()
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      all.push(newTicket);
      localStorage.setItem("@Makel:chamados", JSON.stringify(all));

      showToast(`Chamado ${protocol} aberto com sucesso!`);
      setSubject("");
      setMessage("");
      setActiveModal(null);
    } catch {
      showToast("Erro ao abrir chamado.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setLoading(true);
    
    try {
      await new Promise(r => setTimeout(r, 600));
      const all = JSON.parse(localStorage.getItem("@Makel:chamados") || "[]");
      const idx = all.findIndex((t: any) => t.id === selectedTicket.id);
      
      if (idx !== -1) {
        const newMessage = {
          id: "msg_" + Date.now(),
          sender: isInternal ? "admin" : "client",
          senderName: appUser?.name || "Makel",
          text: replyMessage,
          createdAt: Date.now()
        };
        all[idx].messages.push(newMessage);
        all[idx].updatedAt = Date.now();
        all[idx].status = isInternal ? "Respondido" : "Aguardando Makel";
        
        localStorage.setItem("@Makel:chamados", JSON.stringify(all));
        setSelectedTicket({ ...all[idx] });
        setReplyMessage("");
      }
    } finally {
      setLoading(false);
    }
  };

  const MENU_GROUPS = [
    {
      title: "ATENDIMENTO E SUPORTE",
      items: [
        { icon: MessageCircle, label: "Abrir Chamado", desc: "Dúvidas ou solicitações", action: () => setActiveModal("chamado") },
        { icon: Tag, label: "Minhas Solicitações", desc: "Acompanhar chamados", action: () => setCurrentView('tickets') },
        { icon: Library, label: "Ajuda e Manual", desc: "Base de conhecimento", action: () => navigate("/manual") },
        { icon: MessageSquare, label: "Falar com a Makel", desc: "Atendimento via WhatsApp", iconColor: "text-success", action: () => window.open('https://wa.me/5511999999999?text=Preciso%20de%20suporte', '_blank') },
      ]
    },
    {
      title: "CONFIGURAÇÕES DA CONTA",
      items: [
        { icon: Edit2, label: "Meus Dados", desc: "Atualizar perfil", action: () => setActiveModal("perfil") },
        { icon: KeyRound, label: "Alterar Senha", desc: "Segurança de acesso", action: () => setActiveModal("senha") },
        { icon: Bell, label: "Notificações", desc: "Preferências de alertas", action: () => setActiveModal("notificacoes") },
      ]
    }
  ];

  if (appUser?.role === 'MASTER' || appUser?.role === 'ADMIN' || appUser?.role === 'COLABORADOR') {
    MENU_GROUPS.unshift({
      title: "ADMINISTRAÇÃO DO SISTEMA",
      items: [
        { icon: Shield, label: "Aprovações e Clientes", desc: "Aprovar ou bloquear acesso", action: () => navigate("/clientes/aprovacoes"), iconColor: "" },
        { icon: Bell, label: "Equipe Interna", desc: "Gerenciar perfil de usuários", action: () => navigate("/usuarios"), iconColor: "" },
        { icon: Library, label: "Auditoria do Sistema", desc: "Logs de acesso e ações", action: () => navigate("/admin/auditoria"), iconColor: "" },
      ]
    });
  }

  if (currentView === 'tickets') {
      return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView('menu')} className="p-2 bg-card border border-border rounded-lg hover:bg-background transition-colors text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-white tracking-tight">Minhas Solicitações</h1>
            </div>
            <Button onClick={() => setActiveModal("chamado")} className="gap-2">
              <MessageCircle className="w-4 h-4" /> Novo Chamado
            </Button>
          </header>

          {tickets.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhum chamado encontrado</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Você não possui nenhuma solicitação de suporte aberta no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer hover:bg-card/80 transition-colors border-l-4"
                  style={{ borderLeftColor: ticket.priority === 'urgente' ? 'var(--destructive)' : ticket.priority === 'alta' ? 'var(--warning)' : 'var(--primary)' }}
                  onClick={() => { setSelectedTicket(ticket); setCurrentView('ticket_detail'); }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground bg-background px-2 py-1 rounded">{ticket.protocol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ticket.status === 'Aberto' ? 'bg-info/20 text-info' : 
                        ticket.status === 'Resolvido' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-sm md:max-w-md lg:max-w-xl">
                      {ticket.messages[0]?.text}
                    </p>
                  </div>
                  <div className="text-right flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t border-border md:border-0">
                    <div className="text-xs text-muted-foreground">Última att: {new Date(ticket.updatedAt).toLocaleDateString()}</div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground hidden md:block mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
  }

  if (currentView === 'ticket_detail' && selectedTicket) {
      return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] animate-in fade-in">
          <header className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setCurrentView('tickets'); setSelectedTicket(null); }} 
                className="p-2 bg-card border border-border rounded-lg hover:bg-background transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white leading-tight">{selectedTicket.subject}</h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    selectedTicket.status === 'Aberto' ? 'bg-info/20 text-info' : 
                    selectedTicket.status === 'Resolvido' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Protocolo: {selectedTicket.protocol} • Aberto em {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </header>

          <Card className="flex-1 flex flex-col overflow-hidden border border-border bg-card">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {selectedTicket.messages.map((msg: any) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 uppercase font-bold text-xs">
                      {msg.senderName.charAt(0)}
                    </div>
                    <div>
                      <div className={`p-3 md:p-4 rounded-xl text-sm ${isAdmin ? 'bg-primary text-white rounded-tr-none' : 'bg-background border border-border text-white rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      <p className={`text-[10px] text-muted-foreground mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedTicket.status !== 'Resolvido' ? (
              <div className="p-4 border-t border-border bg-background/50">
                <form onSubmit={handleReplyTicket} className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea 
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 text-white text-sm resize-none focus:outline-none focus:border-primary max-h-32 min-h-[50px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReplyTicket(e as any);
                        }
                      }}
                    />
                    <button type="button" className="absolute right-3 top-3 text-muted-foreground hover:text-white transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                  </div>
                  <Button type="submit" disabled={loading || !replyMessage.trim()} className="h-[50px] w-[50px] shrink-0 p-0 rounded-xl">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-border bg-background/50 text-center">
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" /> Este chamado foi marcado como resolvido e encerrado.
                </p>
              </div>
            )}
          </Card>
        </div>
      );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 animate-in fade-in">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Suporte</h1>
      </header>

      {/* Profile Header */}
      <Card className="p-4 flex items-center justify-between border border-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary flex flex-col items-center justify-center border border-primary/30 uppercase">
            <span className="font-bold text-white text-xl">
              {appUser?.companyName?.charAt(0) || appUser?.name?.charAt(0) || 'M'}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-white">{appUser?.companyName || appUser?.name || 'Usuário'}</h2>
            <p className="text-sm text-muted-foreground">{appUser?.email}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {MENU_GROUPS.map((group, i) => (
          <div key={i}>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {group.title}
            </h3>
            <Card className="border border-border divide-y divide-border overflow-hidden">
              {group.items.map((item, j) => (
                <button 
                  key={j}
                  onClick={item.action} 
                  className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-background ${item.iconColor || 'text-white'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </Card>
          </div>
        ))}
      </div>

      <button 
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 p-4 text-destructive hover:bg-destructive/10 transition-colors rounded-xl font-medium mt-8 border border-transparent hover:border-destructive/20"
      >
        <LogOut className="w-5 h-5" />
        Sair do Aplicativo
      </button>

      <p className="text-center text-[10px] text-muted-foreground">Makel Contabilidade v1.0.0</p>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {activeModal === "senha" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Alterar Senha</h2>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Senha Atual</label>
                <input type="password" required value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nova Senha</label>
                <input type="password" required value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Confirmar Nova Senha</label>
                <input type="password" required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {activeModal === "chamado" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Abrir Chamado</h2>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleOpenTicket} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" placeholder="Dúvida sobre imposto..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white h-24 resize-none" placeholder="Detalhes do seu pedido..."></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Anexo (Opcional)</label>
                <input type="file" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80" />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                  {loading ? "Enviando..." : <><Send className="w-4 h-4"/> Enviar</>}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {(activeModal === "notificacoes" || activeModal === "perfil") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white capitalize">{activeModal === 'perfil' ? 'Meus Dados' : 'Notificações'}</h2>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSetting} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                {activeModal === 'perfil' ? 'Atualize as informações do seu perfil.' : 'Selecione os canais de notificação desejados.'}
              </p>
              
              {activeModal === 'perfil' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Nome</label>
                    <input type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" defaultValue={appUser?.name || ""} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">E-mail</label>
                    <input type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" defaultValue={appUser?.email || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Telefone</label>
                    <input type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white" defaultValue={appUser?.phone || ""} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-background border border-border p-3 rounded-lg">
                    <span className="text-sm text-white font-medium">E-mail</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary ring-offset-background bg-background border-border" />
                  </div>
                  <div className="flex items-center justify-between bg-background border border-border p-3 rounded-lg">
                    <span className="text-sm text-white font-medium">WhatsApp</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary focus:ring-primary ring-offset-background bg-background border-border" />
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setActiveModal(null)}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
