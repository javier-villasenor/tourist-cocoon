"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, PlusCircle, CalendarDays, Bed, Activity, Loader2, ArrowRight, ShieldCheck, Clock, AlertTriangle, CheckCircle2, Eye, Search } from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, subDays, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Types for Audit
type AuditLog = {
  timestamp: string;
  action: string;
  guestDni: string;
};

type AuditReservation = {
  startDate: string;
  endDate: string;
  status: string;
  guestName: string;
};

type AuditCapsule = {
  capsuleId: string;
  roomNumber: number;
  status: string;
  reservations: AuditReservation[];
  accessLogs: AuditLog[];
};

type AdminIncident = {
  id: string;
  roomNumber: number | null;
  guestName: string;
  guestDni: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  reservationId: string;
  reservationStartDate: string;
  reservationEndDate: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'overview' | 'audit' | 'incidents'
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'incidents'>('overview');

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalCapsules: 0,
    occupiedCapsules: 0,
    freeCapsules: 0,
    activeReservations: 0,
    futureReservations: 0,
    totalReservations: 0,
    pendingIncidents: 0
  });

  // Audit State
  const [auditData, setAuditData] = useState<AuditCapsule[]>([]);

  // Incidents State
  const [incidents, setIncidents] = useState<AdminIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<AdminIncident | null>(null);

  // Capsule Form State
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [savingCapsule, setSavingCapsule] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");
    const name = localStorage.getItem("user_name");

    if (!token || role !== "ADMIN") {
      router.push("/login");
      return;
    }
    setUserName(name || "Admin");

    fetchMetrics();
    fetchAuditData();
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      toast.error("Error de conexión (Métricas)");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/audit-calendar", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
      }
    } catch {
      toast.error("Error al cargar la auditoría");
    }
  };

  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/incidents", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setIncidents(await res.json());
      }
    } catch {
      toast.error("Error al cargar incidencias");
    }
  };

  const handleUpdateIncidentStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/admin/incidents/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Estado actualizado");
        fetchIncidents();
        fetchMetrics();
        setSelectedIncident(null);
      } else {
        toast.error(await res.text());
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleCreateCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber) return;

    setSavingCapsule(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/capsules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roomNumber: parseInt(roomNumber, 10) })
      });

      if (res.ok) {
        toast.success("Cápsula Añadida Correctamente");
        setRoomNumber("");
        setShowCapsuleForm(false);
        fetchMetrics();
        fetchAuditData();
      } else {
        const errorMsg = await res.text();
        toast.error(errorMsg || "Error al crear la cápsula");
      }
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setSavingCapsule(false);
    }
  };

  const handleUpdateCapsuleStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/v1/admin/capsules/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Cápsula marcada como disponible");
        fetchAuditData();
        fetchMetrics();
      } else {
        toast.error(await res.text());
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // ── CALENDAR LOGIC ──
  // Generar un rango de días desde hace 3 días hasta dentro de 10 días
  const today = new Date();
  const calendarDays = Array.from({ length: 14 }).map((_, i) => subDays(addDays(today, 10), 13 - i));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2F6E] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans max-w-5xl mx-auto md:p-6 p-0">
      
      {/* ── HEADER ── */}
      <div className="bg-[#1B2F6E] md:rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky/20 rounded-full blur-3xl mix-blend-screen" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-white font-black text-2xl uppercase">{userName.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sky font-bold tracking-widest text-xs uppercase">Gestor de Hotel</p>
              <h1 className="text-white text-2xl font-bold">Portal del GESTOR</h1>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-4 mt-8 relative z-10 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-2 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'overview' ? 'border-sky text-sky' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            Visión General
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-2 font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'audit' ? 'border-sky text-sky' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            <ShieldCheck size={18} />
            Auditoría
          </button>
          <button 
            onClick={() => setActiveTab('incidents')}
            className={`pb-3 px-2 font-bold transition-all border-b-2 flex items-center gap-2 relative ${activeTab === 'incidents' ? 'border-red-400 text-red-400' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            <AlertTriangle size={18} />
            Incidencias
            {metrics.pendingIncidents > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {metrics.pendingIncidents}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="p-4 md:p-0 mt-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-end">
               <button 
                 onClick={() => setShowCapsuleForm(!showCapsuleForm)}
                 className="bg-[#1B2F6E] hover:bg-[#11204F] text-white font-black py-2.5 px-5 rounded-xl shadow-xl hover:shadow-navy/20 transition-all flex items-center gap-2 text-sm tracking-wide"
                >
                 <PlusCircle size={18} />
                 Añadir Cápsula
               </button>
            </div>

            {/* CREATE CAPSULE FORM */}
            {showCapsuleForm && (
              <div className="bg-sky/5 border-2 border-sky/20 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                  <PlusCircle size={20} className="text-sky" />
                  Registrar Nueva Cápsula en Inventario
                </h3>
                <form onSubmit={handleCreateCapsule} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-navy text-sm font-bold mb-2">Número de Habitación / Identificador</label>
                    <input 
                      type="number" 
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="Ej: 101" 
                      required
                      className="w-full bg-white border border-sky/30 rounded-xl py-3 px-4 text-navy focus:outline-none focus:ring-2 focus:ring-sky"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={savingCapsule}
                    className="bg-[#1B2F6E] hover:bg-[#11204F] text-white font-black py-3 px-8 rounded-xl shadow-xl transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
                  >
                    {savingCapsule ? 'Guardando...' : 'Guardar y Publicar'}
                  </button>
                </form>
              </div>
            )}

            {/* METRICS WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/admin/guests')}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 items-start text-left hover:shadow-md hover:border-emerald-200 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-2 relative z-10">
                  <Activity size={24} />
                </div>
                <p className="text-3xl font-black text-slate-800 relative z-10">{metrics.activeReservations}</p>
                <p className="text-slate-500 font-medium text-sm relative z-10">Huéspedes Activos (In-House)</p>
                <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                  Ver listado completo <ArrowRight size={12} />
                </div>
              </button>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 items-start">
                <div className="p-3 bg-sky/10 text-sky rounded-xl mb-2">
                  <Bed size={24} />
                </div>
                <p className="text-3xl font-black text-slate-800">
                  {metrics.occupiedCapsules} <span className="text-lg text-slate-400 font-normal">/ {metrics.totalCapsules}</span>
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                   <div className="bg-sky h-1.5 rounded-full" style={{ width: `${(metrics.occupiedCapsules / (metrics.totalCapsules||1)) * 100}%` }}></div>
                </div>
                <p className="text-slate-500 font-medium text-sm mt-1">Cápsulas Ocupadas</p>
              </div>

              <button 
                onClick={() => router.push('/admin/reservations')}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 items-start text-left hover:shadow-md hover:border-orange-200 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mb-2 relative z-10">
                  <CalendarDays size={24} />
                </div>
                <p className="text-3xl font-black text-slate-800 relative z-10">{metrics.futureReservations}</p>
                <p className="text-slate-500 font-medium text-sm relative z-10">Reservas Futuras (Pendientes)</p>
                <div className="mt-2 text-xs font-bold text-orange-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                  Ver listado completo <ArrowRight size={12} />
                </div>
              </button>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-1 items-start justify-between">
                 <div>
                   <h3 className="font-bold text-slate-800">Cápsulas Libres</h3>
                   <p className="text-slate-500 text-sm">Unidades disponibles para venta</p>
                 </div>
                 <p className="text-5xl font-black text-emerald-500 mt-2">{metrics.freeCapsules}</p>
              </div>
            </div>

            {/* DIRECTORY ACCESS */}
            <button 
              onClick={() => router.push('/admin/clients')}
              className="mt-6 w-full bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Search size={24} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-slate-800">Directorio de Clientes (CRM)</p>
                  <p className="text-slate-500 font-medium text-sm">Buscador avanzado de fichas de huéspedes por DNI o apellido</p>
                </div>
              </div>
              <div className="text-indigo-600 bg-indigo-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                <ArrowRight size={16} />
              </div>
            </button>

          </div>
        )}

        {/* ── AUDIT TAB (CU 6) ── */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-[#1B2F6E] flex items-center gap-2">
                <Clock size={20} className="text-[#4ABDE8]" />
                Cuadrante de Auditoría de Accesos
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Visualización de estado de ocupación e historial inalterable de accesos por cápsula. 
                Pasa el ratón sobre los indicadores rojos para ver quién accedió y a qué hora.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-700 min-w-[150px] sticky left-0 bg-slate-100/80 z-20 shadow-[1px_0_0_#e2e8f0]">Cápsula</th>
                    {calendarDays.map((date, i) => (
                      <th key={i} className={`p-3 text-center border-l border-slate-200 min-w-[80px] ${isSameDay(date, today) ? 'bg-sky/10 text-navy border-sky/30' : 'text-slate-600'}`}>
                        <div className="text-[10px] uppercase font-black tracking-widest opacity-60">
                          {format(date, 'EEE', { locale: es })}
                        </div>
                        <div className={`font-bold text-lg mt-0.5 ${isSameDay(date, today) ? 'text-sky' : ''}`}>
                          {format(date, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditData.map((capsule) => (
                    <tr key={capsule.capsuleId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-[#1B2F6E] sticky left-0 bg-white z-10 shadow-[1px_0_0_#f1f5f9]">
                        <div className="flex flex-col gap-1 items-start">
                          <span>Habitación {capsule.roomNumber}</span>
                          {capsule.status === 'PENDIENTE_LIMPIEZA' && (
                            <button 
                              onClick={() => handleUpdateCapsuleStatus(capsule.capsuleId, 'DISPONIBLE')}
                              className="bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white transition-colors text-[9px] px-2 py-1 rounded shadow-sm uppercase tracking-wider font-bold border border-amber-200 mt-1"
                              title="Marcar como limpia y disponible"
                            >
                              Marcar Limpia
                            </button>
                          )}
                        </div>
                      </td>
                      {calendarDays.map((date, i) => {
                        // Comprobar si esta cápsula está reservada en este día
                        const reservationOnDay = capsule.reservations.find(r => 
                          isWithinInterval(date, { start: parseISO(r.startDate), end: parseISO(r.endDate) })
                        );
                        
                        // Buscar todos los logs de acceso en este día para esta cápsula
                        const logsOnDay = capsule.accessLogs.filter(log => 
                          isSameDay(parseISO(log.timestamp), date)
                        );

                        return (
                          <td 
                            key={i} 
                            className={`p-2 border-l border-slate-100 relative group
                              ${reservationOnDay ? 'bg-sky/10' : ''}
                              ${isSameDay(date, today) ? 'bg-sky/5' : ''}
                            `}
                          >
                            {/* Color block si está reservado */}
                            {reservationOnDay && (
                              <div className="absolute inset-y-1 inset-x-1 bg-[#4ABDE8]/20 rounded-md border border-[#4ABDE8]/30 pointer-events-none"></div>
                            )}

                            {/* Mostrar icono de acceso si hubo aperturas */}
                            {logsOnDay.length > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-md shadow-rose-500/30 text-white cursor-help">
                                  <ShieldCheck size={16} />
                                  
                                  {/* Tooltip con los logs (Caso de Uso 6) */}
                                  <div className="absolute bottom-full mb-2 w-64 bg-[#1B2F6E] text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-50 shadow-2xl">
                                    <p className="font-bold border-b border-white/20 pb-2 mb-2 text-xs">
                                      Registro de Accesos - Hab {capsule.roomNumber}
                                    </p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                      {logsOnDay.map((log, idx) => (
                                        <div key={idx} className="text-xs bg-white/10 p-2 rounded-lg">
                                          <div className="flex justify-between font-bold text-[#4ABDE8] mb-0.5">
                                            <span>{format(parseISO(log.timestamp), 'HH:mm:ss')}</span>
                                            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                              Permitido
                                            </span>
                                          </div>
                                          <p>DNI: <span className="font-mono text-slate-300">{log.guestDni}</span></p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1B2F6E] rotate-45"></div>
                                  </div>
                                </div>
                                {/* Badge contador si hay más de 1 acceso */}
                                {logsOnDay.length > 1 && (
                                  <div className="absolute -top-1 -right-1 bg-[#1B2F6E] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                    {logsOnDay.length}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {auditData.length === 0 && (
                    <tr>
                      <td colSpan={calendarDays.length + 1} className="p-8 text-center text-slate-500">
                        No hay cápsulas configuradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4ABDE8]/20 border border-[#4ABDE8]/30 rounded"></div>
                <span>Cápsula Reservada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span>Acceso Detectado (Log Inalterable)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── INCIDENTS TAB ── */}
        {activeTab === 'incidents' && (
          <div className="space-y-4 pb-20">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Gestión de Incidencias
            </h2>

            {incidents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <p className="font-bold text-slate-800">Sin incidencias</p>
                <p className="text-slate-400 text-sm">No hay incidencias reportadas.</p>
              </div>
            ) : (
              incidents.map((inc) => {
                const statusStyle = inc.status === 'PENDIENTE'
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : inc.status === 'ASIGNADA'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200';

                const categoryLabels: Record<string, string> = {
                  LIMPIEZA: '🧹 Limpieza', AVERIA: '🔧 Avería', RUIDO: '🔊 Ruido',
                  CLIMA: '🌡️ Clima', OTRO: '📝 Otro'
                };

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md hover:border-red-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                        <AlertTriangle size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{categoryLabels[inc.category] || inc.category}</p>
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Clock size={10} /> {new Date(inc.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">CÁPSULA</p>
                        <p className="font-black text-slate-700">Nº {inc.roomNumber ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">HUÉSPED</p>
                        <p className="font-semibold text-slate-700 text-sm">{inc.guestName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${statusStyle}`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* ── DETAIL MODAL ── */}
            {selectedIncident && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedIncident(null)}>
                <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">Detalle de Incidencia</h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedIncident.id.split('-')[0]}...</p>
                    </div>
                    <button onClick={() => setSelectedIncident(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Categoría</p>
                        <p className="font-bold text-slate-800">{selectedIncident.category}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cápsula</p>
                        <p className="font-bold text-slate-800">Nº {selectedIncident.roomNumber ?? '—'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Huésped</p>
                        <p className="font-bold text-slate-800">{selectedIncident.guestName}</p>
                        <p className="text-xs text-slate-400">{selectedIncident.guestDni}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reportada</p>
                        <p className="font-bold text-slate-800 text-sm">
                          {new Date(selectedIncident.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Reserva asociada</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {selectedIncident.reservationStartDate} → {selectedIncident.reservationEndDate}
                      </p>
                    </div>

                    {selectedIncident.description && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Descripción del cliente</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{selectedIncident.description}</p>
                      </div>
                    )}

                    {selectedIncident.resolvedAt && (
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">Resuelta</p>
                        <p className="font-bold text-emerald-700 text-sm">
                          {new Date(selectedIncident.resolvedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      {selectedIncident.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'ASIGNADA')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Asignar Personal
                        </button>
                      )}
                      {(selectedIncident.status === 'PENDIENTE' || selectedIncident.status === 'ASIGNADA') && (
                        <button
                          onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'COMPLETADA')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Marcar Completada
                        </button>
                      )}
                      {selectedIncident.status === 'COMPLETADA' && (
                        <p className="flex-1 text-center text-emerald-600 font-bold py-3 bg-emerald-50 rounded-xl">
                          ✓ Incidencia resuelta
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
