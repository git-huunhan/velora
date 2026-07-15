import { Outlet } from "react-router-dom";
import { Header } from "../Header/Header";
import { Sidebar } from "../Sidebar/Sidebar";

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground min-w-0">
      <Header />
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar />
        <main className="flex-1 overflow-auto flex flex-col relative min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
