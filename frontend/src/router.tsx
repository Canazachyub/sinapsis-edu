import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Landing } from '@/pages/Landing';
import { Plataforma } from '@/pages/Plataforma';
import { Compra } from '@/pages/Compra';
import { Gracias } from '@/pages/Gracias';
import { Login } from '@/pages/Login';
import { Portal } from '@/pages/Portal';
import { Aula } from '@/pages/Aula';

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
        <Route path="/portal" element={<Portal />} />
        <Route path="/aula/:slug" element={<Aula />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
