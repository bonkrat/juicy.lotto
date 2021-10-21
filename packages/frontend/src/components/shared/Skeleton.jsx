import React from "react";

function Skeleton({ width, height }) {
  return <div className={`animate-pulse rounded bg-neutral w-${width} h-${height}`}></div>;
}

export default Skeleton;
