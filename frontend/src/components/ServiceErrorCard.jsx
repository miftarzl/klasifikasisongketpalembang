import React from 'react';

export default function ServiceErrorCard({ title = 'Layanan Tidak Tersedia', message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
      <div className="flex gap-3 items-start">
        <span className="text-2xl">🚫</span>
        <div>
          <p className="text-sm font-semibold text-red-800">{title}</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}
