import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, ShieldAlert, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

const BaseComponent: any = (React as any).Component || class {
  props: any;
  state: any;
  setState: any;
  constructor(props: any) {
    this.props = props;
  }
};

export class ErrorBoundary extends BaseComponent {
  props: Props;
  state: State;
  context: any;
  setState: any;
  forceUpdate: any;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error Boundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      // Clear local application cache while preserving theme
      const theme = localStorage.getItem('nss-portal-theme');
      localStorage.clear();
      sessionStorage.clear();
      if (theme) {
        localStorage.setItem('nss-portal-theme', theme);
      }
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    window.location.href = window.location.pathname;
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected client error occurred.';

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-rose-600 selection:text-white">
          <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-900/20">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              NSS College Ottapalam ERP
            </h1>
            <p className="text-sm font-semibold text-rose-400 mb-4 uppercase tracking-wider">
              Application Recovery Mode
            </p>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              The portal encountered an unexpected runtime error and prevented a blank screen. You can reload the page or reset the local browser cache to resume smoothly.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Portal
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Clear Cache & Restart
              </button>

              <button
                onClick={this.handleResetState}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-800/60 text-slate-400 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Retry
              </button>
            </div>

            {/* Error Message Details */}
            <div className="text-left bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono text-slate-300">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold text-rose-400">Error Notice</span>
                <button
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {this.state.showDetails ? (
                    <>Hide Trace <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Show Technical Details <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              <div className="text-rose-300 font-semibold break-words">
                {errorMessage}
              </div>

              {this.state.showDetails && this.state.errorInfo && (
                <pre className="mt-3 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin p-2 bg-black/40 rounded-lg">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="mt-6 text-[11px] text-slate-500">
              Affiliated to University of Calicut • Accredited 'A' Grade by NAAC
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
