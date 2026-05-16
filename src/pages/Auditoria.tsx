import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Auditoria() {
  const { appUser } = useAuth();
  const [audits, setAudits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("@Makel:audits") || "[]");
    // Sort descending
    list.sort((a: any, b: any) => b.date - a.date);
    setAudits(list);
  }, []);

  if (appUser?.role !== "MASTER" && appUser?.role !== "ADMIN") {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2">Você não tem permissão para acessar a auditoria.</p>
      </div>
    );
  }

  const filtered = audits.filter(a => {
    const q = searchTerm.toLowerCase();
    return (
      (a.userName || "").toLowerCase().includes(q) ||
      (a.action || "").toLowerCase().includes(q) ||
      (a.module || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Logs de Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe todas as ações realizadas no sistema.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuário, ação, módulo..." 
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
          />
        </div>
        <Button variant="secondary" className="h-[38px] md:w-auto px-4 bg-background border border-border">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Data/Hora</th>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Módulo</th>
                <th className="px-4 py-3 font-semibold">Ação Realizada</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a: any) => (
                <tr key={a.id} className="hover:bg-card/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(a.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {a.userName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {a.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {a.ip}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
