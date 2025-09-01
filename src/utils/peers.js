import SimplePeer from "simple-peer";

export function createPeer(peerId, initiator, localStreamRef, peersRef, remoteVideosRef, socketRef) {
  const peer = new SimplePeer({ initiator, trickle: true });

  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current));
  }

  peer.on("signal", (data) => socketRef.current.emit("signal", { to: peerId, data }));

  peer.on("stream", (remoteStream) => {
    if (!remoteVideosRef.current[peerId]) {
      const vid = document.createElement("video");
      vid.id = `remote-${peerId}`;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.style.width = "160px";
      vid.style.height = "120px";
      vid.style.borderRadius = "8px";
      document.getElementById("remote-videos")?.appendChild(vid);
      remoteVideosRef.current[peerId] = vid;
    }
    remoteVideosRef.current[peerId].srcObject = remoteStream;
  });

  peer.on("close", () => {
    remoteVideosRef.current[peerId]?.remove();
    delete remoteVideosRef.current[peerId];
    peer.destroy();
    delete peersRef.current[peerId];
  });

  peersRef.current[peerId] = peer;
  return peer;
}
