import { useEffect } from "react";

export default function Content() {
  useEffect(() => {
    console.log("content view loaded");
  }, []);
  
  return null;
}
