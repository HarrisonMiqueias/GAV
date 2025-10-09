import React, { useEffect, useState} from "react";
import { BiSolidVolumeMute } from "react-icons/bi";
import "../css/Caracter.css";

const SPRITE_SIZE = 50;
const FRAMES =4; 

export default function Character({ x, y, name, isMe, direction, moving, audio }) {
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
      <div className="legenda-nome"
        style={{
          left: x - 5 - (name?.length * 3),
          top: y - 35,
        }}
      >
        {name}
      </div>

      {/* Boneco com spritesheet */}
      <div
        style={{
          position: "absolute",
          left: x - SPRITE_SIZE / 2,
          top: y - SPRITE_SIZE / 4,
          width: SPRITE_SIZE,
          height: SPRITE_SIZE,
          backgroundImage: "url('/sprites/Character_065.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${SPRITE_SIZE * FRAMES}px ${SPRITE_SIZE * 4}px`,
          backgroundPosition: `-${frame * SPRITE_SIZE}px -${
            direction * SPRITE_SIZE
          }px`,
          imageRendering: "pixelated",
        }}
      >
        {
          audio && (
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