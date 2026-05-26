import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function Dashboard({ onOpenPaper }) {
  const { user, logout } = useAuth();
  const [papers, setPapers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    loadPapers();
    const interval = setInterval(loadPapers, 4000);
    return () => clearInterval(interval);
  }, []);

  async function loadPapers() {
    try {
      const data = await api.listPapers();
      setPapers(data.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload(file) {
    if (!file || !file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await api.uploadPaper(file);
      await loadPapers();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(e, paperId) {
    e.stopPropagation();
    try {
      await api.deletePaper(paperId);
      setPapers(p => p.filter(x => x.id !== paperId));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSearch(q) {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const res = await api.search(q);
      setSearchResults(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>pericope</span>
          <span style={styles.logoBeta}>beta</span>
        </div>
        <div style={styles.userRow}>
          <img src={user.photoURL} alt="" style={styles.avatar} />
          <span style={styles.userName}>{user.displayName}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Upload zone */}
        <div
          style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            handleUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => handleUpload(e.target.files[0])}
          />
          {uploading ? (
            <p style={styles.dropText}>Processing...</p>
          ) : (
            <>
              <p style={styles.dropIcon}>⊕</p>
              <p style={styles.dropText}>Drop a PDF or click to upload</p>
              <p style={styles.dropSub}>Research papers, preprints, reports</p>
            </>
          )}
        </div>

        {/* Search bar */}
        {papers.length > 1 && (
          <div style={styles.searchRow}>
            <input
              style={styles.searchBar}
              placeholder="Search across all papers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch(searchQuery)}
            />
            <button
              style={styles.searchBtn}
              onClick={() => handleSearch(searchQuery)}
              disabled={searching}
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        )}

        {/* Search results */}
        {searchResults && (
          <div style={styles.searchResults}>
            <p style={styles.sectionLabel}>Synthesis</p>
            <p style={styles.synthesis}>{searchResults.synthesis}</p>
            {searchResults.sources.map(s => (
              <div key={s.paper_id} style={styles.sourceCard}>
                <p style={styles.sourceTitle}>{s.title}</p>
                {s.chunks.map((c, i) => (
                  <p key={i} style={styles.sourceChunk}>{c}</p>
                ))}
              </div>
            ))}
            <button style={styles.clearBtn} onClick={() => { setSearchResults(null); setSearchQuery(""); }}>
              Clear results
            </button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {/* Papers grid */}
        {!searchResults && papers.length > 0 && (
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Your library — {papers.length} paper{papers.length !== 1 ? "s" : ""}</p>
            <div style={styles.grid}>
              {papers.map(paper => (
                <div
                  key={paper.id}
                  style={{
                    ...styles.card,
                    cursor: paper.status === "ready" ? "pointer" : "default",
                    opacity: paper.status === "error" ? 0.5 : 1,
                  }}
                  onClick={() => paper.status === "ready" && onOpenPaper(paper)}
                >
                  <div style={styles.cardTop}>
                    <span style={{ ...styles.statusBadge, ...statusStyle(paper.status) }}>
                      {paper.status}
                    </span>
                    <button style={styles.deleteBtn} onClick={e => handleDelete(e, paper.id)}>×</button>
                  </div>
                  <p style={styles.cardTitle}>
                    {paper.summary?.title || paper.filename}
                  </p>
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
                  <p style={styles.cardDate}>
                    {new Date(paper.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {papers.length === 0 && !uploading && (
          <p style={styles.empty}>Upload your first paper to get started.</p>
        )}
      </main>
    </div>
  );
}

function statusStyle(status) {
  if (status === "ready") return { background: "rgba(90,138,90,0.2)", color: "#7ab87a" };
  if (status === "error") return { background: "rgba(138,74,74,0.2)", color: "#c87a7a" };
  return { background: "rgba(200,169,110,0.15)", color: "var(--accent)" };
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
    color: "var(--accent)", letterSpacing: "0.1em",
    background: "var(--accent-glow)", padding: "2px 6px", borderRadius: "3px",
  },
  userRow: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "28px", height: "28px", borderRadius: "50%" },
  userName: { fontSize: "13px", color: "var(--text-2)" },
  logoutBtn: {
    background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)",
    color: "var(--text-2)", fontSize: "12px", padding: "4px 10px", cursor: "pointer",
  },
  main: { flex: 1, padding: "48px", maxWidth: "1000px", margin: "0 auto", width: "100%" },
  dropzone: {
    border: "1px dashed var(--border-light)", borderRadius: "8px",
    padding: "48px", textAlign: "center", cursor: "pointer",
    transition: "all 0.15s", marginBottom: "32px",
  },
  dropzoneActive: { borderColor: "var(--accent)", background: "var(--accent-glow)" },
  dropIcon: { fontSize: "28px", color: "var(--accent)", marginBottom: "12px" },
  dropText: { fontSize: "16px", color: "var(--text)", marginBottom: "6px" },
  dropSub: { fontSize: "13px", color: "var(--text-3)" },
  searchRow: { display: "flex", gap: "12px", marginBottom: "24px" },
  searchBar: {
    flex: 1, background: "var(--bg-2)", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius)", color: "var(--text)", fontSize: "14px",
    padding: "10px 14px", outline: "none",
  },
  searchBtn: {
    background: "var(--accent)", border: "none", borderRadius: "var(--radius)",
    color: "#0d0d0d", fontSize: "13px", fontWeight: 500,
    padding: "10px 20px", cursor: "pointer",
  },
  searchResults: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "24px", marginBottom: "32px",
  },
  synthesis: {
    fontSize: "14px", color: "var(--text)", lineHeight: 1.8, marginBottom: "24px",
  },
  sourceCard: {
    borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px",
  },
  sourceTitle: {
    fontSize: "12px", color: "var(--accent)", fontFamily: "'DM Mono', monospace",
    marginBottom: "8px",
  },
  sourceChunk: {
    fontSize: "12px", color: "var(--text-2)", lineHeight: 1.7, marginBottom: "6px",
  },
  clearBtn: {
    marginTop: "16px", background: "none", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-2)", fontSize: "12px",
    padding: "6px 12px", cursor: "pointer",
  },
  error: { color: "#c87a7a", fontSize: "13px", marginBottom: "16px" },
  section: {},
  sectionLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: "11px",
    letterSpacing: "0.1em", color: "var(--text-3)",
    textTransform: "uppercase", marginBottom: "16px",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  card: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: "6px", padding: "20px", transition: "border-color 0.15s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  statusBadge: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.08em", padding: "3px 8px", borderRadius: "3px",
    textTransform: "uppercase",
  },
  deleteBtn: {
    background: "none", border: "none", color: "var(--text-3)",
    cursor: "pointer", fontSize: "18px", lineHeight: 1,
  },
  cardTitle: {
    fontSize: "14px", color: "var(--text)", marginBottom: "8px",
    lineHeight: 1.4, fontWeight: 500,
  },
  cardSummary: {
    fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6, marginBottom: "12px",
    display: "-webkit-box", WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  tags: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" },
  tag: {
    fontSize: "10px", fontFamily: "'DM Mono', monospace",
    background: "var(--bg-3)", border: "1px solid var(--border)",
    padding: "2px 8px", borderRadius: "3px", color: "var(--text-2)",
  },
  cardDate: { fontSize: "11px", color: "var(--text-3)" },
  empty: { textAlign: "center", color: "var(--text-3)", marginTop: "80px" },
};