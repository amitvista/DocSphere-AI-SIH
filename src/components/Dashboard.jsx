import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./Dashboard.css";
import ReactDOM from "react-dom";   // 👈 ADD THIS LINE
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

/* --------- Robust role normalizer --------- */
function normalizeRoleLabel(label) {
  if (!label) return "";
  const v = String(label).trim().toLowerCase();

  if (
    v.includes("hr") ||
    v.includes("human") ||
    v.includes("people") ||
    v.includes("talent") ||
    v.includes("people ops") ||
    v.includes("human resources")
  ) {
    return "hr";
  }
  if (v.includes("finance") || v.includes("accounts") || v.includes("payroll")) return "finance";
  if (v.includes("engineer") || v.includes("developer") || v.includes("dev") || v.includes("software"))
    return "engineer";
  if (v.includes("safety") || v.includes("ehs")) return "safety";
  if (v.includes("legal") || v.includes("law") || v.includes("counsel")) return "legal";
  if (v.includes("operation") || v.includes("operations") || v.includes("ops") || v.includes("depot")) return "operations";
  if (v.includes("admin") || v.includes("administrator") || v.includes("sysadmin")) return "admin";

  const words = v.split(/[,;|\/\s-]+/).filter(Boolean);
  if (words.length === 0) return "";
  for (const w of words) {
    if (["hr", "human", "people"].some((x) => w.includes(x))) return "hr";
    if (["finance", "accounts", "payroll"].some((x) => w.includes(x))) return "finance";
    if (["engineer", "developer", "dev"].some((x) => w.includes(x))) return "engineer";
    if (["safety", "ehs"].some((x) => w.includes(x))) return "safety";
    if (["legal", "counsel"].some((x) => w.includes(x))) return "legal";
    if (["operation", "ops"].some((x) => w.includes(x))) return "operations";
    if (["admin", "administrator", "sysadmin"].some((x) => w.includes(x))) return "admin";
  }
  return words[0];
}

