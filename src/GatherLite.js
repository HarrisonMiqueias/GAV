import { useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import process from "process";
import Draggable from "react-draggable";
window.process = process;


export default function GatherLite() {
  const SOCKET_SERVER =
    process.env.REACT_APP_SOCKET_SERVER || "http://localhost:5000";

  const USER_RADIUS = 60;
  const location = useLocation();
  const userName = location.state?.name || "Você";

  const [me, setMe] = useState({
    id: null,
    x: 700,
    y: 300,
    name: userName,
  });
  const [users, setUsers] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const screenVideoRef = useRef(null);
const [isScreenSharing, setIsScreenSharing] = useState(false);
const [modalPos, setModalPos] = useState({ x: 100, y: 100 });
const [dragging, setDragging] = useState(false);
const dragStart = useRef({ x: 0, y: 0 });
const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);




  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const mapRef = useRef(null);

  // -------------------- PEGAR MÍDIA LOCAL --------------------
  useEffect(() => {
    async function initMedia() {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video:false,
          audio: true,
        });
        setVideoEnabled(false);
        setAudioEnabled(true);
      } catch (err) {
        console.warn("Sem câmera, tentando só áudio:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setVideoEnabled(false);
          setAudioEnabled(true);
        } catch (err2) {
          console.error("Não foi possível acessar microfone:", err2);
          return;
        }
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }

    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);



function onMouseDown(e) {
  setDragging(true);
  dragStart.current = { x: e.clientX - modalPos.x, y: e.clientY - modalPos.y };
}

function onMouseMove(e) {
  if (!dragging) return;
  setModalPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
}

function onMouseUp() {
  setDragging(false);
}

useEffect(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, [dragging]);


async function startScreenShare() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      await screenVideoRef.current.play(); // garante que o vídeo comece
    }

    setIsScreenModalOpen(true);
    setIsScreenSharing(true); // ADICIONE ISSO

    const screenTrack = screenStream.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
      if (sender) sender.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => stopScreenShare();
  } catch (err) {
    console.error("Erro ao compartilhar tela:", err);
  }
}




