import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

export function useSocket(SOCKET_SERVER, me, setMe, peersRef, remoteVideosRef, localStreamRef, USER_RADIUS) {
  const socketRef = useRef(null);
  const [users, setUsers] = useState({});

  // -------------------- CRIAR PEER --------------------
  const createPeer = (peerId, initiator = true) => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
    });

    // Adiciona tracks locais
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

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
        document.getElementById("remote-videos")?.appendChild(vid);
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
  };

  // -------------------- CHECAR PROXIMIDADE --------------------
  const checkProximityAndConnect = () => {
    Object.entries(users).forEach(([id, u]) => {
      if (id === me.id) return; // ignora eu mesmo
      const dx = u.x - me.x;
      const dy = u.y - me.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= USER_RADIUS && !peersRef.current[id]) {
        createPeer(id, true); // inicia conexão
      } else if (dist > USER_RADIUS && peersRef.current[id]) {
        peersRef.current[id].destroy();
        delete peersRef.current[id];
      }
    });
  };

  // -------------------- SOCKET --------------------
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
          if (data.type === "answer" && peersRef.current[from].remoteDescription) return;
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

  // -------------------- MOVIMENTAÇÃO E PROXIMIDADE --------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("move", { x: me.x, y: me.y });
      }
      checkProximityAndConnect();
    }, 500);
    return () => clearInterval(interval);
  }, [me, users]);

  return { socketRef, users, checkProximityAndConnect, createPeer };
}
