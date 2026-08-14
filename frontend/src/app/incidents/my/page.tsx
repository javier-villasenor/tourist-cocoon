"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Incident {
  id: string;
  roomNumber: number | null;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  LIMPIEZA: "🧹 Limpieza",
  AVERIA: "🔧 Avería",
  RUIDO: "🔊 Ruido",
  CLIMA: "🌡️ Climatización",
  OTRO: "📝 Otro",
};

export default function MyIncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role === "ADMIN") { router.push("/admin/dashboard"); return; }

    const fetchIncidents = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { router.push("/login"); return; }

      try {
        const res = await fetch("/api/v1/incidents/my", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setIncidents(await res.json());
        }
      } catch { toast.error("Error al cargar incidencias."); }
      finally { setLoading(false); }
    };
    fetchIncidents();
  }, [router]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ASIGNADA': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETADA': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl shadow-navy/10"
        style={{ background: 'linear-gradient(160deg, #1B2F6E 0%, #e74c3c 100%)' }}
      >
        <button onClick={() => router.back()} className="absolute top-6 left-5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-2xl font-bold mt-8">Mis Incidencias</h1>
        <p className="text-white/70 text-sm mt-1">Historial de reportes enviados</p>
      </div>

      <div className="px-4 mt-6 pb-28 flex-1 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#1B2F6E]" size={32} />
          </div>
        ) : incidents.length === 0 ? (
          <div className="card text-center py-10 space-y-3">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <p className="font-bold text-[#1B2F6E] text-lg">Sin incidencias</p>
            <p className="text-slate-500 text-sm">No has reportado ninguna incidencia todavía.</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div key={inc.id} className="card flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1B2F6E] text-sm">{CATEGORY_LABELS[inc.category] || inc.category}</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <Clock size={10} /> {new Date(inc.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest ${getStatusStyle(inc.status)}`}>
                  {inc.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[10px]">Cápsula</p>
                  <p className="font-semibold text-[#1B2F6E]">Nº {inc.roomNumber ?? '—'}</p>
                </div>
                {inc.resolvedAt && (
                  <div>
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Resuelta</p>
                    <p className="font-semibold text-emerald-600">
                      {new Date(inc.resolvedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                )}
              </div>

              {inc.description && (
                <p className="text-slate-500 text-xs bg-slate-50 rounded-xl p-3 leading-relaxed">
                  {inc.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
