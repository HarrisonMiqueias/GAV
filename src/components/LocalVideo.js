import React from "react";
import { CameraVideo, CameraVideoOff, Mic, MicMute, Display } from "react-bootstrap-icons";

export default function LocalVideo({
  localVideoRef,
  videoEnabled,
  audioEnabled,
  setVideoEnabled,
  setAudioEnabled,
  peersRef,
  localStreamRef,
  screenVideoRef,
  setIsScreenModalOpen,
}) {

  async function enableVideo() {
    if (!localStreamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        localStreamRef.current.addTrack(videoTrack);
        setVideoEnabled(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

        Object.values(peersRef.current).forEach(peer => {
          const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
          else peer._pc.addTrack(videoTrack, localStreamRef.current);
        });
      }
    } catch (err) {
      console.error("Erro ao ativar vídeo:", err);
    }
  }

  function disableVideo() {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getTracks().find(t => t.kind === "video");
    if (videoTrack) {
      videoTrack.stop();
      localStreamRef.current.removeTrack(videoTrack);
      setVideoEnabled(false);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream(localStreamRef.current.getTracks());
      }

      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) peer._pc.removeTrack(sender);
      });
    }
  }

  function toggleAudio() {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play();
      }
      setIsScreenModalOpen(true);

      const screenTrack = screenStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
        else peer._pc.addTrack(screenTrack, screenStream);
      });

      screenTrack.onended = () => setIsScreenModalOpen(false);
    } catch (err) {
      console.error("Erro ao compartilhar tela:", err);
    }
  }

  return (
    <div style={{
      position: "absolute",
      right: 50,
      top: 20,
      width: 250,
      height: 250,
      padding: 10,
      border: "1px solid #0000006b",
      borderRadius: 5,
      background: "#f8f1f1da",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontWeight: "bolder",
      fontStyle: "italic",
    }}>
      <div style={{
        fontSize: 15,
        marginBottom: 5,
        color: "#1a0404ff",
        background: "rgba(45, 240, 65, 0.61)",
        padding: "2px 6px",
        borderRadius: 4,
        width: "85px",
        textAlign: "center"
      }}>Sua Câmera</div>

      <video
        ref={localVideoRef}
        muted
        autoPlay
        playsInline
        style={{
          width: 195,
          height: 145,
          borderRadius: 10,
          background: "#0000006b",
          marginBottom: 10
        }}
      />

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={videoEnabled ? disableVideo : enableVideo}
          style={{
            padding: "6px 12px",
            backgroundColor: videoEnabled ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          {videoEnabled ? <CameraVideo size={18} /> : <CameraVideoOff size={18} />}
        </button>

        <button
          onClick={toggleAudio}
          style={{
            padding: "6px 12px",
            backgroundColor: audioEnabled ? "#22c55e" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          {audioEnabled ? <Mic size={18} /> : <MicMute size={18} />}
        </button>

        <button
          onClick={startScreenShare}
          style={{
            padding: "6px 12px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          <Display size={18} />
        </button>
      </div>
    </div>
  );
}
