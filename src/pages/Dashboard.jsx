// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const departmentViews = {
  finance: { default: 'tracker', links: ['tracker', 'review'] },
  hr: { default: 'employees', links: ['employees', 'onboarding'] },
  // ... other departments
  admin: { default: 'overview', links: ['overview', 'users'] },
};

const Sidebar = ({ user, activeView, setActiveView }) => {
    const { logout } = useAuth();
    const views = departmentViews[user.department.toLowerCase()] || departmentViews.admin;

    return (
        <aside className="sidebar w-64 p-6 flex-shrink-0 flex flex-col justify-between">
            {/* Sidebar content dynamically rendered based on user prop */}
            <nav>
                {views.links.map(view => (
                    <a href="#" key={view} 
                       onClick={(e) => { e.preventDefault(); setActiveView(view); }}
                       className={`sidebar-link p-3 block rounded-lg font-semibold ${activeView === view ? 'active' : ''}`}>
                       {view.charAt(0).toUpperCase() + view.slice(1)}
                    </a>
                ))}
            </nav>
            <button onClick={logout} className="w-full text-left bg-red-600 text-white font-semibold p-3 rounded-lg">Logout</button>
        </aside>
    );
};

const DashboardContent = ({ view, department }) => {
    return (
        <main className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white capitalize">{view}</h1>
            <div className="bg-[#212428] p-6 rounded-xl mt-8">
                This is the {view} view for the {department} department.
            </div>
        </main>
    );
};


const Dashboard = () => {
  const { loggedInUser } = useAuth();
  const initialView = (departmentViews[loggedInUser.department.toLowerCase()] || departmentViews.admin).default;
  const [activeView, setActiveView] = useState(initialView);
  
  return (
    <div id="dashboard" className="flex min-h-screen w-full">
      <Sidebar user={loggedInUser} activeView={activeView} setActiveView={setActiveView} />
      <DashboardContent view={activeView} department={loggedInUser.department} />
    </div>
  );
};

export default Dashboard;