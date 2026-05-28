
import "./polyfills";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Dev-only auto-login as cmd@hopehospital.com so the Director Dashboard opens
// without needing credentials on localhost. Stripped from production builds.
if (import.meta.env.DEV && !localStorage.getItem('hmis_user')) {
  localStorage.setItem('hmis_user', JSON.stringify({
    id: 'af0c7471-e43a-4fc7-8bbc-e22d778645f4',
    email: 'cmd@hopehospital.com',
    username: 'cmd',
    role: 'superadmin',
    hospitalType: 'hope',
  }));
  localStorage.setItem('hmis_visited', 'true');
}

// Error handling for production
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback rendering without StrictMode
  createRoot(rootElement).render(<App />);
}
