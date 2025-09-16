// src/components/AuthFlow.jsx
import React, { useState } from "react";
import "./AuthFlow.css";

/**
 * Updated AuthFlow:
 * - addOfficer stores officer object with password
 * - submitOrganization validates org + each officer (password length >= 6)
 * - requires at least one officer (changeable)
 */

export default function AuthFlow({ onAuthSuccess, onClose }) {
  const [step, setStep] = useState("choice");
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [offName, setOffName] = useState("");
  const [offEmail, setOffEmail] = useState("");
  const [offRole, setOffRole] = useState("HR");
  const [offPassword, setOffPassword] = useState("");
  const [officers, setOfficers] = useState([]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = ["HR", "Finance", "Legal", "IT", "Manager"];

  function fakeNetworkCall(payload = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (payload?.adminEmail === "fail@example.com") return reject(new Error("Server rejected admin email"));
        resolve({ ok: true, payload });
      }, 700);
    });
  }

  function resetErrors() {
    setError("");
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
      setError("Officer password must be at least 6 characters.");
      return false;
    }
    // prevent duplicate officer emails
    if (officers.some((o) => o.email.toLowerCase() === offEmail.toLowerCase())) {
      setError("An officer with this email was already added.");
      return false;
    }
    setError("");
    return true;
  }

  function addOfficer() {
    if (!validateOfficerInput()) return;

    const newOfficer = {
      id: Date.now(),
      name: offName.trim(),
      email: offEmail.trim(),
      role: offRole,
      password: offPassword, // store for submission (hashed server-side later)
    };

    setOfficers((s) => [...s, newOfficer]);

    // clear inputs
    setOffName("");
    setOffEmail("");
    setOffPassword("");
    setOffRole("HR");
    setError("");
  }

  function removeOfficer(id) {
    setOfficers((s) => s.filter((o) => o.id !== id));
  }

  async function submitOrganization() {
    // step 1: validate org fields
    if (!validateOrg()) return;

    // step 2: ensure at least one officer (optional requirement)
    if (officers.length === 0) {
      setError("Please add at least one officer before continuing.");
      return;
    }

    // step 3: validate each officer has required password length (should already be enforced on addOfficer)
    const badOfficer = officers.find((o) => !o.password || o.password.length < 6);
    if (badOfficer) {
      setError(`Officer ${badOfficer.email} has an invalid password (min 6 chars).`);
      return;
    }

    // All good — call registration endpoint (fake here)
    setLoading(true);
    setError("");
    try {
      const payload = {
        orgName: orgName.trim(),
        domain: domain.trim(),
        admin: { email: adminEmail.trim(), password: adminPassword },
        officers: officers.map(({ id, password, ...rest }) => ({ ...rest, password })), // send name,email,role,password
      };

      await fakeNetworkCall(payload);

      setLoading(false);
      // on success -> show success screen
      setStep("success");
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Registration failed. Try again.");
    }
  }

  async function submitLogin(isAdmin = true) {
    if (!loginEmail || !loginPassword) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fakeNetworkCall({ type: isAdmin ? "adminLogin" : "officerLogin", loginEmail });
      setLoading(false);
      onAuthSuccess?.({ email: loginEmail, isAdmin });
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Login failed");
    }
  }

  return (
    <div className="auth-outer">
      <div className="auth-card">
        <div className="auth-pills">
          <button
            onClick={() => { setStep("org"); resetErrors(); }}
            className={`auth-pill ${["org", "officers", "success"].includes(step) ? "active" : ""}`}
          >
            Organization Registration
          </button>
          <button
            onClick={() => { setStep("loginChoice"); resetErrors(); }}
            className={`auth-pill ${["loginChoice", "adminLogin", "officerLogin"].includes(step) ? "active" : ""}`}
          >
            Login
          </button>
        </div>

        {step === "choice" && (
          <div className="auth-choice">
            <h2>Welcome</h2>
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

            {error && <div className="auth-error">{error}</div>}

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

            <div className="auth-row">
              <select className="auth-input" value={offRole} onChange={(e) => setOffRole(e.target.value)}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="auth-input" placeholder="Password" type="password" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} />
            </div>

            <button className="auth-btn-green" onClick={addOfficer}>+ Add Officer</button>

            <div style={{ marginTop: 16 }}>
              <h3>Current Officers</h3>
              {officers.length === 0 && <div className="auth-muted">No officers yet.</div>}
              {officers.map((o) => (
                <div key={o.id} className="auth-officer-row">
                  <span>{o.name} ({o.role})</span>
                  <span>{o.email}</span>
                  <button className="auth-btn-remove" onClick={() => removeOfficer(o.id)}>Remove</button>
                </div>
              ))}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-row">
              <button className="auth-btn-outline" onClick={() => setStep("org")}>← Back</button>
              <button className="auth-btn-primary" onClick={submitOrganization} disabled={loading}>
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
          <>
            <h1 className="auth-title">Admin Login</h1>
            <input className="auth-input" placeholder="Admin Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input className="auth-input" placeholder="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-row">
              <button className="auth-btn-outline" onClick={() => setStep("loginChoice")}>← Back</button>
              <button className="auth-btn-primary" onClick={() => submitLogin(true)}>Login →</button>
            </div>
          </>
        )}

        {step === "officerLogin" && (
          <>
            <h1 className="auth-title">Officer Login</h1>
            <input className="auth-input" placeholder="Officer Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input className="auth-input" placeholder="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-row">
              <button className="auth-btn-outline" onClick={() => setStep("loginChoice")}>← Back</button>
              <button className="auth-btn-primary" onClick={() => submitLogin(false)}>Login →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
