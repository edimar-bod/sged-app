// Hook personalizado para gestión de usuarios y roles
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const USERS_COLLECTION = "users";

export default function useUsers() {
  const [userList, setUserList] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState("");

  useEffect(() => {
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
  }, []);

  return { userList, userListLoading, userListError };
}
