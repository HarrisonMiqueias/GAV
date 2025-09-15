import React, { useEffect, useState } from "react";
import { Border } from "react-bootstrap-icons";
import { BiSolidVolumeMute } from "react-icons/bi";
import{remoteV} from "../components/RemoteVideos";

const SPRITE_SIZE = 32; // cada frame da spritesheet
const FRAMES = 4;       // frames por direção
const DIRECTIONS = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };

function Character({ x, y, name, isMe, direction, moving, audio }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!moving) {
      setFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % FRAMES);
    }, 200); // troca de frame a cada 200ms
    return () => clearInterval(interval);
  }, [moving]);

  return (
    <>
      {/* Nome acima */}
      <div
        style={{
          position: "absolute",
          left: x - 5 - (name?.length * 3),
          top: y - 35,
          fontSize: 12,
          color: "#222",
          background: "rgba(255,255,255,0.8)",
          padding: "2px 6px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>

      {/* Boneco com spritesheet */}
      <div
        style={{
          position: "absolute",
          left: x - SPRITE_SIZE / 2,
          top: y - SPRITE_SIZE / 2,
          width: SPRITE_SIZE,
          height: SPRITE_SIZE,
          backgroundImage: "url('/sprites/char_spritesheet.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${SPRITE_SIZE * FRAMES}px ${SPRITE_SIZE * 4}px`,
          backgroundPosition: `-${frame * SPRITE_SIZE}px -${
            direction * SPRITE_SIZE
          }px`,
          imageRendering: "pixelated",
        }}
      >
        {!audio && (
          <BiSolidVolumeMute
            size={18}
            style={{
              position: "absolute",
              bottom: -10,
              right: -10,
              color: "#ff0000ff",
              borderRadius: "50%",
            }}
          />
        )}
      </div>
    </>
  );
}

export default function MapArea({
  mapRef,
  users,
  me,
  setMe,
  USER_RADIUS,
  background,
  audio,
}) {
  const STEP = 10;

  const onMapClick = (e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMe((m) => ({
      ...m,
      x: Math.min(Math.max(SPRITE_SIZE / 2, x), rect.width - SPRITE_SIZE / 2),
      y: Math.min(Math.max(SPRITE_SIZE / 2, y), rect.height - SPRITE_SIZE / 2),
    }));
  };

  function handleKey(e) {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    setMe((m) => {
      let newX = m.x;
      let newY = m.y;
      let direction = m.direction || DIRECTIONS.DOWN;
      let moving = true;

      if (e.key === "ArrowUp") {
        newY = m.y - STEP;
        direction = DIRECTIONS.UP;
      } else if (e.key === "ArrowDown") {
        newY = m.y + STEP;
        direction = DIRECTIONS.DOWN;
      } else if (e.key === "ArrowLeft") {
        newX = m.x - STEP;
        direction = DIRECTIONS.RIGHT;
      } else if (e.key === "ArrowRight") {
        newX = m.x + STEP;
        direction = DIRECTIONS.LEFT;
      } else {
        moving = false;
      }

      return {
        ...m,
        x: Math.min(Math.max(SPRITE_SIZE / 2, newX), rect.width - SPRITE_SIZE / 2),
        y: Math.min(Math.max(SPRITE_SIZE / 2, newY), rect.height - SPRITE_SIZE / 2),
        direction,
        moving,
      };
    });
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", () =>
      setMe((m) => ({ ...m, moving: false }))
    );
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", () =>
        setMe((m) => ({ ...m, moving: false }))
      );
    };
  }, []);

  return (
    <div
      ref={mapRef}
      onDoubleClick={onMapClick}
      style={{
        width: 1100,
        height: 600,
        borderRadius: 5,
        background: "#f8f1f1da",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.78)",
        backgroundImage: `url(${background})`,
        backgroundSize: 1100,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        display:"flex",
        justifyContent:"end",
        alignItems:"start"
      }}
    >
      {/* Renderiza todos menos o "me" */}
      {Object.entries(users)
        .filter(([id, u]) => u.id !== me.id)
        .map(([id, u]) => (
          <Character
            key={id}
            x={u.x}
            y={u.y}
            name={u.name}
            isMe={false}
            direction={u.direction || DIRECTIONS.DOWN}
            moving={u.moving || false}
            audio={audio}
          />
        ))}

      {/* Renderiza o próprio jogador */}
      <Character
        x={me.x}
        y={me.y}
        name={me.name}
        isMe={true}
        direction={me.direction || DIRECTIONS.DOWN}
        moving={me.moving || false}
        audio={audio}
      />

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
      <lu style={{
        width:"15%",
        background:"rgba(49, 9, 9, 0.42)",
        padding:5,
      }}>
      {Object.entries(users)
        .map(([id, u]) => (
         <li index={id} 
          style={{
            borderRadius:8,
            padding:2,
            paddingLeft:10,
            margin:2,
            marginTop:5,
            fontWeight:"bold",
            color:"rgba(255, 255, 255, 0.93)",
            background: u.id === me.id?"rgba(106, 255, 0, 0.46)":"rgba(214, 212, 212, 0.63)",
            listStyle:"none"

          }}
         >{u.name}</li>
        ))}
        </lu>
    </div>
  );
}
