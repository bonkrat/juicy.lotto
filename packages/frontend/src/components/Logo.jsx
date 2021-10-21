import React from "react";
import logo from "../assets/orange.png";
import { useImage } from "../hooks";
import { LoadingWrapper } from "./shared";

function Logo() {
  const imageLoaded = useImage(logo);

  return (
    <div className="mx-8 sm:mx-36 md:mx-48 max-h-72 sm:max-h-72 flex justify-center items-center">
      <LoadingWrapper showComponent={imageLoaded}>
        <div className="text-4xl sm:text-5xl italic absolute px-2 mt-8 md:mt-16 bg-gradient-to-r from-primary to-primary-focus z-10">
          juicy lotto
        </div>
        <img className={`-ml-4 sm:-ml-8 max-h-48 sm:max-h-72 sm:w-72 sm:h-72`} src={logo} />
      </LoadingWrapper>
    </div>
  );
}

export default Logo;
