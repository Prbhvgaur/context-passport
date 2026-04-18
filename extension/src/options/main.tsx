import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { OptionsApp } from './options-app';

document.body.dataset['surface'] = 'options';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
