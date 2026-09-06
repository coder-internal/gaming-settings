import Link from "next/link";

const TABS = [
  { href: "/recommend", label: "Recommend", icon: "🎯" },
  { href: "/favorites", label: "Favorites", icon: "❤️" },
  { href: "/games", label: "Games", icon: "🎮" },
  { href: "/computers", label: "Computers", icon: "🖥️" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold">Gaming Settings</h1>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <ul className="mx-auto flex max-w-md justify-around">
          {TABS.map((tab) => (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-1 px-2 py-3 text-xs text-slate-300 active:bg-slate-900"
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
