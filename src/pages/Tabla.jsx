// Página de tabla de posiciones
import React from "react";
import useStandings from "../hooks/useStandings";
import StandingsTable from "../components/StandingsTable";

// Simulación de datos (reemplazar con props o contexto real)
const mockTeams = ["Equipo 1", "Equipo 2", "Equipo 3"];
const mockMatches = [
  {
    grupo: "A",
    local: "Equipo 1",
    visitante: "Equipo 2",
    scoreLocal: 2,
    scoreVisitante: 1,
    played: true,
  },
  {
    grupo: "A",
    local: "Equipo 2",
    visitante: "Equipo 3",
    scoreLocal: 0,
    scoreVisitante: 0,
    played: true,
  },
  {
    grupo: "A",
    local: "Equipo 3",
    visitante: "Equipo 1",
    scoreLocal: 1,
    scoreVisitante: 3,
    played: true,
  },
];

export default function Tabla({ group = "A" }) {
  const { standings } = useStandings({
    teams: mockTeams,
    matches: mockMatches,
    group,
  });
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
        Tabla de posiciones - Grupo {group}
      </h2>
      <StandingsTable standings={standings} />
    </div>
  );
}
