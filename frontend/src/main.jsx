
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ShowcaseApp from './ShowcaseApp.jsx';
import './styles/global.css';

const RootApp =
  import.meta.env.VITE_STATIC_DEMO === 'true' ? ShowcaseApp : App;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
