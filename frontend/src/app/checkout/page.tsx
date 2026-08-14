"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LogOut, CheckCircle, Calendar, BedDouble, User, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReservationSummary {
  id: string;
  guestDni: string;
  capsula?: { id: string, roomNumber: number };
  startDate: string;
  endDate: string;
  status: string;
}

export default function CheckOutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<ReservationSummary | null>(null);
  const [userDni, setUserDni] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role === "ADMIN") { router.push("/admin/dashboard"); return; }

    const fetchReservations = async () => {
      const dni = localStorage.getItem("user_dni");
      const token = localStorage.getItem("auth_token");
      if (!dni || !token) { router.push("/login"); return; }
      
      setUserDni(dni);

      try {
        const res = await fetch(`/api/v1/checkout/by-dni/${dni}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        } else if (res.status === 404) {
          setReservations([]);
        } else {
          toast.error("Error al buscar reservas activas.");
        }
      } catch { 
        toast.error("Error de conexión."); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchReservations();
  }, [router]);

  /* ── STEP 2: confirmar checkout ── */
  const handleConfirmCheckOut = async () => {
    if (!selectedReservation) return;
    setConfirming(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/checkout/${selectedReservation.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ guestDni: userDni }),
      });
      if (!res.ok) { toast.error(await res.text()); return; }
      setStep(3);
    } catch { toast.error("Error de conexión."); }
    finally { setConfirming(false); }
  };

  /* ── helpers ── */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const nightsBetween = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const stepLabel =
    step === 1 ? "Selecciona tu reserva" : step === 2 ? "Confirma tu salida" : "¡Hasta pronto!";

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      {/* Gradient header */}
      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem]"
        style={{ background: "linear-gradient(160deg, #1B2F6E 0%, #4ABDE8 100%)" }}
      >
        <button
          onClick={() => step > 1 && step < 3 ? setStep(s => s - 1) : router.back()}
          className="absolute top-6 left-5 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5 mt-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all ${step >= s ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <LogOut size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">Check-out Digital</h1>
            <p className="text-white/70 text-sm mt-0.5">{stepLabel}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 pb-28 flex-1">
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#1B2F6E]" size={32} />
          </div>
        ) : (
          <>
            {/* STEP 1 — Seleccionar Reserva */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="card">
                  <label className="form-label flex items-center gap-2"><User size={16}/> Titular</label>
                  <input
                    type="text"
                    value={userDni}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl cursor-not-allowed font-mono text-sm uppercase"
                  />
                  <p className="text-xs text-slate-400 mt-2">DNI autocompletado asociado a tu cuenta.</p>
                </div>

                {reservations.length === 0 ? (
                  <div className="card text-center py-10 space-y-3 border-dashed border-2 border-slate-300">
                    <AlertCircle size={40} className="text-slate-400 mx-auto" />
                    <p className="font-bold text-[#1B2F6E] text-lg">Sin reservas activas</p>
                    <p className="text-slate-500 text-sm">No tienes ninguna reserva con check-in realizado actualmente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-bold text-[#1B2F6E] ml-1">Tus estancias activas:</h3>
                    {reservations.map((res) => (
                      <div 
                        key={res.id}
                        onClick={() => {
                          setSelectedReservation(res);
                          setStep(2);
                        }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-[#4ABDE8] transition-all active:scale-[0.98]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2 text-[#1B2F6E]">
                            <BedDouble size={18} className="text-[#4ABDE8]"/>
                            <span className="font-bold">
                              Cápsula {res.capsula?.roomNumber ? `Nº ${res.capsula.roomNumber}` : (res.capsula?.id ? res.capsula.id.slice(0, 8).toUpperCase() + '...' : '?')}
                            </span>
                          </div>
                          <span className="bg-[#4ABDE8]/10 text-[#4ABDE8] text-xs font-bold px-2 py-1 rounded-lg">
                            ACTIVA
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 flex justify-between">
                          <span>{formatDate(res.startDate)}</span>
                          <ArrowRight size={14} className="text-slate-300"/>
                          <span>{formatDate(res.endDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — Resumen + Confirmar */}
            {step === 2 && selectedReservation && (
              <div className="space-y-4">

                {/* Reservation summary card */}
                <div className="card space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-[#1B2F6E]/10 flex items-center justify-center">
                      <User size={20} className="text-[#1B2F6E]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1B2F6E] text-sm">Titular de la reserva</p>
                      <p className="text-slate-400 text-xs">DNI: {selectedReservation.guestDni}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Capsule */}
                    <div className="bg-transparent rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#1B2F6E]">
                        <BedDouble size={14} />
                        <span className="text-xs font-semibold uppercase tracking-wide">Cápsula</span>
                      </div>
                      <p className="text-[#1B2F6E] font-bold text-sm truncate">
                        {selectedReservation.capsula?.roomNumber ? `Nº ${selectedReservation.capsula.roomNumber}` : (selectedReservation.capsula?.id ? selectedReservation.capsula.id.slice(0, 8).toUpperCase() + '...' : '?')}
                      </p>
                    </div>

                    {/* Nights */}
                    <div className="bg-transparent rounded-2xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[#1B2F6E]">
                        <Calendar size={14} />
                        <span className="text-xs font-semibold uppercase tracking-wide">Noches</span>
                      </div>
                      <p className="text-[#1B2F6E] font-bold text-sm">
                        {nightsBetween(selectedReservation.startDate, selectedReservation.endDate)} noche
                        {nightsBetween(selectedReservation.startDate, selectedReservation.endDate) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Entrada</span>
                      <span className="font-semibold text-[#1B2F6E]">{formatDate(selectedReservation.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Salida</span>
                      <span className="font-semibold text-[#1B2F6E]">{formatDate(selectedReservation.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">
                    <strong>Esta acción es irreversible.</strong> Una vez confirmado, el acceso
                    a tu cápsula quedará desactivado y la reserva se marcará como completada.
                  </p>
                </div>

                <button
                  onClick={handleConfirmCheckOut}
                  disabled={confirming}
                  className="btn-primary w-full mt-2 !bg-red-500 hover:!bg-red-600 !shadow-red-300/30"
                >
                  {confirming ? "Procesando…" : <> Confirmar Check-out <LogOut size={16} /> </>}
                </button>
              </div>
            )}

            {/* STEP 3 — Success */}
            {step === 3 && (
              <div className="card text-center space-y-5 py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-500 mx-auto">
                  <CheckCircle size={44} strokeWidth={1.5} />
                </div>

                <div>
                  <h2 className="text-[#1B2F6E] text-xl font-bold">¡Check-out completado!</h2>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Tu estancia ha finalizado correctamente.<br />
                    Esperamos verte pronto en Tourist Cocoon.
                  </p>
                </div>

                <div className="bg-[#1B2F6E]/5 border border-[#1B2F6E]/10 rounded-2xl p-4 space-y-2 text-left">
                  <p className="text-xs text-[#1B2F6E] font-semibold">🙏 Gracias por tu estancia</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    El acceso a la cápsula ha sido desactivado y la reserva marcada como completada.
                    Si dejaste algo olvidado, contacta con recepción.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button onClick={() => router.push("/reservations")} className="btn-primary w-full">
                    Volver al inicio <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => router.push("/reservations/new")}
                    className="btn-primary w-full !bg-white !text-[#1B2F6E] !shadow-none border border-slate-200 hover:!bg-slate-50"
                  >
                    Nueva reserva <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
