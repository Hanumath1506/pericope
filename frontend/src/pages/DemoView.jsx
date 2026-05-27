import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import "./DemoView.css";

export default function DemoView() {
  const [papers, setPapers] = useState([]);
  const [activePaper, setActivePaper] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [tab, setTab] = useState("chat");
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
    setTab("chat");
  }

  return (
    <div style={styles.wrap}>
      <header className="demo-header">
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
        <div className="demo-chat-layout">
          <aside className="demo-sidebar">
            <button style={styles.backBtn} onClick={() => { setActivePaper(null); setMessages([]); setTab("chat"); }}>
              ← All papers
            </button>
            <div>
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
                <button key={q} style={styles.suggestion} onClick={() => { setInput(q); setTab("chat"); }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={styles.signInBox}>
              <p style={styles.signInBoxText}>Want to upload your own papers?</p>
              <p style={styles.comingSoonBox}>Full access coming soon</p>
            </div>
          </aside>

          <main className="demo-chat-main">
            <div style={styles.tabNav}>
              {["chat", "summary"].map(t => (
                <button
                  key={t}
                  style={{ ...styles.tabBtn, ...(tab === t ? styles.tabBtnActive : {}) }}
                  onClick={() => setTab(t)}
                >
                  {t === "chat" ? "💬 Chat" : "📋 Summary"}
                </button>
              ))}
            </div>

            {tab === "chat" ? (
              <>
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
                    placeholder="Ask a question..."
                    disabled={loading}
                  />
                  <button style={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.summaryWrap}>
                {activePaper.summary ? (
                  <>
                    <h1 style={styles.summaryTitle}>{activePaper.summary.title}</h1>
                    {activePaper.summary.summary && (
                      <div style={styles.sectionBlock}>
                        <p style={styles.sectionLabel}>Summary</p>
                        <p style={styles.sectionContent}>{activePaper.summary.summary}</p>
                      </div>
                    )}
                    {activePaper.summary.methodology && (
                      <div style={styles.sectionBlock}>
                        <p style={styles.sectionLabel}>Methodology</p>
                        <p style={styles.sectionContent}>{activePaper.summary.methodology}</p>
                      </div>
                    )}
                    {activePaper.summary.contributions && (
                      <div style={styles.sectionBlock}>
                        <p style={styles.sectionLabel}>Key Contributions</p>
                        <ul style={styles.list}>
                          {activePaper.summary.contributions.map((c, i) => (
                            <li key={i} style={styles.listItem}>
                              <span style={styles.bullet}>—</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: "var(--text-3)" }}>Summary not available.</p>
                )}
              </div>
            )}
          </main>
        </div>
      ) : (
        <main className="demo-main">
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
  logo: { display: "flex", alignItems: "baseline", gap: "8px" },
  logoText: { fontFamily: "'DM Serif Display', serif", fontSize: "20px" },
  logoBeta: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    color: "var(--text-2)", letterSpacing: "0.1em",
    background: "var(--bg-3)", padding: "2px 6px", borderRadius: "3px",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  demoNote: { fontSize: "11px", color: "var(--text-3)", fontFamily: "'DM Mono', monospace" },
  comingSoon: {
    fontSize: "11px", color: "var(--accent)",
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
  backBtn: {
    background: "none", border: "none", color: "var(--text-2)",
    fontSize: "13px", cursor: "pointer", textAlign: "left", padding: 0,
  },
  metaLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    letterSpacing: "0.12em", color: "var(--text-3)",
    textTransform: "uppercase", marginBottom: "6px",
  },
  paperTitle: { fontSize: "14px", color: "var(--text)", lineHeight: 1.5, fontWeight: 500 },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: "6px" },
  tag: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    background: "var(--bg-3)", border: "1px solid var(--border)",
    padding: "2px 8px", borderRadius: "3px", color: "var(--text-2)",
  },
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
  tabNav: {
    display: "flex", gap: "4px", padding: "12px 24px",
    borderBottom: "1px solid var(--border)", flexShrink: 0,
  },
  tabBtn: {
    background: "none", border: "none", borderRadius: "var(--radius)",
    color: "var(--text-2)", fontSize: "13px", padding: "8px 12px",
    cursor: "pointer",
  },
  tabBtnActive: { background: "var(--bg-3)", color: "var(--text)" },
  messages: {
    flex: 1, overflowY: "auto", padding: "24px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  emptyChat: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", paddingTop: "60px",
  },
  emptyChatIcon: { fontSize: "32px", color: "var(--accent)", marginBottom: "16px" },
  emptyChatText: { fontSize: "18px", color: "var(--text)", marginBottom: "8px" },
  emptyChatSub: { fontSize: "13px", color: "var(--text-3)" },
  msg: { display: "flex", flexDirection: "column", gap: "6px", maxWidth: "100%" },
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
    maxWidth: "100%", wordBreak: "break-word",
  },
  inputRow: {
    padding: "12px 16px 16px", display: "flex", gap: "8px",
    borderTop: "1px solid var(--border)", flexShrink: 0,
  },
  input: {
    flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)", color: "var(--text)", fontSize: "14px",
    padding: "10px 14px", outline: "none", minWidth: 0,
  },
  sendBtn: {
    background: "var(--accent)", border: "none", borderRadius: "var(--radius)",
    color: "#0d0d0d", fontSize: "13px", fontWeight: 500,
    padding: "10px 16px", cursor: "pointer", flexShrink: 0,
  },
  summaryWrap: { padding: "24px", overflowY: "auto" },
  summaryTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: "clamp(20px, 4vw, 28px)",
    lineHeight: 1.3, marginBottom: "32px",
  },
  sectionBlock: { marginBottom: "28px" },
  sectionLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: "10px",
    letterSpacing: "0.12em", color: "var(--accent)",
    textTransform: "uppercase", marginBottom: "10px",
  },
  sectionContent: { fontSize: "14px", color: "var(--text-2)", lineHeight: 1.8 },
  list: { listStyle: "none" },
  listItem: {
    display: "flex", gap: "12px", fontSize: "14px",
    color: "var(--text-2)", lineHeight: 1.7, marginBottom: "8px",
  },
  bullet: { color: "var(--accent)", flexShrink: 0 },
  demoBanner: { marginBottom: "32px" },
  demoBannerTitle: {
    fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 4vw, 28px)", marginBottom: "8px",
  },
  demoBannerSub: { fontSize: "14px", color: "var(--text-2)" },
  loading: { color: "var(--text-3)", textAlign: "center", marginTop: "48px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
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
  uploadPrompt: {
    textAlign: "center", padding: "40px",
    border: "1px dashed var(--border-light)", borderRadius: "8px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
  },
  uploadPromptText: { fontSize: "16px", color: "var(--text-2)" },
};