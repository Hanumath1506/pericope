import { useAuth } from "../hooks/useAuth";

export default function Login({ onTryDemo }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.left}>
        <div style={styles.tagline}>
          <p style={styles.eyebrow}>AI Research Assistant</p>
          <h1 style={styles.headline}>
            Read smarter.<br />
            <em>Ask deeper.</em>
          </h1>
          <p style={styles.sub}>
            Upload any research paper. Ask questions, extract insights,
            and understand methodology — grounded in the actual text.
          </p>
        </div>
        <div style={styles.features}>
          {["RAG-powered Q&A", "Auto-generated summaries", "Key contributions & methodology", "Cross-paper semantic search"].map(f => (
            <div key={f} style={styles.feature}>
              <span style={styles.dot} />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Sign in</h2>
          <p style={styles.cardSub}>Upload and manage your own papers.</p>
          <button style={styles.btnDisabled} disabled>
            <GoogleIcon />
            Continue with Google
          </button>
          <p style={styles.comingSoon}>Full access coming soon</p>
          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>
          <button style={styles.demoBtn} onClick={onTryDemo}>
            Try the demo →
          </button>
          <p style={styles.note}>3 pre-loaded landmark AI papers. No sign-in required.</p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const styles = {
  wrap: { display: "flex", minHeight: "100vh" },
  left: {
    flex: 1, padding: "80px 64px",
    display: "flex", flexDirection: "column", justifyContent: "center",
    borderRight: "1px solid var(--border)",
  },
  eyebrow: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "11px", letterSpacing: "0.15em",
    color: "var(--accent)", textTransform: "uppercase",
    marginBottom: "24px",
  },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.1,
    color: "var(--text)", marginBottom: "24px",
  },
  sub: {
    fontSize: "16px", color: "var(--text-2)",
    maxWidth: "400px", lineHeight: 1.7, marginBottom: "48px",
  },
  features: { display: "flex", flexDirection: "column", gap: "12px" },
  feature: {
    display: "flex", alignItems: "center", gap: "12px",
    fontSize: "14px", color: "var(--text-2)",
  },
  dot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "var(--accent)", flexShrink: 0,
  },
  right: {
    width: "420px", display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "48px",
  },
  card: {
    width: "100%", background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px", padding: "40px",
  },
  cardTitle: { fontSize: "24px", marginBottom: "8px" },
  cardSub: {
    color: "var(--text-2)", fontSize: "14px", marginBottom: "24px",
  },
  btnDisabled: {
    width: "100%", padding: "12px 20px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
    background: "transparent", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-3)",
    fontSize: "14px", cursor: "not-allowed", opacity: 0.5,
  },
  comingSoon: {
    marginTop: "10px", textAlign: "center",
    fontSize: "12px", color: "var(--accent)",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
  },
  divider: {
    display: "flex", alignItems: "center",
    margin: "20px 0", gap: "12px",
  },
  dividerText: {
    color: "var(--text-3)", fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
  },
  demoBtn: {
    width: "100%", padding: "12px 20px",
    background: "var(--accent-glow)", border: "1px solid var(--accent-dim)",
    borderRadius: "var(--radius)", color: "var(--accent)",
    fontSize: "14px", cursor: "pointer", transition: "all 0.15s",
  },
  note: {
    marginTop: "16px", textAlign: "center",
    fontSize: "12px", color: "var(--text-3)",
  },
};