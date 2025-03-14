import Settings from '@pages/settings/Settings'
import React from "react";
import { createRoot } from "react-dom/client";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
refreshOnUpdate("pages/settings");


function init() {
  const appContainer = document.querySelector("#smart-fill-form-settings");
  if (!appContainer) {
    throw new Error("Can not find #smart-fill-form-settings");
  }
  const root = createRoot(appContainer);
  root.render(<Settings />);
}

init();