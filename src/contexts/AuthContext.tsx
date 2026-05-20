import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface AppUser {
  uid: string;
  email: string;
  name?: string;
  companyName?: string;
  cnpj?: string;
  role?: string;
  status?: string;
  must_change_password?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: any | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateAppUser: (data: Partial<AppUser>) => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (data: any) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedClientData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<any | null>(null);

  const setSelectedClientId = async (id: string | null) => {
    setSelectedClientIdState(id);
    if (!id) {
      setSelectedClientData(null);
    } else {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        setSelectedClientData({ ...data, uid: data.id, companyName: data.company_name });
      } else {
        // Fallback for UI if real DB doesn't have it
        setSelectedClientData(null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ uid: session.user.id, email: session.user.email });
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };
    
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ uid: session.user.id, email: session.user.email });
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          console.error("ERRO CRÍTICO: A tabela 'profiles' não existe no Supabase.");
          alert("Erro crítico: As tabelas do banco de dados não foram criadas no Supabase. Por favor, rode o script SQL fornecido no modo SQL Editor do seu projeto Supabase.");
        }
      }

      if (data) {
        // map db to appUser
        const p: AppUser = {
          uid: data.id,
          email: data.email,
          name: data.name,
          companyName: data.company_name,
          cnpj: data.cnpj,
          role: data.role,
          status: data.status,
          must_change_password: data.must_change_password
        };
        setAppUser(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password?: string) => {
    if (!password) throw new Error("auth/missing-password");
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errMsg = error.message ? error.message.toLowerCase() : "";
      if (errMsg.includes('fetch failed') || errMsg.includes('failed to fetch')) {
        throw new Error("Não foi possível conectar ao banco de dados (Failed to fetch). Verifique se a variável VITE_SUPABASE_URL está correta.");
      }
      throw new Error(error.message);
    }
    
    if (data.user) {
      // Check status from profile
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      
      if (profileError && (profileError.code === 'PGRST205' || profileError.message?.includes('schema cache'))) {
         await supabase.auth.signOut();
         throw new Error("As tabelas do banco de dados (SQL) não foram criadas no seu projeto Supabase. Execute o arquivo supabase-schema.sql no painel.");
      }

      if (profile) {
        if (profile.status === 'inativo' || profile.status === 'bloqueado' || profile.status === 'recusado') {
          await supabase.auth.signOut();
          throw new Error("auth/user-inactive");
        }
        if (profile.role === 'CLIENTE' && profile.status !== 'aprovado') {
          await supabase.auth.signOut();
          throw new Error("auth/user-not-approved");
        }
      }
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    
    // update must_change_password
    await supabase.from('profiles').update({ must_change_password: false, updated_at: new Date().toISOString() }).eq('id', user.uid);
    if (appUser) {
      setAppUser({ ...appUser, must_change_password: false });
    }
  };

  const signUp = async (data: any) => {
    console.log("[AuthContext signUp] Iniciando cadastro de:", data.email);
    console.log("[AuthContext signUp] VITE_SUPABASE_URL está configurado como:", (import.meta.env.VITE_SUPABASE_URL || 'fallbacks para código fixo'));
    
    // Tratamento para payload
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || 'defaultPassword123!',
      options: {
        data: {
          name: data.name,
        }
      }
    });

    if (error) {
      console.error("[AuthContext signUp] Erro na requisição (Supabase):", error);
      const errMsg = error.message ? error.message.toLowerCase() : "";
      
      if (errMsg.includes('already registered')) {
        throw new Error("auth/email-already-in-use");
      }
      
      if (errMsg.includes('fetch failed') || errMsg.includes('failed to fetch') || errMsg.includes('getaddrinfo') || errMsg.includes('network request failed')) {
        throw new Error("Falha de conexão com a API do Supabase. Verifique se a URL (.supabase.co) em VITE_SUPABASE_URL está correta.");
      }
      
      if (error.status === 404) {
         throw new Error("A API (Supabase) não foi encontrada (Erro 404). A URL configurada pode estar incorreta ou projeto pausado.");
      }
      
      throw new Error(`Erro retornado pela API: ${error.message}`);
    }
    
    console.log("[AuthContext signUp] Sucesso no Auth, user:", authData?.user?.id);
        // Assume trigger creates profile, update with extra data
        setTimeout(async () => {
            const isFirst = false; // logic removed for simplicity
            await supabase.from('profiles').update({
                name: data.name,
                company_name: data.companyName,
                cnpj: data.cnpj,
                role: 'CLIENTE',
                status: 'pendente_aprovacao'
            }).eq('id', authData.user?.id);
        }, 1000); // delay to let trigger run
        
        throw new Error("auth/user-pending"); // UI expects error to not login immediately
    
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
    localStorage.removeItem("@Makel:userId"); // cleanup
  };

  const updateAppUser = async (data: Partial<AppUser>) => {
    if (!user) return;
    
    const dbData: any = {};
    if (data.name) dbData.name = data.name;
    if (data.companyName) dbData.company_name = data.companyName;
    if (data.cnpj) dbData.cnpj = data.cnpj;
    if (data.role) dbData.role = data.role;
    if (data.status) dbData.status = data.status;
    dbData.updated_at = new Date().toISOString();

    const { error } = await supabase.from('profiles').update(dbData).eq('id', user.uid);
    if (!error && appUser) {
      setAppUser({ ...appUser, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut, updateAppUser, signIn, signUp, changePassword, selectedClientId, setSelectedClientId, selectedClientData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

