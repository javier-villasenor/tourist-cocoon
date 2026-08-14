"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, DoorOpen, CalendarDays, KeyRound, Loader2, Info, LogOut } from "lucide-react";
import toast from "react-hot-toast";

interface ActiveGuest {
  dni: string;
  firstName: string;
  lastName: string;
  reservationId: string;
  roomNumber: number | null;
  startDate: string;
  endDate: string;
  status: string;
}

export default function AdminGuestsPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<ActiveGuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");

    if (!token || role !== "ADMIN") {
      router.push("/login");
      return;
    }

    fetchGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchGuests = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/active-guests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGuests(data);
      } else {
        toast.error("No se pudo cargar la lista de huéspedes");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleForceCheckOut = async (reservationId: string, dni: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/checkout/${reservationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ guestDni: dni }),
      });
      if (res.ok) {
        toast.success("Check-out forzado correctamente.");
        fetchGuests();
      } else {
        toast.error(await res.text());
      }
    } catch {
      toast.error("Error de conexión al forzar check-out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2F6E] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans max-w-4xl mx-auto md:p-6 p-0">
      
      {/* ── HEADER ── */}
      <div className="bg-[#1B2F6E] md:rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl mix-blend-screen" />
        
        <button onClick={() => router.back()} className="text-white/60 hover:text-white transition-colors self-start relative z-10 flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>

        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h1 className="text-white text-3xl font-black">Huéspedes Activos</h1>
            <p className="text-emerald-300 font-bold tracking-widest text-xs uppercase mt-1">Control de Alojamientos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20 text-white font-bold">
             {guests.length} en total
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 md:p-0 mt-6 flex flex-col gap-4 pb-28">
        
        {guests.length === 0 ? (
           <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center gap-4 border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
               <Info size={32} />
             </div>
             <p className="text-slate-500 font-medium">El hotel está vacío en este momento.</p>
           </div>
        ) : (
          guests.map((guest, index) => (
            <div 
              key={guest.reservationId || index} 
              onClick={() => router.push(`/admin/guests/${guest.dni}`)}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 md:items-center hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
            >
              
              {/* User Info Block */}
              <div className="flex items-center gap-4 flex-1">
                 <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
                   <User size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-800 text-lg">{guest.firstName} {guest.lastName}</h3>
                   <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mt-1">
                     <KeyRound size={12} /> ID: {guest.reservationId.split('-')[0]}...
                   </div>
                 </div>
              </div>

              {/* Data Blocks */}
              <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 flex-1">
                
                <div className="bg-slate-50 rounded-2xl p-3 flex flex-col gap-1 w-full border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><DoorOpen size={12}/> Cápsula</span>
                  <span className="font-black text-slate-700 text-lg">{guest.roomNumber !== null && guest.roomNumber !== undefined ? guest.roomNumber : 'Asignando...'}</span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 flex flex-col gap-1 w-full border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><CalendarDays size={12}/> Periodo</span>
                  <span className="font-bold text-slate-700 text-sm">{guest.startDate.substring(8, 10)}-{guest.startDate.substring(5, 7)} al {guest.endDate.substring(8, 10)}-{guest.endDate.substring(5, 7)}</span>
                </div>

              </div>

              {/* Status Badge & Actions */}
              <div className="mt-2 md:mt-0 flex flex-col items-end justify-center gap-2">
                 <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                   guest.status === 'CHECKIN_HECHO' 
                     ? 'bg-emerald-100 text-emerald-700' 
                     : 'bg-orange-100 text-orange-700'
                 }`}>
                   {guest.status === 'CHECKIN_HECHO' ? 'In-House' : 'Pendiente (Hoy)'}
                 </span>
                 
                 {guest.status === 'CHECKIN_HECHO' && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if (confirm(`¿Estás seguro de que quieres forzar el check-out de ${guest.firstName} ${guest.lastName}? Esta acción es irreversible.`)) {
                         handleForceCheckOut(guest.reservationId, guest.dni);
                       }
                     }}
                     className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                   >
                     <LogOut size={12} strokeWidth={2.5} /> Check-Out
                   </button>
                 )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
