// src/components/HRDashboard.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import "./HRDashboard.css";
import { useAuth } from "../auth/AuthProvider"; // <-- adjust to match your project path

// small id helper
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function HRDashboard() {
  // safe hook usage: call if available
  const auth = typeof useAuth === "function" ? useAuth() : null;
  const { user = null, logout = () => {}, token = null } = auth || {};

  const DATA_TYPES = [
    "Resume / CV",
    "Offer / Contract",
    "ID Document",
    "Bank / Payroll Form",
    "Leave Request",
    "Medical / Sick Note",
    "Timesheet / Attendance",
    "Expense Receipt",
    "Performance Review",
    "Resignation / Offboarding",
  ];

  const DASH_CARDS = [
    "Employee Summary",
    "Pending Requests",
    "Employee Directory",
    "Attendance Snapshot",
    "Onboarding Tracker",
    "Offboarding Tracker",
    "HR Alerts",
    "Documents & Templates",
    "Quick Actions",
    "People Analytics",
  ];

  const [mode, setMode] = useState("home"); // home | inject | explore
  const hrProfile = {
    name: user?.name || "HR Officer",
    role: user?.position || (user?.role === "hr" ? "HR Officer" : user?.role || "Staff"),
  };

  // file injection state
  const [injectedData, setInjectedData] = useState(() => {
    const init = {};
    DATA_TYPES.forEach((t) => (init[t] = []));
    return init;
  });

  // dashboard cards
  const [activeCards] = useState(DASH_CARDS);

  // chat state
  const [chatOpen, setChatOpen] = useState(false);
  const topics = ["General", "Onboarding", "Leave Requests", "Payroll", "Documents"];
  const [activeTopic, setActiveTopic] = useState("General");
  const [messages, setMessages] = useState(() => {
    const init = {};
    topics.forEach((t) => {
      init[t] = [{ from: "ai", text: t === "General" ? "Hello — DocSphere AI at your service." : `Welcome to ${t} topic.` }];
    });
    return init;
  });
  const inputRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  // lock body scroll when chat modal open
  useEffect(() => {
    document.body.style.overflow = chatOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [chatOpen]);

  const handleFileAdd = useCallback((type, files) => {
    if (!files?.length) return;
    const list = Array.from(files).map((f) => ({ id: makeId(), filename: f.name, file: f, size: f.size, mime: f.type }));
    setInjectedData((s) => ({ ...s, [type]: [...s[type], ...list] }));
  }, []);

  const removeInjected = useCallback((type, id) => {
    setInjectedData((s) => ({ ...s, [type]: s[type].filter((x) => x.id !== id) }));
  }, []);

  const submitInjected = useCallback(async () => {
    // Replace this with your real upload endpoint.
    const totalFiles = Object.values(injectedData).flat().length;
    if (totalFiles === 0) {
      alert("No files to submit");
      return;
    }

    try {
      const form = new FormData();
      Object.entries(injectedData).forEach(([type, arr]) => {
        arr.forEach((f) => {
          form.append("files", f.file, f.filename);
          form.append("meta", JSON.stringify({ type, id: f.id, filename: f.filename }));
        });
      });

      // Example: POST to /api/uploads/documents — adapt as needed.
      const res = await fetch("/api/uploads/documents", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      // Clear injected data on success
      const init = {};
      DATA_TYPES.forEach((t) => (init[t] = []));
      setInjectedData(init);
      alert("Uploaded successfully.");
    } catch (err) {
      console.error("Upload error", err);
      alert(`Upload failed: ${err.message}`);
    }
  }, [injectedData, token]);

  const sendMessage = useCallback((topic, text) => {
    if (!text?.trim()) return;
    setMessages((m) => ({ ...m, [topic]: [...(m[topic] || []), { from: "user", text }] }));
    const t = setTimeout(() => {
      setMessages((m) => ({ ...m, [topic]: [...(m[topic] || []), { from: "ai", text: "Mock reply — good point. Suggestion: check pending onboarding tasks for this user." }] }));
    }, 600);
    timersRef.current.push(t);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const totalUploaded = Object.values(injectedData).flat().length;
  const totalSize = Object.values(injectedData).flat().reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="hr-root">
      <div className="hr-container">
        <Header orgName={user?.orgName || "Acme Corp"} hrProfile={hrProfile} mode={mode} setMode={setMode} onLogout={logout} />

        <main className="hr-main">
          {mode === "home" && (
            <>
              <Hero onInject={() => setMode("inject")} onExplore={() => setMode("explore")} hrProfile={hrProfile} />
              <HowToUse />
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

          {mode === "explore" && <ExploreView DASH_CARDS={DASH_CARDS} activeCards={activeCards} openChat={() => setChatOpen(true)} />}
        </main>
      </div>

      {chatOpen && (
        <ChatFullPage
          topics={topics}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          messages={messages}
          sendMessage={sendMessage}
          inputRef={inputRef}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

function Header({ orgName, hrProfile, mode, setMode, onLogout }) {
  return (
    <header className="hr-header">
      <div className="hr-header-left">
        <div className="brand">
          <div className="logo" aria-hidden>
            DS
          </div>
          <div className="brand-text">
            <div className="org-name">{orgName}</div>
            <div className="org-sub">DocSphere AI</div>
          </div>
        </div>
      </div>

      <div className="hr-header-right">
        <nav className="hr-nav" role="navigation" aria-label="main nav">
          {/* Reordered to: Home, Inject Data, Explore */}
          <button onClick={() => setMode("home")} className={`btn ${mode === "home" ? "btn-outline" : "btn-muted"}`}>Home</button>
          <button onClick={() => setMode("inject")} className={`btn ${mode === "inject" ? "btn-primary" : "btn-muted"}`}>Inject Data</button>
          <button onClick={() => setMode("explore")} className={`btn ${mode === "explore" ? "btn-primary" : "btn-muted"}`}>Explore</button>
        </nav>

        <div className="profile-pill" title={`${hrProfile.name} — ${hrProfile.role}`}>
          <div className="profile-text">
            <div className="profile-name">{hrProfile.name}</div>
            <div className="profile-role">{hrProfile.role}</div>
          </div>
          <button onClick={onLogout} className="btn-logout" aria-label="Logout">Logout</button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onInject, onExplore, hrProfile }) {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="pill">Welcome — {hrProfile.role}</div>
        <h1 className="hero-title">Welcome back, <span className="accent">{hrProfile.name}</span></h1>
        <p className="hero-sub">Manage employees, approvals and quickly inject documents into DocSphere AI. Faster onboarding and smarter search.</p>

        <div className="hero-actions">
          <button onClick={onInject} className="btn-cta">Inject Data</button>
          <button onClick={onExplore} className="btn-ghost">Explore Dashboard</button>
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="kpi-value">• • •</div>
            <div className="muted">Quick insights</div>
          </div>
          <div className="kpi">
            <div className="kpi-value">AI</div>
            <div className="muted">Assisted workflows</div>
          </div>
        </div>
      </div>

      <div className="hero-right card-elev">
        <div className="card-head-compact">
          <div>
            <div className="small-title">Upload Snapshot</div>
            <div className="muted">Drag & drop or use Upload buttons</div>
          </div>
        </div>

        <div className="upload-preview muted">No active uploads — try "Inject Data" to get started</div>
      </div>
    </section>
  );
}

function HowToUse() {
  return (
    <section className="how-to">
      <div className="how-main">
        <div className="how-card card-elev">
          <h2>How HR Officers use DocSphere AI</h2>
          <p className="muted">Quick guide with visuals and actions to get productive fast.</p>

          <div className="info-grid">
            <InfoCard title="1. Inject Documents" desc="Upload resumes, contracts, IDs, timesheets. DocSphere AI extracts key fields automatically." icon="📤" />
            <InfoCard title="2. Review & Approve" desc="See pending Leave/Onboarding requests and approve directly from the dashboard." icon="✅" />
            <InfoCard title="3. Explore People" desc="Search employees, open profiles, and track onboarding/offboarding progress." icon="🔍" />
            <InfoCard title="4. Chat with AI" desc="Ask DocSphere AI for insights, missing documents, or compliance checks." icon="🤖" />
          </div>

          <div className="tip-box">
            <h3>Design & UX tips</h3>
            <ul>
              <li>Use "Inject Data" for bulk uploads; verify parsed fields before submit.</li>
              <li>Keep the Pending Requests panel visible — approvals are high priority.</li>
              <li>Use the Chat assistant to generate offer letters or find missing documents quickly.</li>
              <li>Use Quick Actions for frequent tasks: Add Employee, Create Offer, Start Offboarding.</li>
            </ul>
          </div>
        </div>

        <aside className="how-aside card-elev">
          <h3>Getting started checklist</h3>
          <ol>
            <li>Inject at least one contract & ID for a new hire.</li>
            <li>Approve any pending leave requests.</li>
            <li>Open the People Directory and confirm roles.</li>
            <li>Chat with DocSphere AI for a quick audit of missing docs.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}

function InfoCard({ title, desc, icon }) {
  return (
    <div className="info-card">
      <div className="info-icon">{icon}</div>
      <div>
        <div className="info-title">{title}</div>
        <div className="info-desc">{desc}</div>
      </div>
    </div>
  );
}

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
                {injectedData[t].length === 0 ? (
                  <div className="muted empty">No files yet</div>
                ) : (
                  injectedData[t].map((f) => (
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
              arr.map((f) => (
                <div key={f.id} className="summary-row">
                  <div className="file-name">[{type}] {f.filename}</div>
                  <button onClick={() => removeInjected(type, f.id)} className="btn-small btn-danger">Remove</button>
                </div>
              ))
            )}
            {totalUploaded === 0 && <div className="muted">No files to submit</div>}
          </div>

          <button onClick={submitInjected} className="btn-cta mt" disabled={totalUploaded === 0}>Submit Injected</button>
        </div>
      </div>

      <aside className="help-aside card-elev">
        <h3>Help & Formats</h3>
        <div className="muted">Supported: PDF, JPG, PNG, DOCX, CSV. We extract name, emails, dates and key fields automatically.</div>
      </aside>
    </section>
  );
}

function ExploreView({ DASH_CARDS, activeCards, openChat }) {
  return (
    <section className="explore-view">
      <div className="explore-header">
        <h3>HR Dashboard</h3>
        <div>
          <button onClick={openChat} className="btn-primary">Chat with DocSphere AI</button>
        </div>
      </div>

      <div className="cards-grid">
        {activeCards.map((card, idx) => (
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

function ChatFullPage({ topics, activeTopic, setActiveTopic, messages, sendMessage, inputRef, onClose }) {
  return (
    <div className="chat-modal" role="dialog" aria-modal="true" aria-label="DocSphere AI chat">
      <aside className="chat-sidebar">
        <div className="sidebar-head">
          <div className="bold">Topics</div>
          <button onClick={onClose} className="btn-muted">Back</button>
        </div>
        <div className="topics-list">
          {topics.map((t) => (
            <button key={t} onClick={() => setActiveTopic(t)} className={`topic-btn ${activeTopic === t ? "active" : ""}`}>{t}</button>
          ))}
        </div>
      </aside>

      <div className="chat-main">
        <div className="chat-header">
          <div className="bold">Chat — {activeTopic}</div>
          <div className="muted">DocSphere AI</div>
        </div>

        <div className="chat-body" role="log" aria-live="polite">
          {(messages[activeTopic] || []).map((m, i) => (
            <div key={i} className={`chat-bubble ${m.from === "ai" ? "ai" : "user"}`}>{m.text}</div>
          ))}
        </div>

        <div className="chat-input">
          <input ref={inputRef} placeholder={`Ask DocSphere AI about ${activeTopic}`} aria-label={`Message about ${activeTopic}`} />
          <button onClick={() => sendMessage(activeTopic, inputRef.current?.value)} className="btn-cta">Send</button>
        </div>
      </div>
    </div>
  );
}
