import { createRoot } from "react-dom/client";
import Content from "@pages/content/renderContent/content";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("pages/content");
const root = document.createElement("div");
document.body.append(root);
createRoot(root).render(<Content />);