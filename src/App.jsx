import React, { useEffect, useState } from "react";
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
  getDoc,
  updateDoc as updateUserDoc,
  onSnapshot,
} from "firebase/firestore";

// Eliminado import de tournamentData.js por error de sintaxis y migración finalizada
import AuthForm from "./AuthForm";

const CALENDAR_COLLECTION = "calendario";

// Firestore collection for teams and groups
const TEAMS_COLLECTION = "teams";
const USERS_COLLECTION = "users";

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [userRole, setUserRole] = useState(null); // 'admin' | 'viewer' | null
  const isAdmin = userRole === "admin";

  const [activeGroup, setActiveGroup] = useState("A");
  const [activeTab, setActiveTab] = useState("Jornada");
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
  // Calendario state
  const [calendar, setCalendar] = useState({ A: [], B: [] });
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [editingJornada, setEditingJornada] = useState(null); // { group, jornada, partidos }
  const [newJornada, setNewJornada] = useState({
    jornada: "",
    partidos: [{ local: "", visitante: "" }],
  });
  // Admin user management
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState("");
  // Admin: fetch all users for role management
  useEffect(() => {
    if (!isAdmin) return;
    setUserListLoading(true);
    setUserListError("");
    const unsub = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snap) => {
        try {
          const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUserList(users);
          setUserListLoading(false);
        } catch (e) {
          setUserListError("Error cargando usuarios: " + e.message);
          setUserListLoading(false);
        }
      },
      (err) => {
        setUserListError("Error cargando usuarios: " + err.message);
        setUserListLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  // Admin: change user role
  const handleChangeUserRole = async (uid, newRole) => {
    try {
      await updateUserDoc(doc(db, USERS_COLLECTION, uid), { role: newRole });
    } catch (e) {
      alert("Error cambiando rol: " + e.message);
    }
  };

  // Auth handlers
  // On auth state change, fetch user role from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        // Fetch user role from Firestore
        const userDocRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role || "viewer");
        } else {
          // If user doc doesn't exist, create as viewer
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            role: "viewer",
          });
          setUserRole("viewer");
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle user/role
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
      setUserRole(null);
    } catch (e) {
      setAuthError("Error al cerrar sesión: " + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Compute standings from matches (move this above useEffect)
  // Compute standings from calendar data whenever calendar or groupsData changes
  useEffect(() => {
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
          // DIF solo para uso interno
          DIF: 0,
        };
      });
      // Recorre todas las jornadas y partidos del calendario
      (calendar[group] || []).forEach((jornada) => {
        (jornada.partidos || []).forEach((p) => {
          const l = p.local;
          const v = p.visitante;
          const gl = Number(p.scoreLocal);
          const gv = Number(p.scoreVisitante);
          // Solo cuenta si ambos scores son válidos
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
      });
      // Calcular DIF para cada equipo (uso interno)
      Object.values(stats).forEach((row) => {
        row.DIF = row.GF - row.GC;
      });
      // Ordenar según PTS, DIF, GF (reglamento)
      standingsObj[group] = Object.values(stats).sort((a, b) => {
        if (b.PTS !== a.PTS) return b.PTS - a.PTS;
        if (b.DIF !== a.DIF) return b.DIF - a.DIF;
        return b.GF - a.GF;
      });
    });
    setStandings(standingsObj);
  }, [calendar, groupsData]);

  // Load teams/groups from Firestore (on mount only)
  useEffect(() => {
    async function loadTeams() {
      setTeamsLoading(true);
      try {
        const colRef = collection(db, TEAMS_COLLECTION);
        const snap = await getDocs(colRef);
        let loadedGroups = {};
        if (!snap.empty) {
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
    loadTeams();
  }, []);

  // Load calendar from Firestore (on mount only)
  useEffect(() => {
    async function loadCalendar() {
      setCalendarLoading(true);
      setCalendarError("");
      try {
        const colRef = collection(db, CALENDAR_COLLECTION);
        const snap = await getDocs(colRef);
        let loadedCalendar = { A: [], B: [] };
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            loadedCalendar[d.id] = d.data().jornadas;
          });
        }
        setCalendar(loadedCalendar);
        setCalendarLoading(false);
      } catch (e) {
        setCalendarError("Error cargando calendario: " + e.message);
        setCalendarLoading(false);
      }
    }
    loadCalendar();
  }, []);

  // Teams CRUD handlers
  async function handleAddGroup() {
    if (!isAdmin || !newGroupName.trim() || groupsData[newGroupName]) return;
    const updated = { ...groupsData, [newGroupName]: [] };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, newGroupName), { teams: [] });
    setNewGroupName("");
  }

  async function handleDeleteGroup(group) {
    if (!isAdmin) return;
    if (
      !window.confirm(
        `⚠️ ADVERTENCIA: Esta acción eliminará el grupo "${group}" y todos sus equipos. ¿Deseas continuar?`
      )
    )
      return;
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
    if (!isAdmin) return;
    if (
      !window.confirm(
        `⚠️ ADVERTENCIA: Esta acción eliminará el equipo "${team}" del grupo "${group}". ¿Deseas continuar?`
      )
    )
      return;
    const updatedTeams = groupsData[group].filter((t) => t !== team);
    const updated = { ...groupsData, [group]: updatedTeams };
    setGroupsData(updated);
    await setDoc(doc(db, TEAMS_COLLECTION, group), { teams: updatedTeams });
  }

  // Admin: Add/Edit/Delete Jornada (matches) - DEPRECATED (using calendario instead)
  // Handlers para editar/guardar partidos en jornadas (calendario)
  async function handleSaveJornadaPartido(jornadaIndex, partidoIndex) {
    if (!isAdmin || !editingJornada) return;
    try {
      const updatedJornadas = [...(calendar[activeGroup] || [])];
      updatedJornadas[jornadaIndex].partidos[partidoIndex] = {
        local: editingJornada.local,
        visitante: editingJornada.visitante,
        scoreLocal: editingJornada.scoreLocal,
        scoreVisitante: editingJornada.scoreVisitante,
        fecha: editingJornada.fecha,
        hora: editingJornada.hora,
      };
      // Actualizar en Firestore
      await updateDoc(doc(db, CALENDAR_COLLECTION, activeGroup), {
        jornadas: updatedJornadas,
      });
      // Actualizar estado local
      setCalendar({
        ...calendar,
        [activeGroup]: updatedJornadas,
      });
      setEditingJornada(null);
    } catch (e) {
      alert("Error guardando partido: " + e.message);
    }
  }

  async function handleDeleteJornadaPartido(jornadaIndex, partidoIndex) {
    if (!isAdmin) return;
    if (
      !window.confirm(
        `⚠️ ADVERTENCIA: Esta acción eliminará el partido seleccionado de la jornada. ¿Deseas continuar?`
      )
    )
      return;
    try {
      const updatedJornadas = [...(calendar[activeGroup] || [])];
      updatedJornadas[jornadaIndex].partidos = updatedJornadas[
        jornadaIndex
      ].partidos.filter((_, idx) => idx !== partidoIndex);
      // Actualizar en Firestore
      await updateDoc(doc(db, CALENDAR_COLLECTION, activeGroup), {
        jornadas: updatedJornadas,
      });
      // Actualizar estado local
      setCalendar({
        ...calendar,
        [activeGroup]: updatedJornadas,
      });
      setEditingJornada(null);
    } catch (e) {
      alert("Error eliminando partido: " + e.message);
    }
  }

  // UI rendering
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
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        <AuthForm
          onLogin={handleLogin}
          onLogout={handleLogout}
          user={user}
          loading={authLoading}
          error={authError}
        />
        {user && (
          <div className="flex items-center gap-2 bg-white/90 rounded px-3 py-1 shadow text-xs text-slate-700 border transition-all duration-200">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-2">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-xs">{user.email}</span>
              <span
                className={`uppercase tracking-wide text-[10px] font-bold px-2 py-0.5 rounded ${
                  userRole === "admin"
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                    : "bg-gray-100 text-gray-500 border border-gray-300"
                }`}
              >
                {userRole === "admin" ? "ADMINISTRADOR" : "VISOR"}
              </span>
            </div>
          </div>
        )}
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
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-2">
          <input
            type="text"
            placeholder="Nuevo grupo (ej: C)"
            className="border rounded px-2 py-1 w-full sm:w-auto"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value.toUpperCase())}
            maxLength={2}
            disabled={!isAdmin}
          />
          <button
            className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50 w-full sm:w-auto"
            onClick={handleAddGroup}
            disabled={!isAdmin}
          >
            Agregar Grupo
          </button>
          {activeGroup && (
            <button
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50 w-full sm:w-auto"
              onClick={() => handleDeleteGroup(activeGroup)}
              disabled={!isAdmin || Object.keys(groupsData).length <= 1}
            >
              Eliminar Grupo
            </button>
          )}
          {!isAdmin && (
            <span className="text-xs text-red-500 ml-2">
              Solo administradores pueden editar grupos
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {["Jornada", "Calendario", "Tabla", "Equipos"].map((tab) => (
            <TabButton key={tab} label={tab} />
          ))}
        </div>
        {!isAdmin && user && (
          <div className="my-2 text-xs text-red-500 text-center animate-pulse">
            Solo los administradores pueden editar datos. Si necesitas permisos,
            contacta a un administrador.
          </div>
        )}

        {/* Contenido Principal */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === "Jornada" ? "Jornadas" : activeTab} - Grupo{" "}
            {activeGroup}
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
                            className="bg-yellow-500 text-white px-2 py-1 rounded disabled:opacity-50"
                            onClick={() => startEditTeam(activeGroup, team)}
                            disabled={!isAdmin}
                          >
                            Editar
                          </button>
                          <button
                            className="bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                            onClick={() => handleDeleteTeam(activeGroup, team)}
                            disabled={!isAdmin}
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
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <input
                  type="text"
                  placeholder="Nuevo equipo"
                  className="border rounded px-2 py-1 w-full sm:w-auto"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={!isAdmin}
                />
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50 w-full sm:w-auto"
                  onClick={() => handleAddTeam(activeGroup)}
                  disabled={!isAdmin}
                >
                  Agregar Equipo
                </button>
                {!isAdmin && (
                  <span className="text-xs text-red-500 ml-2">
                    Solo administradores pueden editar equipos
                  </span>
                )}
              </div>
            </div>
          )}

          {activeTab === "Jornada" && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center mx-auto mb-2">
                <span className="text-3xl">🗓️</span>
              </div>
              <h3 className="text-center font-bold mb-2">
                Todas las Jornadas - Grupo {activeGroup}
              </h3>
              {calendarLoading && (
                <div className="text-center text-gray-500">
                  Cargando jornadas...
                </div>
              )}
              {calendarError && (
                <div className="text-center text-red-500">{calendarError}</div>
              )}
              {!calendarLoading &&
                !calendarError &&
                (calendar[activeGroup] || []).length === 0 && (
                  <div className="text-center text-gray-500">
                    No hay jornadas registradas
                  </div>
                )}
              <div className="space-y-6">
                {(calendar[activeGroup] || []).map((jornada, jornadaIndex) => (
                  <div
                    key={jornadaIndex}
                    className="bg-white rounded-lg border-2 border-indigo-200 p-4"
                  >
                    <h4 className="text-lg font-bold text-indigo-600 mb-4">
                      {`Jornada ${jornadaIndex + 1}`}
                    </h4>
                    <div className="space-y-3">
                      {(jornada.partidos || []).map((partido, partidoIndex) => {
                        const matchKey = `${jornadaIndex}-${partidoIndex}`;
                        const isEditing = editingJornada?.matchKey === matchKey;
                        return (
                          <div
                            key={matchKey}
                            className="bg-slate-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between border"
                          >
                            {isEditing ? (
                              <div className="flex-1 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                                <select
                                  className="border rounded px-2 py-1 w-full sm:w-auto"
                                  value={editingJornada.local || ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      local: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Local</option>
                                  {(groupsData[activeGroup] || []).map(
                                    (team) => (
                                      <option
                                        key={team}
                                        value={team}
                                        disabled={
                                          team === editingJornada.visitante
                                        }
                                      >
                                        {team}
                                      </option>
                                    )
                                  )}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-16 text-center border rounded"
                                  placeholder="Goles"
                                  value={editingJornada.scoreLocal ?? ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      scoreLocal: e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined,
                                    })
                                  }
                                />
                                <span className="text-gray-400 font-bold">
                                  vs
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-16 text-center border rounded"
                                  placeholder="Goles"
                                  value={editingJornada.scoreVisitante ?? ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      scoreVisitante: e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined,
                                    })
                                  }
                                />
                                <select
                                  className="border rounded px-2 py-1 w-full sm:w-auto"
                                  value={editingJornada.visitante || ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      visitante: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">Visitante</option>
                                  {(groupsData[activeGroup] || []).map(
                                    (team) => (
                                      <option
                                        key={team}
                                        value={team}
                                        disabled={team === editingJornada.local}
                                      >
                                        {team}
                                      </option>
                                    )
                                  )}
                                </select>
                                <input
                                  type="date"
                                  className="border rounded px-2 py-1 w-full sm:w-auto"
                                  value={editingJornada.fecha || ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      fecha: e.target.value,
                                    })
                                  }
                                />
                                <input
                                  type="time"
                                  className="border rounded px-2 py-1 w-full sm:w-auto"
                                  value={editingJornada.hora || ""}
                                  onChange={(e) =>
                                    setEditingJornada({
                                      ...editingJornada,
                                      hora: e.target.value,
                                    })
                                  }
                                />
                                <button
                                  className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50 w-full sm:w-auto"
                                  onClick={() =>
                                    handleSaveJornadaPartido(
                                      jornadaIndex,
                                      partidoIndex
                                    )
                                  }
                                  disabled={
                                    !editingJornada?.local ||
                                    !editingJornada?.visitante ||
                                    editingJornada.local ===
                                      editingJornada.visitante
                                  }
                                >
                                  Guardar
                                </button>
                                <button
                                  className="bg-gray-400 text-white px-2 py-1 rounded w-full sm:w-auto"
                                  onClick={() => setEditingJornada(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                                  <span className="font-semibold text-gray-800 w-32 text-right">
                                    {partido.local}
                                  </span>
                                  <span className="text-lg font-bold text-indigo-600 w-16 text-center">
                                    {partido.scoreLocal ?? "-"}
                                  </span>
                                  <span className="mx-2 text-gray-500 font-bold">
                                    vs
                                  </span>
                                  <span className="text-lg font-bold text-indigo-600 w-16 text-center">
                                    {partido.scoreVisitante ?? "-"}
                                  </span>
                                  <span className="font-semibold text-gray-800 w-32 text-left">
                                    {partido.visitante}
                                  </span>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {partido.fecha} {partido.hora}
                                  </span>
                                </div>
                                {isAdmin && (
                                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    <button
                                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                                      onClick={() =>
                                        setEditingJornada({
                                          ...partido,
                                          matchKey,
                                          jornadaIndex,
                                          partidoIndex,
                                        })
                                      }
                                    >
                                      Editar
                                    </button>
                                    <button
                                      className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                                      onClick={() =>
                                        handleDeleteJornadaPartido(
                                          jornadaIndex,
                                          partidoIndex
                                        )
                                      }
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
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
              {calendarLoading ? (
                <div className="text-center text-gray-500">
                  Cargando calendario...
                </div>
              ) : calendarError ? (
                <div className="text-center text-red-500">{calendarError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="px-2 py-1 border">Jornada</th>
                        <th className="px-2 py-1 border">Partidos</th>
                        {isAdmin && (
                          <th className="px-2 py-1 border">Acción</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {calendar[activeGroup]?.map((j, ji) => (
                        <tr key={j.jornada}>
                          <td className="border px-2 py-1 font-bold text-center">
                            {editingJornada && editingJornada.index === ji ? (
                              <input
                                type="text"
                                className="border rounded px-2 py-1"
                                value={editingJornada.jornada}
                                onChange={(e) =>
                                  setEditingJornada({
                                    ...editingJornada,
                                    jornada: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              j.jornada
                            )}
                          </td>
                          <td className="border px-2 py-1">
                            <ul>
                              {(editingJornada && editingJornada.index === ji
                                ? editingJornada.partidos
                                : j.partidos
                              ).map((p, pi) => (
                                <li
                                  key={pi}
                                  className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                                >
                                  {editingJornada &&
                                  editingJornada.index === ji ? (
                                    <>
                                      <select
                                        className="border rounded px-2 py-1 w-full sm:w-auto"
                                        value={p.local}
                                        onChange={(e) => {
                                          const partidos = [
                                            ...editingJornada.partidos,
                                          ];
                                          partidos[pi].local = e.target.value;
                                          setEditingJornada({
                                            ...editingJornada,
                                            partidos,
                                          });
                                        }}
                                      >
                                        <option value="">Local</option>
                                        {(groupsData[activeGroup] || []).map(
                                          (team) => (
                                            <option
                                              key={team}
                                              value={team}
                                              disabled={team === p.visitante}
                                            >
                                              {team}
                                            </option>
                                          )
                                        )}
                                      </select>
                                      <span className="text-gray-400">vs</span>
                                      <select
                                        className="border rounded px-2 py-1 w-full sm:w-auto"
                                        value={p.visitante}
                                        onChange={(e) => {
                                          const partidos = [
                                            ...editingJornada.partidos,
                                          ];
                                          partidos[pi].visitante =
                                            e.target.value;
                                          setEditingJornada({
                                            ...editingJornada,
                                            partidos,
                                          });
                                        }}
                                      >
                                        <option value="">Visitante</option>
                                        {(groupsData[activeGroup] || []).map(
                                          (team) => (
                                            <option
                                              key={team}
                                              value={team}
                                              disabled={team === p.local}
                                            >
                                              {team}
                                            </option>
                                          )
                                        )}
                                      </select>
                                      <button
                                        className="bg-red-600 text-white px-2 py-1 rounded ml-2"
                                        onClick={() => {
                                          if (
                                            !window.confirm(
                                              "⚠️ ADVERTENCIA: Esta acción eliminará el partido del editor de jornada. ¿Deseas continuar?"
                                            )
                                          )
                                            return;
                                          const partidos =
                                            editingJornada.partidos.filter(
                                              (_, idx) => idx !== pi
                                            );
                                          setEditingJornada({
                                            ...editingJornada,
                                            partidos,
                                          });
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold text-gray-700">
                                        {p.local}
                                      </span>
                                      <span className="text-gray-400">vs</span>
                                      <span className="font-semibold text-gray-700">
                                        {p.visitante}
                                      </span>
                                    </>
                                  )}
                                </li>
                              ))}
                              {editingJornada &&
                                editingJornada.index === ji && (
                                  <li className="mt-2">
                                    <button
                                      className="bg-blue-600 text-white px-2 py-1 rounded"
                                      onClick={() =>
                                        setEditingJornada({
                                          ...editingJornada,
                                          partidos: [
                                            ...editingJornada.partidos,
                                            { local: "", visitante: "" },
                                          ],
                                        })
                                      }
                                    >
                                      Agregar Partido
                                    </button>
                                  </li>
                                )}
                            </ul>
                          </td>
                          {isAdmin && (
                            <td className="border px-2 py-1 text-center">
                              {editingJornada && editingJornada.index === ji ? (
                                <>
                                  <button
                                    className="bg-green-600 text-white px-2 py-1 rounded mr-2 disabled:opacity-50"
                                    onClick={async () => {
                                      // Validate partidos before save
                                      const invalid =
                                        editingJornada.partidos.some(
                                          (p) =>
                                            !p.local ||
                                            !p.visitante ||
                                            p.local === p.visitante
                                        );
                                      if (!editingJornada.jornada || invalid) {
                                        alert(
                                          "Completa la jornada y asegúrate de que Local y Visitante sean diferentes en todos los partidos"
                                        );
                                        return;
                                      }
                                      const updated = [
                                        ...calendar[activeGroup],
                                      ];
                                      updated[ji] = {
                                        jornada: editingJornada.jornada,
                                        partidos: editingJornada.partidos,
                                      };
                                      setCalendar({
                                        ...calendar,
                                        [activeGroup]: updated,
                                      });
                                      await setDoc(
                                        doc(
                                          db,
                                          CALENDAR_COLLECTION,
                                          activeGroup
                                        ),
                                        { jornadas: updated }
                                      );
                                      setEditingJornada(null);
                                    }}
                                    disabled={
                                      !editingJornada?.jornada ||
                                      editingJornada.partidos.some(
                                        (p) =>
                                          !p.local ||
                                          !p.visitante ||
                                          p.local === p.visitante
                                      )
                                    }
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    className="bg-gray-400 text-white px-2 py-1 rounded"
                                    onClick={() => setEditingJornada(null)}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                                    onClick={() =>
                                      setEditingJornada({ ...j, index: ji })
                                    }
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="bg-red-600 text-white px-2 py-1 rounded"
                                    onClick={async () => {
                                      const updated = calendar[
                                        activeGroup
                                      ].filter((_, idx) => idx !== ji);
                                      setCalendar({
                                        ...calendar,
                                        [activeGroup]: updated,
                                      });
                                      await setDoc(
                                        doc(
                                          db,
                                          CALENDAR_COLLECTION,
                                          activeGroup
                                        ),
                                        { jornadas: updated }
                                      );
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {isAdmin && (
                        <tr>
                          <td className="border px-2 py-1">
                            <input
                              type="text"
                              className="border rounded px-2 py-1"
                              placeholder="Nueva jornada"
                              value={newJornada.jornada}
                              onChange={(e) =>
                                setNewJornada({
                                  ...newJornada,
                                  jornada: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="border px-2 py-1">
                            <ul>
                              {newJornada.partidos.map((p, pi) => (
                                <li
                                  key={pi}
                                  className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                                >
                                  <select
                                    className="border rounded px-2 py-1 w-full sm:w-auto"
                                    value={p.local}
                                    onChange={(e) => {
                                      const partidos = [...newJornada.partidos];
                                      partidos[pi].local = e.target.value;
                                      setNewJornada({
                                        ...newJornada,
                                        partidos,
                                      });
                                    }}
                                  >
                                    <option value="">Local</option>
                                    {(groupsData[activeGroup] || []).map(
                                      (team) => (
                                        <option
                                          key={team}
                                          value={team}
                                          disabled={team === p.visitante}
                                        >
                                          {team}
                                        </option>
                                      )
                                    )}
                                  </select>
                                  <span className="text-gray-400">vs</span>
                                  <select
                                    className="border rounded px-2 py-1 w-full sm:w-auto"
                                    value={p.visitante}
                                    onChange={(e) => {
                                      const partidos = [...newJornada.partidos];
                                      partidos[pi].visitante = e.target.value;
                                      setNewJornada({
                                        ...newJornada,
                                        partidos,
                                      });
                                    }}
                                  >
                                    <option value="">Visitante</option>
                                    {(groupsData[activeGroup] || []).map(
                                      (team) => (
                                        <option
                                          key={team}
                                          value={team}
                                          disabled={team === p.local}
                                        >
                                          {team}
                                        </option>
                                      )
                                    )}
                                  </select>
                                  <button
                                    className="bg-red-600 text-white px-2 py-1 rounded ml-2"
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          "⚠️ ADVERTENCIA: Esta acción eliminará el partido del editor de jornada. ¿Deseas continuar?"
                                        )
                                      )
                                        return;
                                      const partidos =
                                        newJornada.partidos.filter(
                                          (_, idx) => idx !== pi
                                        );
                                      setNewJornada({
                                        ...newJornada,
                                        partidos,
                                      });
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </li>
                              ))}
                              <li className="mt-2">
                                <button
                                  className="bg-blue-600 text-white px-2 py-1 rounded"
                                  onClick={() =>
                                    setNewJornada({
                                      ...newJornada,
                                      partidos: [
                                        ...newJornada.partidos,
                                        { local: "", visitante: "" },
                                      ],
                                    })
                                  }
                                >
                                  Agregar Partido
                                </button>
                              </li>
                            </ul>
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <button
                              className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                              onClick={async () => {
                                // Validate all partidos
                                const invalid = newJornada.partidos.some(
                                  (p) =>
                                    !p.local ||
                                    !p.visitante ||
                                    p.local === p.visitante
                                );
                                if (!newJornada.jornada || invalid) {
                                  alert(
                                    "Completa la jornada y asegúrate de que Local y Visitante sean diferentes en todos los partidos"
                                  );
                                  return;
                                }
                                const updated = [
                                  ...(calendar[activeGroup] || []),
                                  {
                                    jornada: newJornada.jornada,
                                    partidos: newJornada.partidos,
                                  },
                                ];
                                setCalendar({
                                  ...calendar,
                                  [activeGroup]: updated,
                                });
                                await setDoc(
                                  doc(db, CALENDAR_COLLECTION, activeGroup),
                                  { jornadas: updated }
                                );
                                setNewJornada({
                                  jornada: "",
                                  partidos: [{ local: "", visitante: "" }],
                                });
                              }}
                              disabled={
                                !newJornada.jornada ||
                                newJornada.partidos.some(
                                  (p) =>
                                    !p.local ||
                                    !p.visitante ||
                                    p.local === p.visitante
                                )
                              }
                            >
                              Agregar Jornada
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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

        {/* Admin User Management UI */}
        {isAdmin && (
          <section className="bg-white rounded-xl border p-6 mt-8">
            <h2 className="text-lg font-bold mb-4">
              Gestión de Usuarios (Solo Admin)
            </h2>
            {userListLoading ? (
              <div className="text-gray-500">Cargando usuarios...</div>
            ) : userListError ? (
              <div className="text-red-500">{userListError}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-2 py-1 border">Email</th>
                      <th className="px-2 py-1 border">Rol</th>
                      <th className="px-2 py-1 border">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u) => (
                      <tr key={u.id}>
                        <td className="border px-2 py-1">{u.email}</td>
                        <td className="border px-2 py-1 text-center">
                          {u.role}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {u.role === "admin" ? (
                            <button
                              className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                              onClick={() =>
                                handleChangeUserRole(u.id, "viewer")
                              }
                              disabled={u.id === user?.uid}
                            >
                              Quitar admin
                            </button>
                          ) : (
                            <button
                              className="bg-green-600 text-white px-2 py-1 rounded"
                              onClick={() =>
                                handleChangeUserRole(u.id, "admin")
                              }
                            >
                              Hacer admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
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
