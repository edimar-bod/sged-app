import React, { useState } from "react";

function AuthForm({ onLogin, onLogout, user, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-gray-700">
          Conectado como <b>{user.email}</b>
        </div>
        <button
          className="bg-red-600 text-white px-3 py-1 rounded"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 items-center"
      onSubmit={(e) => {
        e.preventDefault();
        onLogin(email, password);
      }}
    >
      <input
        type="email"
        placeholder="Correo electrónico"
        className="border rounded px-2 py-1"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="border rounded px-2 py-1"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded w-full"
        disabled={loading}
      >
        Iniciar sesión
      </button>
      {/* Google login button removed */}
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
    </form>
  );
}

export default AuthForm;
