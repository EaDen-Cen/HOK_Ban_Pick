import './base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BroadcastRoutes from './BroadcastRoutes';
createRoot(document.getElementById('root')!).render(
  <StrictMode><BroadcastRoutes /></StrictMode>,
);
