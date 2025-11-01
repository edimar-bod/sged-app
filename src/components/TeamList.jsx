// Lista de equipos reutilizable
import React from "react";

export default function TeamList({ teams, onEdit, onDelete }) {
  return (
    <ul className="space-y-2">
      {teams.map((team) => (
        <li key={team} className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{team}</span>
          {onEdit && (
            <button
              className="bg-yellow-500 text-white px-2 py-1 rounded"
              onClick={() => onEdit(team)}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              className="bg-red-600 text-white px-2 py-1 rounded"
              onClick={() => onDelete(team)}
            >
              Eliminar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
