export default function GameLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 16,
        background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.95)), #0b1120',
        color: '#b1bad3',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#00e701',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.05em' }}>
        Loading game…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
