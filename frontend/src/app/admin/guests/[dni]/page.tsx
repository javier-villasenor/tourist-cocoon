"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Save, Calendar, CheckCircle2, History, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Reservation {
  id: string;
  roomNumber: number | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface GuestProfile {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  reservations: Reservation[];
}

export default function GuestProfilePage({ params }: { params: { dni: string } }) {
  const router = useRouter();
  const { dni } = params;
  
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");

    if (!token || role !== "ADMIN") {
      router.push("/login");
      return;
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni, router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/admin/guests/${dni}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
      } else {
        toast.error("No se pudo cargar el perfil del huésped.");
        router.push("/admin/guests");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/admin/guests/${dni}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ firstName, lastName, email })
      });
      
      if (res.ok) {
        toast.success("Datos guardados correctamente");
        fetchProfile(); // Refresh
      } else {
        toast.error("Error al guardar los datos");
      }
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2F6E] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  if (!profile) return null;

  // Sorting reservations: newest first
  const sortedReservations = [...profile.reservations].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="min-h-screen bg-transparent font-sans max-w-5xl mx-auto md:p-6 p-0">
      
      {/* ── HEADER ── */}
      <div className="bg-[#1B2F6E] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] mix-blend-screen" />
        
        <button onClick={() => router.back()} className="text-white/60 hover:text-white transition-colors self-start relative z-10 flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={18} /> Volver a Huéspedes
        </button>

        <div className="relative z-10 flex items-center gap-6 mt-4">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 text-white shadow-inner">
            <User size={48} />
          </div>
          <div>
            <h1 className="text-white text-4xl font-black">{profile.firstName} {profile.lastName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                DNI: {profile.dni}
              </span>
              <span className="text-white/60 text-sm font-medium flex items-center gap-1.5">
                <Mail size={14} /> {profile.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-0 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 pb-28">
        
        {/* ── COLUMNA IZQUIERDA: EDICIÓN DE DATOS ── */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <User className="text-emerald-500" size={20}/> Editar Perfil
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">DNI / Pasaporte (Solo lectura)</label>
                <input 
                  type="text" 
                  value={profile.dni} 
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Nombre</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Apellidos</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 mt-2">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Modificar estos datos afectará a futuras facturas y notificaciones.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="mt-4 w-full bg-[#1B2F6E] hover:bg-[#12204b] text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: HISTORIAL DE RESERVAS ── */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="text-[#1B2F6E]" size={20}/> Historial de Reservas
              </h2>
              <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-sm">
                {sortedReservations.length} {sortedReservations.length === 1 ? 'Reserva' : 'Reservas'}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {sortedReservations.map((res) => {
                
                // Determinar el diseño según el estado
                let statusColor = "bg-slate-100 text-slate-600";
                let borderColor = "border-slate-100";
                
                if (res.status === 'PENDIENTE') {
                  statusColor = "bg-orange-100 text-orange-700";
                  borderColor = "border-orange-100";
                } else if (res.status === 'CHECKIN_HECHO') {
                  statusColor = "bg-emerald-100 text-emerald-700";
                  borderColor = "border-emerald-200";
                } else if (res.status === 'COMPLETADA') {
                  statusColor = "bg-blue-50 text-blue-600";
                  borderColor = "border-blue-100";
                } else if (res.status === 'CANCELADA') {
                  statusColor = "bg-red-50 text-red-600";
                  borderColor = "border-red-100";
                }

                return (
                  <div key={res.id} className={`p-5 rounded-2xl border ${borderColor} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md`}>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColor.split(' ')[0]} ${statusColor.split(' ')[1]}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-slate-400 mb-0.5">ID: {res.id.split('-')[0]}</div>
                        <div className="font-bold text-slate-800">
                          {res.startDate.substring(8, 10)}-{res.startDate.substring(5, 7)} <span className="text-slate-300 font-normal mx-1">➜</span> {res.endDate.substring(8, 10)}-{res.endDate.substring(5, 7)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-none">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cápsula</span>
                        <span className="font-black text-slate-700">{res.roomNumber !== null ? res.roomNumber : 'N/A'}</span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                      <div className="flex flex-col items-end flex-1">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${statusColor}`}>
                          {res.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}

              {sortedReservations.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Este huésped no tiene reservas registradas.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
