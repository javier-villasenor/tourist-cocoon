"use client";

import React, { useState } from 'react';
import { User, Users, Lock, Mail, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  
  // Login states
  const [loginDni, setLoginDni] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register states
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [regManagerKey, setRegManagerKey] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: loginDni, password: loginPassword }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        // Guardar Info en LocalStorage
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.nombre);
        localStorage.setItem('user_dni', data.dni);
        localStorage.setItem('auth_token', data.token);

        // Redirección por rol
        if (data.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/reservations');
        }
      } else {
        const errorMessage = typeof data === 'object' ? (data.message || data.error || JSON.stringify(data)) : data;
        alert(errorMessage || "DNI o contraseña incorrectos");
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: regNombre, 
          apellidos: regApellidos, 
          dni: regDni, 
          email: regEmail, 
          password: regPassword,
          managerKey: isManager ? regManagerKey : undefined
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.nombre);
        localStorage.setItem('user_dni', data.dni);
        localStorage.setItem('auth_token', data.token);
        
        if (data.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/reservations');
        }
      } else {
        const errorMessage = typeof data === 'object' ? (data.message || data.error || JSON.stringify(data)) : data;
        alert(errorMessage || "Error al crear la cuenta");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-navy/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 transition-all duration-300 ease-in-out">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy to-sky flex items-center justify-center mb-6 shadow-xl shadow-navy/20 mx-auto">
            <span className="text-white font-black text-2xl">C</span>
          </div>
          <h1 className="text-3xl font-bold text-navy mb-2">
            {view === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="text-slate-500">
            {view === 'login' ? 'Accede a tu cuenta de Tourist Cocoon' : 'Únete a la revolución de las cápsulas'}
          </p>
        </div>

        {/* Form Card with Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl shadow-navy/5 transition-all duration-300 ease-in-out">
          
          {view === 'login' ? (
            /* ── LOGIN FORM ── */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="form-label px-1">DNI / Identificación</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="12345678X"
                    value={loginDni}
                    onChange={(e) => setLoginDni(e.target.value)}
                    className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-4 pl-12 pr-4 text-navy placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="form-label mb-0">Contraseña</label>
                  <button type="button" className="text-[10px] font-bold text-sky uppercase tracking-wider hover:text-navy transition-colors">
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-4 pl-12 pr-4 text-navy placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary py-4 disabled:opacity-70"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Acceder'}
                {!loading && <ArrowRight size={20} />}
              </button>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400">
                  ¿Aún no tienes cuenta?{" "}
                  <button 
                    type="button"
                    onClick={() => setView('register')}
                    className="text-navy font-bold hover:text-sky transition-colors underline decoration-sky/30 underline-offset-4"
                    disabled={loading}
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ── REGISTER FORM ── */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="form-label px-1">Nombre</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Juan"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="form-label px-1">Apellidos</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Users size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Pérez"
                      value={regApellidos}
                      onChange={(e) => setRegApellidos(e.target.value)}
                      className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label px-1">DNI</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <CreditCard size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="12345678X"
                    value={regDni}
                    onChange={(e) => setRegDni(e.target.value)}
                    className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label px-1">Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label px-1">Contraseña</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white/50 border border-white shadow-inner rounded-2xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky/30 focus:border-sky transition-all font-medium"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 border-t border-slate-100 pt-4">
                <input 
                  type="checkbox" 
                  checked={isManager} 
                  onChange={(e) => setIsManager(e.target.checked)}
                  className="w-4 h-4 accent-[#4ABDE8] cursor-pointer"
                  id="managerCheck"
                />
                <label htmlFor="managerCheck" className="text-sm font-bold text-slate-500 cursor-pointer">
                  Quiero registrar cuenta de Gestor (Admin)
                </label>
              </div>

              {isManager && (
                <div className="space-y-2 p-4 bg-sky/5 rounded-2xl border border-sky/20 mt-4">
                  <label className="form-label px-1 text-sky font-bold">Clave Secreta de Gestor</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky/60">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      placeholder="Identificador autorizado"
                      value={regManagerKey}
                      onChange={(e) => setRegManagerKey(e.target.value)}
                      className="w-full bg-white/70 border border-sky/30 shadow-inner rounded-xl py-3 pl-11 pr-4 text-navy text-sm placeholder:text-sky/40 focus:outline-none focus:ring-2 focus:ring-sky/50 transition-all font-medium"
                      required={isManager}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[10px] text-sky/70 mt-1">Esta clave es proporcionada internamente por la empresa.</p>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary py-4 mt-2 disabled:opacity-70"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Crear Cuenta'}
                {!loading && <ArrowRight size={20} />}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  ¿Ya tienes cuenta?{" "}
                  <button 
                    type="button"
                    onClick={() => setView('login')}
                    className="text-navy font-bold hover:text-sky transition-colors underline decoration-sky/30 underline-offset-4"
                    disabled={loading}
                  >
                    Iniciar sesión aquí
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>

        {/* Security badge */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
          <div className="w-1 h-1 rounded-full bg-navy/50" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-navy">Conexión Segura SSL</span>
          <div className="w-1 h-1 rounded-full bg-navy/50" />
        </div>
      </div>
    </div>
  );
}
