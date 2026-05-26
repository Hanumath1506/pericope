import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

export default function DemoView({ onSignIn }) {
  const [papers, setPapers] = useState([]);
  const [activePaper, setActivePaper] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    api.listDemoPapers()
      .then(data => {
        if (Array.isArray(data)) setPapers(data);
        setLoadingPapers(false);
      })
      .catch(() => setLoadingPapers(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading || !activePaper) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.demoChat(activePaper.id, userMsg);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function openPaper(paper) {
    setActivePaper(paper);
    setMessages([]);
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>pericope</span>
          <span style={styles.logoBeta}>demo</span>
        </div>
        <div style={styles.headerRight}>
          <p style={styles.demoNote}>3 pre-loaded papers — no sign-in required</p>
          <p style={styles.comingSoon}>Full access coming soon</p>
        </div>
      </header>

      {activePaper ? (
        <div style={styles.chatLayout}>
          <aside style={styles.sidebar}>
            <button style={styles.backBtn} onClick={() => { setActivePaper(null); setMessages([]); }}>
              ← All papers
            </button>
            <div style={styles.paperMeta}>
              <p style={styles.metaLabel}>Paper</p>
              <p style={styles.paperTitle}>{activePaper.summary?.title || activePaper.filename}</p>
            </div>
            {activePaper.summary?.keywords && (
              <div>
                <p style={styles.metaLabel}>Keywords</p>
                <div style={styles.tagWrap}>
                  {activePaper.summary.keywords.slice(0, 6).map(k => (
                    <span key={k} style={styles.tag}>{k}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p style={styles.metaLabel}>Suggested questions</p>
              {["What problem does this paper solve?", "What is the main methodology?", "What are the key results?", "What are the limitations?"].map(q => (
                <button key={q} style={styles.suggestion} onClick={() => setInput(q)}>
                  {q}
                </button>
              ))}
            </div>
            <div style={styles.signInBox}>
              <p style={styles.signInBoxText}>Want to upload your own papers?</p>
              <p style={styles.comingSoonBox}>Full access coming soon</p>
            </div>
          </aside>

          <main style={styles.chatMain}>
            <div style={styles.messages}>
              {messages.length === 0 && (
                <div style={styles.emptyChat}>
                  <p style={styles.emptyChatIcon}>◎</p>
                  <p style={styles.emptyChatText}>Ask anything about this paper</p>
                  <p style={styles.emptyChatSub}>Answers are grounded in the paper's actual content</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ ...styles.msg, ...(msg.role === "user" ? styles.msgUser : styles.msgAssistant) }}>
                  <span style={styles.msgRole}>{msg.role === "user" ? "you" : "ai"}</span>
                  <p style={styles.msgContent}>{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.msg, ...styles.msgAssistant }}>
                  <span style={styles.msgRole}>ai</span>
                  <p style={{ ...styles.msgContent, color: "var(--text-3)" }}>Thinking…</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask a question about this paper..."
                disabled={loading}
              />
              <button style={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>
                Send
              </button>
            </div>
          </main>
        </div>
      ) : (
        <main style={styles.main}>
          <div style={styles.demoBanner}>
            <p style={styles.demoBannerTitle}>Demo Library</p>
            <p style={styles.demoBannerSub}>3 landmark AI papers — click any to start chatting</p>
          </div>

          {loadingPapers ? (
            <p style={styles.loading}>Loading papers...</p>
          ) : (
            <div style={styles.grid}>
              {papers.map(paper => (
                <div key={paper.id} style={styles.card} onClick={() => openPaper(paper)}>
                  <div style={styles.cardTop}>
                    <span style={styles.readyBadge}>READY</span>
                  </div>
                  <p style={styles.cardTitle}>{paper.summary?.title || paper.filename}</p>
                  {paper.summary?.summary && (
                    <p style={styles.cardSummary}>{paper.summary.summary}</p>
                  )}
                  {paper.summary?.keywords && (
                    <div style={styles.tags}>
                      {paper.summary.keywords.slice(0, 4).map(k => (
                        <span key={k} style={styles.tag}>{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={styles.uploadPrompt}>
            <p style={styles.uploadPromptText}>Want to upload and chat with your own research papers?</p>
            <p style={styles.comingSoonLarge}>Full access coming soon</p>
          </div>
        </main>
      )}
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: {
    borderBottom: "1px solid var(--border)", padding: "0 48px",
    height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "baseline", gap: "8px" },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: "20px" },
  logoBeta: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    color: "var(--text-2)", letterSpacing: "0.1em",
    background: "var(--bg-3)", padding: "2px 6px", borderRadius: "3px",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  demoNote: { fontSize: "12px", color: "var(--text-3)", fontFamily: "'DM Mono', monospace" },
  comingSoon: {
    fontSize: "12px", color: "var(--accent)",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
  },
  comingSoonBox: {
    fontSize: "12px", color: "var(--accent)",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
    textAlign: "center",
  },
  comingSoonLarge: {
    fontSize: "14px", color: "var(--accent)",
    fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
  },
  main: { flex: 1, padding: "48px", maxWidth: "1000px", margin: "0 auto", width: "100%" },
  demoBanner: { marginBottom: "32px" },
  demoBannerTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: "28px", marginBottom: "8px",
  },
  demoBannerSub: { fontSize: "14px", color: "var(--text-2)" },
  loading: { color: "var(--text-3)", textAlign: "center", marginTop: "48px" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px", marginBottom: "48px",
  },
  card: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: "6px", padding: "20px", cursor: "pointer",
    transition: "border-color 0.15s",
  },
  cardTop: { marginBottom: "12px" },
  readyBadge: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.08em", padding: "3px 8px", borderRadius: "3px",
    background: "rgba(90,138,90,0.2)", color: "#7ab87a",
  },
  cardTitle: { fontSize: "14px", color: "var(--text)", marginBottom: "8px", lineHeight: 1.4, fontWeight: 500 },
  cardSummary: {
    fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "12px",
    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  tags: { display: "flex", flexWrap: "wrap", gap: "6px" },
  tag: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    background: "var(--bg-3)", border: "1px solid var(--border)",
    padding: "2px 8px", borderRadius: "3px", color: "var(--text-2)",
  },
  uploadPrompt: {
    textAlign: "center", padding: "40px",
    border: "1px dashed var(--border-light)", borderRadius: "8px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
  },
  uploadPromptText: { fontSize: "16px", color: "var(--text-2)" },
  chatLayout: { display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 60px)" },
  sidebar: {
    width: "280px", borderRight: "1px solid var(--border)",
    padding: "24px", display: "flex", flexDirection: "column", gap: "24px",
    overflowY: "auto", flexShrink: 0,
  },
  backBtn: {
    background: "none", border: "none", color: "var(--text-2)",
    fontSize: "13px", cursor: "pointer", textAlign: "left", padding: 0,
  },
  paperMeta: {},
  metaLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    letterSpacing: "0.12em", color: "var(--text-3)",
    textTransform: "uppercase", marginBottom: "6px",
  },
  paperTitle: { fontSize: "14px", color: "var(--text)", lineHeight: 1.5, fontWeight: 500 },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: "6px" },
  suggestion: {
    display: "block", width: "100%", background: "none",
    border: "1px solid var(--border)", borderRadius: "var(--radius)",
    color: "var(--text-2)", fontSize: "12px", padding: "8px 10px",
    textAlign: "left", cursor: "pointer", marginBottom: "6px", lineHeight: 1.4,
  },
  signInBox: {
    marginTop: "auto", background: "var(--bg-3)",
    border: "1px solid var(--border)", borderRadius: "6px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "8px", alignItems: "center",
  },
  signInBoxText: { fontSize: "12px", color: "var(--text-2)", textAlign: "center" },
  chatMain: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  messages: {
    flex: 1, overflowY: "auto", padding: "32px 48px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  emptyChat: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", paddingTop: "80px",
  },
  emptyChatIcon: { fontSize: "32px", color: "var(--accent)", marginBottom: "16px" },
  emptyChatText: { fontSize: "18px", color: "var(--text)", marginBottom: "8px" },
  emptyChatSub: { fontSize: "13px", color: "var(--text-3)" },
  msg: { display: "flex", flexDirection: "column", gap: "6px", maxWidth: "720px" },
  msgUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  msgAssistant: { alignSelf: "flex-start", alignItems: "flex-start" },
  msgRole: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    letterSpacing: "0.12em", color: "var(--text-3)", textTransform: "uppercase",
  },
  msgContent: {
    fontSize: "14px", lineHeight: 1.7, color: "var(--text)",
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: "6px", padding: "12px 16px",
  },
  inputRow: {
    padding: "16px 48px 24px", display: "flex", gap: "12px",
    borderTop: "1px solid var(--border)",
  },
  input: {
    flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)", color: "var(--text)", fontSize: "14px",
    padding: "10px 14px", outline: "none",
  },
  sendBtn: {
    background: "var(--accent)", border: "none", borderRadius: "var(--radius)",
    color: "#0d0d0d", fontSize: "13px", fontWeight: 500,
    padding: "10px 20px", cursor: "pointer",
  },
};