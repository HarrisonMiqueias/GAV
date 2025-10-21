// src/pages/CreateUser.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
function CreateUser() {

  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem("userName", name);
    navigate("/gather");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded p-2 mb-2 w-64"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded w-64 hover:bg-blue-600"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default CreateUser;
