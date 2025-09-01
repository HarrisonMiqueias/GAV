// src/hooks/useMedia.js
import { useState, useEffect, useCallback } from "react";

export function useMedia() {
  const [stream, setStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Inicializa a câmera e o microfone
  useEffect(() => {
    async function initMedia() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
      } catch (err) {
        console.error("Erro ao acessar mídia:", err);
      }
    }
    initMedia();
  }, []);

  // Alternar câmera
  const toggleCamera = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setCameraOn(track.enabled);
      });
    }
  }, [stream]);

  // Alternar microfone
  const toggleMic = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setMicOn(track.enabled);
      });
    }
  }, [stream]);

  return { stream, cameraOn, micOn, toggleCamera, toggleMic };
}
