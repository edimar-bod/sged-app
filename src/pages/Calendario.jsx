// Página de gestión de calendario
import React from "react";
import useCalendar from "../hooks/useCalendar";
import CalendarTable from "../components/CalendarTable";

export default function Calendario({ group = "A" }) {
  const { calendar, loading } = useCalendar(group);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Calendario - Grupo {group}</h2>
      {loading ? (
        <div>Cargando calendario...</div>
      ) : (
        <CalendarTable calendar={calendar} />
      )}
    </div>
  );
}
