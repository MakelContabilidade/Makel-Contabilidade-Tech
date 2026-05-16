import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UserPlus, UserCog, UserX, KeyRound, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import bcrypt from "bcryptjs";

export default function Usuarios() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("COLABORADOR");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const usersObj = JSON.parse(usersStr);
    const usersList = Object.values(usersObj).filter((u: any) => u.uid !== appUser?.uid && (u.role === 'MASTER' || u.role === 'ADMIN' || u.role === 'COLABORADOR'));
    setUsers(usersList as any[]);
  };

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedUser(null);
    setName("");
    setEmail("");
    setPhone("");
    setPosition("");
    setRole("COLABORADOR");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const usersObj = JSON.parse(usersStr);

      if (Object.values(usersObj).some((u: any) => u.email === email)) {
        showToast("Este e-mail já está cadastrado.", "error");
        setLoading(false);
        return;
      }

      const rawPassword = "Makel" + Math.floor(1000 + Math.random() * 9000) + "!";
      const password_hash = bcrypt.hashSync(rawPassword, 10);
      
      const uid = "admin_" + Date.now();
      const newUser = {
        uid,
        name,
        email,
        phone,
        position,
        role,
        status: "aprovado",
        password_hash,
        must_change_password: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      usersObj[uid] = newUser;
      localStorage.setItem("@Makel:users", JSON.stringify(usersObj));
      
      loadUsers();
      showToast(`Usuário criado! Senha provisória: ${rawPassword}`);
      closeModal();
    } catch {
      showToast("Erro ao criar usuário.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const usersObj = JSON.parse(usersStr);

      if (usersObj[selectedUser.uid]) {
        usersObj[selectedUser.uid] = {
          ...usersObj[selectedUser.uid],
          name,
          email,
          phone,
          position,
          role,
          updatedAt: Date.now()
        };
        localStorage.setItem("@Makel:users", JSON.stringify(usersObj));
        loadUsers();
        showToast("Usuário atualizado com sucesso.");
        closeModal();
      }
    } catch {
      showToast("Erro ao atualizar usuário.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (uid: string) => {
    if (!confirm("Deseja gerar uma nova senha provisória para este usuário?")) return;
    
    setLoading(true);
    try {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const usersObj = JSON.parse(usersStr);

      if (usersObj[uid]) {
        const rawPassword = "Reset" + Math.floor(1000 + Math.random() * 9000) + "!";
        const password_hash = bcrypt.hashSync(rawPassword, 10);
        
        usersObj[uid].password_hash = password_hash;
        usersObj[uid].must_change_password = true;
        usersObj[uid].updatedAt = Date.now();
        
        localStorage.setItem("@Makel:users", JSON.stringify(usersObj));
        loadUsers();
        alert(`Senha redefinida com sucesso!\n\nNova Senha Provisória: ${rawPassword}`);
      }
    } catch {
      showToast("Erro ao redefinir senha.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === "inativo" ? "aprovado" : "inativo";
    if (!confirm(`Deseja realmente alterar o status para ${newStatus}?`)) return;

    try {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const usersObj = JSON.parse(usersStr);

      if (usersObj[uid]) {
        usersObj[uid].status = newStatus;
        usersObj[uid].updatedAt = Date.now();
        localStorage.setItem("@Makel:users", JSON.stringify(usersObj));
        loadUsers();
        showToast(`Usuário marcado como ${newStatus}.`);
      }
    } catch {
      showToast("Erro ao alterar status.", "error");
    }
  };

  const openEdit = (u: any) => {
    setSelectedUser(u);
    setName(u.name || "");
    setEmail(u.email || "");
    setPhone(u.phone || "");
    setPosition(u.position || "");
    setRole(u.role || "COLABORADOR");
    setActiveModal("edit");
  };

  if (appUser?.role !== "MASTER") {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2">Apenas o perfil MASTER pode acessar esta área.</p>
      </div>
    );
  }

  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q));
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Equipe Interna</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os acessos de administradores e colaboradores.</p>
        </div>
        <Button onClick={() => setActiveModal("create")} className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          Novo Colaborador
        </Button>
      </header>

      {toast && (
        <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-medium border ${toast.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar usuário..." 
          className="w-full bg-transparent border-none text-white focus:outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>

      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Colaborador</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Perfil</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Último Acesso</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u: any) => (
                <tr key={u.uid} className={`transition-colors ${u.status === 'inativo' ? 'bg-card/20 opacity-60' : 'hover:bg-card/40'}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.position || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'MASTER' ? 'bg-primary/20 text-primary' : 'bg-info/20 text-info'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.status === 'inativo' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca acessou'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Editar" className="w-8 h-8 rounded hover:bg-white/10 text-muted-foreground hover:text-white">
                        <UserCog className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleResetPassword(u.uid)} title="Redefinir Senha" className="w-8 h-8 rounded hover:bg-warning/20 text-muted-foreground hover:text-warning" disabled={loading}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(u.uid, u.status || 'aprovado')} title={u.status === 'inativo' ? 'Reativar' : 'Inativar'} className={`w-8 h-8 rounded hover:bg-white/10 text-muted-foreground ${u.status === 'inativo' ? 'hover:text-success' : 'hover:text-destructive'}`}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum colaborador encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Ciar/Editar */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white uppercase">{activeModal === 'create' ? 'Novo Colaborador' : 'Editar Colaborador'}</h2>
              <button type="button" onClick={closeModal} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={activeModal === 'create' ? handleCreateUser : handleEditUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Nome Completo</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm" placeholder="Ex: João Silva" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">E-mail</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={activeModal === 'edit'} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50" placeholder="joao@makel.com.br" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white">Telefone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white">Cargo</label>
                  <input type="text" value={position} onChange={e => setPosition(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm" placeholder="Ex: Assistente" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white">Perfil de Acesso</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm">
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="MASTER">Master</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
