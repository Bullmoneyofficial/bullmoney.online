'use client';

import React from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents full app crashes and provides recovery mechanisms
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset error state when props change (if enabled)
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
          <div className="max-w-2xl w-full bg-black/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(239,68,68,0.3)]">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-3xl font-bold text-center mb-4 text-white">
              Oops! Something Went Wrong
            </h2>

            {/* Error Description */}
            <p className="text-white/70 text-center mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe.
              You can try reloading the page or contact support if the problem persists.
            </p>

            {/* Error Details (Dev Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-500/20 rounded-xl overflow-auto max-h-48">
                <p className="text-red-400 text-sm font-mono mb-2">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-red-300/70 text-xs font-mono whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                Reload Page
              </button>
              <a
                href="https://t.me/+dlP_A0ebMXs3NTg0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-center transition-all hover:scale-105 active:scale-95"
              >
                Contact Support
              </a>
            </div>

            {/* Additional Help Text */}
            <p className="text-white/50 text-xs text-center mt-6">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for error boundary with hooks support
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
