import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { registerSW } from 'virtual:pwa-register';
import { Analytics } from "@vercel/analytics/react"
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorHandler.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <ErrorBoundary>
      <App />
      <Analytics />
      <Toaster position='top-center' />
    </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);

// Đăng ký Service Worker cho PWA (vite-plugin-pwa)
registerSW({ immediate: true });
