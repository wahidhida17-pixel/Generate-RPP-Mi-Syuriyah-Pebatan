import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

// Catch unhandled promise rejections gracefully so they don't break iframe context
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("Global unhandled promise rejection caught:", event.reason);
    // Prevent default browser error reporting if it's a known non-critical Firestore or storage warning
    if (
      event.reason?.message?.includes("offline") ||
      event.reason?.message?.includes("network") ||
      event.reason?.code === "unavailable"
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

