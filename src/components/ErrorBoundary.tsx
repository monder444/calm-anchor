import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: '#13131f', color: '#e0e0e0', padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ fontSize: '14px', color: '#888' }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/auth'; }}
            style={{ padding: '12px 24px', borderRadius: '12px', background: '#7c3aed', color: '#fff', border: 'none', fontSize: '14px', cursor: 'pointer' }}
          >
            Go to Sign In
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
