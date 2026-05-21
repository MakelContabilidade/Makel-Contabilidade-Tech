import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, CheckCircle, ShieldAlert, Badge, UserCheck, UserX, Clock, Database, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export default function Aprovacoes() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'CLIENTE').neq('id', appUser?.uid);
    if (data) {
      const usersList = data.map((u: any) => ({
        ...u,
        uid: u.id,
        companyName: u.company_name
      }));
      setUsers(usersList);
    }
  };

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{email: string, pass: string} | null>(null);

  const updateUserStatus = async (uid: string, status: string, role?: string) => {
    const dbUpdate: any = { status };
    if (role) dbUpdate.role = role;
    
    // update in supabase
    const { error } = await supabase.from('profiles').update(dbUpdate).eq('id', uid);
    
    if (error) {
      alert("Erro ao atualizar: " + error.message);
      return;
    }
    
    loadUsers();
    
    // Log Audit
    await supabase.from('audits').insert([{
      user_id: appUser?.uid,
      action: `Alterou status para ${status} do cliente ${uid}`,
      details: `Novo status: ${status}`,
      date: new Date().toISOString()
    }]);

    if (status === "aprovado") {
      alert(`Cliente provado com sucesso! Mande ele recuperar a senha na tela de login.`);
    } else {
      alert(`Cliente atualizado com sucesso para: ${status}`);
    }
  };

  if (appUser?.role !== "MASTER" && appUser?.role !== "ADMIN") {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  const pendentes = users.filter((u: any) => u.status === "pendente_aprovacao");
  const demais = users.filter((u: any) => u.status !== "pendente_aprovacao");

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Aprovações de Cadastro</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie os acessos de clientes e colaboradores</p>
      </header>

      {pendentes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-warning flex items-center gap-2">
            <Clock className="w-5 h-5" /> Cadastros Pendentes ({pendentes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendentes.map((u: any) => (
              <Card key={u.uid} className="p-5 border border-border bg-card/60 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-warning"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{u.companyName || u.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">CNPJ/CPF: {u.cnpj || u.cpf}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Contato:</strong> {u.name}</p>
                  <p><strong className="text-foreground">Email:</strong> {u.email}</p>
                  <p><strong className="text-foreground">Telefone:</strong> {u.phone}</p>
                  <p><strong className="text-foreground">Segmento:</strong> {u.segment || "-"}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1 bg-success/10 text-success hover:bg-success hover:text-white border-0" onClick={() => updateUserStatus(u.uid, "aprovado", "CLIENTE")}>
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Aprovar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-0 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white" onClick={() => updateUserStatus(u.uid, "recusado")}>
                    <XCircle className="w-4 h-4 mr-1.5" /> Recusar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5" /> Todos os Clientes
        </h2>
        
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-card/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome / Empresa</th>
                  <th className="px-4 py-3 font-semibold">Contato</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demais.map((u: any) => (
                  <tr key={u.uid} className="hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{u.companyName || u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.cnpj || u.cpf}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{u.email}</div>
                      <div className="text-xs">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                        u.status === "aprovado" ? "bg-success/10 text-success" : 
                        u.status === "bloqueado" ? "bg-warning/10 text-warning" : 
                        u.status === "inativo" ? "bg-destructive/10 text-destructive" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {u.status || "desconhecido"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.status === "aprovado" ? (
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs border-warning/30 text-warning hover:bg-warning hover:text-white" onClick={() => updateUserStatus(u.uid, "bloqueado")}>
                            Bloquear
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => updateUserStatus(u.uid, "inativo")}>
                            Inativar
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-success/30 text-success hover:bg-success hover:text-white" onClick={() => updateUserStatus(u.uid, "aprovado")}>
                          <UserCheck className="w-3 h-3 mr-1" /> Reaprovar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {demais.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {activeModal === "credentials" && credentials && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <h2 className="text-xl font-bold text-success mb-2 flex items-center gap-2"><CheckCircle className="w-6 h-6" /> Cliente Aprovado!</h2>
            <p className="text-sm text-foreground mb-6">Envie as credenciais abaixo para o cliente acessar o sistema. Ele será forçado a alterar a senha no primeiro acesso.</p>
            
            <div className="bg-background border border-border p-4 rounded-xl flex flex-col gap-2 mb-6 text-sm">
              <p><span className="text-muted-foreground">E-mail:</span> <strong className="text-white">{credentials.email}</strong></p>
              <p><span className="text-muted-foreground">Senha Provisória:</span> <strong className="text-white font-mono">{credentials.pass}</strong></p>
            </div>

            <Button onClick={() => setActiveModal(null)} className="w-full font-bold">
              OK, Entendi
            </Button>
          </Card>
        </div>
      )}

    </div>
  );
}
