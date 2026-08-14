"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AccessPage() {
  const router = useRouter();

  const [capsuleId, setCapsuleId] = useState("");
  const [capsuleName, setCapsuleName] = useState("Buscando...");
  const [guestDni, setGuestDni] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<"idle" | "open" | "error">("idle");
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }

    const dni = localStorage.getItem("user_dni");
    const token = localStorage.getItem("auth_token");
    if (dni) {
      setGuestDni(dni);
      fetchActiveCapsule(dni, token);
    } else {
      setLoadingConfig(false);
      setCapsuleName("Usuario no logueado");
    }
  }, [router]);

  const fetchActiveCapsule = async (dni: string, token: string | null) => {
    try {
      const res = await fetch(`/api/v1/reservations/all-by-dni/${dni.toUpperCase()}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        // Buscamos la reserva que tenga CHECKIN_HECHO
        const activeRes = data.find((r: any) => r.status === "CHECKIN_HECHO");
        if (activeRes && activeRes.capsula) {
          setCapsuleId(activeRes.capsula.id);
          setCapsuleName(`Habitación ${activeRes.capsula.roomNumber}`);
        } else {
          setCapsuleName("Sin Check-in");
        }
      } else {
        setCapsuleName("Sin reservas");
      }
    } catch {
      setCapsuleName("Error de red");
    } finally {
      setLoadingConfig(false);
    }
  };


  const press = (v: string) => {
    if (pin.length < 6) setPin(p => p + v);
  };
  const clear = () => { setPin(""); setStatus("idle"); };

  const handleOpen = async () => {
    if (pin.length !== 6 || !capsuleId) return;
    try {
      const res = await fetch("/api/v1/access/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsuleId, guestDni, pin }),
      });
      if (!res.ok) { setStatus("error"); toast.error(await res.text()); setPin(""); return; }
      setStatus("open");
      toast.success("¡Puerta abierta!");
      setTimeout(() => { setStatus("idle"); setPin(""); }, 5000);
    } catch { toast.error("Error de conexión."); }
  };

  const isOpen = status === "open";
  const isError = status === "error";

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: 'linear-gradient(180deg, #0f1e4a 0%, #1B2F6E 50%, #1a3a5c 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.push('/reservations')} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg">Acceso a Cápsula</h1>
          <p className="text-white/50 text-xs">Terminal: {capsuleName}</p>
        </div>
      </div>

      {/* Door status */}
      <div className="flex flex-col items-center py-10 gap-4">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${isOpen ? 'border-[#4ABDE8] bg-[#4ABDE8]/20 shadow-[0_0_40px_rgba(74,189,232,0.5)]' :
            isError ? 'border-red-400 bg-red-500/20' :
              'border-white/20 bg-white/5'
          }`}>
          {isOpen
            ? <Unlock size={52} className="text-[#4ABDE8]" strokeWidth={1.5} />
            : <Lock size={52} className={isError ? 'text-red-400' : 'text-white/60'} strokeWidth={1.5} />
          }
        </div>
        <p className={`text-sm font-semibold tracking-widest uppercase ${isOpen ? 'text-[#4ABDE8]' : isError ? 'text-red-400' : 'text-white/40'
          }`}>
          {isOpen ? '✓ Puerta Abierta' : isError ? '✗ Acceso Denegado' : 'Sistema Bloqueado'}
        </p>
      </div>

      {/* Card with keypad */}
      <div className="bg-transparent mx-4 rounded-3xl p-5 flex-1 flex flex-col gap-4 mb-28">



        {/* PIN display */}
        <div className="bg-[#1B2F6E] rounded-2xl px-4 py-4 flex items-center justify-center gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${i < pin.length ? 'bg-[#4ABDE8] border-[#4ABDE8]' : 'border-white/20'
                }`}
            >
              {i < pin.length && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => press(n.toString())}
              className="bg-white rounded-2xl h-14 text-xl font-bold text-[#1B2F6E] shadow-sm active:scale-95 transition-transform hover:bg-[#4ABDE8]/10"
            >
              {n}
            </button>
          ))}
          <button onClick={clear} className="bg-red-50 rounded-2xl h-14 text-xs font-bold text-red-400 active:scale-95 transition-transform">
            Borrar
          </button>
          <button
            onClick={() => press("0")}
            className="bg-white rounded-2xl h-14 text-xl font-bold text-[#1B2F6E] shadow-sm active:scale-95 transition-transform hover:bg-[#4ABDE8]/10"
          >
            0
          </button>
          <button
            onClick={handleOpen}
            disabled={pin.length !== 6 || isOpen || !capsuleId}
            className="bg-[#4ABDE8] rounded-2xl h-14 text-xs font-bold text-white active:scale-95 transition-all disabled:opacity-40 shadow-md shadow-sky-300/30"
          >
            Abrir
          </button>
        </div>
      </div>
    </div>
  );
}
