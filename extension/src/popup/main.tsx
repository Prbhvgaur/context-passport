import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { PopupApp } from './popup-app';

document.body.dataset['surface'] = 'popup';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
