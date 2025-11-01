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

// Obtener partidos por grupo
export async function getMatches(group) {
  const q = query(collection(db, "matches"), where("grupo", "==", group));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Agregar un partido
export async function addMatch(match) {
  const docRef = await addDoc(collection(db, "matches"), match);
  return { id: docRef.id, ...match };
}

// Actualizar un partido
export async function updateMatch(id, match) {
  const matchRef = doc(db, "matches", id);
  await updateDoc(matchRef, match);
  return { id, ...match };
}

// Eliminar un partido
export async function deleteMatch(id) {
  const matchRef = doc(db, "matches", id);
  await deleteDoc(matchRef);
}
