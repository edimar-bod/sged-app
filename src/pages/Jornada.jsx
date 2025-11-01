// Página de gestión de jornadas (partidos)
import React from "react";
import useMatches from "../hooks/useMatches";
// import TeamList from "../components/TeamList";
// import MatchEditor from "../components/MatchEditor";

export default function Jornada({ activeGroup = "A" }) {
  const {
    matches,
    loading,
    editingMatch,
    setEditingMatch,
    newMatch,
    setNewMatch,
    handleAddMatch,
    handleEditMatchSave,
    handleDeleteMatch,
  } = useMatches(activeGroup);

  // Formulario para agregar nuevo partido
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMatch((prev) => ({ ...prev, [name]: value }));
  };

  // Formulario para editar partido
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingMatch((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Jornada - Grupo {activeGroup}
      </h2>
      {/* Formulario para agregar partido */}
      <div className="flex gap-2 items-end">
        <input
          type="text"
          name="local"
          placeholder="Local"
          value={newMatch.local}
          onChange={handleInputChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          name="visitante"
          placeholder="Visitante"
          value={newMatch.visitante}
          onChange={handleInputChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          name="fecha"
          value={newMatch.fecha}
          onChange={handleInputChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="time"
          name="hora"
          value={newMatch.hora}
          onChange={handleInputChange}
          className="border rounded px-2 py-1"
        />
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={handleAddMatch}
          disabled={
            !newMatch.local ||
            !newMatch.visitante ||
            newMatch.local === newMatch.visitante
          }
        >
          Agregar Partido
        </button>
      </div>
      {/* Lista de partidos */}
      {loading ? (
        <div>Cargando partidos...</div>
      ) : (
        <div>
          {matches.length === 0 ? (
            <div>No hay partidos registrados.</div>
          ) : (
            <ul className="space-y-2">
              {matches.map((match) => (
                <li key={match.id} className="flex items-center gap-2">
                  {editingMatch && editingMatch.id === match.id ? (
                    <>
                      <input
                        type="text"
                        name="local"
                        value={editingMatch.local}
                        onChange={handleEditInputChange}
                        className="border rounded px-2 py-1"
                      />
                      <span>vs</span>
                      <input
                        type="text"
                        name="visitante"
                        value={editingMatch.visitante}
                        onChange={handleEditInputChange}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="date"
                        name="fecha"
                        value={editingMatch.fecha}
                        onChange={handleEditInputChange}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="time"
                        name="hora"
                        value={editingMatch.hora}
                        onChange={handleEditInputChange}
                        className="border rounded px-2 py-1"
                      />
                      <button
                        className="bg-green-600 text-white px-2 py-1 rounded"
                        onClick={handleEditMatchSave}
                        disabled={
                          !editingMatch.local ||
                          !editingMatch.visitante ||
                          editingMatch.local === editingMatch.visitante
                        }
                      >
                        Guardar
                      </button>
                      <button
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                        onClick={() => setEditingMatch(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-800">
                        {match.local}
                      </span>
                      <span>vs</span>
                      <span className="font-semibold text-gray-800">
                        {match.visitante}
                      </span>
                      <span className="text-xs text-gray-400">
                        {match.fecha} {match.hora}
                      </span>
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                        onClick={() => setEditingMatch(match)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleDeleteMatch(match.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
