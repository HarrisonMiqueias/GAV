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
   <div
  className="login-container"
  style={{
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  }}
>
      
      <form onSubmit={handleSubmit} className=" bg-white p-5 rounded shadow"
        style={{ 
          width: "300px", 
          textAlign: "center" 

        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: 
            "center", alignItems: 
            "center", 
            flexDirection: "column",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}>
         
          <div style={{
            marginBottom: "20px",
            fontSize: "24px", 
            fontWeight: "bold",
            color: "#007BFF", 
            }}>Bem-vindo ao SiCAV!</div>
        <h2 className="text-xl mb-4" style={{
          fontWeight: "bold", 
          marginBottom: "20px",
          color: "#333"
        }}>Digite seu nome!</h2>
        <input
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full mb-4 rounded"
          style={{ marginBottom: "20px",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "100%",
            boxSizing: "border-box", 
            fontSize: "16px",
          }}
        />
        <button
          style={{
            backgroundColor: "#007BFF",
            color: "#fff",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
            fontSize: "16px",
            fontWeight: "bold",
            transition: "background-color 0.3s",
            hover: {
              backgroundColor: "#0056b3"
            }
          }}
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Entrar
        </button>
        </div>
      </form>
<style>
{`
.wave {
  position: absolute;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, #54e0ea, #ff6ec7);
  animation: waveMove 10s linear infinite;
  clip-path: polygon(
    0% 50%, 10% 52%, 20% 48%, 30% 53%, 40% 50%,
    50% 52%, 60% 48%, 70% 53%, 80% 50%, 90% 52%, 100% 50%,
    100% 100%, 0% 100%
  );
}

@keyframes waveMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`}
</style>
    </div>
    
  );
}
