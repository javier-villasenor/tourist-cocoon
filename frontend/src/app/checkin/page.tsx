"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ScanLine, CheckCircle, User, FileImage, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";

export default function CheckInPage() {
  const router = useRouter();

  useEffect(() => {
    // La redirección inicial y auto-fetch se movieron al final para no chocar con dependencias
  }, []);

  const [step, setStep] = useState(1);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationId, setReservationId] = useState("");
  const [dniInput, setDniInput] = useState("");
  const [form, setForm] = useState({
    dni: "",
    acceptTerms: false,
  });
  const [dniPhoto, setDniPhoto] = useState<File | null>(null);
  
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleDniLookup = async (dniToSearch?: string) => {
    const targetDni = dniToSearch || dniInput.trim();
    if (!targetDni) { toast.error("Introduce tu DNI primero."); return; }
    setScanning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/reservations/by-dni/${targetDni.toUpperCase()}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!res.ok) { toast.error("No se encontró una reserva activa para ese DNI."); return; }
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("No se encontraron reservas."); 
        return;
      }
      
      setForm(f => ({ ...f, dni: targetDni.toUpperCase() }));

      if (data.length === 1) {
        setReservationId(data[0].id);
        setStep(3); // Saltar directo al formulario
      } else {
        setReservations(data);
        setStep(2); // Seleccionar de la lista
      }
    } catch { toast.error("Error de conexión al buscar."); }
    finally { setScanning(false); }
  };

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const userDni = localStorage.getItem("user_dni");
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
    
    // Auto-búsqueda si ya hay un DNI guardado (usuario logueado)
    if (userDni) {
      setDniInput(userDni);
      handleDniLookup(userDni);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectReservation = (id: string) => {
    setReservationId(id);
    setStep(3);
  };

  const handleCheckIn = async () => {
    if (!dniPhoto) {
      toast.error("Es obligatorio subir una foto de tu DNI."); return;
    }
    if (!form.acceptTerms) { 
      toast.error("Debes aceptar los términos."); return; 
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      formData.append("dni", form.dni);
      formData.append("dniPhoto", dniPhoto);

      const res = await fetch(`/api/v1/checkin/${reservationId}`, {
        method: "POST",
        headers: { 
          // OJO: No se suele mandar "Content-Type" con FormData en fetch, el navegador lo pone automático con el boundary
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData,
      });
      
      if (!res.ok) { toast.error(await res.text()); return; }
      const data = await res.json();
      setPin(data.accessPin);
      setStep(4);
    } catch { toast.error("Error de conexión al completar el check-in."); }
  };

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto flex flex-col">

      {/* Gradient header */}
      <div
        className="relative px-5 pt-12 pb-8 rounded-b-[2.5rem]"
        style={{ background: 'linear-gradient(160deg, #1B2F6E 0%, #4ABDE8 100%)' }}
      >
        <button onClick={() => step > 1 ? setStep(s => s === 3 && reservations.length > 1 ? 2 : s === 3 ? 1 : s - 1) : router.back()} className="absolute top-6 left-5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex gap-2 mb-5 mt-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
        <h1 className="text-white text-2xl font-bold">Check-in Digital</h1>
        <p className="text-white/70 text-sm mt-1">
          {step === 1 ? 'Paso 1: Introduce tu DNI' : 
           step === 2 ? 'Paso 2: Elige tu Reserva' :
           step === 3 ? 'Paso 3: Confirma tus Datos' : '¡Todo listo!'}
        </p>
      </div>

      <div className="px-4 mt-4 pb-28 flex-1">

        {/* STEP 1 — DNI lookup */}
        {step === 1 && (
          <div className="card space-y-5">
            <div>
              <label className="form-label">DNI / NIF del titular</label>
              <input
                className="input-underline"
                placeholder="12345678A"
                value={dniInput}
                onChange={e => setDniInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDniLookup()}
              />
            </div>

            <div
              onClick={() => handleDniLookup()}
              className="border-2 border-dashed border-[#4ABDE8]/50 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#4ABDE8]/5 active:scale-95 transition-all"
            >
              <div className={`p-5 rounded-full ${scanning ? 'bg-[#4ABDE8]/20 animate-pulse' : 'bg-[#4ABDE8]/10'}`}>
                <ScanLine size={36} className="text-[#4ABDE8]" strokeWidth={1.5} />
              </div>
              <p className="text-[#1B2F6E] font-semibold text-sm">
                {scanning ? 'Buscando reservas…' : 'Pulsa para buscar tus reservas'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 — Select Reservation */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-navy font-bold px-2">Hemos encontrado múltiples reservas:</h3>
            {reservations.map(res => (
              <div key={res.id} onClick={() => selectReservation(res.id)} className="card hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex items-center justify-between border border-transparent hover:border-sky/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky/10 rounded-xl flex items-center justify-center text-sky">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">Estado: {res.status}</p>
                    <p className="text-slate-500 text-xs">Del {res.startDate} al {res.endDate}</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-sky/50" />
              </div>
            ))}
          </div>
        )}

        {/* STEP 3 — Confirm data + Photo */}
        {step === 3 && (
          <div className="card space-y-4">
            
            {/* Foto Obligatoria del DNI */}
            <div className="bg-[#1B2F6E]/5 rounded-2xl p-4 border border-[#1B2F6E]/10 mb-2">
              <label className="form-label text-[#1B2F6E] font-bold flex items-center gap-2 mb-2">
                <FileImage size={18} />
                Foto Oficial del DNI (Obligatorio)
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setDniPhoto(e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#4ABDE8] file:text-white hover:file:bg-[#1B2F6E] transition-all cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-2">Sube una imagen frontal clara de tu documento de identidad para verificación legal.</p>
            </div>

            <div>
              <label className="form-label">DNI / NIF Identificado</label>
              <input className="input-underline opacity-50 cursor-not-allowed" value={form.dni} readOnly />
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer mt-4">
              <input type="checkbox" className="w-4 h-4 accent-[#4ABDE8]" checked={form.acceptTerms} onChange={e => setForm(f => ({ ...f, acceptTerms: e.target.checked }))} />
              <span className="text-xs text-slate-500 leading-tight">Certifico que los datos son reales y acepto los <span className="text-[#4ABDE8] font-medium underline cursor-pointer">Términos Legales</span></span>
            </label>
            <button onClick={handleCheckIn} className="btn-primary w-full mt-2">
              Verificar y Completar <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 4 — Success + PIN */}
        {step === 4 && (
          <div className="card text-center space-y-5 py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#4ABDE8]/15 text-[#4ABDE8] mx-auto">
              <CheckCircle size={44} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[#1B2F6E] text-xl font-bold">¡Check-in completado!</h2>
              <p className="text-slate-500 text-sm mt-1">Tu documento ha sido verificado con éxito.</p>
            </div>
            <div className="bg-[#1B2F6E] rounded-2xl py-6 px-4 shadow-xl shadow-[#1B2F6E]/30">
              <p className="text-[#4ABDE8] text-[10px] font-black tracking-[0.2em] mb-2 uppercase">CÓDIGO DE ACCESO</p>
              <p className="text-white text-5xl font-black tracking-[0.25em] font-mono">{pin}</p>
            </div>
            <p className="text-xs text-slate-400">Guarda este pin secreto. Lo necesitarás en los terminales del hotel para acceder a tus instalaciones.</p>
            <button onClick={() => router.push('/access')} className="btn-primary w-full">
              Ir al Control de Acceso <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
