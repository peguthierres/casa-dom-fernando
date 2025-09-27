import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { runDiagnostics } from './utils/diagnostics';

// Executar diagnóstico em produção também
if (import.meta.env.PROD) {
  runDiagnostics();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
