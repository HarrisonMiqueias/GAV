import React from "react";
import "../css/LocalVideo.css";
import { CameraVideo, CameraVideoOff, Mic, MicMute, Display } from "react-bootstrap-icons";

export default function LocalVideo({
  localVideoRef,
  videoEnabled,
  audioEnabled,
  setVideoEnabled,
  setAudioEnabled,
  peersRef,
  localStreamRef,
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

        Object.values(peersRef.current)
        .forEach(peer => {
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

  return (
    <div className="local-container">
      <div className="peers">
          {/* implementar futuramente para aparecer a foto ou letra caso não tenha foto*/}
      </div>
      <div className="div-button">
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
           onClick={() => setIsScreenModalOpen(true)}
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
        <div className="camera">
          <video className="video"
            ref={localVideoRef}
            muted
            autoPlay
            playsInline
          />
        </div>
      
     
      
    </div>
  );
}
