// Hook personalizado para gestión de tabla de posiciones
import { useState, useEffect } from "react";

// Calcula la tabla de posiciones a partir de partidos y equipos
function computeStandings(teams, matches, group) {
  const stats = {};
  teams.forEach((team) => {
    stats[team] = {
      equipo: team,
      PJ: 0,
      PG: 0,
      PE: 0,
      PP: 0,
      GF: 0,
      GC: 0,
      PTS: 0,
    };
  });
  matches
    .filter((m) => m.grupo === group && m.played)
    .forEach((m) => {
      const l = m.local;
      const v = m.visitante;
      const gl = Number(m.scoreLocal);
      const gv = Number(m.scoreVisitante);
      if (!isNaN(gl) && !isNaN(gv)) {
        if (stats[l]) {
          stats[l].PJ += 1;
          stats[l].GF += gl;
          stats[l].GC += gv;
        }
        if (stats[v]) {
          stats[v].PJ += 1;
          stats[v].GF += gv;
          stats[v].GC += gl;
        }
        if (gl > gv && stats[l]) {
          stats[l].PG += 1;
          stats[l].PTS += 3;
        } else if (gl < gv && stats[v]) {
          stats[v].PG += 1;
          stats[v].PTS += 3;
        } else if (gl === gv) {
          if (stats[l]) {
            stats[l].PE += 1;
            stats[l].PTS += 1;
          }
          if (stats[v]) {
            stats[v].PE += 1;
            stats[v].PTS += 1;
          }
        }
        if (gl < gv && stats[l]) stats[l].PP += 1;
        if (gl > gv && stats[v]) stats[v].PP += 1;
      }
    });
  return Object.values(stats).sort((a, b) => b.PTS - a.PTS || b.GF - a.GF);
}

// Hook principal
export default function useStandings({ teams, matches, group }) {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    if (!teams || !matches || !group) {
      setStandings([]);
      return;
    }
    setStandings(computeStandings(teams, matches, group));
  }, [teams, matches, group]);

  return { standings };
}
