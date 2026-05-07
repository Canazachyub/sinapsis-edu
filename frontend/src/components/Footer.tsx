export function Footer() {
  return (
    <footer className="bg-jungle text-cream">
      <div className="container-x py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl text-lime">PORTAL CENTRAL</div>
          <p className="mt-2 text-sm opacity-80 max-w-xs">
            La central de evaluación médica. Acceso a las mejores plataformas en un solo lugar.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-3">Plataformas</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li>ENAM</li>
            <li>ENCIB</li>
            <li>ENCAPS</li>
            <li>Residentado Médico</li>
            <li>EsSalud</li>
            <li>Biblioteca Médica</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contacto</div>
          <p className="text-sm opacity-80">WhatsApp: +51 984 300 510</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-4 text-xs opacity-60 flex justify-between">
          <span>© {new Date().getFullYear()} Portal Central</span>
          <span>Hecho con ☕ en Lima</span>
        </div>
      </div>
    </footer>
  );
}
