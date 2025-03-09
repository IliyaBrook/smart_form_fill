import { createRoot } from "react-dom/client";
import Content from "@pages/content/renderContent/content";
import refreshOnUpdate from "virtual:reload-on-update-in-view";
declare const __IS_DEV__: boolean;

if (__IS_DEV__) {
	try {
		refreshOnUpdate("pages/content");
	}catch {}
}

const root = document.createElement("div");
document.body.append(root);
createRoot(root).render(<Content />);

export default {};