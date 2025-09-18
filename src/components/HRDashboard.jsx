// src/components/HRDashboard.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider"; // <-- make sure this path matches your AuthProvider location

// small id helper
function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}


export default function HRDashboard() {
  const { user, logout } = useAuth();

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
  const [messages, setMessages] = useState(() => ({ General: [{ from: "ai", text: "Hello — DocSphere AI at your service." }] }));
  const inputRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const handleFileAdd = useCallback((type, files) => {
    if (!files?.length) return;
    const list = Array.from(files).map((f) => ({ id: makeId(), filename: f.name, file: f, size: f.size, mime: f.type }));
    setInjectedData((s) => ({ ...s, [type]: [...s[type], ...list] }));
  }, []);

  const removeInjected = useCallback((type, id) => {
    setInjectedData((s) => ({ ...s, [type]: s[type].filter((x) => x.id !== id) }));
  }, []);

  const submitInjected = useCallback(() => {
    // Hook this up to your backend upload endpoint. For now it's a mock.
    console.log("Submitting injected data:", injectedData);
    window.alert("Injected data submitted (mock). Check console.");
  }, [injectedData]);

  const sendMessage = useCallback((topic, text) => {
    if (!text?.trim()) return;
    setMessages((m) => ({ ...m, [topic]: [...(m[topic] || []), { from: "user", text }] }));
    const t = setTimeout(() => {
      setMessages((m) => ({ ...m, [topic]: [...(m[topic] || []), { from: "ai", text: "Mock reply — good point. Suggestion: check pending onboarding tasks for this user." }] }));
    }, 500);
    timersRef.current.push(t);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071024] via-[#081127] to-[#030312] text-slate-100 antialiased overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-6 overflow-visible">
        <Header orgName={user?.orgName || "Acme Corp"} hrProfile={hrProfile} mode={mode} setMode={setMode} onLogout={logout} />

        <main className="mt-6 overflow-visible">
          {mode === "home" && (
            <>
              <Hero onInject={() => setMode("inject")} onExplore={() => setMode("explore")} hrProfile={hrProfile} />
              <HowToUse />
            </>
          )}

          {mode === "inject" && (
            <InjectView DATA_TYPES={DATA_TYPES} injectedData={injectedData} handleFileAdd={handleFileAdd} removeInjected={removeInjected} submitInjected={submitInjected} />
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
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-lg font-bold tracking-tight">{orgName}</div>
          <div className="text-xs text-slate-400">DocSphere AI</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <nav className="hidden sm:flex gap-2">
          <button onClick={() => setMode("inject")} className={`px-4 py-2 rounded-md text-sm font-semibold ${mode === "inject" ? "bg-indigo-600 text-white shadow" : "text-slate-200 hover:bg-white/5"}`}>Inject Data</button>
          <button onClick={() => setMode("explore")} className={`px-4 py-2 rounded-md text-sm font-semibold ${mode === "explore" ? "bg-indigo-600 text-white shadow" : "text-slate-200 hover:bg-white/5"}`}>Explore</button>
        </nav>

        <div className="flex items-center gap-3 bg-white/3 px-3 py-2 rounded-xl shadow-sm">
          <div className="text-right mr-2">
            <div className="text-sm font-semibold">{hrProfile.name}</div>
            <div className="text-xs text-slate-300">{hrProfile.role}</div>
          </div>
          <button onClick={onLogout} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">Logout</button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onInject, onExplore, hrProfile }) {
  return (
    <section className="mt-8 bg-gradient-to-br from-white/3 to-white/2 backdrop-blur-sm rounded-2xl p-6">
      <h1 className="text-3xl font-extrabold">Welcome back, {hrProfile.name}</h1>
      <p className="mt-2 text-slate-300">Manage employees, approvals and quickly inject documents into DocSphere AI.</p>

      <div className="mt-6 flex gap-3">
        <button onClick={onInject} className="px-5 py-3 bg-emerald-500 rounded-lg font-semibold shadow hover:scale-[1.02] transition">Inject Data</button>
        <button onClick={onExplore} className="px-5 py-3 bg-white/6 rounded-lg font-semibold hover:bg-white/8 transition">Explore Dashboard</button>
      </div>
    </section>
  );
}

function HowToUse() {
  return (
    <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white/4 p-6 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold">How HR Officers use DocSphere AI</h2>
        <p className="mt-2 text-slate-300">Quick guide with visuals and actions to get productive fast.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard title="1. Inject Documents" desc="Upload resumes, contracts, IDs, timesheets. DocSphere AI extracts key fields automatically." icon="📤" />
          <InfoCard title="2. Review & Approve" desc="See pending Leave/Onboarding requests and approve directly from the dashboard." icon="✅" />
          <InfoCard title="3. Explore People" desc="Search employees, open profiles, and track onboarding/offboarding progress." icon="🔍" />
          <InfoCard title="4. Chat with AI" desc="Ask DocSphere AI for insights, missing documents, or compliance checks." icon="🤖" />
        </div>

        <div className="mt-6 bg-white/6 p-4 rounded-lg">
          <h3 className="font-semibold">Design & UX tips</h3>
          <ul className="mt-2 text-sm text-slate-300 list-disc list-inside">
            <li>Use "Inject Data" for bulk uploads; verify parsed fields before submit.</li>
            <li>Keep the Pending Requests panel visible — approvals are high priority.</li>
            <li>Use the Chat assistant to generate offer letters or find missing documents quickly.</li>
            <li>Use Quick Actions for frequent tasks: Add Employee, Create Offer, Start Offboarding.</li>
          </ul>
        </div>
      </div>

      <aside className="bg-white/4 p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold">Getting started checklist</h3>
        <ol className="mt-3 text-sm text-slate-300 list-decimal list-inside">
          <li>Inject at least one contract & ID for a new hire.</li>
          <li>Approve any pending leave requests.</li>
          <li>Open the People Directory and confirm roles.</li>
          <li>Chat with DocSphere AI for a quick audit of missing docs.</li>
        </ol>
      </aside>
    </section>
  );
}

function InfoCard({ title, desc, icon }) {
  return (
    <div className="flex gap-4 items-start bg-gradient-to-tr from-white/5 to-white/3 p-4 rounded-xl">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-slate-300 mt-1">{desc}</div>
      </div>
    </div>
  );
}

function InjectView({ DATA_TYPES, injectedData, handleFileAdd, removeInjected, submitInjected }) {
  return (
    <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DATA_TYPES.map((t) => (
            <div key={t} className="bg-gradient-to-tr from-white/5 to-white/3 rounded-2xl p-4 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-xs text-slate-300 mt-1">Drop or upload files</div>
                </div>

                <label className="inline-flex items-center gap-2 px-3 py-2 bg-white/6 rounded-md cursor-pointer hover:bg-white/8">
                  Upload
                  <input onChange={(e) => handleFileAdd(t, e.target.files)} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx,.csv" className="hidden" />
                </label>
              </div>

              <div className="mt-3 max-h-36 overflow-auto pr-2">
                {injectedData[t].length === 0 ? (
                  <div className="text-xs text-slate-400">No files yet</div>
                ) : (
                  injectedData[t].map((f) => (
                    <div key={f.id} className="mt-2 flex items-center justify-between bg-white/6 p-2 rounded-md">
                      <div className="text-sm truncate max-w-[70%]">{f.filename}</div>
                      <button onClick={() => removeInjected(t, f.id)} className="px-2 py-1 text-sm rounded-md bg-red-600/90">Remove</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-white/4 p-4 rounded-xl">
          <div className="font-semibold">All Uploaded Files Before Submit</div>
          <div className="mt-2 max-h-40 overflow-auto space-y-2">
            {Object.entries(injectedData).flatMap(([type, arr]) => arr.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-white/6 p-2 rounded-md">
                <div className="text-sm truncate max-w-[70%]">[{type}] {f.filename}</div>
                <button onClick={() => removeInjected(type, f.id)} className="px-2 py-1 text-sm rounded-md bg-red-600/90">Remove</button>
              </div>
            )))}
          </div>
        </div>

        <button onClick={submitInjected} className="mt-4 px-4 py-2 bg-emerald-500 rounded-lg font-semibold shadow">Submit Injected</button>
      </div>

      <aside className="bg-white/4 p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold">Help & Formats</h3>
        <div className="mt-2 text-sm text-slate-300">Supported: PDF, JPG, PNG, DOCX, CSV. We extract name, emails, dates and key fields automatically.</div>
      </aside>
    </section>
  );
}

function ExploreView({ DASH_CARDS, activeCards, openChat }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">HR Dashboard</h3>
        <button onClick={openChat} className="px-4 py-2 bg-indigo-600 rounded-lg shadow">Chat with DocSphere AI</button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeCards.map((card) => (
          <div key={card} className="relative rounded-2xl p-4 bg-gradient-to-tr from-white/5 to-white/3 shadow-lg min-h-[140px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-300">{card}</div>
                <div className="mt-2 text-lg font-bold">—</div>
              </div>
              <div className="text-slate-400 text-xs">Updated just now</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChatFullPage({ topics, activeTopic, setActiveTopic, messages, sendMessage, inputRef, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900" role="dialog" aria-modal="true">
      <aside className="w-1/4 bg-slate-800 p-4 border-r border-slate-700 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="font-bold">Topics</div>
          <button onClick={onClose} className="px-2 py-1 bg-white/6 rounded-md">Back</button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {topics.map((t) => (
            <button key={t} onClick={() => setActiveTopic(t)} className={`text-left px-3 py-2 rounded-md ${activeTopic === t ? "bg-indigo-600 text-white" : "bg-white/6"}`}>{t}</button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="font-semibold">Chat — {activeTopic}</div>
          <div className="text-sm text-slate-400">DocSphere AI</div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {(messages[activeTopic] || []).map((m, i) => (
            <div key={i} className={`max-w-[80%] ${m.from === "ai" ? "self-start bg-white/6" : "self-end bg-indigo-600 text-white"} rounded-lg p-3`}>{m.text}</div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700 flex items-center gap-3">
          <input ref={inputRef} placeholder={`Ask DocSphere AI about ${activeTopic}`} className="flex-1 bg-white/6 rounded-md px-3 py-2 outline-none" />
          <button onClick={() => sendMessage(activeTopic, inputRef.current?.value)} className="px-4 py-2 bg-emerald-500 rounded-md">Send</button>
        </div>
      </div>
    </div>
  );
}
