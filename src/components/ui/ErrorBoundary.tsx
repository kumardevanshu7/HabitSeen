import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      sessionStorage.clear();
    } catch {
      // Ignore cleanup error
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 bg-surface-card border-2 border-red-200 rounded-3xl max-w-lg mx-auto my-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-ink">
              {this.props.fallbackTitle || 'Something went wrong rendering this view'}
            </h3>
            <p className="text-xs sm:text-sm text-charcoal mt-1 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please try reloading.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
              <RefreshCw size={14} /> Try Again
            </Button>
            <Button variant="primary" size="sm" onClick={() => window.location.reload()} className="gap-1.5">
              Reload App
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleClearCache}
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw size={13} /> Clear Cache
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
