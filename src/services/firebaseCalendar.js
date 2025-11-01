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

// Obtener calendario por grupo
export async function getCalendar(group) {
  const q = query(collection(db, "calendar"), where("grupo", "==", group));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Agregar una jornada/calendario
export async function addCalendarEntry(entry) {
  const docRef = await addDoc(collection(db, "calendar"), entry);
  return { id: docRef.id, ...entry };
}

// Actualizar una jornada/calendario
export async function updateCalendarEntry(id, entry) {
  const entryRef = doc(db, "calendar", id);
  await updateDoc(entryRef, entry);
  return { id, ...entry };
}

// Eliminar una jornada/calendario
export async function deleteCalendarEntry(id) {
  const entryRef = doc(db, "calendar", id);
  await deleteDoc(entryRef);
}
