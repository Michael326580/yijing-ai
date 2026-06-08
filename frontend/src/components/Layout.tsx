import { Camera, Grid3X3, Home, Images, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/upload", label: "上传", icon: Camera },
  { to: "/analysis", label: "分析", icon: Sparkles },
  { to: "/generate", label: "生成", icon: Grid3X3 },
  { to: "/demo", label: "展示", icon: Images },
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-soft">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-normal text-ink">忆境 AI</div>
              <div className="text-xs text-muted">校园相册叙事生成器</div>
            </div>
          </NavLink>

          <nav className="hidden items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
