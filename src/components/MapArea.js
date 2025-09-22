import React, { useEffect,useCallback} from "react";
import Character from '../components/Caracter.js';
import "../css/MapArea.css";

const SPRITE_SIZE = 32;
const DIRECTIONS = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };


export default function MapArea({  mapRef,  users,  me,  setMe,  background,  audio,}) {
  
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

  const handleKey = useCallback((e) =>{
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
  },[mapRef,setMe]);

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
  }, [handleKey,setMe]);

  return (
    <div ref={mapRef} onDoubleClick={onMapClick} className="map">
      
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

      {/* Lista de usuário atual */}
      
      <div className="list">
        {Object.entries(users)
        .map(([id, u]) => (
         <li index={id} className="list-user"
          style={{
            background: u.id === me.id?"rgba(106, 255, 0, 0.46)":"rgba(214, 212, 212, 0.63)"
          }}
         >{u.name}</li>
        ))}
        </div>
    </div>
  );
}
