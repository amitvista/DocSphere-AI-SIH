// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

// For brevity, the static sections are collapsed.
// In a real app, you might make each <section> its own component.
const LandingPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Header onOpenAuth={() => setIsModalOpen(true)} />
      
      <main className="pt-20">
        <section className="hero-bg relative">
          <div className="container mx-auto px-6 py-24 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
              From Document Chaos to <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-green-300 to-purple-400 bg-clip-text text-transparent">Intelligent Clarity</span>
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-400 mb-8">
              DocSphere ingests your organization's entire document flow—from PDFs to WhatsApp texts—and transforms it into structured, actionable intelligence.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary font-bold py-3 px-8 rounded-lg text-lg">
              Get Started
            </button>
          </div>
        </section>
        
        {/* All other sections (<WhatWeDo>, <HowItWorks>, etc.) go here */}
        {/* ... */}
      </main>

      <footer className="bg-black py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
            <p>&copy; 2025 DocSphere. All rights reserved.</p>
        </div>
      </footer>

      {isModalOpen && <AuthModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default LandingPage;