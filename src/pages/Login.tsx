import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.message === "auth/user-inactive") {
        setError("Seu acesso está inativo. Procure o administrador.");
      } else if (err.message === "auth/user-not-approved") {
        setError("Seu cadastro ainda não foi aprovado pela contabilidade.");
      } else if (err.message?.includes("Invalid login credentials")) {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("E-mail não confirmado. Verifique sua caixa de entrada.");
      } else {
        setError(`Erro ao fazer login: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-primary/10 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#31323E1A_1px,transparent_1px),linear-gradient(to_bottom,#31323E1A_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-[60px] flex items-center shrink-0">
              <img src="/logo-novo.png" alt="Makel" className="h-full w-auto object-contain drop-shadow-md" onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} />
              <span className="hidden font-bold text-white text-2xl">M</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">A contabilidade do futuro, hoje.</h2>
          <p className="text-muted-foreground text-lg">
            Tenha controle absoluto da saúde financeira da sua empresa com inteligência artificial e processos automatizados.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="h-[60px] flex items-center shrink-0">
              <img src="/logo-novo.png" alt="Makel" className="h-full w-auto object-contain drop-shadow-md" onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }} />
              <span className="hidden font-bold text-white text-xl">M</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Acesse sua conta</h2>
              <p className="text-muted-foreground">Insira seus dados para acessar o painel.</p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">E-mail corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="voce@empresa.com.br"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-muted-foreground">Senha</label>
                  <a href="#" className="text-xs text-primary font-medium hover:underline">Esqueci minha senha</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-primary font-bold hover:underline">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
