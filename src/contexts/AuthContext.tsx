import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import bcrypt from "bcryptjs";

interface AppUser {
  uid: string;
  email: string;
  name?: string;
  companyName?: string;
  cnpj?: string;
  role?: string;
  status?: string;
  must_change_password?: boolean;
  password_hash?: string;
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

  const setSelectedClientId = (id: string | null) => {
    setSelectedClientIdState(id);
    if (!id) {
      setSelectedClientData(null);
    } else {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const users = JSON.parse(usersStr);
      setSelectedClientData(users[id] || null);
    }
  };

  useEffect(() => {
    // Check localStorage for session
    seedInitialUsers();
    
    const storedUserId = localStorage.getItem("@Makel:userId");
    if (storedUserId) {
      const usersStr = localStorage.getItem("@Makel:users") || "{}";
      const users = JSON.parse(usersStr);
      if (users[storedUserId]) {
        if(users[storedUserId].status === "inativo") {
           localStorage.removeItem("@Makel:userId");
        } else {
          setUser({ uid: storedUserId, email: users[storedUserId].email });
          setAppUser(users[storedUserId]);
        }
      } else {
        localStorage.removeItem("@Makel:userId");
      }
    }
    setLoading(false);
  }, []);

  const seedInitialUsers = () => {
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const users = JSON.parse(usersStr);

    let needsUpdate = false;

    // Admin Master
    if (!users["master_1"]) {
      users["master_1"] = {
        uid: "master_1",
        email: "kleber.felipe@makelcontabilidade.com",
        name: "Kleber Felipe",
        role: "MASTER",
        status: "aprovado",
        companyName: "Makel Contabilidade",
        password_hash: bcrypt.hashSync("Kleber05!", 10),
        must_change_password: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      needsUpdate = true;
    }

    // Admin 2
    if (!users["admin_1"]) {
      users["admin_1"] = {
        uid: "admin_1",
        email: "karen.fernanda@makelcontabilidade.com",
        name: "Karen Fernanda",
        role: "ADMIN",
        status: "aprovado",
        companyName: "Makel Contabilidade",
        password_hash: bcrypt.hashSync("Karen05!", 10),
        must_change_password: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      needsUpdate = true;
    }

    if (needsUpdate) {
      localStorage.setItem("@Makel:users", JSON.stringify(users));
    }
  };

  const signIn = async (email: string, password?: string) => {
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const users = JSON.parse(usersStr);
    
    let foundUser = null;
    for (const key in users) {
      if (users[key].email === email) {
        foundUser = users[key];
        break;
      }
    }

    if (foundUser) {
      if (foundUser.role === 'MASTER' || foundUser.role === 'ADMIN' || foundUser.role === 'COLABORADOR') {
        if (foundUser.status === 'inativo') {
          throw new Error("auth/user-inactive");
        }
      } else {
        if (foundUser.status === 'inativo' || foundUser.status === 'bloqueado' || foundUser.status === 'recusado') {
          throw new Error("auth/user-inactive");
        }
        if (foundUser.status !== 'aprovado') {
          throw new Error("auth/user-not-approved");
        }
      }

      if (password && foundUser.password_hash) {
        const isMatch = bcrypt.compareSync(password, foundUser.password_hash);
        if (!isMatch) {
          throw new Error("auth/invalid-password");
        }
      }

      // Update last_login
      foundUser.last_login = Date.now();
      users[foundUser.uid] = foundUser;
      localStorage.setItem("@Makel:users", JSON.stringify(users));

      localStorage.setItem("@Makel:userId", foundUser.uid);
      setUser({ uid: foundUser.uid, email: foundUser.email });
      setAppUser(foundUser);
    } else {
      throw new Error("auth/user-not-found");
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!appUser) return;
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const users = JSON.parse(usersStr);

    if (users[appUser.uid]) {
      const hash = bcrypt.hashSync(newPassword, 10);
      users[appUser.uid].password_hash = hash;
      users[appUser.uid].must_change_password = false;
      users[appUser.uid].updatedAt = Date.now();
      
      localStorage.setItem("@Makel:users", JSON.stringify(users));
      setAppUser(users[appUser.uid]);
    }
  };

  const signUp = async (data: any) => {
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const users = JSON.parse(usersStr);
    
    const isFirst = Object.keys(users).length === 0;
    
    for (const key in users) {
      if (users[key].email === data.email) {
        throw new Error("auth/email-already-in-use");
      }
    }

    const uid = "user_" + Date.now();
    const newUser = { 
      ...data, 
      uid, 
      role: isFirst ? "MASTER" : "CLIENTE",
      status: isFirst ? "aprovado" : "pendente_aprovacao",
      password_hash: data.password ? bcrypt.hashSync(data.password, 10) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    users[uid] = newUser;
    
    localStorage.setItem("@Makel:users", JSON.stringify(users));
    
    if (isFirst) {
      localStorage.setItem("@Makel:userId", uid);
      setUser({ uid, email: newUser.email });
      setAppUser(newUser);
    } else {
      throw new Error("auth/user-pending");
    }
  };

  const signOut = async () => {
    localStorage.removeItem("@Makel:userId");
    setUser(null);
    setAppUser(null);
  };

  const updateAppUser = async (data: Partial<AppUser>) => {
    if (!user) return;
    const usersStr = localStorage.getItem("@Makel:users") || "{}";
    const users = JSON.parse(usersStr);
    
    if (users[user.uid]) {
      const updated = { ...users[user.uid], ...data, updatedAt: Date.now() };
      users[user.uid] = updated;
      
      localStorage.setItem("@Makel:users", JSON.stringify(users));
      setAppUser(updated);
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

