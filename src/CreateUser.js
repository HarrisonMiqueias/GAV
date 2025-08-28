import React, { useState } from "react";
import { api } from "./api";
import { useNavigate } from "react-router-dom";
import "../src/CreateUser.css";

export default function CreateUser() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("Digite seu nome");

    try {
      const res = await api.post("/api/users", { name }); // não precisa repetir URL inteira
      console.log("Usuário criado:", res.data);
      navigate("/gather", { state: { name: res.data.name } });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar usuário");
    }
  };

  return (
    <div className="login-container">
      
      <form onSubmit={handleSubmit} className=" bg-white p-5 rounded shadow">
        <h2 className="text-xl mb-4">Criar Usuário</h2>
        <input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-4 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
