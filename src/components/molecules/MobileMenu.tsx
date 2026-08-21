import { useState } from 'react';
import { navLinks } from '../../data/navigation';
import { Icon } from '../atoms/Icon';

/**
 * Isla React: botón hamburguesa + menú desplegable móvil.
 * El menú se posiciona absoluto bajo el header (contenedor sticky).
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-transparent text-navy min-[861px]:hidden"
      >
        <Icon name={open ? 'close' : 'menu'} className="h-5 w-5" />
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menú móvil"
          className="absolute inset-x-0 top-full flex flex-col border-b border-line bg-paper shadow-lg min-[861px]:hidden"
        >
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="border-t border-line px-5 py-3.5 text-[15px] font-medium text-ink-soft transition-colors hover:text-teal-deep"
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}