function stopScreenShare() {
  setIsScreenModalOpen(false);
  setIsScreenSharing(false); // ADICIONE ISSO

  navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    .then((newStream) => {
      localStreamRef.current = newStream;
      localVideoRef.current.srcObject = newStream;
      localVideoRef.current.play();

      const videoTrack = newStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
      });
    });
}



 // 🔴 Desliga vídeo
  function disableVideo() {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getTracks().find(t => t.kind === "video");
    if (videoTrack) {
      videoTrack.stop(); 
      localStreamRef.current.removeTrack(videoTrack);
      setVideoEnabled(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream(
          localStreamRef.current.getTracks()
        );
      }

      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) peer._pc.removeTrack(sender);
      });
    }
  }

  // 🟢 Liga vídeo novamente
  async function enableVideo() {
    if (!localStreamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        localStreamRef.current.addTrack(videoTrack);
        setVideoEnabled(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        Object.values(peersRef.current).forEach(peer => {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            peer._pc.addTrack(videoTrack, localStreamRef.current);
          }
        });
      }
    } catch (err) {
      console.error("Erro ao reativar vídeo:", err);
    }
  }





  // -------------------- TOGGLES --------------------
  
  function toggleAudio() {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);

      socketRef.current.emit("update-audio", {
        audioEnabled: audioTrack.enabled,
      });
    }
  }

  // -------------------- SOCKET --------------------
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      const myId = socketRef.current.id;
      setMe((prev) => {
        const newMe = { ...prev, id: myId };
        socketRef.current.emit("join", {
          x: newMe.x,
          y: newMe.y,
          name: newMe.name,
        });
        return newMe;
      });
    });

    socketRef.current.on("state", (serverUsers) => setUsers(serverUsers));

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
          if (
            data.type === "answer" &&
            peersRef.current[from].remoteDescription
          ) {
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

  // -------------------- MOVIMENTAÇÃO + PROXIMIDADE --------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("move", { x: me.x, y: me.y });
      }
      checkProximityAndConnect();
    }, 500);
    return () => clearInterval(interval);
  }, [me, users]);

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

  // -------------------- MAPA --------------------
  function onMapClick(e) {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMe((m) => ({ ...m, x, y }));
    socketRef.current?.emit("move", { x, y });
  }

  function handleKey(e) {
    const step = 50;
    if (e.key === "ArrowUp") setMe((m) => ({ ...m, y: Math.max(0, m.y - step) }));
    if (e.key === "ArrowDown") setMe((m) => ({ ...m, y: Math.min(600, m.y + step) }));
    if (e.key === "ArrowLeft") setMe((m) => ({ ...m, x: Math.max(0, m.x - step) }));
    if (e.key === "ArrowRight") setMe((m) => ({ ...m, x: Math.min(1100, m.x + step) }));
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // -------------------- RENDER --------------------
  return (
    <div className="" style={{ background: "#2de7fbff", height: "100vh", overflow: "hidden" }}>
      <div style={{
            width: 1100, 
            height: 50, 
            padding: 10,
            marginLeft: 200,
            marginTop: 20,
            border: "1px solid #0000006b", 
            borderRadius: 5, 
            background: "#f8f1f1da",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
            margin:10,
            fontSize: 20,
            color: "#1a0404ff",
            textAlign:"center",
            fontWeight:"bolder",
            fontStyle:"italic",
      }}>
        SiCAV - Sistema de Comunicação Audiovisuais em Vídeo
      </div>
      <div className="relative" style={{ 
            width: 1100, 
            height: 600, 
            padding: 10,
            marginLeft: 200,
            marginTop: 10,
            border: "1px solid #0000006b", 
            borderRadius: 5, 
            background: "#f8f1f1da",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
            margin:10
            }}>
        <div
          ref={mapRef}
          onClick={onMapClick}
          className="absolute inset-0"
          style={{
            backgroundImage:"url('https://cdna.artstation.com/p/assets/images/images/054/239/544/large/charlotte-r-map-00-v2-wip4.jpg?1664093958')",
            backgroundSize: "cover",
            borderRadius: 5,
            overflow: "hidden",
            width: 1100,
            height: 600,
            marginBottom:10
          }}
        >
        {Object.entries(users).map(([id, u]) => (
  <React.Fragment key={id}>
    
     {/* Nome abaixo do círculo */}
    <div
      style={{
        position: "absolute",
        left: u.x - (u.name?.length * 3), // centralizar o nome em relação ao círculo
        top: u.y + 20, // um pouco abaixo do círculo
        fontSize: 12,
        color: "#222",
        background: "rgba(255,255,255,0.8)",
        padding: "2px 6px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {u.name}
    </div>
    {/* Círculo */}
    <div
  style={{
    position: "absolute",
    left: u.x - 11,
    top: u.y + 45,
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
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
  }}
>
  {u.name ? u.name.charAt(0).toUpperCase() : "?"}

  {/* Ícone de mute */}
  {u.audioEnabled === false ? (
    <span
      style={{
        position: "absolute",
        bottom: -8,
        right: -8,
        fontSize: 14,
        background: "red",
        borderRadius: "50%",
        padding: "2px 4px",
      }}
    >
      🔇
    </span>
  ):(
    <span></span>
  )
}
</div>


   
  </React.Fragment>
))}



          {/* Indicador de raio */}
          <div
            style={{
              position: "absolute",
              left: (me.x+2) - USER_RADIUS,
              top: (me.y +60) - USER_RADIUS,
              width: USER_RADIUS * 2,
              height: USER_RADIUS * 2,
              borderRadius: "50%",
              border: "1px dashed rgba(24, 2, 2, 0.64)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Vídeos remotos */}
        <div style={{ 
          position: "absolute",
          right: 20,
          top: 290,
          width: 200,
          height: 390, 
          padding: 10,
          marginLeft: 200,
          border: "1px solid #0000006b", 
          borderRadius: 5, 
          background: "#f8f1f1da",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
          margin:10,
          fontSize: 20,
          color: "#1a0404ff",
          textAlign:"center",
          fontWeight:"bolder",
          fontStyle:"italic",
          }}>
            <div style={{ 
              fontSize: 15,
              marginLeft:10,
              marginBottom:5,
              color: "#1a0404ff",
              background: "rgba(45, 240, 65, 0.61)",
              borderRadius: 4,}}>
            Usuários Próximos
            </div>
        <div
          id="remote-videos"
          style={{ position: "absolute", right: 0, top:50, width: 200}}
        />
        </div>

        {/* Vídeo local */}
        <div style={{ 
          position: "absolute",
          right: 20,
          top: 10,
            width: 200, 
            height: 250, 
            padding: 10,
            marginLeft: 200,
            border: "1px solid #0000006b", 
            borderRadius: 5, 
            background: "#f8f1f1da",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
            margin:10,
            fontSize: 20,
            color: "#1a0404ff",
            textAlign:"center",
            fontWeight:"bolder",
            fontStyle:"italic",
        }}>
        <div style={{ position: "absolute", right: 10, top: 10, bottom:0, width: 200, paddingTop:15 }}>
          <div style={{ 
            fontSize: 15,
            marginLeft:10, 
            color: "#1a0404ff",
            background: "rgba(45, 240, 65, 0.61)",
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            width:85,
            bottom:5,
            fontStyle:"italic",
            fontWeight:"bolder"
          }}>Sua Câmera 
          </div>          
            <video
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
            style={{ 
              width: 195, 
              marginTop:10, 
              height: 145, 
              borderRadius: 10,
              background: "#0000006b"
            }}
            />
           
            
         
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <div>
             {videoEnabled ? (
                <button onClick={disableVideo} style={{
                  padding: "6px 12px",
                   backgroundColor: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",

                }}>Câmera</button>
              ) : (
                <button onClick={enableVideo} style={{
                  padding: "6px 12px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}>Câmera</button>
              )}
            </div>
            <div>
              <button onClick={toggleAudio} style={{ 
                padding: "6px 12px"
                ,backgroundColor: audioEnabled ? "#22c55e":"#ef4444"
                ,color: "#fff"
                ,border: "none"
                ,borderRadius: 4
                ,cursor: "pointer"
               }}>
                {audioEnabled? "Audio" : "Audio"}
              </button>
              </div>
              <div>
                <button onClick={startScreenShare} style={{
                  padding: "6px 12px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}>
                  Tela
                </button>
              </div>
            </div>
          </div> 
        </div>
        {isScreenModalOpen && (
          <div style={{
            position: "fixed",
            top: 50,
            left: 50,
            width: "80%",
            height: "80%",
            background: "#fff",
            border: "2px solid #3b82f6",
            borderRadius: 10,
            zIndex: 9999,
            boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              padding: "8px 12px",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: "bold",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              Compartilhando Tela
              <button onClick={stopScreenShare} style={{
                background: "red",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer"
              }}>X</button>
            </div>
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", background: "#000", borderRadius: 8 }}
            />
          </div>
        )}

      </div>
    </div>
    
  );
}
