import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Search, Filter, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Mensagens() {
  const { appUser } = useAuth();

  if (appUser?.role !== "MASTER" && appUser?.role !== "ADMIN") {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar central de mensagens.</p>
      </div>
    );
  }

  const MOCK_MESSAGES = [
    { id: 1, type: "whatsapp", client: "Empresa de Teste", user: "João Silva", status: "Respondido", preview: "Olá, pode me ajudar com a NFS-e?", date: "14/05/2026 10:20" },
    { id: 2, type: "suporte", client: "Padaria Pão Quente", user: "Maria Silva", status: "Aberto", preview: "Como emitir o DAE de domestica?", date: "14/05/2026 09:15" }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Central de Mensagens</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe comunicações de clientes e equipe.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar mensagens..." 
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>
        <Button variant="secondary" className="h-[38px] md:w-auto px-4 bg-background border border-border">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_MESSAGES.map(m => (
          <Card key={m.id} className="p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-white text-base">{m.client} <span className="text-muted-foreground font-normal text-xs ml-2">({m.user})</span></h3>
                  <span className="text-xs text-muted-foreground">{m.date}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{m.preview}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-background border border-border text-muted-foreground">
                    {m.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'Aberto' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
