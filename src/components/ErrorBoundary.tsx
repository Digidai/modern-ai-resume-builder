import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-danger"
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
            <h3 className="font-display text-xl font-semibold text-ink mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-xs text-muted cursor-pointer hover:text-ink">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-tint rounded-[2px] text-xs overflow-auto max-h-32 text-danger">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="focus-ring h-10 px-4 text-sm font-medium text-paper bg-ink rounded-[2px] hover:bg-ink-hover transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="focus-ring h-10 px-4 text-sm font-medium text-ink border border-ink rounded-[2px] hover:bg-ink/5 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for sections that can fail gracefully
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ 
  children, 
  sectionName = 'This section' 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[2px]">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {sectionName} failed to load. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
