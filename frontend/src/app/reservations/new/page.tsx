"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function NewReservationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    guestDni: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }

    const savedDni = localStorage.getItem('user_dni');
    if (savedDni) {
      setFormData(prev => ({ ...prev, guestDni: savedDni }));
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch("/api/v1/reservations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.text();
        toast.error(error || "Error al crear la reserva");
        return;
      }
      setSuccess(true);
    } catch {
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col items-center justify-center px-4 pb-28">
        <div className="card w-full text-center space-y-6 py-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#4ABDE8]/15 text-[#4ABDE8] mx-auto">
            <CheckCircle size={44} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[#1B2F6E] text-2xl font-bold">¡Reserva confirmada!</h2>
            <p className="text-slate-500 text-sm mt-2">
              Tu reserva ha sido completada exitosamente.
              <br />Recuerda hacer el check-in digital antes de llegar.
            </p>
          </div>
          <div className="bg-[#4ABDE8]/10 rounded-2xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">DNI</span>
              <span className="font-semibold text-[#1B2F6E]">{formData.guestDni}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Entrada</span>
              <span className="font-semibold text-[#1B2F6E]">{formData.startDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Salida</span>
              <span className="font-semibold text-[#1B2F6E]">{formData.endDate}</span>
            </div>
          </div>
          <button onClick={() => router.push("/checkin")} className="btn-primary w-full">
            Ir al Check-in <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      {/* Header */}
      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem]"
        style={{ background: 'linear-gradient(160deg, #1B2F6E 0%, #4ABDE8 100%)' }}
      >
        <button onClick={() => router.back()} className="absolute top-12 left-5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-2xl font-bold mt-6">Nueva Reserva</h1>
        <p className="text-white/70 text-sm mt-1">Urban Cube · Madrid</p>
      </div>

      {/* Form card */}
      <div className="px-4 mt-4 pb-28">
        <form onSubmit={handleSubmit} className="card space-y-5">

          <div>
            <label className="form-label">DNI / NIF</label>
            <input
              className="input-underline bg-slate-50 opacity-70 cursor-not-allowed"
              placeholder="12345678A"
              required
              readOnly
              value={formData.guestDni}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Fecha Entrada</label>
              <input
                type="date"
                className="input-underline"
                required
                value={formData.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Fecha Salida</label>
              <input
                type="date"
                className="input-underline"
                required
                value={formData.endDate}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 leading-relaxed">
            ⚖️ Máx. <strong>7 noches consecutivas</strong> y <strong>15 días/mes</strong> por Ley de Arrendamientos Urbanos.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60"
          >
            {loading ? "Procesando..." : <>Confirmar Reserva <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
