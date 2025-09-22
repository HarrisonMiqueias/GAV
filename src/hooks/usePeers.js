// src/hooks/usePeers.js
import { useEffect, useState, useCallback } from "react";
import SimplePeer from "simple-peer";

export default function usePeers(socket, me, localStream) {
  const [peers, setPeers] = useState({}); // peers ativos

  // Adiciona novo peer
  const addPeer = useCallback((incomingSignal, callerId, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", signal => {
      socket.emit("returning signal", { signal, callerId: callerId });
    });

    peer.signal(incomingSignal);

    setPeers(prevPeers => ({ ...prevPeers, [callerId]: peer }));
  }, [socket]);

  // Cria peer ao se conectar
  const createPeer = useCallback((userToSignal, callerId, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", signal => {
      socket.emit("sending signal", { userToSignal, callerId, signal });
    });

    setPeers(prevPeers => ({ ...prevPeers, [userToSignal]: peer }));
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user joined", payload => {
      createPeer(payload.callerId, me.id, localStream);
    });

    socket.on("receiving returned signal", payload => {
      const item = peers[payload.id];
      item?.signal(payload.signal);
    });

    socket.on("receiving signal", payload => {
      addPeer(payload.signal, payload.callerId, localStream);
    });

    return () => {
      socket.off("user joined");
      socket.off("receiving returned signal");
      socket.off("receiving signal");
    };
  }, [socket, me.id, localStream, addPeer, createPeer, peers]);

  return peers;
}
