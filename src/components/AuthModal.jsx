// src/components/AuthModal.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthModal = ({ onClose }) => {
  const [step, setStep] = useState('orgReg');
  const navigate = useNavigate();
  const { mockDatabase, setMockDatabase, setLoggedInUser, showAlert } = useAuth();
  const [tempUser, setTempUser] = useState(null);

  const handleOrgSubmit = (data) => {
    setMockDatabase({
      ...mockDatabase,
      admin: { name: 'Admin', department: 'Admin', email: data.adminEmail, password: data.adminPassword },
      domain: data.orgDomain,
      orgName: data.orgName
    });
    setStep('officerReg');
  };
  
  const handleOfficerSubmit = (officerData) => {
    if (officerData.email.split('@')[1] !== mockDatabase.domain) {
      showAlert(`Email must be in the ${mockDatabase.domain} domain.`);
      return false;
    }
    setMockDatabase(prev => ({ ...prev, officers: [...prev.officers, officerData] }));
    showAlert(`${officerData.name} added successfully`);
    return true;
  };
  
  const handleLogin = (credentials, userType) => {
    let user;
    if (userType === 'admin') {
      user = mockDatabase.admin?.email === credentials.email && mockDatabase.admin?.password === credentials.password ? mockDatabase.admin : null;
    } else {
      user = mockDatabase.officers.find(o => o.email === credentials.email && o.password === credentials.password);
    }
    if (user) {
      setTempUser(user);
      showAlert("Authentication code sent to your email.");
      setStep('mfa');
    } else {
      showAlert(`Invalid ${userType} credentials.`);
    }
  };
  
  const handleMfa = (otp) => {
    if (otp === '123456') {
      setLoggedInUser(tempUser);
      showAlert('OTP Verified! Welcome to your Dashboard.');
      onClose();
      navigate('/dashboard');
    } else {
      showAlert('Invalid OTP');
    }
  };

  const resetAndClose = () => {
    // Optional: Reset mock database on close if you want a fresh start each time
    // setMockDatabase({ admin: null, officers: [], orgName: '', domain: '' });
    onClose();
  }

  return (
    <div className="modal-visible fixed inset-0 z-[100] bg-black bg-opacity-70 items-center justify-center">
      <div className="auth-modal-content rounded-xl p-8 relative">
        {/* The main close button is now on the OrgRegStep's "Back" button */}
        
        {step === 'orgReg' && <OrgRegStep onSubmit={handleOrgSubmit} onBack={resetAndClose} />}
        {step === 'officerReg' && <OfficerRegStep onSubmit={handleOfficerSubmit} onBack={() => setStep('orgReg')} onComplete={() => setStep('regComplete')} officers={mockDatabase.officers} />}
        {step === 'regComplete' && <RegCompleteStep onNext={() => setStep('loginSelection')} />}
        {step === 'loginSelection' && <LoginSelectionStep setStep={setStep} />}
        {step === 'adminLogin' && <AdminLoginStep onSubmit={handleLogin} onBack={() => setStep('loginSelection')} />}
        {step === 'officerLogin' && <OfficerLoginStep onSubmit={handleLogin} onBack={() => setStep('loginSelection')} />}
        {step === 'mfa' && <MfaStep onSubmit={handleMfa} />}
      </div>
    </div>
  );
};

// --- Sub-Components for each step ---

