import React, { ErrorInfo, ReactNode } from "react";
import { MdOutlineArrowOutward } from "react-icons/md";

// Error Boundary with Windows 11 BSOD-inspired UI (black background)

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  handleRestart = () => {
    // Simple reload to reset app state
    window.location.href = '/home'
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-4xl text-left">
            <p className="text-5xl md:text-7xl font-semibold mb-4 md:mb-6">:(</p>
            <p className="text-xl md:text-2xl mb-3 md:mb-4 font-bold">
              Hệ thống đã gặp sự cố và cần khởi động lại.
            </p>
            <p className="text-sm md:text-base opacity-80 mb-4 md:mb-6">
              Nếu sự cố vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật. {' '}
              <a href="https://discord.chisadin.site" className="underline">https://discord.chisadin.site<MdOutlineArrowOutward className="inline-block ml-1" /></a>
            </p>

            {this.state.error && (
              <div className="rounded-2xl bg-neutral-900 p-3 md:p-4 mb-4 md:mb-6 shadow max-h-[40vh] overflow-auto">
                <p className="text-xs md:text-sm font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-[10px] md:text-xs mt-2 whitespace-pre-wrap font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
                {/* Copy btn */}
                <div className="mt-2">
                  <button
                    onClick={() => {
                      const errorDetails = `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`;
                      navigator.clipboard.writeText(errorDetails);
                    }}
                    className="rounded-2xl px-3 py-1 bg-neutral-800 hover:bg-neutral-700 transition text-xs md:text-sm"
                  >
                    Copy error details
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 md:mt-4">
              <button
                onClick={this.handleRestart}
                className="w-full sm:w-auto rounded-2xl px-5 md:px-6 py-3 shadow hover:shadow-lg transition active:scale-95 bg-white text-black font-semibold"
              >
                Khởi động lại
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
