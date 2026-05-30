import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/fonts.css";
import { initNative } from "./lib/native";

// Fire-and-forget — every native call no-ops on web, so this is safe to
// run unconditionally and doesn't block React mount.
initNative();

createRoot(document.getElementById("root")!).render(<App />);
