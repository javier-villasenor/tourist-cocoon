"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Leemos las credenciales
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      // Si hay sesión Iniciada, miramos su rol
      const role = localStorage.getItem('user_role');
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/reservations');
      }
    } else {
      // Si no existe, al login
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1B2F6E] to-[#4ABDE8] flex items-center justify-center animate-pulse shadow-2xl shadow-[#1B2F6E]/20">
        <span className="text-white font-black text-3xl">C</span>
      </div>
    </div>
  );
}
