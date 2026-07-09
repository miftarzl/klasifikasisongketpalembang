import { ChevronRight, Database, Puzzle, Clock3, Sparkles, LogOut, X } from 'lucide-react';

const navItems = [
  { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'training', label: 'Training', icon: Puzzle },
  { id: 'history', label: 'History', icon: Clock3 },
];

export default function AdminSidebar({ activeTab, onSelectTab, onLogout, mobileOpen = false, onClose = () => {} }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto border-r border-songket-border bg-white/95 p-4 shadow-soft backdrop-blur-xl transition-transform duration-300 sm:p-6 lg:sticky lg:inset-auto lg:top-6 lg:w-full lg:max-w-none lg:translate-x-0 lg:border-none lg:bg-white/95 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal={mobileOpen ? 'true' : 'false'}
      >
        <div className="mb-5 flex items-center justify-between gap-4 lg:justify-start">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-songket-text-secondary sm:text-xs sm:tracking-[0.36em]">Admin</p>
            <h2 className="mt-3 text-2xl font-semibold text-songket-text-primary sm:mt-4 sm:text-3xl">Panel Songket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-songket-cream text-songket-text-secondary transition hover:bg-songket-gold/10"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-6 text-sm leading-6 text-songket-text-secondary sm:mb-8">Kelola dataset, model, dan riwayat klasifikasi Songket Palembang.</p>

        <nav className="space-y-2 sm:space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-[1.25rem] border px-3 py-3 text-left transition duration-200 sm:rounded-[1.5rem] sm:px-4 sm:py-4 ${isActive ? 'border-songket-gold bg-songket-gold/10 text-songket-text-primary shadow-soft' : 'border-songket-border bg-songket-cream text-songket-text-secondary hover:border-songket-gold/70 hover:bg-songket-cream/90'}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-songket-cream text-songket-gold shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="truncate font-semibold">{item.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-songket-text-secondary" />
              </button>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-songket-border pt-5">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-songket-gold/10 px-4 py-3 text-sm font-semibold text-songket-text-primary transition hover:bg-songket-gold/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
