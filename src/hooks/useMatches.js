import React, { useState, useEffect, useCallback } from "react";
import {
  getMatches,
  addMatch,
  updateMatch,
  deleteMatch,
} from "../services/firebaseMatches";

// Hook personalizado para gestión de partidos
export default function useMatches(activeGroup) {
  // Estado de partidos y edición
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [editingMatch, setEditingMatch] = useState(null);
  const [newMatch, setNewMatch] = useState({
    grupo: activeGroup,
    local: "",
    visitante: "",
    dia: "",
    fecha: "",
    hora: "",
  });

  // Cargar partidos desde Firestore
  useEffect(() => {
    setLoading(true);
    getMatches(activeGroup)
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, [activeGroup]);

  // Handlers CRUD Firestore
  const handleAddMatch = useCallback(async () => {
    if (
      !newMatch.local ||
      !newMatch.visitante ||
      newMatch.local === newMatch.visitante
    )
      return;
    const matchToAdd = { ...newMatch, grupo: activeGroup };
    const added = await addMatch(matchToAdd);
    setMatches((prev) => [...prev, added]);
    setNewMatch({
      grupo: activeGroup,
      local: "",
      visitante: "",
      dia: "",
      fecha: "",
      hora: "",
    });
  }, [newMatch, activeGroup]);

  const handleEditMatchSave = useCallback(async () => {
    if (
      !editingMatch ||
      !editingMatch.local ||
      !editingMatch.visitante ||
      editingMatch.local === editingMatch.visitante
    )
      return;
    await updateMatch(editingMatch.id, editingMatch);
    setMatches((prev) =>
      prev.map((m) => (m.id === editingMatch.id ? editingMatch : m))
    );
    setEditingMatch(null);
  }, [editingMatch]);

  const handleDeleteMatch = useCallback(async (id) => {
    await deleteMatch(id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return {
    matches,
    loading,
    error,
    editingMatch,
    setEditingMatch,
    newMatch,
    setNewMatch,
    handleAddMatch,
    handleEditMatchSave,
    handleDeleteMatch,
  };
}
