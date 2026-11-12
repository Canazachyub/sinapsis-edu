import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Landing } from '@/pages/Landing';
import { Plataforma } from '@/pages/Plataforma';
import { Compra } from '@/pages/Compra';
import { Gracias } from '@/pages/Gracias';
import { Login } from '@/pages/Login';
import { Recuperar } from '@/pages/Recuperar';
import { Portal } from '@/pages/Portal';
import { Aula } from '@/pages/Aula';
import { Terminos } from '@/pages/legal/Terminos';
import { Privacidad } from '@/pages/legal/Privacidad';
import { LibroReclamaciones } from '@/pages/legal/LibroReclamaciones';

// HashRouter para que funcione en GitHub Pages sin reescritura de servidor.
export function Router() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/plataforma/:slug" element={<Plataforma />} />
        <Route path="/compra/:slug" element={<Compra />} />
        <Route path="/gracias" element={<Gracias />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/aula/:slug" element={<Aula />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/libro-de-reclamaciones" element={<LibroReclamaciones />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
