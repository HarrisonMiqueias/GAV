import React, { useEffect } from "react";

export default function MapArea({ mapRef, users, me, setMe, USER_RADIUS, background }) {
  const onMapClick = (e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 0;
    const y = e.clientY - rect.top - 0;
    setMe((m) => ({ ...m, x, y }));
  };

  function handleKey(e) {
    const step = 10;
    if (e.key === "ArrowUp") setMe((m) => ({ ...m, y: Math.max(0, m.y - step) }));
    if (e.key === "ArrowDown") setMe((m) => ({ ...m, y: Math.min(600, m.y + step) }));
    if (e.key === "ArrowLeft") setMe((m) => ({ ...m, x: Math.max(0, m.x - step) }));
    if (e.key === "ArrowRight") setMe((m) => ({ ...m, x: Math.min(1100, m.x + step) }));
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      ref={mapRef}
      onClick={onMapClick}
      style={{
        width: 1000,
        height: 560,
        marginLeft: 100,
        marginTop: 10,
        borderRadius: 5,
        background: "#f8f1f1da",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
        backgroundImage: `url(${background})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Renderiza todos os usuários */}
      {Object.entries(users).map(([id, u]) => (
        <React.Fragment key={id}>
          {/* Nome acima da bolinha */}
          <div
            style={{
              position: "absolute",
              left: u.x - 5 -(u.name?.length * 3),
              top: u.y - 35,
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

          {/* Bolinha */}
          <div
            style={{
              position: "absolute",
              left: u.x - 11,
              top: u.y - 11,
              width: 25,
              height: 25,
              borderRadius: "50%",
              background: id === me.id ? "#4ade80" : "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.78)",
            }}
          >
            {u.name?.charAt(0).toUpperCase() || "?"}
          </div>

          {/* Raio só no usuário atual */}
          {id === me.id && (
            <div
              style={{
                position: "absolute",
                left: u.x - USER_RADIUS,
                top: u.y - USER_RADIUS,
                width: USER_RADIUS * 2,
                height: USER_RADIUS * 2,
                borderRadius: "50%",
                
                background: "rgba(255, 255, 255, 0.23)",
                pointerEvents: "none",
              }}
            />
          )}
        </React.Fragment>
      ))}

    </div>
  );
}
