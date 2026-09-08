import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import '@codegouvfr/react-dsfr/dsfr/dsfr.min.css';
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.min.css';
import './index.css';
import App from './App';

startReactDsfr({ defaultColorScheme: 'system', Link });

declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
