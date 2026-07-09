import React from 'react';
import { ScrollText, CalendarDays, Users, Sparkles } from 'lucide-react';
import { getSongketInformation } from '../data/songketInformation';

export default function SongketCultureInfo({ songketName }) {
  const cultureInfo = getSongketInformation(songketName);

  if (!cultureInfo) return null;

  return (
    <section className="space-y-6 lg:space-y-8">
      <div className="card-shell p-8 shadow-soft animate-fade-in">
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-songket-text-primary">
          Tentang Songket {songketName}
        </h2>
        <p className="mt-4 text-songket-text-secondary leading-relaxed max-w-3xl">
          Temukan konteks budaya di balik motif yang dikenali AI. Informasi ini membantu memahami penggunaan tradisional, nilai sejarah, dan makna simbolik Songket Palembang tersebut.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          className="card-shell p-6 shadow-soft animate-fade-in"
          style={{ backgroundColor: '#FFF8E7', borderLeft: '4px solid #C9A227' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-6 h-6 text-[#C9A227]" strokeWidth={2} />
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-songket-text-primary">Sejarah</h3>
          </div>
          <p className="text-songket-text-secondary leading-relaxed text-base sm:text-lg">
            {cultureInfo.sejarah}
          </p>
        </div>

        <div
          className="card-shell p-6 shadow-soft animate-fade-in"
          style={{ backgroundColor: '#FFF3E0', borderLeft: '4px solid #D4AF37' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-6 h-6 text-[#C9A227]" strokeWidth={2} />
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-songket-text-primary">Dipakai Ketika</h3>
          </div>
          <div className="space-y-3">
            {cultureInfo.acara.map((occasion, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-songket-gold bg-opacity-20 text-songket-text-primary text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-songket-text-secondary font-medium pt-0.5">{occasion}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="card-shell p-6 shadow-soft animate-fade-in"
          style={{ backgroundColor: '#F9F5EC', borderLeft: '4px solid #8B5E3C' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#8B5E3C]" strokeWidth={2} />
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-songket-text-primary">Biasa Dipakai Oleh</h3>
          </div>
          <div className="space-y-3">
            {cultureInfo.digunakanOleh.map((wearer, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-songket-text-primary bg-opacity-10 text-songket-text-primary text-sm font-bold flex-shrink-0">
                  •
                </span>
                <span className="text-songket-text-secondary font-medium pt-0.5">{wearer}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="card-shell p-6 shadow-soft animate-fade-in"
          style={{ backgroundColor: '#FFF9F0', borderLeft: '4px solid #B8860B' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#C9A227]" strokeWidth={2} />
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-songket-text-primary">Filosofi</h3>
          </div>
          <p className="text-songket-text-secondary leading-relaxed text-base sm:text-lg">
            {cultureInfo.filosofi}
          </p>
        </div>
      </div>
    </section>
  );
}
