import React from "react";

export default function RemoteVideos({ remoteVideosRef }) {
  return (
    <div style={{
      position: "absolute",
      right: 50,
      top: 300,
      width: 250,
      height: 340,
      padding: 10,
      border: "1px solid #0000006b",
      borderRadius: 5,
      background: "#f8f1f1da",
      boxShadow: "0 4px 10px rgba(0,0,0,0.78)"
    }}>
      <div style={{
        fontSize: 15,
        marginBottom: 5,
        color: "#1a0404ff",
        background: "rgba(45, 240, 65, 0.61)",
        borderRadius: 4,
        paddingLeft: 10
      }}>
        Usuários Próximos
      </div>
      <div id="remote-videos" style={{ position: "absolute", right: 0, top: 50, width: 200 }} />
    </div>
  );
}
