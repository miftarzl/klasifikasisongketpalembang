import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../services/api';
import DatasetManager from '../components/DatasetManager';
import TrainingPanel from '../components/TrainingPanel';
import HistoryTable from '../components/HistoryTable';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import AdminSidebar from '../components/AdminSidebar';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { Menu } from 'lucide-react';

export default function Admin() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [activeTab, setActiveTab] = useState('dataset');
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);
  const [analyticsResetKey, setAnalyticsResetKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        setHistoryError('');
        const { data } = await api.get('/admin/history');
        if (active) setHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed loading admin history:', error);
        setHistoryError(error.response?.data?.message || error.message || 'Gagal memuat riwayat klasifikasi.');
      } finally {
        if (active) setHistoryLoading(false);
      }
    }

    loadHistory();
    const interval = setInterval(loadHistory, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    navigate('/admin/login');
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/admin/predictions/history');
      setHistory([]);
      setAnalyticsRefreshTrigger(Date.now());
      setAnalyticsResetKey(Date.now());
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const tabs = [
    { id: 'analytics', name: 'AI Model Analytics' },
    { id: 'dataset', name: 'Dataset' },
    { id: 'training', name: 'Training' },
    { id: 'history', name: 'History' },
    { id: 'settings', name: 'Account Settings' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <AnalyticsDashboard
            key={analyticsResetKey}
            refreshTrigger={analyticsRefreshTrigger}
          />
        );
      case 'dataset':
        return <DatasetManager />;
      case 'training':
        return <TrainingPanel onTrainingSuccess={() => setAnalyticsRefreshTrigger(Date.now())} />;
      case 'history':
        return (
          <HistoryTable
            items={history}
            isLoading={historyLoading}
            error={historyError}
            onClearHistory={handleClearHistory}
          />
        );
      case 'settings':
        return <ChangePasswordForm onLogout={handleLogout} />;
      default:
        return <DatasetManager />;
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-songket-cream text-songket-text-primary">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-songket-text-secondary sm:text-xs sm:tracking-[0.32em]">Admin Panel</p>
            <h1 className="truncate text-xl font-semibold text-songket-text-primary sm:text-2xl">Kelola Songket</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-songket-gold px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-songket-hover"
            aria-label="Buka menu admin"
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start xl:gap-6">
          <div className="hidden lg:block">
            <AdminSidebar activeTab={activeTab} onSelectTab={setActiveTab} onLogout={handleLogout} />
          </div>

          <div className="min-w-0 space-y-4 sm:space-y-6">
            <section className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-songket-text-secondary sm:text-xs sm:tracking-[0.32em]">Admin Panel</p>
                <h1 className="text-2xl font-semibold text-songket-text-primary sm:text-4xl">Panel Admin</h1>
                <p className="max-w-2xl text-sm leading-6 text-songket-text-secondary sm:leading-7">
                  Kelola dataset, model, dan riwayat klasifikasi saja. Fitur Explorer dikelola manual dan tidak ditampilkan di antarmuka admin saat ini.
                </p>
              </div>
            </section>

            <div className="min-w-0 rounded-[1.25rem] border border-songket-border bg-white p-3 shadow-soft sm:rounded-[1.75rem] sm:p-5">
              <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-songket-text-secondary sm:text-xs sm:tracking-[0.32em]">Tab Konten</p>
                  <h2 className="mt-1 text-xl font-semibold text-songket-text-primary sm:mt-2 sm:text-2xl">Pilih karya yang ingin dikelola</h2>
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-songket-gold text-white shadow-soft' : 'bg-songket-cream text-songket-text-secondary hover:bg-songket-hover/10'}`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-w-0">{renderTabContent()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          onLogout={handleLogout}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>
    </main>
  );
}
