import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? null);
setAuthTokenGetter(() => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("travelogue_admin_api_token");
});

createRoot(document.getElementById("root")!).render(<App />);
