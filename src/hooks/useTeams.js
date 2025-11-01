// Hook personalizado para gestión de equipos
import { useState, useEffect, useCallback } from "react";
import {
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
} from "../services/firebaseTeams";

export default function useTeams(activeGroup) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [editingTeam, setEditingTeam] = useState(null); // { oldName, newName }

  // Cargar equipos desde Firestore
  useEffect(() => {
    setLoading(true);
    getTeams(activeGroup)
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch(() => {
        setTeams([]);
        setLoading(false);
      });
  }, [activeGroup]);

  // Handlers CRUD Firestore
  const handleAddTeam = useCallback(async () => {
    if (!newTeam.trim() || teams.some((t) => t.name === newTeam)) return;
    const teamToAdd = { name: newTeam, grupo: activeGroup };
    const added = await addTeam(teamToAdd);
    setTeams((prev) => [...prev, added]);
    setNewTeam("");
  }, [newTeam, teams, activeGroup]);

  const startEditTeam = useCallback((team) => {
    setEditingTeam({ id: team.id, oldName: team.name, newName: team.name });
  }, []);

  const handleEditTeamSave = useCallback(async () => {
    if (!editingTeam || !editingTeam.newName.trim()) return;
    await updateTeam(editingTeam.id, {
      name: editingTeam.newName,
      grupo: activeGroup,
    });
    setTeams((prev) =>
      prev.map((t) =>
        t.id === editingTeam.id ? { ...t, name: editingTeam.newName } : t
      )
    );
    setEditingTeam(null);
  }, [editingTeam, activeGroup]);

  const handleDeleteTeam = useCallback(async (id) => {
    await deleteTeam(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
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
  };
}
