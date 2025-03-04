import { createRoot } from "react-dom/client";
import Content from "@pages/content/renderContent/content";
import refreshOnUpdate from "virtual:reload-on-update-in-view";

refreshOnUpdate("pages/content");

const root = document.createElement("div");
root.id = "smart-form-fill-react-vite-content-view-root";
document.body.append(root);

createRoot(root).render(<Content />);