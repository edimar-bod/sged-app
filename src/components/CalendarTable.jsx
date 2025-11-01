// Tabla de calendario reutilizable
import React from "react";

export default function CalendarTable({ calendar }) {
  if (!calendar || calendar.length === 0) {
    return <div>No hay jornadas registradas.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-green-50">
            <th className="px-2 py-1 border">Jornada</th>
            <th className="px-2 py-1 border">Partidos</th>
          </tr>
        </thead>
        <tbody>
          {calendar.map((j) => (
            <tr key={j.jornada}>
              <td className="border px-2 py-1 font-bold text-center">
                {j.jornada}
              </td>
              <td className="border px-2 py-1">
                <ul>
                  {j.partidos.map((p, i) => (
                    <li key={i} className="flex gap-2 items-center">
                      <span className="font-semibold text-gray-700">
                        {p.local}
                      </span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-semibold text-gray-700">
                        {p.visitante}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
