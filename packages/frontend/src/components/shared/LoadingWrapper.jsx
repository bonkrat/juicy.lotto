import React, { useState, useEffect } from "react";
import Skeleton from "./Skeleton";

function LoadingWrapper({ children, showComponent, width, height, skeleton }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    showComponent && setMounted(true);
  }, [showComponent]);

  const fadeInClass = `${
    mounted ? "opacity-100" : "opacity-0"
  } transition-opacity duration-1000 ease-in-out`;

  return showComponent ? (
    React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { className: `${fadeInClass} ${child.props.className}` });
      }
    })
  ) : skeleton ? (
    skeleton
  ) : (
    <Skeleton width={width} height={height} />
  );
}

export default LoadingWrapper;
