import React from "react";

function Row({ label, value, size = "lg", borderColor = "base-100", onClick, className }) {
  return (
    <div
      className={`flex justify-between text-content py-2 px-4 ${className} ${
        onClick && "rounded hover:bg-base-100 cursor-pointer"
      }`}
      onClick={onClick}
    >
      <div className={`lg:text-${size} sm:text-xl`}>{label}</div>
      <div
        className={`flex-grow border-dotted border-0 border-b-4 border-${borderColor} mx-2`}
      ></div>
      <div className={`lg:text-${size} sm:text-xl text-right`}>{value}</div>
    </div>
  );
}

export default Row;
