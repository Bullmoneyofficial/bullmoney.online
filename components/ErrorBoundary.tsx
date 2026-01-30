"use client";

import React, { Component, ReactNode } from "react";
import { reportReactError } from "@/lib/CrashTracker";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    reportReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold mb-4">Oops!</h1>
            <p className="text-lg mb-4">Something went wrong.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
