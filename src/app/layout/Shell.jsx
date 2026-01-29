import { Outlet } from "react-router-dom";

export default function Shell() {
  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 md:px-10">
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
