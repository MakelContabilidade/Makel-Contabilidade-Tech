import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Building2, UserCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Company details
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [stateRegistration, setStateRegistration] = useState("");
  const [taxRegime, setTaxRegime] = useState("Simples Nacional");
  const [segment, setSegment] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  
  // User details
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [whatsappAuth, setWhatsappAuth] = useState(true);

  const formatCnpj = (value: string) => {
    return value.replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const formatCpf = (value: string) => {
    return value.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  };

  const validateCompany = () => {
    if (!companyName || !cnpj || !segment) return false;
    if (cnpj.length < 18) return false;
    return true;
  };

  const handleNext = () => {
    setError("");
    if (!validateCompany()) {
      setError("Preencha todos os campos obrigatórios da empresa (Nome, CNPJ e Segmento).");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    
    if (!terms) {
      setError("Você precisa aceitar os Termos e Condições para continuar.");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: email,
        password: password,
        name: name,
        cpf: cpf,
        role: role,
        phone: phone,
        companyName: companyName,
        tradeName: tradeName,
        cnpj: cnpj,
        stateRegistration: stateRegistration,
        taxRegime: taxRegime,
        segment: segment,
        companyPhone: companyPhone,
        address: "",
        whatsappAuth,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await signUp(userData);

      navigate("/");
    } catch (err: any) {
      console.error("REGISTER ERROR:", err);
      if (err.message === "auth/email-already-in-use" || String(err.message).includes("already registered")) {
        setError("Este e-mail já está em uso.");
      } else if (err.message === "auth/user-pending") {
        alert("Cadastro realizado com sucesso! Seu acesso está pendente de aprovação pela contabilidade.");
        navigate("/login");
      } else {
        setError(`Erro: ${err?.message || 'Falha desconhecida ao cadastrar. Verifique o console.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/30">
      {/* Left side - Branded info sidebar */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] bg-card border-r border-border p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <Building2 className="w-64 h-64" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
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
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Abra sua conta</h2>
              <p className="text-muted-foreground">O processo leva menos de 2 minutos.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors", step >= 1 ? "bg-primary text-white" : "bg-background border border-border text-muted-foreground")}>1</div>
                  <div className={cn("w-0.5 h-12 mt-2 transition-colors", step >= 2 ? "bg-primary" : "bg-border")}></div>
                </div>
                <div className="pt-1">
                  <h3 className={cn("font-bold", step >= 1 ? "text-white" : "text-muted-foreground")}>Dados da Empresa</h3>
                  <p className="text-xs text-muted-foreground mt-1">CNPJ, razão social, segmento</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors", step >= 2 ? "bg-primary text-white" : "bg-background border border-border text-muted-foreground")}>2</div>
                </div>
                <div className="pt-1">
                  <h3 className={cn("font-bold", step >= 2 ? "text-white" : "text-muted-foreground")}>Seus Dados</h3>
                  <p className="text-xs text-muted-foreground mt-1">Acesso, cargo, contatos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-muted-foreground">
          Já tem uma conta? <Link to="/login" className="text-primary font-bold hover:underline">Fazer login</Link>
        </div>
      </div>

      {/* Right side - Form area */}
      <div className="flex-1 flex flex-col p-6 items-center lg:items-start lg:p-12 overflow-y-auto">
        
        <div className="w-full max-w-xl">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-white">Dados da Empresa</h2>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-muted-foreground">CNPJ <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Razão Social <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Empresa LTDA"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Nome Fantasia</label>
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Empresa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={stateRegistration}
                      onChange={(e) => setStateRegistration(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Segmento <span className="text-destructive">*</span></label>
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Comércio">Comércio</option>
                      <option value="Serviços">Serviços</option>
                      <option value="Indústria">Indústria</option>
                      <option value="Tecnologia">Tecnologia</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-muted-foreground">Regime Tributário</label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                  </select>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full h-12 text-base font-bold mt-4"
                >
                  Próximo passo
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex items-center gap-3 mb-6">
                <UserCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-white">Dados do Responsável</h2>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-muted-foreground">Nome Completo <span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">CPF <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Cargo <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">E-mail de Acesso <span className="text-destructive">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">WhatsApp <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Senha <span className="text-destructive">*</span></label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Confirmar Senha <span className="text-destructive">*</span></label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="terms" 
                      checked={terms}
                      onChange={e => setTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-background" 
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
                      Eu li e aceito os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="whatsapp" 
                      checked={whatsappAuth}
                      onChange={e => setWhatsappAuth(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-background" 
                    />
                    <label htmlFor="whatsapp" className="text-sm text-muted-foreground leading-snug">
                      Autorizo o recebimento de notificações, alertas e cobranças via WhatsApp.
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 font-bold"
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] h-12 font-bold"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Concluir Cadastro"}
                  </Button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
