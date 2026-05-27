import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import "./PaperView.css";

export default function PaperView({ paper, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat");
  const bottomRef = useRef();

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const history = await api.getChatHistory(paper.id);
      setMessages(history);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await api.chat(paper.id, userMsg);
      setMessages(prev => [...prev, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  const s = paper.summary;

  return (
    <div className="paper-layout">
      <aside className="paper-sidebar">
        <button style={styles.backBtn} onClick={onBack}>← Library</button>
        <div>
          <p style={styles.metaLabel}>Paper</p>
          <p style={styles.paperTitle}>{s?.title || paper.filename}</p>
        </div>
        <nav style={styles.nav}>
          {["chat", "summary"].map(t => (
            <button
              key={t}
              style={{ ...styles.navBtn, ...(tab === t ? styles.navBtnActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === "chat" ? "💬 Chat" : "📋 Summary"}
            </button>
          ))}
        </nav>
        {s?.keywords && (
          <div>
            <p style={styles.metaLabel}>Keywords</p>
            <div style={styles.tagWrap}>
              {s.keywords.map(k => (
                <span key={k} style={styles.tag}>{k}</span>
              ))}
            </div>
          </div>
        )}
        <div style={styles.suggestedWrap}>
          <p style={styles.metaLabel}>Suggested questions</p>
          {["What problem does this paper solve?", "What is the main methodology?", "What are the key results?", "What are the limitations?"].map(q => (
            <button key={q} style={styles.suggestion} onClick={() => { setInput(q); setTab("chat"); }}>
              {q}
            </button>
          ))}
        </div>
      </aside>

      <main className="paper-main">
        {tab === "chat" ? (
          <div style={styles.chatWrap}>
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
          </div>
        ) : (
          <div style={styles.summaryWrap}>
            {s ? (
              <>
                <h1 style={styles.summaryTitle}>{s.title}</h1>
                <Section label="Summary" content={s.summary} />
                <Section label="Methodology" content={s.methodology} />
                {s.contributions && (
                  <div style={styles.sectionBlock}>
                    <p style={styles.sectionLabel}>Key Contributions</p>
                    <ul style={styles.list}>
                      {s.contributions.map((c, i) => (
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
  );
}

function Section({ label, content }) {
  if (!content) return null;
  return (
    <div style={styles.sectionBlock}>
      <p style={styles.sectionLabel}>{label}</p>
      <p style={styles.sectionContent}>{content}</p>
    </div>
  );
}

const styles = {
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
  nav: { display: "flex", flexDirection: "row", gap: "4px", flexWrap: "wrap" },
  navBtn: {
    background: "none", border: "none", borderRadius: "var(--radius)",
    color: "var(--text-2)", fontSize: "13px", padding: "8px 12px",
    textAlign: "left", cursor: "pointer", transition: "all 0.1s",
  },
  navBtnActive: { background: "var(--bg-3)", color: "var(--text)" },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: "6px" },
  tag: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    background: "var(--bg-3)", border: "1px solid var(--border)",
    padding: "2px 8px", borderRadius: "3px", color: "var(--text-2)",
  },
  suggestedWrap: {},
  suggestion: {
    display: "block", width: "100%", background: "none",
    border: "1px solid var(--border)", borderRadius: "var(--radius)",
    color: "var(--text-2)", fontSize: "12px", padding: "8px 10px",
    textAlign: "left", cursor: "pointer", marginBottom: "6px",
    lineHeight: 1.4, transition: "border-color 0.1s",
  },
  chatWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" },
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
};