// Hook personalizado para gestión de calendario
import { useState, useEffect } from "react";
import { getCalendar } from "../services/firebaseCalendar";

export default function useCalendar(group = "A") {
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendar(group)
      .then((data) => {
        setCalendar(data);
        setLoading(false);
      })
      .catch(() => {
        setCalendar([]);
        setLoading(false);
      });
  }, [group]);

  return { calendar, loading };
}
