import React from "react";
import LoadingWrapper from "./LoadingWrapper";

function Row({
  label,
  value,
  size = "lg",
  borderColor = "white",
  onClick,
  showRow = true,
  className,
}) {
  return (
    <LoadingWrapper showComponent={showRow} width="full" height={10}>
      <div
        className={`flex justify-between text-content py-2 px-4 ${className} ${
          onClick && "rounded hover:bg-base-100 cursor-pointer"
        }`}
        onClick={onClick}
      >
        <div className={`lg:text-${size} sm:text-xl`}>{label}</div>
        <div
          className={`flex-grow border-dotted border-0 border-b-4 border-${borderColor} border-opacity-5 mx-2`}
        ></div>
        <div className={`lg:text-${size} sm:text-xl text-right`}>{value}</div>
      </div>
    </LoadingWrapper>
  );
}

export default Row;
