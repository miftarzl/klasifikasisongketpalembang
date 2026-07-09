import { useEffect } from 'react';

export default function Toast({ show, message, type = 'success', onClose, duration = 3200 }) {
  useEffect(() => {
    if (!show) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show || !message) return null;

  const tone = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : type === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-full max-w-md rounded-3xl border p-4 shadow-xl ${tone}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-lg">{type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : '✅'}</div>
        <div className="min-w-0 text-sm leading-6">
          <p className="font-semibold">{type === 'error' ? 'Perhatian' : type === 'warning' ? 'Info' : 'Berhasil'}</p>
          <p className="mt-1 truncate text-sm text-current">{message}</p>
        </div>
      </div>
    </div>
  );
}
