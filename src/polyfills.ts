// Polyfills for production build
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Ensure React is available globally for debugging
import React from 'react';
import ReactDOM from 'react-dom/client';

if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOM;
}
