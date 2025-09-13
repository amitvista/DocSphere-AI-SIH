// src/components/Header.jsx
import React, { useState, useEffect } from 'react';

const Header = ({ onOpenAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 bg-[#0d1117] border-b border-gray-800 transition-all duration-300 ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#" className="text-2xl font-bold text-white">Doc<span className="text-[#8AFF8A]">Sphere</span></a>
          <div className="flex items-center">
            <nav id="desktop-nav" className="space-x-4 text-sm font-medium text-gray-300 mr-6">
                <a href="#what-we-do" className="hover:text-white transition-colors">What We Do</a>
                {/* ... other nav links */}
            </nav>
            <button onClick={onOpenAuth} className="btn-primary font-semibold py-2 px-5 rounded-lg text-sm">
                Go to Authentication
            </button>
            <button id="hamburger-btn" onClick={() => setIsMenuOpen(true)} className="flex-col justify-center items-center space-y-1.5 ml-4 p-2">
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
                <span className="block w-6 h-0.5 bg-white"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div id="mobile-menu" className={`fixed top-0 right-0 h-full w-72 bg-[#161b22] shadow-2xl z-[60] p-6 ${isMenuOpen ? 'menu-open' : ''}`}>
        {/* ... mobile menu content ... */}
        <button onClick={() => setIsMenuOpen(false)}>Close</button>
      </div>
    </>
  );
};

export default Header;