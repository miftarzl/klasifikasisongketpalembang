import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

export default function TrainingPanel({ onTrainingSuccess }) {
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const refreshStatus = async () => {
    try {
      const { data } = await api.get('/ml/training-status');
      if (data && data.state) {
        setStatus(data.state === 'running' ? 'Training berjalan...' : data.state === 'completed' ? 'Training selesai.' : data.state);
        if (typeof data.progress === 'number') {
          setProgress(Math.min(100, Math.max(0, data.progress)));
        }
        if (data.log) {
          setLogs((prev) => {
            const next = [...prev, data.log];
            return next.slice(-10);
          });
        }
      }
      if (training && data.state !== 'running') {
        // Training finished or failed - stop polling and notify parent to refresh analytics
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        if (data.state === 'completed' && onTrainingSuccess) {
          onTrainingSuccess();
        }
      }
    } catch (err) {
      console.warn('Training status polling failed:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(refreshStatus, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    setProgress(0);
    setStatus('Menjalankan training...');
    setMessage('Memulai proses training, mohon tunggu...');
    setLogs([]);
    setError('');
    startPolling();

    try {
      const resp = await api.post('/admin/train');
      const data = resp.data;
      setMessage(data.message || 'Training dimulai.');

      // If ML service already completed and returned final metrics (200), trigger analytics refresh
      if (resp.status === 200) {
        setStatus('completed');
        setProgress(100);
        if (onTrainingSuccess) onTrainingSuccess();
      } else {
        // Response accepted (202) - background training: keep polling, on completion polling will refresh status
        setStatus('running');
      }
    } catch (err) {
      stopPolling();
      const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.error || err.message;
      setError(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail, null, 2));
      setMessage('Terjadi kesalahan saat training. Lihat detail di bawah.');
      setStatus('error');
    } finally {
      setTraining(false);
      // keep polling until status becomes non-running; refreshStatus will update logs and when completed, it will stop polling
      await refreshStatus();
    }
  };

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-songket-border bg-white shadow-soft sm:rounded-[2rem]">
      <div className="bg-songket-cream p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-songket-text-secondary sm:text-xs sm:tracking-[0.3em]">Training Model</p>
            <h2 className="mt-2 text-xl font-semibold text-songket-text-primary sm:mt-3 sm:text-2xl">Kelola proses training AI</h2>
            <p className="mt-2 text-sm text-songket-text-secondary">Mulai training ulang dengan dataset terbaru dan pantau statusnya di sini.</p>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
          >
            {training ? 'Menjalankan...' : 'Mulai Training'}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        <div className="rounded-[1.25rem] border border-songket-border bg-songket-cream p-4 sm:rounded-[1.75rem] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-songket-text-primary">{status || 'Siap menjalankan training'}</p>
              <p className="text-sm text-songket-text-secondary">Proses training akan terlihat secara otomatis setelah dimulai.</p>
            </div>
            <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-songket-border bg-white px-4 py-2 text-sm font-semibold text-songket-text-primary">{progress}%</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-songket-cream border border-songket-border">
            <div className="h-full rounded-full bg-songket-gold transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {message && (
          <div className="rounded-[1.5rem] border border-songket-border bg-white p-4 text-songket-text-secondary">
            <p className="text-sm font-semibold text-songket-text-primary">Info</p>
            <p className="mt-2 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="text-sm font-semibold">Kesalahan training</p>
            <pre className="mt-2 overflow-x-auto text-xs leading-5 text-red-700">{error}</pre>
          </div>
        )}

        {logs.length > 0 && (
          <div className="rounded-[1.5rem] border border-songket-border bg-songket-cream p-4">
            <h3 className="font-semibold text-songket-text-primary mb-3">Log training terbaru</h3>
            <div className="custom-scrollbar max-h-44 space-y-2 overflow-y-auto overflow-x-auto pr-2">
              {logs.map((line, index) => (
                <p key={index} className="whitespace-nowrap font-mono text-xs text-songket-text-secondary">- {line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
