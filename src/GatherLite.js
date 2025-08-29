import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client"; 
import SimplePeer from "simple-peer";
import process from "process";
window.process = process;

// Servidor de sinalização
export default function GatherLite() {
  // GatherLite.js
const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "http://localhost:5000";

  const USER_RADIUS = 120;
  const location = useLocation();
  const userName = location.state?.name || "Você";
  const [me, setMe] = useState({ id: null, x: 700, y: 300, name: userName });
  const [users, setUsers] = useState({});

  // Referências
  const socketRef = useRef(null); // socket
  const peersRef = useRef({}); // mapa de peers ativos {peerId: SimplePeer}
  const remoteVideosRef = useRef({}); // referência dos vídeos remotos
  const localVideoRef = useRef(null); // vídeo local
  const localStreamRef = useRef(null); // stream local
  const mapRef = useRef(null); // referência do mapa

  // -------------------- PEGAR MÍDIA LOCAL --------------------
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch((err) => console.warn("Falha ao acessar câmera/microfone:", err));
  }, []);

  // -------------------- CONFIGURAÇÃO DO SOCKET --------------------
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      const myId = socketRef.current.id;
      setMe((prev) => {
        const newMe = { ...prev, id: myId };
        // Emitir join somente após ter o id
        socketRef.current.emit("join", { x: newMe.x, y: newMe.y, name: newMe.name });
        return newMe;
      });
    });

    // Recebe estado de todos os usuários
    socketRef.current.on("state", (serverUsers) => setUsers(serverUsers));

    // Usuário desconectou
    socketRef.current.on("user-left", (id) => {
      setUsers((u) => {
        const clone = { ...u };
        delete clone[id];
        return clone;
      });
      if (peersRef.current[id]) {
        peersRef.current[id].destroy();
        delete peersRef.current[id];
      }
      if (remoteVideosRef.current[id]) {
        remoteVideosRef.current[id].remove();
        delete remoteVideosRef.current[id];
      }
    });

    socketRef.current.on("signal", ({ from, data }) => {
      if (!peersRef.current[from]) {
        const peer = createPeer(from, false);
        peer.signal(data);
      } else {
        try {
          if (data.type === "answer" && peersRef.current[from].remoteDescription) {
            console.log("Ignorando answer duplicada de", from);
            return;
          }
          peersRef.current[from].signal(data);
        } catch (err) {
          console.warn("Erro ao aplicar sinal:", err);
        }
      }
    });


    return () => {
      socketRef.current.disconnect();
      if (localStreamRef.current)
        localStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // -------------------- BROADCAST DE POSIÇÃO --------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("move", { x: me.x, y: me.y });
      }
      checkProximityAndConnect();
    }, 500);
    return () => clearInterval(interval);
  }, [me, users]);

  // -------------------- CHECAGEM DE PROXIMIDADE --------------------
  const checkProximityAndConnect = () => {
    if (!me.id) return;
    Object.entries(users).forEach(([id, u]) => {
      if (id === me.id) return;
      const dx = u.x - me.x;
      const dy = u.y - me.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= USER_RADIUS && !peersRef.current[id]) {
        createPeer(id, true);
      } else if (dist > USER_RADIUS && peersRef.current[id]) {
        peersRef.current[id].destroy();
        delete peersRef.current[id];
      }
    });
  };

  // -------------------- CRIAR PEER --------------------
  function createPeer(peerId, initiator = true) {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStreamRef.current || null,
    });

    peer.on("signal", (data) => {
      socketRef.current.emit("signal", { to: peerId, data });
    });

    peer.on("stream", (remoteStream) => {
      let el = remoteVideosRef.current[peerId];
      if (!el) {
        const vid = document.createElement("video");
        vid.id = `remote-${peerId}`;
        vid.autoplay = true;
        vid.playsInline = true;
        vid.style.width = "160px";
        vid.style.height = "120px";
        vid.style.borderRadius = "8px";
        document.getElementById("remote-videos").appendChild(vid);
        remoteVideosRef.current[peerId] = vid;
        el = vid;
      }
      el.srcObject = remoteStream;
    });

    peer.on("close", () => {
      if (remoteVideosRef.current[peerId]) {
        remoteVideosRef.current[peerId].remove();
        delete remoteVideosRef.current[peerId];
      }
      peer.destroy();
      delete peersRef.current[peerId];
    });

    peersRef.current[peerId] = peer;
    return peer;
  }

  // -------------------- MOVIMENTAÇÃO --------------------
  function onMapClick(e) {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMe((m) => ({ ...m, x, y }));
    socketRef.current?.emit("move", { x, y });
  }

  function handleKey(e) {
    const step = 10;
    if (e.key === "ArrowUp") setMe((m) => ({ ...m, y: Math.max(0, m.y - step) }));
    if (e.key === "ArrowDown") setMe((m) => ({ ...m, y: Math.min(500, m.y + step) }));
    if (e.key === "ArrowLeft") setMe((m) => ({ ...m, x: Math.max(0, m.x - step) }));
    if (e.key === "ArrowRight") setMe((m) => ({ ...m, x: Math.min(1000, m.x + step) }));
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // -------------------- RENDER --------------------
  return (
    <div className="">
      <div className="relative" style={{ 
            width: 1000, 
            height: 500, 
            padding: 10,
            marginLeft: 200,
            marginTop: 10
            }}>
        <div
          ref={mapRef}
          onClick={onMapClick}
          className="absolute inset-0"
          style={{
            backgroundImage:"url('https://images.unsplash.com/photo-1549880338-65ddcdfd017b')",
            backgroundSize: "cover",
            borderRadius: 5,
            overflow: "hidden",
            width: 1000,
            height: 500,
          }}
        >
          {/* Usuários */}
        {Object.entries(users).map(([id, u]) => (
          <div
            key={id}
            style={{
              position: "absolute",
              left: u.x - 16,
              top: u.y - 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: id === me.id ? "#4ade80" : "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              userSelect: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            {u.name ? u.name.charAt(0).toUpperCase() : "?"}
          </div>
          ))}


          {/* Indicador de raio */}
          <div
            style={{
              position: "absolute",
              left: me.x - USER_RADIUS,
              top: me.y - USER_RADIUS,
              width: USER_RADIUS * 2,
              height: USER_RADIUS * 2,
              borderRadius: "50%",
              border: "1px dashed rgba(24, 2, 2, 0.84)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Vídeos remotos */}
        <div
          id="remote-videos"
          style={{ position: "absolute", right: 0, top: 20, width: 170 }}
        />

        {/* Vídeo local */}
        <div style={{ position: "absolute", left: 10, top: 10, bottom: 0, width: 200 }}>
          <div style={{ fontSize: 12,marginLeft:10, color: "#1a0404ff" }}>Sua câmera</div>
          <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            style={{ width: 200, height: 140, borderRadius: 8 }}
          />
        </div>
      </div>
    </div>
  );
}
