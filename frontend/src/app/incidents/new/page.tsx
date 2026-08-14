"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Send, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ActiveReservation {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  capsula?: { roomNumber: number };
}

const CATEGORIES = [
  { value: "LIMPIEZA", label: "🧹 Limpieza", desc: "Problemas de higiene o limpieza en la cápsula" },
  { value: "AVERIA", label: "🔧 Avería", desc: "Algo está roto o no funciona correctamente" },
  { value: "RUIDO", label: "🔊 Ruido", desc: "Molestias por ruido excesivo" },
  { value: "CLIMA", label: "🌡️ Climatización", desc: "Problemas con la temperatura o ventilación" },
  { value: "OTRO", label: "📝 Otro", desc: "Otra incidencia no listada" },
];

export default function NewIncidentPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<ActiveReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now] = useState(new Date().toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" }));

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role === "ADMIN") { router.push("/admin/dashboard"); return; }

    const fetchReservations = async () => {
      const dni = localStorage.getItem("user_dni");
      const token = localStorage.getItem("auth_token");
      if (!dni || !token) { router.push("/login"); return; }

      try {
        const res = await fetch(`/api/v1/reservations/all-by-dni/${dni}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Solo reservas con check-in hecho
          setReservations(data.filter((r: ActiveReservation) => r.status === "CHECKIN_HECHO"));
        }
      } catch { toast.error("Error al cargar reservas."); }
      finally { setLoading(false); }
    };
    fetchReservations();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation || !category) {
      toast.error("Selecciona una reserva y una categoría.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          reservationId: selectedReservation,
          category,
          description
        })
      });
      if (res.ok) {
        toast.success("Incidencia reportada correctamente.");
        router.push("/incidents/my");
      } else {
        toast.error(await res.text());
      }
    } catch { toast.error("Error de conexión."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      {/* Header */}
      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl shadow-navy/10"
        style={{ background: 'linear-gradient(160deg, #1B2F6E 0%, #e74c3c 100%)' }}
      >
        <button onClick={() => router.back()} className="absolute top-6 left-5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-2xl font-bold mt-8 flex items-center gap-3">
          <AlertTriangle size={28} /> Reportar Incidencia
        </h1>
        <p className="text-white/70 text-sm mt-1">
          Notifica un problema con tu cápsula
        </p>
      </div>

      <div className="px-4 mt-6 pb-28 flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#1B2F6E]" size={32} />
          </div>
        ) : reservations.length === 0 ? (
          <div className="card text-center py-10 space-y-3">
            <AlertTriangle size={40} className="text-orange-400 mx-auto" />
            <p className="font-bold text-[#1B2F6E] text-lg">Sin reservas activas</p>
            <p className="text-slate-500 text-sm">Solo puedes reportar incidencias de reservas con check-in realizado.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Fecha/Hora bloqueada */}
            <div className="card">
              <label className="form-label flex items-center gap-2"><Clock size={14} /> Fecha y hora del reporte</label>
              <input
                type="text"
                value={now}
                disabled
                className="w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl cursor-not-allowed font-mono text-sm"
              />
            </div>

            {/* Selector de reserva */}
            <div className="card">
              <label className="form-label">Selecciona tu reserva</label>
              <select
                value={selectedReservation}
                onChange={(e) => setSelectedReservation(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 text-[#1B2F6E] px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400/50 font-semibold"
              >
                <option value="">— Elige una reserva —</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    Cápsula {r.capsula?.roomNumber ?? '?'} · {r.startDate} → {r.endDate}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div className="card">
              <label className="form-label">¿Qué ha ocurrido?</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      category === cat.value
                        ? 'border-red-400 bg-red-50 shadow-md'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-sm text-[#1B2F6E]">{cat.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="card">
              <label className="form-label">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Cuéntanos qué ha pasado con más detalle..."
                className="w-full bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full !bg-red-500 hover:!bg-red-600 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {submitting ? 'Enviando...' : 'Enviar Incidencia'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
