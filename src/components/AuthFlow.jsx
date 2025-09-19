// src/components/AuthFlow.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { authService } from "../services/api";
import "./AuthFlow.css";

/**
 * AuthFlow - full file (updated)
 * - saves authenticated user to AuthProvider (login)
 * - redirects HR users to /hr using useNavigate
 */

export default function AuthFlow({ onAuthSuccess, onClose }) {
  const [step, setStep] = useState("choice");

  // Organization
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Officer creation
  const OFFICER_TYPES = [
    "HR officer",
    "Finance officer",
    "Engineering officer",
    "Safety & Compliance Officer",
    "Legal officer",
    "Operations Officer (Station/Depot)",
  ];
  const [offName, setOffName] = useState("");
  const [offEmail, setOffEmail] = useState("");
  const [offRole, setOffRole] = useState(OFFICER_TYPES[0]);
  const [offPassword, setOffPassword] = useState("");
  const [officers, setOfficers] = useState([]);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dev_officers");
      if (raw) setOfficers(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dev_officers", JSON.stringify(officers));
    } catch (e) {
      // ignore
    }
  }, [officers]);

  function resetErrors() {
    setError("");
  }

  function fakeNetworkCall(payload = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (payload?.adminEmail === "fail@example.com") return reject(new Error("Server rejected admin email"));
        resolve({ ok: true, payload });
      }, 650);
    });
  }

  function validateOrg() {
    if (!orgName.trim() || !domain.trim() || !adminEmail.trim() || !adminPassword) {
      setError("Please fill all organization fields.");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) {
      setError("Enter a valid admin email.");
      return false;
    }
    if (adminPassword.length < 6) {
      setError("Admin password must be at least 6 characters.");
      return false;
    }
    setError("");
    return true;
  }

  function validateOfficerInput() {
    if (!offName.trim() || !offEmail.trim() || !offPassword) {
      setError("Please fill all officer fields.");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(offEmail)) {
      setError("Enter a valid officer email.");
      return false;
    }
    if (offPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (officers.some((o) => o.email.toLowerCase() === offEmail.toLowerCase())) {
      setError("An officer with this email is already added.");
      return false;
    }
    setError("");
    return true;
  }

  function addOfficer() {
    if (!validateOfficerInput()) return;

    const newOfficer = {
      id: String(Date.now()),
      name: offName.trim(),
      email: offEmail.trim(),
      role: offRole,
      password: offPassword,
    };

    setOfficers((s) => [...s, newOfficer]);
    setOffName("");
    setOffEmail("");
    setOffPassword("");
    setOffRole(OFFICER_TYPES[0]);
    setError("");
  }

  function removeOfficer(id) {
    setOfficers((s) => s.filter((o) => o.id !== id));
    if (selectedOfficerId === id) {
      setSelectedOfficerId("");
      setLoginEmail("");
    }
  }

  async function submitOrganization() {
    if (!validateOrg()) return;
    setLoading(true);
    setError("");

    try {
      // Call the registration API
      const registrationData = {
        organization: orgName,
        domain,
        email: adminEmail,
        password: adminPassword,
        name: "Admin User", // You might want to add a name field to your form
        role: "admin",
      };

      const response = await authService.register(registrationData);

      if (response.success) {
        // Auto-login the user after registration
        const loginResult = await login({
          email: adminEmail,
          password: adminPassword,
        });

        if (loginResult.success) {
          // Move to officers step
          setStep("officers");
        } else {
          setError("Registration successful but login failed. Please try logging in.");
        }
      } else {
        setError(response.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error?.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call the login API
      const credentials = {
        email: loginEmail,
        password: loginPassword,
      };

      const result = await login(credentials);

      if (result.success) {
        // Redirect based on user role
        const redirectPath = result.user.role === "hr" ? "/hr" : "/";
        navigate(redirectPath);

        // Call the success callback if provided
        if (onAuthSuccess) onAuthSuccess();
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error?.message || "An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Sync selected officer -> loginEmail
  useEffect(() => {
    if (!selectedOfficerId) return;
    const found = officers.find((o) => o.id === selectedOfficerId);
    if (found) setLoginEmail(found.email);
  }, [selectedOfficerId, officers]);

  // Clear selection if officer removed
  useEffect(() => {
    if (!selectedOfficerId) return;
    const stillExists = officers.some((o) => o.id === selectedOfficerId);
    if (!stillExists) {
      setSelectedOfficerId("");
      setLoginEmail("");
    }
  }, [officers, selectedOfficerId]);

  function handleOfficerSelect(id) {
    setSelectedOfficerId(id);
    if (!id) {
      setLoginEmail("");
      return;
    }
    const o = officers.find((x) => x.id === id);
    if (o) setLoginEmail(o.email);
  }

  return (
    <div className="auth-outer" role="dialog" aria-modal="true" aria-labelledby="auth-main-title">
      <div className="auth-card">
        <div className="auth-pills" role="tablist" aria-label="Authentication steps">
          <button
            className={`auth-pill ${["org", "officers", "success"].includes(step) ? "active" : ""}`}
            onClick={() => { setStep("org"); resetErrors(); }}
            role="tab"
            aria-selected={["org", "officers", "success"].includes(step)}
          >
            Organization Registration
          </button>

          <button
            className={`auth-pill ${["loginChoice", "adminLogin", "officerLogin"].includes(step) ? "active" : ""}`}
            onClick={() => { setStep("loginChoice"); resetErrors(); }}
            role="tab"
            aria-selected={["loginChoice", "adminLogin", "officerLogin"].includes(step)}
          >
            Login
          </button>
        </div>

        {step === "choice" && (
          <div className="auth-choice">
            <h2 id="auth-main-title">Welcome</h2>
            <p>Get started by registering your organization or logging in.</p>
            <div className="auth-choice-buttons">
              <button className="auth-btn-primary" onClick={() => setStep("org")}>Get Started →</button>
              <button className="auth-btn-outline" onClick={() => setStep("loginChoice")}>Go to Authentication</button>
            </div>
          </div>
        )}

        {step === "org" && (
          <>
            <h1 className="auth-title">Organization Registration</h1>
            <label className="auth-label">Organization Name</label>
            <input className="auth-input" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Corp" />
            <label className="auth-label">Domain</label>
            <input className="auth-input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" />
            <label className="auth-label">Admin Email</label>
            <input className="auth-input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@company.com" />
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min 6 characters" />

            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="auth-row">
              <button className="auth-btn-outline" onClick={() => setStep("choice")}>← Back</button>
              <button className="auth-btn-green" onClick={() => setStep("officers")}>Next: Officers →</button>
            </div>
          </>
        )}

        {step === "officers" && (
          <>
            <h1 className="auth-title">Officer Registration</h1>

            <input className="auth-input" placeholder="Name" value={offName} onChange={(e) => setOffName(e.target.value)} />
            <input className="auth-input" placeholder="Email" value={offEmail} onChange={(e) => setOffEmail(e.target.value)} />

            <div className="auth-row split">
              <select className="auth-input auth-select" value={offRole} onChange={(e) => setOffRole(e.target.value)}>
                {OFFICER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="auth-input" placeholder="Password" type="password" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="auth-btn-green add-officer" onClick={addOfficer}>+ Add Officer</button>
            </div>

            <div style={{ marginTop: 16 }}>
              <h3>Current Officers</h3>
              {officers.length === 0 && <div className="auth-muted">No officers yet.</div>}

              {officers.map((o) => (
                <div key={o.id} className="auth-officer-row">
                  <div className="officer-meta">
                    <div className="officer-name">{o.name}</div>
                    <div className="officer-role">{o.role}</div>
                  </div>

                  <div className="officer-email">{o.email}</div>

                  <div className="officer-actions">
                    <button className="auth-btn-remove" onClick={() => removeOfficer(o.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="auth-row">
              <button 
                type="button"
                className="auth-btn-outline" 
                onClick={() => setStep("org")}
                disabled={loading}
              >
                ← Back
              </button>
              <button 
                type="button"
                className="auth-btn-primary" 
                onClick={submitOrganization} 
                disabled={loading}
              >
                {loading ? "Registering..." : "Done →"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="auth-choice">
            <h2>Registration Completed!</h2>
            <p>Your organization and officers are now registered.</p>
            <div className="auth-choice-buttons">
              <button className="auth-btn-green" onClick={() => setStep("loginChoice")}>Go to Login →</button>
              <button className="auth-btn-outline" onClick={() => onClose?.()}>Close</button>
            </div>
          </div>
        )}

        {step === "loginChoice" && (
          <div className="auth-choice">
            <h2>Choose Login Type</h2>
            <div className="auth-choice-buttons">
              <button className="auth-btn-outline" onClick={() => setStep("adminLogin")}>Admin Login</button>
              <button className="auth-btn-outline" onClick={() => setStep("officerLogin")}>Officer Login</button>
            </div>
          </div>
        )}

        {step === "adminLogin" && (
          <form onSubmit={handleLogin}>
            <h1 className="auth-title">Admin Login</h1>
            <input 
              className="auth-input" 
              placeholder="Admin Email" 
              type="email"
              value={loginEmail} 
              onChange={(e) => setLoginEmail(e.target.value)} 
              required
            />
            <input 
              className="auth-input" 
              placeholder="Password" 
              type="password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="auth-row">
              <button 
                type="button" 
                className="auth-btn-outline" 
                onClick={() => setStep("loginChoice")}
              >
                ← Back
              </button>
              <button 
                type="submit" 
                className="auth-btn-primary" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login →"}
              </button>
            </div>
          </form>
        )}

        {step === "officerLogin" && (
          <form onSubmit={handleLogin}>
            <h1 className="auth-title">Officer Login</h1>

            <div className="custom-select-wrapper">
              <label className="auth-label">Choose Officer</label>

              {officers.length === 0 ? (
                <div className="auth-muted" style={{ marginBottom: 8 }}>
                  No officers found — type officer email below to login manually or add officers first.
                </div>
              ) : (
                <OfficerDropdown
                  items={officers}
                  value={selectedOfficerId}
                  onChange={(id) => handleOfficerSelect(id)}
                  placeholder="-- Select Officer --"
                />
              )}
            </div>

            <input
              className="auth-input"
              placeholder="Officer Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              readOnly={Boolean(selectedOfficerId)}
              required
            />

            <input
              className="auth-input"
              placeholder="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />

            {error && <div className="auth-error" role="alert">{error}</div>}

            <div className="auth-row">
              <button 
                type="button"
                className="auth-btn-outline" 
                onClick={() => setStep("loginChoice")}
              >
                ← Back
              </button>
              <button 
                type="submit" 
                className="auth-btn-primary" 
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------- OfficerDropdown (unchanged) ------------------------- */
function OfficerDropdown({ items = [], value = "", onChange = () => {}, placeholder = "-- Select --" }) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  function computeMenuPosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8;
    const left = rect.left + window.scrollX;
    const width = rect.width;
    setMenuStyle({ top, left, width });
  }

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    }
    function onScrollOrResize() {
      if (open) computeMenuPosition();
    }
    document.addEventListener("click", onDocClick);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      computeMenuPosition();
      setFocusedIndex(items.length ? 0 : -1);
    } else {
      setFocusedIndex(-1);
    }
  }, [open, items.length]);

  const selected = items.find((i) => i.id === value);

  function toggle() {
    if (items.length === 0) return;
    setOpen((s) => !s);
  }

  function onSelect(id) {
    onChange(id);
    setOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (focusedIndex >= 0 && items[focusedIndex]) onSelect(items[focusedIndex].id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
      scrollFocusedIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
      scrollFocusedIntoView();
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    }
  }

  function scrollFocusedIntoView() {
    setTimeout(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const focused = menu.querySelectorAll('.custom-item')[focusedIndex];
      if (focused) focused.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  const menu = open ? ReactDOM.createPortal(
    <div
      ref={menuRef}
      className={`custom-menu open`}
      style={{
        position: 'absolute',
        top: menuStyle.top + 'px',
        left: menuStyle.left + 'px',
        width: menuStyle.width + 'px',
        zIndex: 2147483647
      }}
      role="listbox"
    >
      {items.length === 0 && <div className="custom-empty">No officers available</div>}
      {items.map((it, idx) => (
        <div
          key={it.id}
          role="option"
          aria-selected={it.id === value}
          className={`custom-item ${it.id === value ? 'selected' : ''} ${focusedIndex === idx ? 'focused' : ''}`}
          onClick={() => onSelect(it.id)}
          onMouseEnter={() => setFocusedIndex(idx)}
          tabIndex={-1}
        >
          <div className="item-left">
            <div className="item-name">{it.name}</div>
            <div className="item-role">{it.role}</div>
          </div>
          <div className="item-email">{it.email}</div>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className="custom-select" ref={wrapperRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`custom-select-trigger ${items.length === 0 ? 'disabled' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-disabled={items.length === 0}
        onKeyDown={onKeyDown}
      >
        <span className="custom-selected-text">{selected ? `${selected.name} — ${selected.role}` : placeholder}</span>
        <span className={`custom-arrow ${open ? "open" : ""}`} aria-hidden />
      </button>

      {menu}
    </div>
  );
}
