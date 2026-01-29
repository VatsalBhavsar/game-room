import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          "bg-slate-950 text-white border border-white/10 shadow-lg rounded-xl",
      }}
    />
  );
}
