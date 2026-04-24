import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logError } from "@/lib/logger";

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const err = (event as ErrorEvent).error as Error | undefined;
    const message = err?.message || (event as ErrorEvent).message || 'Erro';
    void logError(message, {
      type: 'window.error',
      filename: (event as ErrorEvent).filename,
      lineno: (event as ErrorEvent).lineno,
      colno: (event as ErrorEvent).colno,
      stack: err?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason as any;
    const message = reason?.message ? String(reason.message) : String(reason);
    void logError(message, { type: 'unhandledrejection' });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
