import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AboutProject from './components/AboutProject';
import DonationPage from './components/DonationPage';
import ThankYouPage from './components/ThankYouPage';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projeto" element={<AboutProject />} />
          <Route path="/doacao" element={<DonationPage />} />
          <Route path="/obrigado" element={<ThankYouPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* Catch all route for 404 */}
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-800 mb-4">Página não encontrada</h1><p className="text-gray-600 mb-6">A página que você está procurando não existe.</p><a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">Voltar ao Início</a></div></div>} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;