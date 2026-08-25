import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * A render error anywhere below this unmounts the whole tree and leaves a
 * white page, which is impossible to diagnose mid-demo. Show the actual error
 * and a way back instead.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: string }
> {
  state = { error: null as Error | null, info: '' };

  static getDerivedStateFromError(error: Error) {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep it in the console too, so the stack is available.
    console.error('Dashboard crashed:', error, info);
    this.setState({ error, info: info.componentStack ?? '' });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] p-6">
        <div className="soft-card w-full max-w-2xl p-7">
          <h1 className="text-lg font-extrabold text-rose-700">
            Something broke while rendering
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6b7b72]">
            The dashboard hit an error. Nothing was lost — the backend is
            unaffected.
          </p>

          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-rose-300">
            {error.message}
          </pre>

          {info && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-500">
                Component stack
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
                {info}
              </pre>
            </details>
          )}

          <div className="mt-6 flex gap-2.5">
            <button
              onClick={() => this.setState({ error: null, info: '' })}
              className="rounded-2xl bg-[#059669] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#047857]"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-[#f4f6f5] px-5 py-2.5 text-sm font-bold text-[#6b7b72] transition hover:text-[#0b1f14]"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