/* Dashboard */
export default function Dashboard() {
  const auth = typeof useAuth === "function" ? useAuth() : null;
  const { user = null, logout = () => {} } = auth || {};

  // Role detection: prefer roleSlug, roles array, role/post/title
  const roleFromArray = Array.isArray(user?.roles) ? user.roles.find((r) => typeof r === "string" && r.length) : null;
  const rawRoleSource = user?.roleSlug ?? roleFromArray ?? user?.role ?? user?.post ?? user?.title ?? "";
  const roleSlug = (rawRoleSource ? normalizeRoleLabel(rawRoleSource) : (user?.isAdmin ? "admin" : "hr")).toLowerCase();

  // debug console (remove after QA)
  console.info("DBG user object:", user, "rawRoleSource:", rawRoleSource, "derived roleSlug:", roleSlug);

  const profile = { name: user?.name || user?.email || "Officer", roleDisplay: user?.post || user?.role || roleSlug.toUpperCase() };

  const DATA_TYPES = useMemo(() => {
    const base = [
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
    if (roleSlug === "engineer") return ["Design Docs", "Sprints / Tickets", "ID Document", "Timesheet / Attendance", "Performance Review"];
    if (roleSlug === "finance") return ["Invoices", "Bank / Payroll Form", "Expense Receipt", "Contract Invoices"];
    if (roleSlug === "legal") return ["Offer / Contract", "NDAs", "Compliance Certificates", "Legal Memos"];
    if (roleSlug === "safety") return ["Incident Report", "Medical / Sick Note", "Safety Certificates", "Inspection Reports"];
    return base;
  }, [roleSlug]);

  const DASH_CARDS = useMemo(() => {
    if (roleSlug === "admin") return ["System Health", "Pipeline", "Users", "Knowledge Graph", "Audit Trail", "Alerts"];
    return ["Summary", "Approvals", "Directory", "Attendance", "Tasks"];
  }, [roleSlug]);

  const [mode, setMode] = useState("home"); // home | inject | explore
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // injected files
  const [injectedData, setInjectedData] = useState(() => {
    const init = {};
    DATA_TYPES.forEach((t) => (init[t] = []));
    return init;
  });
  useEffect(() => {
    setInjectedData((s) => {
      const out = { ...s };
      DATA_TYPES.forEach((t) => {
        if (!Array.isArray(out[t])) out[t] = [];
      });
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
    const onKey = (e) => {
      if (e.key === "Escape") setModal(null);
    };
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
    for (let i = 0; i <= 20; i++) {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 160));
      setModal((m) => ({ ...(m || {}), progress: Math.round((i / 20) * 100) }));
    }
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
    if (totalUploaded === 0) {
      setToast({ text: "No files to stage" });
      return;
    }
    setToast({ text: `Staged ${totalUploaded} files — use Process Now in Admin Home to process.` });
  }, [totalUploaded]);

  /* ---------- Render ---------- */
  return (
    <div className={`dashboard-root ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="dashboard-frame">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((s) => !s)}
          onNavigate={(m) => setMode(m)}
          activeMode={mode}
          onOpenChat={openChat}
          onLogout={logout}
          orgName={user?.orgName || "DocSphere"}
        />
        <div className="dashboard-container">
          <HeaderCompact profile={profile} />

          <main className="dashboard-main">
            {mode === "home" && roleSlug === "admin" && (
              <AdminHome
                profile={profile}
                openInspect={openInspect}
                openKg={openKg}
                processNow={processNow}
                injectedSummary={{ files: totalUploaded, size: formatBytes(totalSize) }}
                processing={processing}
                openChat={openChat}
              />
            )}

            {mode === "home" && roleSlug !== "admin" && (
              <OfficerHome
                roleSlug={roleSlug}
                profile={profile}
                openChat={openChat}
                onInject={() => setMode("inject")}
                onExplore={() => setMode("explore")}
                injectedSummary={{ files: totalUploaded, size: formatBytes(totalSize) }}
              />
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
                    <div className="file-name" title={f.filename}>
                      [{type}] {f.filename}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {f.mime || "—"} • {formatBytes(f.size)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        navigator.clipboard?.writeText(f.filename);
                        setToast({ text: "Filename copied" });
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => {
                        removeInjected(type, f.id);
                        setToast({ text: "Removed from queue" });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
            {totalUploaded === 0 && <div className="muted empty">No files staged</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>
              Close
            </button>
            <button className="btn-cta" onClick={processNow} disabled={processing}>
              {processing ? "Processing…" : "Process Now"}
            </button>
          </div>
        </Modal>
      )}

      {modal && modal.type === "kg" && (
        <Modal onClose={() => setModal(null)}>
          <div className="modal-title">Knowledge Graph — Snapshot</div>
          <div className="muted">Quick overview</div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
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
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                setToast({ text: "Consistency check running (mock)" });
                await new Promise((r) => setTimeout(r, 900));
                setToast({ text: "Consistency check finished — 3 issues found" });
              }}
            >
              Run Consistency Check
            </button>
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
            <div className="muted" style={{ marginTop: 8 }}>
              {modal.progress ?? 0}%
            </div>
          </div>
        </Modal>
      )}

      {/* Full-screen Chat (ChatGPT-like) */}
      {modal && modal.type === "chat" &&
  ReactDOM.createPortal(
    <ChatFullScreen onClose={() => setModal(null)} roleSlug={roleSlug} />,
    document.body
  )
}



      {/* Toast */}
      {toast && (
        <div className="toast" role="status" onClick={() => setToast(null)}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sidebar + header compact ---------------- */
function Sidebar({ collapsed, onToggle, activeMode, onNavigate, onOpenChat, onLogout, orgName }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <div className="logo-compact">
          <div className="logo">DS</div>
          {!collapsed && (
            <div className="brand-text">
              <div className="org-name">{orgName}</div>
              <div className="org-sub">DocSphere AI</div>
            </div>
          )}
        </div>
        <button className="collapse-btn" onClick={onToggle} title="Collapse sidebar">
          {collapsed ? "➤" : "◀"}
        </button>
      </div>

      <div className="sidebar-search">
        <input placeholder="Search docs, users..." aria-label="Search" />
      </div>

      <nav className="sidebar-nav">
        <button className={`nav-item ${activeMode === "home" ? "active" : ""}`} onClick={() => onNavigate("home")} title="Home">
          🏠 {!collapsed && <span>Home</span>}
        </button>
        <button className={`nav-item ${activeMode === "inject" ? "active" : ""}`} onClick={() => onNavigate("inject")} title="Inject Data">
          ⬆️ {!collapsed && <span>Inject</span>}
        </button>
        <button className={`nav-item ${activeMode === "explore" ? "active" : ""}`} onClick={() => onNavigate("explore")} title="Explore">
          🔎 {!collapsed && <span>Explore</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="quick-btn" onClick={onOpenChat} title="Open AI Assistant">
          💬 {!collapsed && <span>AI Assist</span>}
        </button>
        <button className="quick-btn danger" onClick={onLogout} title="Logout">
          🚪 {!collapsed && <span>Logout</span>}
        </button>
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
            <div className="muted" style={{ fontSize: 12 }}>
              {profile.roleDisplay}
            </div>
          </div>
        </div>
      </div>
      <div className="header-actions muted">System overview</div>
    </div>
  );
}

/* ---------------- Admin Home (unchanged) ---------------- */
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
          <h2 className="hero-title small">
            Welcome back, <span className="accent">{profile.name}</span>
          </h2>
          <div className="muted">Overview of system health, pipeline, and critical alerts.</div>
        </div>

        <div className="admin-top-actions">
          <button className="btn-ghost" onClick={openKg}>
            View KG
          </button>
          <button className="btn-ghost" onClick={openInspect}>
            Inspect Queue
          </button>
          <button className="btn-cta" onClick={processNow} disabled={processing}>
            {processing ? "Processing…" : "Process Now"}
          </button>
          <button className="btn-primary" onClick={openChat}>
            AI Assistant
          </button>
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
              <div className="activity-row">
                <div>Alice uploaded 7 invoices</div>
                <div className="muted">2m</div>
              </div>
              <div className="activity-row">
                <div>OCR failed on scan_332.pdf</div>
                <div className="muted">12m</div>
              </div>
              <div className="activity-row">
                <div>John approved onboarding</div>
                <div className="muted">1h</div>
              </div>
            </div>
          </div>

          <div className="card-elev alerts">
            <div className="card-title">Alerts</div>
            <div className="muted">Immediate attention required</div>
            <div className="alerts-list" style={{ marginTop: 8 }}>
              {alerts.map((a) => (
                <div key={a.id} className={`alert-row ${a.level}`}>
                  <div className="alert-dot" /> <div>{a.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-elev upload-snapshot">
            <div className="card-title">Upload Snapshot</div>
            <div className="muted">Files waiting to be processed</div>
            <div className="upload-stats" style={{ marginTop: 8 }}>
              <div>
                <div className="upload-number">{injectedSummary.files}</div>
                <div className="muted">Files</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="upload-size">{injectedSummary.size}</div>
                <div className="muted">Total size</div>
              </div>
            </div>

            <div className="upload-actions" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={openInspect}>
                  Inspect
                </button>
                <button className="btn-cta" onClick={processNow} disabled={processing}>
                  {processing ? "Processing…" : "Process Now"}
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="btn-muted" onClick={() => alert("Export queue (mock)")}>
                  Export Queue
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- Officer Home (new polished officer dashboard) ---------------- */
function OfficerHome({ roleSlug, profile, openChat, onInject, onExplore, injectedSummary }) {
  // role-specific numbers (mock). Replace with real data calls as you integrate.
  const roleDefaults = {
    hr: {
      stats: [
        { label: "Open Reqs", value: 18, delta: "+2" },
        { label: "Pending Onboards", value: 6, delta: "-1" },
        { label: "Compliance Due", value: 3, delta: "+0" },
        { label: "Active Employees", value: 412, delta: "+4" },
      ],
      tasks: [
        { title: "Approve offer for candidate: Maya R.", time: "2h" },
        { title: "Verify documents for John D.", time: "4h" },
        { title: "Schedule onboarding for new hires", time: "1d" },
      ],
      tipsTitle: "HR Tips",
      tips: ["Verify ID documents before onboarding", "Flag duplicate resumes", "Use AI Assist to draft offer letters"],
    },
    finance: {
      stats: [
        { label: "Open Invoices", value: 42, delta: "-3" },
        { label: "Payments Due", value: 28, delta: "+1" },
        { label: "Expense Claims", value: 12, delta: "-2" },
        { label: "Budget Remaining", value: "$42.4k", delta: "+6%" },
      ],
      tasks: [
        { title: "Approve expense: ACME - travel", time: "3h" },
        { title: "Review vendor invoice #3321", time: "6h" },
      ],
      tipsTitle: "Finance Tips",
      tips: ["Match invoices with PO numbers", "Enable two-step approvals for >$1k"],
    },
    engineer: {
      stats: [
        { label: "Active Projects", value: 7, delta: "+1" },
        { label: "Open Tickets", value: 34, delta: "-5" },
        { label: "PRs Pending", value: 8, delta: "+2" },
        { label: "Docs Indexed", value: 1_200, delta: "+4%" },
      ],
      tasks: [
        { title: "Review design doc: search index", time: "5h" },
        { title: "Fix parsing bug in OCR pipeline", time: "1d" },
      ],
      tipsTitle: "Engineering Tips",
      tips: ["Attach tickets to docs for traceability", "Use sample inputs when testing parsers"],
    },
    safety: {
      stats: [
        { label: "Active Incidents", value: 2, delta: "—" },
        { label: "Safety Trainings", value: 14, delta: "+1" },
        { label: "Open Audits", value: 3, delta: "-1" },
        { label: "Certificates", value: 108, delta: "+2" },
      ],
      tasks: [{ title: "Investigate incident #998", time: "2h" }],
      tipsTitle: "Safety Tips",
      tips: ["Log all incidents promptly", "Attach photos and witness notes"],
    },
    legal: {
      stats: [
        { label: "Contracts Active", value: 86, delta: "+2" },
        { label: "Under Review", value: 5, delta: "-1" },
        { label: "NDAs Signed", value: 312, delta: "+6" },
        { label: "Compliance Items", value: 7, delta: "—" },
      ],
      tasks: [{ title: "Review NDA for Vendor X", time: "6h" }, { title: "Update policy: remote work", time: "2d" }],
      tipsTitle: "Legal Tips",
      tips: ["Use templates for common contracts", "Flag ambiguous clauses for counsel review"],
    },
    operations: {
      stats: [
        { label: "Depots", value: 8, delta: "—" },
        { label: "Open Shifts", value: 23, delta: "-2" },
        { label: "Assets", value: 1_024, delta: "+5" },
        { label: "Tasks", value: 46, delta: "-3" },
      ],
      tasks: [{ title: "Confirm staffing for Depot 5", time: "4h" }, { title: "Asset audit Q2", time: "3d" }],
      tipsTitle: "Operations Tips",
      tips: ["Keep asset tags updated", "Schedule preventive maintenance"],
    },
  };

  const role = roleDefaults[roleSlug] || roleDefaults["hr"];

  return (
    <section className="officer-root">
      <div className="admin-top card-elev">
        <div>
          <div className="pill">{roleSlug.toUpperCase()} Console</div>
          <h2 className="hero-title small">
            Welcome back, <span className="accent">{profile.name}</span>
          </h2>
          <div className="muted">Role-focused overview and quick actions for {roleSlug.toUpperCase()}.</div>
        </div>

        <div className="admin-top-actions">
          <button className="btn-ghost" onClick={onExplore}>
            Explore
          </button>
          <button className="btn-ghost" onClick={onInject}>
            Inject Data
          </button>
          <button className="btn-cta" onClick={() => alert("Run quick audit (mock)")}>
            Quick Audit
          </button>
          <button className="btn-primary" onClick={openChat}>
            AI Assistant
          </button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-left">
          <div className="stats-grid">
            {role.stats.map((s) => (
              <div key={s.label} className="stat-card card-elev" title={s.label}>
                <div className="stat-label muted">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-delta">{s.delta}</div>
              </div>
            ))}
          </div>

          <div className="pipeline card-elev">
            <div className="pipeline-head">
              <div className="card-title">Pending Tasks</div>
              <div className="muted">Important items requiring action</div>
            </div>

            <div className="pipeline-rows">
              {role.tasks.map((t, idx) => (
                <div className="pipeline-row" key={idx}>
                  <div className="pipeline-left">
                    <div className="pipeline-step">{t.title}</div>
                    <div className="muted">{t.time} • assigned to you</div>
                  </div>
                  <div style={{ minWidth: 120, textAlign: "right" }}>
                    <button className="btn-ghost" onClick={() => alert("Open task (mock)")}>
                      Open
                    </button>
                    <button className="btn-small" style={{ marginLeft: 8 }} onClick={() => alert("Mark done (mock)")}>
                      Done
                    </button>
                  </div>
                </div>
              ))}
              {role.tasks.length === 0 && <div className="muted">No pending tasks</div>}
            </div>
          </div>

          <div className="kg-card card-elev">
            <div className="card-title">Role Insights</div>
            <div className="muted">Quick role-specific actions and KPIs</div>

            <div className="kg-stats" style={{ marginTop: 8 }}>
              <div className="kg-item">
                <div className="kg-number">{injectedSummary.files}</div>
                <div className="muted">Files staged</div>
              </div>
              <div className="kg-item">
                <div className="kg-number">{injectedSummary.size}</div>
                <div className="muted">Staged size</div>
              </div>
              <div className="kg-item">
                <div className="kg-number">—</div>
                <div className="muted">Auto suggestions</div>
              </div>
            </div>

            <div className="kg-cta-row" style={{ marginTop: 12 }}>
              <button className="btn-ghost" onClick={() => alert("Open role explorer (mock)")}>
                Open Explorer
              </button>
              <button className="btn-primary" onClick={() => alert("Request review (mock)")}>
                Request Review
              </button>
            </div>
          </div>
        </div>

        <aside className="admin-right">
          <div className="card-elev recent-activity">
            <div className="card-title">Recent Activity</div>
            <div className="muted">Latest actions in your domain</div>
            <div className="activity-list" style={{ marginTop: 8 }}>
              <div className="activity-row">
                <div>System extracted fields for invoice_772.pdf</div>
                <div className="muted">5m</div>
              </div>
              <div className="activity-row">
                <div>New candidate profile added</div>
                <div className="muted">12m</div>
              </div>
              <div className="activity-row">
                <div>Policy update suggested by AI</div>
                <div className="muted">1h</div>
              </div>
            </div>
          </div>

          <div className="card-elev alerts">
            <div className="card-title">Role Alerts</div>
            <div className="muted">Issues requiring attention</div>
            <div className="alerts-list" style={{ marginTop: 8 }}>
              <div className="alert-row warn">
                <div className="alert-dot" /> <div>Pending compliance review (2)</div>
              </div>
              <div className="alert-row">
                <div className="alert-dot" /> <div>Low priority: incomplete profiles</div>
              </div>
            </div>
          </div>

          <div className="card-elev upload-snapshot">
            <div className="card-title">Upload Snapshot</div>
            <div className="muted">Files waiting to be processed</div>
            <div className="upload-stats" style={{ marginTop: 8 }}>
              <div>
                <div className="upload-number">{injectedSummary.files}</div>
                <div className="muted">Files</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="upload-size">{injectedSummary.size}</div>
                <div className="muted">Total size</div>
              </div>
            </div>

            <div className="upload-actions" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => alert("Inspect (mock)")}>
                  Inspect
                </button>
                <button className="btn-cta" onClick={() => alert("Request processing (mock)")}>
                  Request Processing
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="btn-muted" onClick={() => alert("Export (mock)")}>
                  Export Queue
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- Inject View (enhanced with OCR) ---------------- */
import api from "../services/api";

function InjectView({
  DATA_TYPES,
  injectedData,
  handleFileAdd,
  removeInjected,
  submitInjected,
  totalUploaded,
  totalSize,
  formatBytes,
}) {
  const [uploading, setUploading] = useState(false);
  const [ocrResponse, setOcrResponse] = useState(null);
  const [error, setError] = useState("");

  const sendToOCR = async () => {
    const files = Object.values(injectedData).flat();
    if (files.length === 0) {
      setError("No files selected");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // Upload the first file (extend later to loop all)
      const result = await api.ocr.upload(files[0].file);
      setOcrResponse(result.data);
      console.log("OCR result:", result.data);
    } catch (err) {
      setError(err.message || "OCR failed");
    } finally {
      setUploading(false);
    }
  };

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
                  <input
                    onChange={(e) => handleFileAdd(t, e.target.files)}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.csv"
                    className="hidden"
                  />
                </label>
              </div>

              <div className="file-list" role="list" aria-label={`${t} file list`}>
                {(injectedData[t] || []).length === 0 ? (
                  <div className="muted empty">No files yet</div>
                ) : (
                  (injectedData[t] || []).map((f) => (
                    <div key={f.id} className="file-row" role="listitem">
                      <div className="file-left">
                        <div className="file-name" title={f.filename}>
                          {f.filename}
                        </div>
                        <div className="file-meta muted">
                          {f.mime || "—"} • {formatBytes(f.size || 0)}
                        </div>
                      </div>
                      <div className="file-actions">
                        <button
                          onClick={() => removeInjected(t, f.id)}
                          className="btn-small btn-danger"
                          aria-label={`Remove ${f.filename}`}
                        >
                          Remove
                        </button>
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
          <div className="summary-meta muted">
            Files: <strong>{totalUploaded}</strong> — Size: <strong>{formatBytes(totalSize)}</strong>
          </div>

          <button
            onClick={submitInjected}
            className="btn-cta mt"
            disabled={totalUploaded === 0}
          >
            Stage Files
          </button>

          <button
            onClick={sendToOCR}
            className="btn-primary mt"
            disabled={totalUploaded === 0 || uploading}
          >
            {uploading ? "Processing OCR…" : "Send to OCR"}
          </button>

          {error && <div className="muted" style={{ color: "red" }}>{error}</div>}
          {ocrResponse && (
            <pre style={{ marginTop: 12, background: "#111", color: "#0f0", padding: 12 }}>
              {JSON.stringify(ocrResponse, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <aside className="help-aside card-elev">
        <h3>Help & Formats</h3>
        <div className="muted">
          Supported: PDF, JPG, PNG, DOCX, CSV. We extract key fields automatically.
        </div>
      </aside>
    </section>
  );
}


/* ---------------- Explore View (unchanged look) ---------------- */
function ExploreView({ DASH_CARDS, openChat }) {
  return (
    <section className="explore-view">
      <div className="explore-header">
        <h3>Dashboard</h3>
        <div>
          <button onClick={openChat} className="btn-primary">
            Chat with DocSphere AI
          </button>
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
function ChatFullScreen({ onClose, roleSlug }) {
  const topics = ["General", "Onboarding", "Leave Requests", "Payroll", "Documents"];
  const [activeTopic, setActiveTopic] = useState("General");
  const [messages, setMessages] = useState(() => {
    const init = {};
    topics.forEach((t) => {
      init[t] = [
        { from: "ai", text: t === "General" ? "Hello — DocSphere AI at your service." : `Welcome to ${t}` }
      ];
    });
    return init;
  });

  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  // ✅ make send async
  const send = async () => {
    const text = inputRef.current?.value;
    if (!text?.trim()) return;

    setMessages((m) => ({
      ...m,
      [activeTopic]: [...(m[activeTopic] || []), { from: "user", text }]
    }));
    inputRef.current.value = "";

    try {
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: roleSlug,   // ✅ pass roleSlug from Dashboard
          topic: activeTopic
        })
      });

      const data = await res.json();
      const reply = data.reply || "⚠ AI did not respond.";

      setMessages((m) => ({
        ...m,
        [activeTopic]: [...(m[activeTopic] || []), { from: "ai", text: reply }]
      }));
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((m) => ({
        ...m,
        [activeTopic]: [...(m[activeTopic] || []), { from: "ai", text: "⚠ Error connecting to AI backend." }]
      }));
    }
  };

  // ✅ scroll effect runs whenever messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, activeTopic]);

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
              {topics.map((t) => (
                <button
                  key={t}
                  className={`topic-btn ${t === activeTopic ? "active" : ""}`}
                  onClick={() => setActiveTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </aside>

          <section className="chat-center">
            <div className="chat-conversation" ref={chatBodyRef}>
              {(messages[activeTopic] || []).map((m, i) => (
                <div key={i} className={`chat-bubble ${m.from === "ai" ? "ai" : "user"}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="chat-compose">
              <input
                ref={inputRef}
                placeholder={`Message ${activeTopic}`}
                aria-label={`Message ${activeTopic}`}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              />
              <button className="btn-cta" onClick={send}>Send</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
