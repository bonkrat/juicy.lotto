import { useState, useEffect } from "react";

function useImage(src) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setLoaded(true);
    image.src = src;

    return () => {
      image.onload = null;
    };
  }, []);

  return loaded;
}

export default useImage;
