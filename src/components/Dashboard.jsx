import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./Dashboard.css";
import { useAuth } from "../auth/AuthProvider";

/* helpers */
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function normalizeRoleLabel(label) {
  if (!label) return "";
  const v = String(label).trim().toLowerCase();
  if (v.includes("admin")) return "admin";
  if (v.includes("hr")) return "hr";
  if (v.includes("finance")) return "finance";
  if (v.includes("engineer")) return "engineer";
  if (v.includes("safety")) return "safety";
  if (v.includes("legal")) return "legal";
  if (v.includes("operation") || v.includes("operations") || v.includes("station") || v.includes("depot")) return "operations";
  return v.split(/\s+/)[0] || v;
}

/* Dashboard */
export default function Dashboard() {
  const auth = typeof useAuth === "function" ? useAuth() : null;
  const { user = null, logout = () => {} } = auth || {};

  const roleSlug = (user?.roleSlug || normalizeRoleLabel(user?.role || user?.post || "") || "hr").toLowerCase();
  const profile = { name: user?.name || user?.email || "Officer", roleDisplay: user?.post || user?.role || roleSlug.toUpperCase() };

  const DATA_TYPES = useMemo(() => {
    const base = ["Resume / CV","Offer / Contract","ID Document","Bank / Payroll Form","Leave Request","Medical / Sick Note","Timesheet / Attendance","Expense Receipt","Performance Review","Resignation / Offboarding"];
    if (roleSlug === "engineer") return ["Design Docs","Sprints / Tickets","ID Document","Timesheet / Attendance","Performance Review"];
    if (roleSlug === "finance") return ["Invoices","Bank / Payroll Form","Expense Receipt","Contract Invoices"];
    if (roleSlug === "legal") return ["Offer / Contract","NDAs","Compliance Certificates","Legal Memos"];
    if (roleSlug === "safety") return ["Incident Report","Medical / Sick Note","Safety Certificates","Inspection Reports"];
    return base;
  }, [roleSlug]);

  const DASH_CARDS = useMemo(() => {
    if (roleSlug === "admin") return ["System Health","Pipeline","Users","Knowledge Graph","Audit Trail","Alerts"];
    return ["Employee Summary","Pending Requests","Employee Directory","Attendance Snapshot","Onboarding Tracker"];
  }, [roleSlug]);

  const [mode, setMode] = useState("home"); // home | inject | explore
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // injected files (used across inject + inspect)
  const [injectedData, setInjectedData] = useState(() => {
    const init = {};
    DATA_TYPES.forEach((t) => (init[t] = []));
    return init;
  });
  useEffect(() => {
    setInjectedData((s) => {
      const out = { ...s };
      DATA_TYPES.forEach((t) => { if (!Array.isArray(out[t])) out[t] = []; });
      return out;
    });
  }, [DATA_TYPES.join("|")]);

  const handleFileAdd = useCallback((type, files) => {
    if (!files?.length) return;
    const arr = Array.from(files).map((f) => ({ id: makeId(), filename: f.name, file: f, size: f.size, mime: f.type }));
    setInjectedData((s) => ({ ...s, [type]: [...(s[type] || []), ...arr] }));
  }, []);

  const removeInjected = useCallback((type, id) => {
    setInjectedData((s) => ({ ...s, [type]: (s[type] || []).filter((x) => x.id !== id) }));
  }, []);

  const totalUploaded = Object.values(injectedData).flat().length;
  const totalSize = Object.values(injectedData).flat().reduce((acc, f) => acc + (f.size || 0), 0);

  /* UI state */
  const [modal, setModal] = useState(null); // null or { type: 'chat'|'inspect'|'kg'|'processing', ... }
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setModal(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Admin actions (mock) */
  const openInspect = useCallback(() => setModal({ type: "inspect" }), []);
  const openKg = useCallback(() => setModal({ type: "kg" }), []);
  const openChat = useCallback(() => setModal({ type: "chat" }), []);

  const processNow = useCallback(async () => {
    const files = Object.values(injectedData).flat();
    if (files.length === 0) {
      setToast({ text: "No files staged for processing" });
      return;
    }
    setProcessing(true);
    setModal({ type: "processing", progress: 0 });
    // mock progress
    for (let i = 0; i <= 20; i++) {
      await new Promise((r) => setTimeout(r, 140 + Math.random() * 160));
      setModal((m) => ({ ...(m || {}), progress: Math.round((i / 20) * 100) }));
    }
    // clear staged files (mock success)
    setInjectedData((s) => {
      const empty = {};
      Object.keys(s).forEach((k) => (empty[k] = []));
      return empty;
    });
    setProcessing(false);
    setToast({ text: `Processed ${files.length} files` });
    setTimeout(() => setModal(null), 700);
  }, [injectedData]);

  /* Submit within Inject view (stages files locally) */
  const submitInjected = useCallback(async () => {
    if (totalUploaded === 0) { setToast({ text: "No files to stage" }); return; }
    setToast({ text: `Staged ${totalUploaded} files — use Process Now in Admin Home to process.` });
  }, [totalUploaded]);

  /* Restore Inject card grid & Explore cards */
  return (
    <div className={`dashboard-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="dashboard-frame">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((s) => !s)} onNavigate={(m) => setMode(m)} activeMode={mode} onOpenChat={openChat} onLogout={logout} />
        <div className="dashboard-container">
          <HeaderCompact profile={profile} />

          <main className="dashboard-main">
            {mode === "home" && roleSlug === "admin" && (
              <AdminHome profile={profile} openInspect={openInspect} openKg={openKg} processNow={processNow} injectedSummary={{ files: totalUploaded, size: formatBytes(totalSize) }} processing={processing} openChat={openChat} />
            )}

            {mode === "home" && roleSlug !== "admin" && (
              <>
                <Hero profile={profile} roleSlug={roleSlug} onInject={() => setMode("inject")} onExplore={() => setMode("explore")} />
                <HowToUse roleSlug={roleSlug} />
              </>
            )}

            {mode === "inject" && (
              <InjectView
                DATA_TYPES={DATA_TYPES}
                injectedData={injectedData}
                handleFileAdd={handleFileAdd}
                removeInjected={removeInjected}
                submitInjected={submitInjected}
                totalUploaded={totalUploaded}
                totalSize={totalSize}
                formatBytes={formatBytes}
              />
            )}

            {mode === "explore" && <ExploreView DASH_CARDS={DASH_CARDS} openChat={openChat} />}
          </main>
        </div>
      </div>

      {/* Single modal area */}
      {modal && modal.type === "inspect" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Inspect Upload Queue</div>
          <div className="muted">Files staged for processing</div>
          <div className="summary-list" style={{ marginTop: 12, maxHeight: 260, overflow: "auto" }}>
            {Object.entries(injectedData).flatMap(([type, arr]) =>
              (arr || []).map((f) => (
                <div key={f.id} className="summary-row">
                  <div style={{ minWidth: 0 }}>
                    <div className="file-name" title={f.filename}>[{type}] {f.filename}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{f.mime || "—"} • {formatBytes(f.size)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(f.filename); setToast({ text: "Filename copied" }); }}>Copy</button>
                    <button className="btn-small btn-danger" onClick={() => { removeInjected(type, f.id); setToast({ text: "Removed from queue" }); }}>Remove</button>
                  </div>
                </div>
              ))
            )}
            {totalUploaded === 0 && <div className="muted empty">No files staged</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Close</button>
            <button className="btn-cta" onClick={processNow} disabled={processing}>{processing ? "Processing…" : "Process Now"}</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "kg" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Knowledge Graph — Snapshot</div>
          <div className="muted">Quick overview</div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div className="kg-item"><div className="kg-number">12,124</div><div className="muted">Entities</div></div>
            <div className="kg-item"><div className="kg-number">312</div><div className="muted">Orphans</div></div>
            <div className="kg-item"><div className="kg-number">42</div><div className="muted">Suggestions</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Close</button>
            <button className="btn-primary" onClick={async () => { setToast({ text: "Consistency check running (mock)" }); await new Promise((r) => setTimeout(r, 900)); setToast({ text: "Consistency check finished — 3 issues found" }); }}>Run Consistency Check</button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "processing" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Processing</div>
          <div className="muted">Processing staged files — progress shown below</div>
          <div style={{ marginTop: 12 }}>
            <div className="progress" style={{ width: "100%" }}>
              <div className="progress-bar" style={{ width: `${modal.progress ?? 0}%` }} />
            </div>
            <div className="muted" style={{ marginTop: 8 }}>{modal.progress ?? 0}%</div>
          </div>
        </Modal>
      )}

      {/* Full-screen Chat (ChatGPT-like) */}
      {modal && modal.type === "chat" && (
        <ChatFullScreen onClose={() => setModal(null)} />
      )}

      {/* Toast */}
      {toast && <div className="toast" role="status" onClick={() => setToast(null)}>{toast.text}</div>}
    </div>
  );
}

/* ---------------- Sidebar + header compact ---------------- */
function Sidebar({ collapsed, onToggle, activeMode, onNavigate, onOpenChat, onLogout }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="logo-compact">
          <div className="logo">DS</div>
          {!collapsed && <div className="brand-text"><div className="org-name">DocSphere</div><div className="org-sub">Admin</div></div>}
        </div>
        <button className="collapse-btn" onClick={onToggle} title="Collapse sidebar">{collapsed ? "➤" : "◀"}</button>
      </div>

      <div className="sidebar-search">
        <input placeholder="Search docs, users..." aria-label="Search" />
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${activeMode === "home" ? "active" : ""}`} onClick={() => onNavigate("home")} title="Home">🏠 {!collapsed && <span>Home</span>}</button>
        <button className={`nav-item ${activeMode === "inject" ? "active" : ""}`} onClick={() => onNavigate("inject")} title="Inject Data">⬆️ {!collapsed && <span>Inject</span>}</button>
        <button className={`nav-item ${activeMode === "explore" ? "active" : ""}`} onClick={() => onNavigate("explore")} title="Explore">🔎 {!collapsed && <span>Explore</span>}</button>
      </nav>

      <div className="sidebar-footer">
        <button className="quick-btn" onClick={onOpenChat} title="Open AI Assistant">💬 {!collapsed && <span>AI Assist</span>}</button>
        <button className="quick-btn danger" onClick={onLogout} title="Logout">🚪 {!collapsed && <span>Logout</span>}</button>
      </div>
    </aside>
  );
}

function HeaderCompact({ profile }) {
  return (
    <div className="header-compact card-elev" role="banner">
      <div>
        <div className="small-title muted">Signed in as</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="avatar">{profile.name?.charAt(0) || "U"}</div>
          <div>
            <div className="profile-name">{profile.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{profile.roleDisplay}</div>
          </div>
        </div>
      </div>
      <div className="header-actions muted">System overview</div>
    </div>
  );
}

/* ---------------- Admin Home ---------------- */
function AdminHome({ profile, openInspect, openKg, processNow, injectedSummary, processing, openChat }) {
  const stats = [
    { label: "Indexed Docs", value: 12480, delta: "+3.8%" },
    { label: "Pending Review", value: 42, delta: "-8%" },
    { label: "Extraction Accuracy", value: "92.7%", delta: "+1.2%" },
    { label: "Active Users", value: 318, delta: "+4.1%" },
  ];

  const pipeline = [
    { step: "Uploaded", count: 72, pct: 100 },
    { step: "OCR", count: 70, pct: 97 },
    { step: "NLP Parse", count: 66, pct: 91 },
    { step: "KG Index", count: 62, pct: 86 },
  ];

  const alerts = [
    { id: "a1", level: "error", text: "OCR queue delay > 10m" },
    { id: "a2", level: "warn", text: "Low disk space on processing node" },
  ];

  return (
    <section className="admin-root">
      <div className="admin-top card-elev">
        <div>
          <div className="pill">Admin Console</div>
          <h2 className="hero-title small">Welcome back, <span className="accent">{profile.name}</span></h2>
          <div className="muted">Overview of system health, pipeline, and critical alerts.</div>
        </div>

        <div className="admin-top-actions">
          <button className="btn-ghost" onClick={openKg}>View KG</button>
          <button className="btn-ghost" onClick={openInspect}>Inspect Queue</button>
          <button className="btn-cta" onClick={processNow} disabled={processing}>{processing ? "Processing…" : "Process Now"}</button>
          <button className="btn-primary" onClick={openChat}>AI Assistant</button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-left">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card card-elev" title={s.label}>
                <div className="stat-label muted">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-delta">{s.delta}</div>
              </div>
            ))}
          </div>

          <div className="pipeline card-elev">
            <div className="pipeline-head">
              <div className="card-title">Document Pipeline</div>
              <div className="muted">Realtime processing throughput</div>
            </div>
            <div className="pipeline-rows">
              {pipeline.map((p) => (
                <div className="pipeline-row" key={p.step}>
                  <div className="pipeline-left">
                    <div className="pipeline-step">{p.step}</div>
                    <div className="muted">{p.count} items</div>
                  </div>
                  <div className="pipeline-right">
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${p.pct}%` }} />
                    </div>
                    <div className="pipeline-pct muted">{p.pct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="kg-card card-elev">
            <div className="card-title">Knowledge Graph Health</div>
            <div className="muted">Entity coverage, orphan nodes, and suggested merges</div>

            <div className="kg-stats" style={{ marginTop: 8 }}>
              <div className="kg-item">
                <div className="kg-number">12,124</div>
                <div className="muted">Entities</div>
              </div>
              <div className="kg-item">
                <div className="kg-number">312</div>
                <div className="muted">Orphans</div>
              </div>
              <div className="kg-item">
                <div className="kg-number">42</div>
                <div className="muted">Suggestions</div>
              </div>
            </div>

            <div className="kg-cta-row" style={{ marginTop: 12 }}>
              <button className="btn-ghost">Open Explorer</button>
              <button className="btn-primary">Run Consistency Check</button>
            </div>
          </div>
        </div>

        <aside className="admin-right">
          <div className="card-elev recent-activity">
            <div className="card-title">Recent Activity</div>
            <div className="muted">User actions and system events</div>
            <div className="activity-list" style={{ marginTop: 8 }}>
              <div className="activity-row"><div>Alice uploaded 7 invoices</div><div className="muted">2m</div></div>
              <div className="activity-row"><div>OCR failed on scan_332.pdf</div><div className="muted">12m</div></div>
              <div className="activity-row"><div>John approved onboarding</div><div className="muted">1h</div></div>
            </div>
          </div>

          <div className="card-elev alerts">
            <div className="card-title">Alerts</div>
            <div className="muted">Immediate attention required</div>
            <div className="alerts-list" style={{ marginTop: 8 }}>
              {alerts.map((a) => <div key={a.id} className={`alert-row ${a.level}`}><div className="alert-dot" /> <div>{a.text}</div></div>)}
            </div>
          </div>

          <div className="card-elev upload-snapshot">
            <div className="card-title">Upload Snapshot</div>
            <div className="muted">Files waiting to be processed</div>
            <div className="upload-stats" style={{ marginTop: 8 }}>
              <div><div className="upload-number">{injectedSummary.files}</div><div className="muted">Files</div></div>
              <div style={{ textAlign: "right" }}><div className="upload-size">{injectedSummary.size}</div><div className="muted">Total size</div></div>
            </div>

            <div className="upload-actions" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={openInspect}>Inspect</button>
                <button className="btn-cta" onClick={processNow} disabled={processing}>{processing ? "Processing…" : "Process Now"}</button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="btn-muted" onClick={() => alert("Export queue (mock)")}>Export Queue</button>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </section>
  );
}

/* ---------------- Inject View (restored card look) ---------------- */
function InjectView({ DATA_TYPES, injectedData, handleFileAdd, removeInjected, submitInjected, totalUploaded, totalSize, formatBytes }) {
  return (
    <section className="inject-view">
      <div className="inject-main">
        <div className="grid-2">
          {DATA_TYPES.map((t) => (
            <div key={t} className="inject-card card-elev">
              <div className="card-head">
                <div>
                  <div className="card-title">{t}</div>
                  <div className="card-sub">Drop or upload files</div>
                </div>

                <label className="upload-btn" aria-label={`Upload ${t}`}>
                  Upload
                  <input onChange={(e) => handleFileAdd(t, e.target.files)} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.csv" className="hidden" />
                </label>
              </div>

              <div className="file-list" role="list" aria-label={`${t} file list`}>
                {(injectedData[t] || []).length === 0 ? (
                  <div className="muted empty">No files yet</div>
                ) : (
                  (injectedData[t] || []).map((f) => (
                    <div key={f.id} className="file-row" role="listitem">
                      <div className="file-left">
                        <div className="file-name" title={f.filename}>{f.filename}</div>
                        <div className="file-meta muted">{f.mime || "—"} • {formatBytes(f.size || 0)}</div>
                      </div>
                      <div className="file-actions">
                        <button onClick={() => removeInjected(t, f.id)} className="btn-small btn-danger" aria-label={`Remove ${f.filename}`}>Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="summary-card card-elev">
          <div className="summary-title">All Uploaded Files Before Submit</div>
          <div className="summary-meta muted">Files: <strong>{totalUploaded}</strong> — Size: <strong>{formatBytes(totalSize)}</strong></div>
          <div className="summary-list">
            {Object.entries(injectedData).flatMap(([type, arr]) =>
              (arr || []).map((f) => (
                <div key={f.id} className="summary-row">
                  <div className="file-name">[{type}] {f.filename}</div>
                  <button onClick={() => removeInjected(type, f.id)} className="btn-small btn-danger">Remove</button>
                </div>
              ))
            )}
            {totalUploaded === 0 && <div className="muted">No files to submit</div>}
          </div>

          <button onClick={submitInjected} className="btn-cta mt" disabled={totalUploaded === 0}>Stage Files</button>
        </div>
      </div>

      <aside className="help-aside card-elev">
        <h3>Help & Formats</h3>
        <div className="muted">Supported: PDF, JPG, PNG, DOCX, CSV. We extract key fields automatically.</div>
      </aside>
    </section>
  );
}

/* ---------------- Explore View (restored cards grid) ---------------- */
function ExploreView({ DASH_CARDS, openChat }) {
  return (
    <section className="explore-view">
      <div className="explore-header">
        <h3>Dashboard</h3>
        <div>
          <button onClick={openChat} className="btn-primary">Chat with DocSphere AI</button>
        </div>
      </div>

      <div className="cards-grid">
        {DASH_CARDS.map((card, idx) => (
          <div key={card} className="dash-card card-elev" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="card-top">
              <div className="card-label">{card}</div>
              <div className="card-updated">Updated just now</div>
            </div>
            <div className="card-body">—</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Full-screen Chat (ChatGPT-like) ---------------- */
function ChatFullScreen({ onClose }) {
  const topics = ["General", "Onboarding", "Leave Requests", "Payroll", "Documents"];
  const [activeTopic, setActiveTopic] = useState("General");
  const [messages, setMessages] = useState(() => {
    const init = {};
    topics.forEach((t) => { init[t] = [{ from: "ai", text: t === "General" ? "Hello — DocSphere AI at your service." : `Welcome to ${t}` }]; });
    return init;
  });
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const send = () => {
    const text = inputRef.current?.value;
    if (!text?.trim()) return;
    setMessages((m) => ({ ...m, [activeTopic]: [...(m[activeTopic] || []), { from: "user", text }] }));
    inputRef.current.value = "";
    setTimeout(() => setMessages((m) => ({ ...m, [activeTopic]: [...(m[activeTopic] || []), { from: "ai", text: "Mock reply — try asking for 'missing docs'." }] })), 700);
    // scroll down after small delay
    setTimeout(() => { if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }, 200);
  };

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, []);

  return (
    <div className="chat-modal-full" role="dialog" aria-modal="true" aria-label="DocSphere AI chat full">
      <div className="chat-full-panel card-elev">
        <div className="chat-full-header">
          <div>
            <div className="bold">DocSphere AI</div>
            <div className="muted">Ask questions, run audits, or request missing documents</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="chat-full-body">
          <aside className="chat-left">
            <div className="chat-left-head muted">Topics</div>
            <div className="chat-topics">
              {topics.map((t) => <button key={t} className={`topic-btn ${t === activeTopic ? "active" : ""}`} onClick={() => setActiveTopic(t)}>{t}</button>)}
            </div>
            <div className="chat-left-footer muted">Quick commands: "list missing docs"</div>
          </aside>

          <section className="chat-center">
            <div className="chat-conversation" ref={chatBodyRef}>
              {(messages[activeTopic] || []).map((m, i) => (
                <div key={i} className={`chat-bubble ${m.from === "ai" ? "ai" : "user"}`}>{m.text}</div>
              ))}
            </div>

            <div className="chat-compose">
              <input ref={inputRef} placeholder={`Message ${activeTopic}`} aria-label={`Message ${activeTopic}`} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
              <button className="btn-cta" onClick={send}>Send</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* Modal wrapper */
function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal card-elev">{children}</div>
    </div>
  );
}
