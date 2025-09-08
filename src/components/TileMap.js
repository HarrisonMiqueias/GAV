import React from "react";

/**
 * TileMap: renderiza a grade de tiles (cada tile é uma imagem)
 *
 * Props:
 *  - mapMatrix: matrix [row][col] com índices de tiles
 *  - TILE_SIZE: tamanho de cada tile em px
 *  - tilesDef: objeto { idx: { img: "/tiles/xxx.png", solid: boolean } }
 *  - style: style extra para o container (opcional)
 */
export default function TileMap({ mapMatrix, TILE_SIZE = 64, tilesDef, style = {} }) {
  const rows = mapMatrix.length;
  const cols = mapMatrix[0].length;

  return (
    <div
      style={{
        position: "absolute",
        width: cols * TILE_SIZE,
        height: rows * TILE_SIZE,
        left: 0,
        top: 0,
        ...style,
      }}
    >
      {/* Render tiles as absolutely positioned elements for faster control */}
      {mapMatrix.map((row, ty) =>
        row.map((tileIndex, tx) => {
          const tile = tilesDef[tileIndex];
          return (
            <div
              key={`${tx}-${ty}`}
              style={{
                position: "absolute",
                left: tx * TILE_SIZE,
                top: ty * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundImage: `url(${tile.img})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                pointerEvents: "none",
              }}
            />
          );
        })
      )}
    </div>
  );
}
