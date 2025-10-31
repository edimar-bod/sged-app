import React, { useEffect, useState, useCallback } from "react";
import { db, auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  JORNADA_2_PARTIDOS,
  CALENDARIO_A,
  CALENDARIO_B,
  EQUIPOS_A,
  EQUIPOS_B,
} from "./tournamentData";
import AuthForm from "./AuthForm";

// Firestore collection for teams and groups
const TEAMS_COLLECTION = "teams";
const ADMIN_EMAILS = ["edimar.bod@gmail.com", "edimar.marcano@gmail.com"];

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const [activeGroup, setActiveGroup] = useState("A");
  const [activeTab, setActiveTab] = useState("Jornada");
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [initError, setInitError] = useState("");
  const [standings, setStandings] = useState({ A: [], B: [] });
  const [groupsData, setGroupsData] = useState({});
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [editTeam, setEditTeam] = useState({
    group: "",
    oldName: "",
    newName: "",
  });

  // Auth handlers
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setAuthError("Error de autenticación: " + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signOut(auth);
    } catch (e) {
      setAuthError("Error al cerrar sesión: " + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Compute standings from matches (move this above useEffect)
  const computeStandings = useCallback(
    (matchList) => {
      // Use dynamic groups from Firestore
      const groupKeys = Object.keys(groupsData).length
        ? Object.keys(groupsData)
        : ["A", "B"];
      const standingsObj = {};
      groupKeys.forEach((group) => {
        const teams = groupsData[group] || [];
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
        matchList
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
        standingsObj[group] = Object.values(stats).sort(
          (a, b) => b.PTS - a.PTS || b.GF - a.GF
        );
      });
      setStandings(standingsObj);
    },
    [groupsData]
  );

  // On mount, load Jornada 2 matches and teams/groups from Firestore, or initialize if empty
  useEffect(() => {
    async function loadMatches() {
      try {
        const colRef = collection(db, "jornada_2");
        const snap = await getDocs(colRef);
        let loadedMatches;
        if (snap.empty) {
          // Initialize Firestore with static data if not present
          await Promise.all(
            JORNADA_2_PARTIDOS.map((m) =>
              setDoc(doc(db, "jornada_2", m.id), {
                ...m,
                scoreLocal: null,
                scoreVisitante: null,
                played: false,
              })
            )
          );
          loadedMatches = JORNADA_2_PARTIDOS.map((m) => ({
            ...m,
            scoreLocal: null,
            scoreVisitante: null,
            played: false,
          }));
        } else {
          loadedMatches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        setMatches(loadedMatches);
        setLoading(false);
        computeStandings(loadedMatches);
      } catch (e) {
        setInitError("Error loading matches: " + e.message);
        setLoading(false);
      }
    }
    async function loadTeams() {
      setTeamsLoading(true);
      try {
        const colRef = collection(db, TEAMS_COLLECTION);
        const snap = await getDocs(colRef);
        let loadedGroups = {};
        if (snap.empty) {
          // Initialize with static data if not present
          loadedGroups = { A: EQUIPOS_A, B: EQUIPOS_B };
          await Promise.all(
            Object.entries(loadedGroups).map(([group, teams]) =>
              setDoc(doc(db, TEAMS_COLLECTION, group), { teams })
            )
          );
        } else {
          snap.docs.forEach((d) => {
            loadedGroups[d.id] = d.data().teams;
          });
        }
        setGroupsData(loadedGroups);
        setTeamsLoading(false);
      } catch {
        setTeamsLoading(false);
      }
    }
    loadMatches();
    loadTeams();
  }, [computeStandings]);

  // Teams CRUD handlers
  async function handleAddGroup() {
    if (!isAdmin || !newGroupName.trim() || groupsData[newGroupName]) return;
    const updated = { ...groupsData, [newGroupName]: [] };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, newGroupName), { teams: [] });
    setNewGroupName("");
  }

  async function handleDeleteGroup(group) {
    if (!isAdmin || !window.confirm(`¿Eliminar grupo ${group}?`)) return;
    const updated = { ...groupsData };
    delete updated[group];
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, group), { teams: [] });
  }

  async function handleAddTeam(group) {
    if (!isAdmin || !newTeamName.trim() || !groupsData[group]) return;
    const updatedTeams = [...groupsData[group], newTeamName];
    const updated = { ...groupsData, [group]: updatedTeams };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, group), { teams: updatedTeams });
    setNewTeamName("");
  }

  function startEditTeam(group, oldName) {
    if (!isAdmin) return;
    setEditTeam({ group, oldName, newName: oldName });
  }

  async function handleEditTeamSave() {
    if (!isAdmin) return;
    const { group, oldName, newName } = editTeam;
    if (!newName.trim() || !groupsData[group]) return;
    const updatedTeams = groupsData[group].map((t) =>
      t === oldName ? newName : t
    );
    const updated = { ...groupsData, [group]: updatedTeams };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, group), { teams: updatedTeams });
    setEditTeam({ group: "", oldName: "", newName: "" });
  }

  async function handleDeleteTeam(group, team) {
    if (!isAdmin || !window.confirm(`¿Eliminar equipo ${team}?`)) return;
    const updatedTeams = groupsData[group].filter((t) => t !== team);
    const updated = { ...groupsData, [group]: updatedTeams };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, group), { teams: updatedTeams });
  }

  // Matches CRUD handlers (restricted to admins)
  async function handleScoreChange(matchId, field, value) {
    if (!isAdmin) return;
    const newMatches = matches.map((m) =>
      m.id === matchId ? { ...m, [field]: value } : m
    );
    setMatches(newMatches);
  }

  async function handleSaveScore(match) {
    if (!isAdmin) return;
    const gl = Number(match.scoreLocal);
    const gv = Number(match.scoreVisitante);
    if (isNaN(gl) || isNaN(gv)) return;
    const played = true;
    const matchRef = doc(db, "jornada_2", match.id);
    await updateDoc(matchRef, {
      scoreLocal: gl,
      scoreVisitante: gv,
      played,
    });
    const updated = matches.map((m) =>
      m.id === match.id
        ? { ...m, scoreLocal: gl, scoreVisitante: gv, played }
        : m
    );
    setMatches(updated);
    computeStandings(updated);
  }

  // UI rendering
  if (loading || authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Conectando y cargando datos persistentes...</p>
        </div>
      </div>
    );
  }
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Error de inicialización
          </h2>
          <p className="text-gray-700">{initError}</p>
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
      {/* Auth UI */}
      <div className="absolute top-4 right-4 z-50">
        <AuthForm
          onLogin={handleLogin}
          onLogout={handleLogout}
          user={user}
          loading={authLoading}
          error={authError}
        />
      </div>

      {/* Header */}
      <header className="px-6 py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">⚽ COPA DORADA</h1>
          <p className="text-slate-600">Fundación Corazón de Azúcar</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Selector de Grupo dinámico */}
        <div className="flex gap-3 flex-wrap">
          {Object.keys(groupsData).map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={
                `px-6 py-2 rounded-lg font-bold transition-all ` +
                (activeGroup === group
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300")
              }
            >
              Grupo {group}
            </button>
          ))}
        </div>
        {/* Add/Delete Group */}
        <div className="flex gap-2 items-center mt-2">
          <input
            type="text"
            placeholder="Nuevo grupo (ej: C)"
            className="border rounded px-2 py-1"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value.toUpperCase())}
            maxLength={2}
          />
          <button
            className="bg-green-600 text-white px-3 py-1 rounded"
            onClick={handleAddGroup}
          >
            Agregar Grupo
          </button>
          {activeGroup && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => handleDeleteGroup(activeGroup)}
              disabled={Object.keys(groupsData).length <= 1}
            >
              Eliminar Grupo
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {["Jornada", "Calendario", "Tabla", "Equipos"].map((tab) => (
            <TabButton key={tab} label={tab} />
          ))}
        </div>

        {/* Contenido Principal */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab} - Grupo {activeGroup}
          </h2>

          {/* Equipos CRUD UI */}
          {activeTab === "Equipos" && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-center font-bold mb-2">
                Equipos del Grupo {activeGroup}
              </h3>
              {teamsLoading ? (
                <div className="text-center text-gray-500">
                  Cargando equipos...
                </div>
              ) : (
                <ul className="space-y-2">
                  {(groupsData[activeGroup] || []).map((team) => (
                    <li key={team} className="flex items-center gap-2">
                      {editTeam.group === activeGroup &&
                      editTeam.oldName === team ? (
                        <>
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editTeam.newName}
                            onChange={(e) =>
                              setEditTeam({
                                ...editTeam,
                                newName: e.target.value,
                              })
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
                            onClick={() =>
                              setEditTeam({
                                group: "",
                                oldName: "",
                                newName: "",
                              })
                            }
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-800">
                            {team}
                          </span>
                          <button
                            className="bg-yellow-500 text-white px-2 py-1 rounded"
                            onClick={() => startEditTeam(activeGroup, team)}
                          >
                            Editar
                          </button>
                          <button
                            className="bg-red-600 text-white px-2 py-1 rounded"
                            onClick={() => handleDeleteTeam(activeGroup, team)}
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {/* Add Team */}
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  placeholder="Nuevo equipo"
                  className="border rounded px-2 py-1"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={() => handleAddTeam(activeGroup)}
                >
                  Agregar Equipo
                </button>
              </div>
            </div>
          )}

          {activeTab === "Jornada" && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">🗓️</span>
              </div>
              <h3 className="text-center font-bold mb-2">Partidos Jornada 2</h3>
              <div className="space-y-3">
                {matches
                  .filter((m) => m.grupo === activeGroup)
                  .map((match) => (
                    <div
                      key={match.id}
                      className="bg-slate-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between border"
                    >
                      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                        <span className="font-semibold text-gray-800 w-32 text-right">
                          {match.local}
                        </span>
                        <input
                          type="number"
                          min="0"
                          className="w-12 text-center border rounded mx-1"
                          value={match.scoreLocal ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              match.id,
                              "scoreLocal",
                              e.target.value
                            )
                          }
                          disabled={match.played}
                        />
                        <span className="mx-2 text-gray-500 font-bold">vs</span>
                        <input
                          type="number"
                          min="0"
                          className="w-12 text-center border rounded mx-1"
                          value={match.scoreVisitante ?? ""}
                          onChange={(e) =>
                            handleScoreChange(
                              match.id,
                              "scoreVisitante",
                              e.target.value
                            )
                          }
                          disabled={match.played}
                        />
                        <span className="font-semibold text-gray-800 w-32 text-left">
                          {match.visitante}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <span className="text-xs text-gray-400">
                          {match.dia} {match.fecha} {match.hora}
                        </span>
                        {!match.played && (
                          <button
                            className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition"
                            onClick={() => handleSaveScore(match)}
                          >
                            Guardar
                          </button>
                        )}
                        {match.played && (
                          <span className="ml-4 text-green-600 font-bold">
                            Guardado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "Calendario" && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-center font-bold mb-2">
                Calendario Grupo {activeGroup}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-green-50">
                      <th className="px-2 py-1 border">Jornada</th>
                      <th className="px-2 py-1 border">Partidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeGroup === "A" ? CALENDARIO_A : CALENDARIO_B).map(
                      (j) => (
                        <tr key={j.jornada}>
                          <td className="border px-2 py-1 font-bold text-center">
                            {j.jornada}
                          </td>
                          <td className="border px-2 py-1">
                            <ul>
                              {j.partidos.map((p, idx) => (
                                <li
                                  key={idx}
                                  className="flex gap-2 items-center"
                                >
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
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Tabla" && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">🏆</span>
              </div>
              <h3 className="text-center font-bold mb-2">
                Tabla de Posiciones Grupo {activeGroup}
              </h3>
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
                    {standings[activeGroup]?.map((row) => (
                      <tr key={row.equipo}>
                        <td className="border px-2 py-1 font-semibold">
                          {row.equipo}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.PJ}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.PG}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.PE}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.PP}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.GF}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.GC}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.PTS}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

export default App;
