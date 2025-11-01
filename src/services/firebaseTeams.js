import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Obtener equipos por grupo
export async function getTeams(group) {
  const q = query(collection(db, "teams"), where("grupo", "==", group));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Agregar un equipo
export async function addTeam(team) {
  const docRef = await addDoc(collection(db, "teams"), team);
  return { id: docRef.id, ...team };
}

// Actualizar un equipo
export async function updateTeam(id, team) {
  const teamRef = doc(db, "teams", id);
  await updateDoc(teamRef, team);
  return { id, ...team };
}

// Eliminar un equipo
export async function deleteTeam(id) {
  const teamRef = doc(db, "teams", id);
  await deleteDoc(teamRef);
}
