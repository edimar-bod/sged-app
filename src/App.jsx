import { useEffect, useState } from "react";

export default function App() {
  const [activeGroup, setActiveGroup] = useState("A");
  const [activeTab, setActiveTab] = useState("Jornada");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Conectando y cargando datos persistentes...</p>
        </div>
      </div>
    );
  }

  const TabButton = ({ label }) => (
    <button
      onClick={() => setActiveTab(label)}
      className={
        `px-4 py-2 rounded-lg font-semibold transition-all ` +
        (activeTab === label
          ? "bg-indigo-600 text-white shadow-md"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="px-6 py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">⚽ COPA DORADA</h1>
          <p className="text-slate-600">Fundación Corazón de Azúcar</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Selector de Grupo */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveGroup("A")}
            className={
              `px-6 py-2 rounded-lg font-bold transition-all ` +
              (activeGroup === "A"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300")
            }
          >
            Grupo A
          </button>
          <button
            onClick={() => setActiveGroup("B")}
            className={
              `px-6 py-2 rounded-lg font-bold transition-all ` +
              (activeGroup === "B"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300")
            }
          >
            Grupo B
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {["Jornada", "Calendario", "Tabla"].map((tab) => (
            <TabButton key={tab} label={tab} />
          ))}
        </div>

        {/* Contenido Principal */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab} - Grupo {activeGroup}
          </h2>

          {activeTab === "Jornada" && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">🗓️</span>
              </div>
              <p className="text-center">
                Cargando partidos de la Jornada 2...
              </p>
              <p className="text-center text-slate-600">
                Esta sección mostrará los resultados editables.
              </p>
            </div>
          )}

          {activeTab === "Calendario" && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-center">Cargando calendario...</p>
              <p className="text-center text-slate-600">
                Esta sección mostrará el calendario del Grupo {activeGroup}.
              </p>
            </div>
          )}

          {activeTab === "Tabla" && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">🏆</span>
              </div>
              <p className="text-center">Cargando tabla de posiciones...</p>
              <p className="text-center text-slate-600">
                Esta sección mostrará la tabla del Grupo {activeGroup}.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="text-indigo-600">✔️</span>
          Sistema de Gestión de Evento Deportivo - Copa Dorada
        </span>
      </footer>
    </div>
  );
}
