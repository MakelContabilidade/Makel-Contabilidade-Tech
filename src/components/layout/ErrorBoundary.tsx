import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="max-w-md w-full bg-card border border-border p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-destructive mb-2">Ops! Algo deu errado.</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Infelizmente ocorreu um erro inesperado no aplicativo. Nossa equipe já foi notificada.
            </p>
            <pre className="p-3 bg-muted rounded overflow-auto text-xs text-muted-foreground mb-4 max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Recarregar aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
