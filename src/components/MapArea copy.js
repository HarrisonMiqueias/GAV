import React, { useEffect } from "react";
import { BiSolidVolumeMute } from "react-icons/bi";

export default function MapArea({ mapRef, users, me, setMe, USER_RADIUS, background, audio }) {
  const CIRCLE_SIZE = 25; // largura/altura do círculo
  const STEP = 10;

  const onMapClick = (e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMe((m) => ({
      ...m,
      x: Math.min(Math.max(CIRCLE_SIZE / 2, x), rect.width - CIRCLE_SIZE / 2),
      y: Math.min(Math.max(CIRCLE_SIZE / 2, y), rect.height - CIRCLE_SIZE / 2),
    }));
  };

  function handleKey(e) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMe((m) => {
      let newX = m.x;
      let newY = m.y;

      if (e.key === "ArrowUp") newY = m.y - STEP;
      if (e.key === "ArrowDown") newY = m.y + STEP;
      if (e.key === "ArrowLeft") newX = m.x - STEP;
      if (e.key === "ArrowRight") newX = m.x + STEP;

      return {
        ...m,
        x: Math.min(Math.max(CIRCLE_SIZE / 2, newX), rect.width - CIRCLE_SIZE / 2),
        y: Math.min(Math.max(CIRCLE_SIZE / 2, newY), rect.height - CIRCLE_SIZE / 2),
      };
    });
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
        width: 1100,
        height:600,
        borderRadius: 5,
        background: "#f8f1f1da",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
        backgroundImage: `url(${background})`,
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundSize:1100,
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {Object.entries(users)
       .filter(([id, u]) => u.id !== me.id)
       .map(([id, u]) => (
        <React.Fragment key={id}>
          {/* Nome acima da bolinha */}
          <div
            style={{
              position: "absolute",
              left: u.x - 5 - (u.name?.length * 3),
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
              left: u.x - CIRCLE_SIZE / 2,
              top: u.y - CIRCLE_SIZE / 2,
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: "50%",
              background: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.78)",
            }}
          >
            {u.name?.charAt(0).toUpperCase() || "?"}
            {!audio && (
              <BiSolidVolumeMute size={18} style={{ position: "absolute", bottom: -10, right: -10, color: "#ff0000ff", borderRadius: "50%" }} />
            )}
          </div>

          
        </React.Fragment>
      ))}


      {/* Nome acima da bolinha */}
          <div
            style={{
              position: "absolute",
              left: me.x - 5 - (me.name?.length * 3),
              top: me.y - 35,
              fontSize: 12,
              color: "#222",
              background: "rgba(255,255,255,0.8)",
              padding: "2px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {me.name}
            
          </div>

          {/* Bolinha */}
          <div
            style={{
              position: "absolute",
              left: me.x - CIRCLE_SIZE / 2,
              top: me.y - CIRCLE_SIZE / 2,
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: "50%",
              background: me.id ? "#4ade80" : "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              boxShadow: "0 4px 10px rgba(0,0,0,0.78)",
            }}
          >
            {me.name?.charAt(0).toUpperCase() || "?"}
            {!audio && (
              <BiSolidVolumeMute size={18} style={{ position: "absolute", bottom: -10, right: -10, color: "#ff0000ff", borderRadius: "50%" }} />
            )}
          </div>

          {/* Raio só no usuário atual */}
          {me.id && (
            <div
              style={{
                position: "absolute",
                left: me.x - USER_RADIUS,
                top: me.y - USER_RADIUS,
                width: USER_RADIUS * 2,
                height: USER_RADIUS * 2,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.23)",
                pointerEvents: "none",
              }}
            />
          )}
    </div>
  );
}
