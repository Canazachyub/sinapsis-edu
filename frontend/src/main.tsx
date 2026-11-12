import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Enlaces externos tipo https://sinapsisedu.com/#plataformas (ancla sin "/"): con HashRouter no
// matchean ninguna ruta, así que se pasan a la ruta #/plataformas, que hace scroll a la sección.
if (window.location.hash === '#plataformas') {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/plataformas`);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
