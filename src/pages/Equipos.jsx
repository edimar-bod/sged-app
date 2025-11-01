// Página de gestión de equipos
import React from "react";
import useTeams from "../hooks/useTeams";
import TeamList from "../components/TeamList";

export default function Equipos({ activeGroup = "A" }) {
  const {
    teams,
    loading,
    error,
    newTeam,
    setNewTeam,
    editingTeam,
    setEditingTeam,
    handleAddTeam,
    startEditTeam,
    handleEditTeamSave,
    handleDeleteTeam,
  } = useTeams(activeGroup);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Equipos - Grupo {activeGroup}
      </h2>
      {loading ? (
        <div>Cargando equipos...</div>
      ) : (
        <>
          <TeamList
            teams={teams}
            onEdit={startEditTeam}
            onDelete={handleDeleteTeam}
          />
          {/* Edición inline */}
          {editingTeam && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="border rounded px-2 py-1"
                value={editingTeam.newName}
                onChange={(e) =>
                  setEditingTeam({ ...editingTeam, newName: e.target.value })
                }
              />
              <button
                className="bg-green-600 text-white px-2 py-1 rounded"
                onClick={handleEditTeamSave}
              >
                Guardar
              </button>
              <button
                className="bg-gray-400 text-white px-2 py-1 rounded"
                onClick={() => setEditingTeam(null)}
              >
                Cancelar
              </button>
            </div>
          )}
          {/* Agregar equipo */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Nuevo equipo"
              className="border rounded px-2 py-1"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={handleAddTeam}
            >
              Agregar Equipo
            </button>
          </div>
        </>
      )}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
