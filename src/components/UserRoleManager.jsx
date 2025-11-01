// Gestión de roles de usuario

import React from "react";
import useUsers from "../hooks/useUsers";
import useAuth from "../hooks/useAuth";

export default function UserRoleManager() {
  const { userList, userListLoading, userListError } = useUsers();
  const { user, updateUserRole } = useAuth();

  if (userListLoading) return <div>Cargando usuarios...</div>;
  if (userListError) return <div className="text-red-500">{userListError}</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-lg font-bold mb-4">Gestión de Usuarios</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-2 text-left">Email</th>
            <th className="py-2 px-2 text-left">Rol</th>
            <th className="py-2 px-2 text-left">Acción</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="py-2 px-2">{u.email}</td>
              <td className="py-2 px-2 uppercase">{u.role}</td>
              <td className="py-2 px-2">
                {u.role === "admin" ? (
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    onClick={() => updateUserRole(u.id, "viewer")}
                    disabled={u.id === user?.uid}
                  >
                    Quitar admin
                  </button>
                ) : (
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    onClick={() => updateUserRole(u.id, "admin")}
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
  );
}
