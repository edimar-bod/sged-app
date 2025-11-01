import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const USERS_COLLECTION = "users";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [userRole, setUserRole] = useState(null); // 'admin' | 'viewer' | null
  const isAdmin = userRole === "admin";

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

  const login = useCallback(async (email, password) => {
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
  }, []);

  const logout = useCallback(async () => {
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
  }, []);

  // Admin: change user role
  const updateUserRole = useCallback(async (uid, newRole) => {
    try {
      await updateDoc(doc(db, USERS_COLLECTION, uid), { role: newRole });
    } catch (e) {
      setAuthError("Error cambiando rol: " + e.message);
    }
  }, []);

  return {
    user,
    userRole,
    isAdmin,
    authLoading,
    authError,
    login,
    logout,
    updateUserRole,
  };
}
