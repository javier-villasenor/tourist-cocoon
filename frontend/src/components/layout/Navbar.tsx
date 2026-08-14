'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, ScanLine, KeyRound, LogOut } from 'lucide-react';

const links = [
  { href: '/',                 label: 'Home',    icon: Home        },
  { href: '/reservations/new', label: 'Reservar', icon: CalendarDays },
  { href: '/checkin',          label: 'Check-in', icon: ScanLine    },
  { href: '/checkout',         label: 'Check-out', icon: LogOut      },
  { href: '/access',           label: 'Acceso',   icon: KeyRound    },
];

export default function Navbar() {
  const pathname = usePathname();

  // No mostrar la barra de navegación en login ni en pantallas de admin
  if (pathname === '/login' || pathname?.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4">
      <div className="bg-white rounded-full shadow-2xl shadow-slate-300/60 flex items-center gap-1 px-4 py-2 max-w-sm w-full justify-around border border-slate-100">
        {links.map(l => {
          const Icon = l.icon;
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                active
                  ? 'bg-[#1B2F6E] text-white'
                  : 'text-slate-400 hover:text-[#1B2F6E]'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
