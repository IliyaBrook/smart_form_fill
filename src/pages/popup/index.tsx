import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "@pages/popup/Popup";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
refreshOnUpdate("pages/popup");
import "@src/global.css";

function init() {
  const appContainer = document.querySelector("#smart-fill-form-popup");
  if (!appContainer) {
    throw new Error("Can not find #smart-fill-form-popup");
  }
  const root = createRoot(appContainer);
  root.render(<Popup />);
}

init();
