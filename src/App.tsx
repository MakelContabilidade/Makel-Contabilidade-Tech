/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/layout/PrivateRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Financeiro from "@/pages/Financeiro";
import Cobrancas from "@/pages/Cobrancas";
import Relatorios from "@/pages/Relatorios";
import Suporte from "@/pages/Suporte";
import Contabilidade from "@/pages/Contabilidade";
import Manual from "@/pages/Manual";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import Aprovacoes from "@/pages/Aprovacoes";
import Auditoria from "@/pages/Auditoria";
import Mensagens from "@/pages/Mensagens";
import Usuarios from "@/pages/Usuarios";

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}
