"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Star, LogOut } from 'lucide-react';

export default function ReservationsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [hasActiveCheckIn, setHasActiveCheckIn] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
      return;
    }

    const name = localStorage.getItem('user_name');
    if (name) {
      setUserName(name);
    }

    // Check if user has active check-in
    const checkActiveReservations = async () => {
      const dni = localStorage.getItem('user_dni');
      const token = localStorage.getItem('auth_token');
      if (dni && token) {
        try {
          const res = await fetch(`/api/v1/checkout/by-dni/${dni}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setHasActiveCheckIn(data && data.length > 0);
          }
        } catch {
          // ignore
        }
      }
    };
    checkActiveReservations();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col max-w-md mx-auto relative antialiased">
      
      {/* ── HEADER / HERO ── */}
      <div
        className="relative h-72 flex flex-col justify-end p-6 overflow-hidden rounded-b-[2.5rem] shadow-2xl shadow-navy/20"
        style={{
          background: 'linear-gradient(160deg, #1B2F6E 0%, #4ABDE8 100%)',
        }}
      >
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-white/30 transition-all flex items-center gap-2 group z-50"
          title="Cerrar sesión"
        >
          <span className="text-[10px] font-bold transition-opacity whitespace-nowrap px-1 uppercase tracking-wider">Salir</span>
          <LogOut size={18} />
        </button>

        {/* Logo watermark */}
        <div className="absolute top-6 left-6 flex items-center gap-2 opacity-80">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-white font-black text-xl">C</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Tourist Cocoon</span>
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-xs mb-1 font-bold uppercase tracking-widest">Madrid, España</p>
          <h1 className="text-white text-3xl font-bold leading-tight mb-5">
            Bienvenido,<br /> 
            <span className="text-sky-200">{userName || 'Huésped'}</span>
          </h1>
          <Link href="/reservations/new">
            <button className="bg-white text-navy rounded-2xl py-3 px-6 font-bold flex items-center gap-2 hover:bg-sky-50 active:scale-95 transition-all text-sm shadow-xl shadow-navy/10">
              Nueva Reserva <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-4 pt-8 pb-32 space-y-6">

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/reservations/new', emoji: '🛏️', label: 'Reservar' },
            { href: '/checkin', emoji: '📲', label: 'Check-in' },
            { href: '/checkout', emoji: '🚪', label: 'Check-out' },
            { href: '/access', emoji: '🔑', label: 'Acceso' },
            { href: '/reservations/my', emoji: '📋', label: 'Mis Reservas' },
            ...(hasActiveCheckIn ? [
              { href: '/incidents/new', emoji: '⚠️', label: 'Incidencia' },
              { href: '/incidents/my', emoji: '📊', label: 'Mis Incidencias' }
            ] : [])
          ].map(a => (
            <Link key={a.href} href={a.href}>
              <div className="bg-white rounded-[2rem] p-4 shadow-xl shadow-navy/5 border border-white flex flex-col items-center gap-2 cursor-pointer hover:shadow-navy/10 hover:-translate-y-1 transition-all active:scale-95 group">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-sky-50 transition-colors">
                  <span className="text-2xl">{a.emoji}</span>
                </div>
                <span className="text-[11px] font-bold text-navy uppercase tracking-tighter opacity-70">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Info card */}
        <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] p-6 border border-white/60 shadow-xl shadow-navy/5 space-y-3">
          <h2 className="text-navy font-bold text-lg">Tu estancia, sin colas</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Gestiona tu reserva, check-in legal y acceso a la cápsula
            todo desde tu móvil. Sin recepción, sin esperas.
          </p>
          <div className="grid grid-cols-2 gap-y-2.5 pt-2">
            {['Check-in 100% digital', 'PIN de 6 cifras', 'Sin recepción física', 'Registro legal'].map(f => (
              <div key={f} className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-sky flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>



      </div>

      {/* Decorative background circle */}
      <div className="absolute top-[400px] -right-20 w-64 h-64 bg-sky/5 rounded-full blur-3xl -z-10" />
    </div>
  );
}