const OrgRegStep = ({ onSubmit, onBack }) => {
    const [formData, setFormData] = useState({ orgName: '', orgDomain: '', adminEmail: '', adminPassword: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Organization Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-sm text-gray-400">Organization Name</label><input name="orgName" onChange={handleChange} required className="auth-input w-full p-2 mt-1 bg-[#313438] border border-[#444] rounded-lg" /></div>
                <div><label className="text-sm text-gray-400">Domain</label><input name="orgDomain" onChange={handleChange} required className="auth-input w-full p-2 mt-1 bg-[#313438] border border-[#444] rounded-lg" /></div>
                <div><label className="text-sm text-gray-400">Admin Email</label><input type="email" name="adminEmail" onChange={handleChange} required className="auth-input w-full p-2 mt-1 bg-[#313438] border border-[#444] rounded-lg" /></div>
                <div><label className="text-sm text-gray-400">Password</label><input type="password" name="adminPassword" onChange={handleChange} required className="auth-input w-full p-2 mt-1 bg-[#313438] border border-[#444] rounded-lg" /></div>
                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onBack} className="font-semibold text-gray-400">← Close</button>
                    <button type="submit" className="auth-btn-continue font-semibold text-white py-2 px-6 rounded-lg">Continue →</button>
                </div>
            </form>
        </div>
    );
}

const OfficerRegStep = ({ onSubmit, onBack, onComplete, officers }) => {
    const [formData, setFormData] = useState({ name: '', email: '', department: '', password: '' });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if(onSubmit(formData)) { 
            e.target.reset(); 
            setFormData({ name: '', email: '', department: '', password: '' }); 
        } 
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Officer Registration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Officer's Full Name" required className="w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="officer@domain.com" required className="w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                <select name="department" value={formData.department} onChange={handleChange} required className="w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]">
                    <option value="" disabled>Select Department</option>
                    <option value="Finance">Finance</option><option value="HR">HR</option><option value="Legal">Legal</option><option value="Engineering">Engineering</option><option value="Safety">Safety</option>
                </select>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">+ Add Officer</button>
            </form>
            {officers.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Current Officers</h3>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                        {officers.map(o => <div key={o.email} className='flex justify-between items-center bg-gray-700 p-2 rounded'><span className="text-sm text-white">{o.name}</span><span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">{o.department}</span></div>)}
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={onBack} className="font-semibold text-gray-400">← Back</button>
                <button type="button" onClick={onComplete} className="auth-btn-continue font-semibold text-white py-2 px-6 rounded-lg" disabled={officers.length === 0}>Finish & Login →</button>
            </div>
        </div>
    );
}

const RegCompleteStep = ({ onNext }) => (
    <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-white mb-2">Registration Completed</h2>
        <p className="text-gray-400 mb-6">Your organization and officers are registered.</p>
        <button type="button" onClick={onNext} className="w-full bg-green-600 hover:bg-green-700 font-semibold text-white py-3 rounded-lg">Go to Login →</button>
    </div>
);

const LoginSelectionStep = ({ setStep }) => (
    <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-white mb-8">Login As</h2>
        <div className="space-y-4">
            <button onClick={() => setStep('adminLogin')} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">Admin Login</button>
            <button onClick={() => setStep('officerLogin')} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg">Officer Login</button>
        </div>
    </div>
);

const AdminLoginStep = ({ onSubmit, onBack }) => {
    const [creds, setCreds] = useState({email: '', password: ''});
    const handleChange = e => setCreds({...creds, [e.target.name]: e.target.value});
    const handleSubmit = e => { e.preventDefault(); onSubmit(creds, 'admin'); };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" name="email" onChange={handleChange} placeholder="Admin Email" required className="auth-input w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                <input type="password" name="password" onChange={handleChange} placeholder="Password" required className="auth-input w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                 <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onBack} className="font-semibold text-gray-400">← Back</button>
                    <button type="submit" className="auth-btn-continue font-semibold text-white py-2 px-6 rounded-lg">Login →</button>
                </div>
            </form>
        </div>
    );
};

const OfficerLoginStep = ({ onSubmit, onBack }) => {
    const [creds, setCreds] = useState({email: '', password: ''});
    const handleChange = e => setCreds({...creds, [e.target.name]: e.target.value});
    const handleSubmit = e => { e.preventDefault(); onSubmit(creds, 'officer'); };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white text-center mb-6">Officer Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" name="email" onChange={handleChange} placeholder="Officer Email" required className="auth-input w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                <input type="password" name="password" onChange={handleChange} placeholder="Password" required className="auth-input w-full p-3 rounded-lg text-sm bg-[#313438] border border-[#444]" />
                 <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onBack} className="font-semibold text-gray-400">← Back</button>
                    <button type="submit" className="auth-btn-continue font-semibold text-white py-2 px-6 rounded-lg">Login →</button>
                </div>
            </form>
        </div>
    );
};

const MfaStep = ({ onSubmit }) => {
    const [otp, setOtp] = useState('');
    const handleSubmit = e => { e.preventDefault(); onSubmit(otp); };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white text-center mb-6">2FA Verification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP (123456)" required className="auth-input w-full p-3 rounded-lg text-sm text-center tracking-widest bg-[#313438] border border-[#444]" />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-semibold text-white py-3 rounded-lg">Verify & Continue →</button>
            </form>
        </div>
    );
};

export default AuthModal;