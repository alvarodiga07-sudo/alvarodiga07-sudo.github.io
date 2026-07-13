import React from 'react';

// Si algo revienta en el árbol de React, mostramos una pantalla con salida en
// vez de dejar la app en blanco (lo que pasaba hasta ahora: cualquier error
// no controlado tumbaba toda la interfaz sin explicación ni forma de volver).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Waddle crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px',
        textAlign: 'center', background: 'var(--background, #0b0b10)',
        color: 'var(--foreground, #f4f3f0)', gap: '16px',
      }}>
        <span style={{ fontSize: '48px' }}>🦆💥</span>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Algo se ha torcido</h1>
        <p style={{ fontSize: '14px', opacity: 0.7, maxWidth: '320px', margin: 0 }}>
          Waddle ha encontrado un error inesperado. Recargar suele arreglarlo — tus viajes están a salvo.
        </p>
        <button
          onClick={() => { this.setState({ hasError: false }); window.location.hash = '#/'; window.location.reload(); }}
          style={{
            marginTop: '8px', padding: '12px 24px', borderRadius: '12px',
            background: '#eab308', color: '#0b0b10', fontWeight: 700,
            border: 'none', cursor: 'pointer', fontSize: '14px',
          }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }
}
