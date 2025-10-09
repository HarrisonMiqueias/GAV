import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import process from "process";
import { Row, Col } from "react-bootstrap";
import MapArea from "../components/MapArea";
import LocalVideo from "../components/LocalVideo";
import ScreenShareModal from "../components/ScreenShareModal";
import { createPeer } from "../utils/peers";
import background from "../assets/background.png";
import "../css/GatherLite.css";

window.process = process;

export default function GatherLite() {
  const SOCKET_SERVER = process.env.REACT_APP_SOCKET_SERVER || "http://localhost:5000";
  const USER_RADIUS = 60;
  const location = useLocation();
  const navigate = useNavigate();
  const userNam = location.state?.name;
  const [me, setMe] = useState({ id: null, x: 700, y: 300, name: userNam });
  const [users, setUsers] = useState({});
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null); // 👈 novo modal remoto
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const mapRef = useRef(null);
  const remoteScreenVideoRef = useRef(null); // 👈 referência para o vídeo do modal remoto

  // Redireciona se não houver usuário
  useEffect(() => {
    if (!userNam) navigate("/", { replace: true });
  }, [userNam, navigate]);

  // Inicializa mídia local
  useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setVideoEnabled(false);
        setAudioEnabled(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Não foi possível acessar microfone:", err);
      }
    }
    initMedia();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Movimentação do usuário
  useEffect(() => {
    const interval = setInterval(() => {
      socketRef.current?.connected && socketRef.current.emit("move", { x: me.x, y: me.y });
      Object.entries(users).forEach(([id, u]) => {
        if (id === me.id) return;
        const dx = u.x - me.x;
        const dy = u.y - me.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= USER_RADIUS && !peersRef.current[id]) {
          createPeer(id, true, localStreamRef, peersRef, remoteVideosRef, socketRef, setRemoteScreenStream);
        } else if (dist > USER_RADIUS && peersRef.current[id]) {
          peersRef.current[id].destroy();
          delete peersRef.current[id];
        }
      });
    }, 500);
    return () => clearInterval(interval);
  }, [me, users]);


  
  // Atualiza o stream do modal remoto quando a stream mudar
    useEffect(() => {
      if (remoteScreenStream && remoteScreenVideoRef.current) {
        remoteScreenVideoRef.current.srcObject = remoteScreenStream;
      }
    }, [remoteScreenStream]);


  // Socket 
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      const myId = socketRef.current.id;
      setMe((prev) => {
        const newMe = { ...prev, id: myId };
        socketRef.current.emit("join", { x: newMe.x, y: newMe.y, name: newMe.name });
        return newMe;
      });
    });

    socketRef.current.on("state", (serverUsers) => setUsers(serverUsers));

    socketRef.current.on("user-left", (id) => {
      setUsers((prev) => {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      });
      peersRef.current[id]?.destroy();
      delete peersRef.current[id];
      remoteVideosRef.current[id]?.remove();
      delete remoteVideosRef.current[id];
    });

    socketRef.current.on("signal", ({ from, data }) => {
      if (!peersRef.current[from]) {
        createPeer(from, false, localStreamRef, peersRef, remoteVideosRef, socketRef, setRemoteScreenStream).signal(data);
      } else {
        peersRef.current[from].signal(data);
      }
    });

    return () => socketRef.current.disconnect();
  }, [SOCKET_SERVER]);



  return (
    <div className="container">
      <Row className="row-principal">
        <Col className="col-principal">     
          <Row className="row-primario">
            <Col className="col-primario">
            <MapArea
              mapRef={mapRef}
              users={users}
              me={me}
              setMe={setMe}
              USER_RADIUS={USER_RADIUS}
              background={background}
              audio={audioEnabled}
              remoteVideosRef={remoteVideosRef}
              audioEnabled={audioEnabled}
            />
           </Col>
          </Row>
           <Row className="row-secundario">
            <Col className="col-secundario">
              <LocalVideo
                localVideoRef={localVideoRef}
                videoEnabled={videoEnabled}
                audioEnabled={audioEnabled}
                setVideoEnabled={setVideoEnabled}
                setAudioEnabled={setAudioEnabled}
                peersRef={peersRef}
                localStreamRef={localStreamRef}
                screenVideoRef={screenVideoRef}
                setIsScreenModalOpen={setIsScreenModalOpen}
              />
            </Col>
          </Row>
        </Col>
      </Row>   




      {/* Modal para minha tela compartilhada */}
      {isScreenModalOpen && (
        <ScreenShareModal
          screenVideoRef={screenVideoRef}
          onClose={() => setIsScreenModalOpen(false)}
          peersRef={peersRef}
          localStreamRef={localStreamRef}
        />
      )}

      {/* Modal automático quando outro usuário compartilha tela */}
      {remoteScreenStream && (
        <ScreenShareModal
          screenVideoRef={{ current: { srcObject: remoteScreenStream } }}
          onClose={() => setRemoteScreenStream(null)}
          peersRef={peersRef}
          localStreamRef={localStreamRef}
        />
      )}
    </div>
  );
}
