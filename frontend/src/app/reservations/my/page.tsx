"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Key, Info, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function MyReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyReservations = async () => {
      const role = localStorage.getItem("user_role");
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
        return;
      }

      const dni = localStorage.getItem("user_dni");
      const token = localStorage.getItem("auth_token");

      if (!dni || !token) {
        toast.error("Sesión no iniciada. Por favor, identifícate.");
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/v1/reservations/all-by-dni/${dni}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Sort by start date, newest first
          setReservations(data.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        }
      } catch (error) {
        toast.error("No se ha podido conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyReservations();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDIENTE': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'CONFIRMADA': return 'text-sky bg-sky/10 border-sky/30';
      case 'CHECKIN_HECHO': return 'text-[#1B2F6E] bg-[#1B2F6E]/10 border-[#1B2F6E]/30';
      case 'COMPLETADA': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CANCELADA': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const getGoogleCalendarUrl = (res: any) => {
    const title = encodeURIComponent(`Tourist Cocoon - Cápsula ${res.capsula?.roomNumber || 'Por asignar'}`);
    const start = res.startDate.replace(/-/g, '') + 'T140000';
    const end = res.endDate.replace(/-/g, '') + 'T110000';
    const details = encodeURIComponent(`Tu reserva digital en Tourist Cocoon.\nRecuerda hacer el Check-in online antes de llegar para obtener tu PIN de acceso.`);
    const location = encodeURIComponent(`Tourist Cocoon Madrid`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      {/* Header */}
      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl shadow-navy/10"
        style={{ background: 'linear-gradient(160deg, #1B2F6E 0%, #4ABDE8 100%)' }}
      >
        <button onClick={() => router.back()} className="absolute top-6 left-5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-2xl font-bold mt-8">Mis Reservas</h1>
        <p className="text-white/70 text-sm mt-1">
          Historial completo de tus cápsulas
        </p>
      </div>

      <div className="px-4 mt-6 pb-28 flex-1 space-y-4">
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-[#4ABDE8] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="card text-center py-10 space-y-3">
            <div className="w-16 h-16 bg-sky/10 rounded-full flex items-center justify-center mx-auto">
              <CalendarDays size={32} className="text-sky/60" />
            </div>
            <p className="font-bold text-navy text-lg mt-4">Aún no hay estancias</p>
            <p className="text-slate-500 text-sm">Parece que no tienes ninguna reserva asociada a tu DNI.</p>
            <button onClick={() => router.push('/reservations/new')} className="btn-primary mt-4">
              Realizar una Reserva
            </button>
          </div>
        ) : (
          reservations.map((res) => (
            <div key={res.id} className="card relative overflow-hidden flex flex-col gap-3">
              
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 tracking-wider mb-1">CÁPSULA</p>
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-[#1B2F6E]" />
                    <span className="font-mono font-bold text-[#1B2F6E] uppercase tracking-wide">
                      {res.capsula?.roomNumber !== null && res.capsula?.roomNumber !== undefined ? `Nº ${res.capsula.roomNumber}` : 'Asignando...'}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest ${getStatusColor(res.status)}`}>
                  {res.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Entrada</p>
                  <p className="font-semibold text-navy text-sm">{res.startDate}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Salida</p>
                   <p className="font-semibold text-navy text-sm">{res.endDate}</p>
                </div>
              </div>

              {/* Si hay código de acceso y no ha sido cancelada/completada */}
              {res.accessPin && (res.status === 'CHECKIN_HECHO' || res.status === 'CONFIRMADA') && (
                <div className="mt-2 bg-[#1B2F6E] rounded-xl p-3 flex justify-between items-center shadow-lg shadow-navy/20">
                  <span className="text-sky text-xs font-bold uppercase tracking-widest">PIN de Acceso</span>
                  <span className="font-mono text-white text-lg font-black tracking-[0.2em]">{res.accessPin}</span>
                </div>
              )}

              {/* Add to Google Calendar button (only if not cancelled/completed) */}
              {(res.status === 'PENDIENTE' || res.status === 'CONFIRMADA' || res.status === 'CHECKIN_HECHO') && (
                <a
                  href={getGoogleCalendarUrl(res)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 bg-white border border-slate-200 text-slate-600 rounded-xl p-2.5 flex justify-center items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm active:scale-95 text-xs font-bold"
                >
                  <CalendarPlus size={16} className="text-[#4ABDE8]" />
                  Añadir a Google Calendar
                </a>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  );
}
