// src/App.jsx
import React, { useEffect, useState } from "react";
import "./index.css";
import AuthFlow from "./components/AuthFlow"; // <-- make sure this file exists

const FEATURES = [
  {
    title: "Unified Document Management",
    desc:
      "Collect scattered documents from emails, WhatsApp chats, scanned papers, invoices and bills. Works across multiple languages.",
  },
  {
    title: "Intelligent Summarization",
    desc:
      "AI-powered summaries for long documents. Extracts key clauses, deadlines and action items automatically.",
  },
  {
    title: "Officer & Department Dashboards",
    desc:
      "Personalized dashboards for officers/departments and consolidated views for leaders.",
  },
  {
    title: "Knowledge Graph & AI Insights",
    desc:
      "Links related data points across documents to reveal dependencies and hidden connections.",
  },
  {
    title: "Security & Collaboration",
    desc: "Role-based access for admins, MFA, and traceable audit logs.",
  },
  {
    title: "Integrations",
    desc:
      "Connect email providers, messaging systems and cloud storage for automated ingestion.",
  },
];

const TESTIMONIALS = [
  {
    title: "Gov. Projects",
    body: "Cross-department visibility for invoices and bills made audits effortless.",
  },
  {
    title: "Finance Team",
    body: "Reduced processing time by 60% and improved traceability across teams.",
  },
  {
    title: "Legal Unit",
    body: "Automatically found key clauses and deadlines across large contract sets.",
  },
];

