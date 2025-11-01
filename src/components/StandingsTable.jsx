// Tabla de posiciones reutilizable
import React from "react";

export default function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return <div>No hay datos de posiciones.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-amber-50">
            <th className="px-2 py-1 border">Equipo</th>
            <th className="px-2 py-1 border">PJ</th>
            <th className="px-2 py-1 border">PG</th>
            <th className="px-2 py-1 border">PE</th>
            <th className="px-2 py-1 border">PP</th>
            <th className="px-2 py-1 border">GF</th>
            <th className="px-2 py-1 border">GC</th>
            <th className="px-2 py-1 border">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.equipo}>
              <td className="border px-2 py-1 font-semibold">{row.equipo}</td>
              <td className="border px-2 py-1 text-center">{row.PJ}</td>
              <td className="border px-2 py-1 text-center">{row.PG}</td>
              <td className="border px-2 py-1 text-center">{row.PE}</td>
              <td className="border px-2 py-1 text-center">{row.PP}</td>
              <td className="border px-2 py-1 text-center">{row.GF}</td>
              <td className="border px-2 py-1 text-center">{row.GC}</td>
              <td className="border px-2 py-1 text-center">{row.PTS}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
