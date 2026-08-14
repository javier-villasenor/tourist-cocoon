"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, User, KeyRound, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface ClientSearchResult {
  dni: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
}

export default function AdminClientsSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const token = localStorage.getItem("auth_token");

    if (!token || role !== "ADMIN") {
      router.push("/login");
    }
  }, [router]);

  const handleSearch = async (e?: React.FormEvent, fetchAll: boolean = false) => {
    if (e) e.preventDefault();
    if (!fetchAll && !query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem("auth_token");
      const url = fetchAll ? '/api/v1/admin/guests/search?q=' : `/api/v1/admin/guests/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        toast.error("Error al buscar clientes");
        setResults([]);
      }
    } catch {
      toast.error("Error de conexión");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans max-w-4xl mx-auto md:p-6 p-0">
      
      {/* HEADER */}
      <div className="bg-[#1B2F6E] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen" />
        
        <button onClick={() => router.back()} className="text-white/60 hover:text-white transition-colors self-start relative z-10 flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={18} /> Volver al Dashboard
        </button>

        <div className="relative z-10">
          <h1 className="text-white text-3xl font-black mb-2">Directorio CRM</h1>
          <p className="text-indigo-200 font-medium">Buscador global de huéspedes por DNI o apellido</p>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="relative z-10 mt-2">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-indigo-300">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: García, 12345678X..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-32 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 bg-white text-[#1B2F6E] font-bold px-6 py-2 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
            >
              Buscar
            </button>
          </div>
        </form>

        <button 
          onClick={() => { setQuery(""); handleSearch(undefined, true); }}
          className="relative z-10 self-center text-indigo-200 hover:text-white text-sm font-medium transition-colors underline decoration-indigo-400/50 hover:decoration-white underline-offset-4"
        >
          O ver el listado completo de clientes registrados
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 md:p-0 mt-6 flex flex-col gap-4 pb-28">
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="animate-spin text-indigo-400" size={40} />
          </div>
        ) : searched && results.length === 0 ? (
           <div className="bg-white rounded-3xl p-10 text-center flex flex-col items-center gap-4 border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
               <User size={32} />
             </div>
             <p className="text-slate-500 font-medium text-lg">No se han encontrado huéspedes.</p>
             <p className="text-slate-400 text-sm">Prueba a buscar con otro apellido u otro formato de DNI.</p>
           </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 px-2 uppercase tracking-widest">
               {results.length} resultado{results.length !== 1 && 's'}
            </h2>
            
            {results.map((client) => (
              <div 
                key={client.dni} 
                onClick={() => router.push(`/admin/guests/${client.dni}`)}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 md:items-center hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              >
                
                <div className="flex items-center gap-4 flex-1">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${client.role === 'ADMIN' ? 'bg-amber-100 text-amber-600 border border-amber-200 group-hover:bg-amber-500 group-hover:text-white' : 'bg-indigo-50 text-indigo-500 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                     <User size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                       {client.firstName} {client.lastName}
                       {client.role === 'ADMIN' && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-tighter font-black">Admin</span>}
                     </h3>
                     <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mt-0.5">
                       <KeyRound size={12} /> {client.dni}
                     </div>
                   </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                    <Mail size={14} className="text-slate-400" />
                    {client.email}
                  </div>
                )}
                
              </div>
            ))}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-16 opacity-50">
              <Search size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">Introduce un DNI o apellido para comenzar</p>
           </div>
        )}
      </div>

    </div>
  );
}