export default function App() {
  const [openModal, setOpenModal] = useState(false);
  const [openAuth, setOpenAuth] = useState(false); // NEW: controls full auth flow
  const [activeStep, setActiveStep] = useState(null);
  const [tIndex, setTIndex] = useState(0);

  // rotate testimonials
  useEffect(() => {
    const id = setInterval(() => setTIndex((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);

  // reveal-on-scroll
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("entered");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // callback when auth completes successfully
  function handleAuthSuccess(user) {
    console.log("Authenticated user:", user);
    // close the auth UI (you may want to redirect to dashboard here)
    setOpenAuth(false);
    // TODO: set token / update app-level auth state / redirect to dashboard
  }

  // close auth without success (passed to AuthFlow if you implement an onClose prop later)
  function handleAuthClose() {
    setOpenAuth(false);
  }

  // If auth flow is open, render it full-screen and skip landing content
  if (openAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0f1724,#0b1220)" }}>
        <AuthFlow onAuthSuccess={handleAuthSuccess} onClose={handleAuthClose} />
      </div>
    );
  }

  return (
    <div className="page">
      {/* NAV */}
      <header className="nav">
        <div className="nav-left">
          <div className="logo">DS</div>
          <div>
            <div className="brand-title">DocSphere</div>
            <div className="brand-sub">Document Intelligence</div>
          </div>
        </div>

        <nav className="nav-right">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#tech">Tech</a>

          {/* Green authentication button (explicit selector in CSS ensures green color) */}
          <button
            className="btn-auth"
            onClick={() => {
              // open auth flow (replaces landing with AuthFlow)
              setOpenAuth(true);
            }}
          >
            Go to Authentication
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left reveal">
          <div className="pill">AI · Search · Knowledge Graphs · Secure</div>

          <h1 className="hero-title">
            Transform the way your organization <br /> manages documents.
          </h1>

          <p className="hero-lead">
            A unified platform to bring scattered documents, chats, emails, and invoices into one
            intelligent dashboard. Upload or connect sources — DocSphere organizes, summarizes and
            surfaces actionable insights.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                // open auth flow (Get Started)
                setOpenAuth(true);
              }}
            >
              Get Started
            </button>
            <button
              className="btn btn-outline"
              onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            >
              How it works
            </button>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="kpi-value">60%</div>
              <div className="kpi-label">Avg. processing reduction</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">Multilingual</div>
              <div className="kpi-label">Supports many languages</div>
            </div>
            <div className="kpi">
              <div className="kpi-value">Role-based</div>
              <div className="kpi-label">Admins & Officers</div>
            </div>
          </div>
        </div>

        <div className="hero-right reveal">
          {/* CONFIDENT, BEAUTIFUL DASHBOARD MOCK - non overflowing */}
          <div className="mock-dashboard" role="img" aria-label="Dashboard preview">
            <div className="dash-header">
              <h4>Connected Sources</h4>
              <p className="muted">Emails · WhatsApp · Scans · Bills</p>
            </div>

            <div className="dash-stats" aria-hidden>
              <div className="stat gradient">
                <div className="num">37%</div>
                <div className="label">avg processing</div>
              </div>
              <div className="stat">
                <div className="num">135</div>
                <div className="label">documents</div>
              </div>
              <div className="stat">
                <div className="num">21</div>
                <div className="label">unresolved</div>
              </div>
            </div>

            <div className="dash-table" role="region" aria-label="Latest documents preview">
              <div className="row head">
                <span>Type</span>
                <span>Summary</span>
                <span>Officer</span>
                <span>Date</span>
              </div>

              <div className="row">
                <span className="tag invo">Invoice</span>
                <span className="cell">Received from vendor — payment pending</span>
                <span className="cell">Stella F</span>
                <span className="cell">5/6/24</span>
              </div>

              <div className="row">
                <span className="tag contr">Contract</span>
                <span className="cell">Lease renewal due — check clause</span>
                <span className="cell">Courtney R</span>
                <span className="cell">5/4/24</span>
              </div>

              <div className="row">
                <span className="tag bill">Bill</span>
                <span className="cell">Network outage report — follow-up</span>
                <span className="cell">Jose H</span>
                <span className="cell">5/4/24</span>
              </div>
            </div>

            <div className="dash-panels">
              <div className="panel">
                <h5>Summaries</h5>
                <ul>
                  <li>
                    <b>Clause:</b> Force majeure <span className="muted">6/20/24</span>
                  </li>
                  <li>
                    <b>Obligation:</b> Payment terms <span className="muted">5/10/24</span>
                  </li>
                  <li>
                    <b>Date:</b> Licence expires <span className="muted">10/28/24</span>
                  </li>
                </ul>
              </div>

              <div className="panel">
                <h5>Knowledge Graph</h5>
                <div className="tags">
                  <span>invoices</span>
                  <span>outages</span>
                  <span>leases</span>
                  <span>reviews</span>
                </div>
              </div>
            </div>
          </div>

          <div className="small-controls" aria-hidden>
            <button className="btn-mini">Summaries</button>
            <button className="btn-mini">KG Links</button>
            <button className="btn-mini">Role Views</button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section reveal">
        <h2 className="section-title">Key features</h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <article key={i} className="feature-card">
              <h3>{f.title}</h3>
              <p className="muted">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="section reveal">
        <h2 className="section-title">How it works</h2>
        <div className="how-grid">
          <div className={`how-step ${activeStep === 1 ? "open" : ""}`}>
            <button onClick={() => setActiveStep(activeStep === 1 ? null : 1)} className="how-btn">
              Step 1 — Upload / Connect sources
            </button>
            {activeStep === 1 && <p className="muted">Email, WhatsApp, scanned docs, invoices and bills are ingested automatically.</p>}
          </div>

          <div className={`how-step ${activeStep === 2 ? "open" : ""}`}>
            <button onClick={() => setActiveStep(activeStep === 2 ? null : 2)} className="how-btn">
              Step 2 — AI organizes & summarizes
            </button>
            {activeStep === 2 && <p className="muted">OCR, entity extraction, clause detection and summary generation.</p>}
          </div>

          <div className={`how-step ${activeStep === 3 ? "open" : ""}`}>
            <button onClick={() => setActiveStep(activeStep === 3 ? null : 3)} className="how-btn">
              Step 3 — Officers access dashboards
            </button>
            {activeStep === 3 && <p className="muted">Personalized officer/department dashboards with action items and timelines.</p>}
          </div>

          <div className={`how-step ${activeStep === 4 ? "open" : ""}`}>
            <button onClick={() => setActiveStep(activeStep === 4 ? null : 4)} className="how-btn">
              Step 4 — Leadership views consolidated insights
            </button>
            {activeStep === 4 && <p className="muted">Real-time reports, KPIs and traceable audit logs.</p>}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS & TECH */}
      <section className="section reveal">
        <div className="split">
          <div className="testimonials">
            <h2 className="section-title">Testimonials & Use Cases</h2>
            <div className="testimonial-card">
              <h4>{TESTIMONIALS[tIndex].title}</h4>
              <p className="muted">{TESTIMONIALS[tIndex].body}</p>
              <div className="dots">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} className={`dot ${i === tIndex ? "active" : ""}`} onClick={() => setTIndex(i)} />
                ))}
              </div>
            </div>
          </div>

          <div id="tech" className="tech">
            <h2 className="section-title">Technology stack</h2>
            <div className="tech-grid">
              <div className="tech-card">
                <h4>AI / ML</h4>
                <p className="muted">NLP models, OCR pipelines, custom extractors</p>
              </div>
              <div className="tech-card">
                <h4>Data</h4>
                <p className="muted">Vector DBs, Knowledge Graph, RDB for metadata</p>
              </div>
              <div className="tech-card">
                <h4>Security</h4>
                <p className="muted">Role-based auth, MFA, encryption</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAR */}
      <section className="cta reveal">
        <div className="cta-inner">
          <div>
            <h3>Bring intelligence to your documents today.</h3>
            <p className="muted">Sign in and connect your sources to begin.</p>
          </div>

          <div>
            <button
              className="btn btn-primary"
              onClick={() => {
                // open auth flow
                setOpenAuth(true);
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div>© {new Date().getFullYear()} DocSphere</div>
        <div className="foot-links">
          <a href="#docs">Docs</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>

      {/* MODAL (Invite) */}
      {openModal && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-panel reveal">
            <button className="modal-close" onClick={() => setOpenModal(false)}>
              ×
            </button>
            <h3>Request access</h3>
            <p className="muted">Enter your work email and we'll send a quick setup link.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Invite requested (stub).");
                setOpenModal(false);
              }}
            >
              <input name="email" type="email" required placeholder="you@company.org" />
              <div className="modal-actions">
                <button className="btn btn-primary">Request invite</button>
                <button type="button" className="btn btn-outline" onClick={() => setOpenModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}