/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/layout/PrivateRoute";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Cobrancas = lazy(() => import("@/pages/Cobrancas"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Suporte = lazy(() => import("@/pages/Suporte"));
const Contabilidade = lazy(() => import("@/pages/Contabilidade"));
const Manual = lazy(() => import("@/pages/Manual"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Aprovacoes = lazy(() => import("@/pages/Aprovacoes"));
const Auditoria = lazy(() => import("@/pages/Auditoria"));
const Mensagens = lazy(() => import("@/pages/Mensagens"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse">Carregando...</div>}>
          <Routes>
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/cadastro" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/financeiro" element={<AppLayout><Financeiro /></AppLayout>} />
              <Route path="/cobrancas" element={<AppLayout><Cobrancas /></AppLayout>} />
              <Route path="/relatorios" element={<AppLayout><Relatorios /></AppLayout>} />
              <Route path="/suporte" element={<AppLayout><Suporte /></AppLayout>} />
              <Route path="/manual" element={<AppLayout><Manual /></AppLayout>} />
              <Route path="/contabilidade" element={<AppLayout><Contabilidade /></AppLayout>} />
              <Route path="/clientes/aprovacoes" element={<AppLayout><Aprovacoes /></AppLayout>} />
              <Route path="/usuarios" element={<AppLayout><Usuarios /></AppLayout>} />
              <Route path="/admin/auditoria" element={<AppLayout><Auditoria /></AppLayout>} />
              <Route path="/admin/mensagens" element={<AppLayout><Mensagens /></AppLayout>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
