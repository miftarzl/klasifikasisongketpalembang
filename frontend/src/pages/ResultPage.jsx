import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import SongketCultureInfo from '../components/SongketCultureInfo';
import { resolveConfidenceScore, formatConfidencePercent, getConfidenceLabel } from '../utils/confidence';

const safeDecode = (value) => {
  try {
    const bytes = Uint8Array.from(atob(decodeURIComponent(value)), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (error) {
    return null;
  }
};

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 520"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" x2="1" y1="0" y2="1"%3E%3Cstop offset="0%25" stop-color="%23F8F5EE"/%3E%3Cstop offset="100%25" stop-color="%23FFFDF8"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="920" height="520" fill="url(%23g)"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%232E2116" font-family="Cinzel, serif" font-size="48" font-weight="700"%3ESongket%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" fill="%23C8A23A" font-family="Cinzel, serif" font-size="24"%3EPalembang%3C/text%3E%3C/svg%3E';

export default function ResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const payload = searchParams.get('payload');

  const result = useMemo(() => {
    if (!payload) return null;
    const raw = safeDecode(payload);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return {
        prediction_label: parsed.prediction_label,
        confidence_score: parsed.confidence_score,
        model_version: parsed.model_version || 'v2.0',
        image_url: parsed.image_url,
        image: parsed.image_url,
        image_path: parsed.image_url,
        top_predictions: parsed.top_predictions || [],
        created_at: parsed.created_at || new Date().toISOString(),
        confidence: parsed.confidence_score,
        confidence_score_pct: (parsed.confidence_score * 100),
      };
    } catch (error) {
      console.error('Error decoding result:', error);
      return null;
    }
  }, [payload]);

  const confidenceScore = resolveConfidenceScore(result);
  const confidenceText = formatConfidencePercent(confidenceScore, 0);
  const confidenceLabel = getConfidenceLabel(confidenceScore);

  return (
    <main className="bg-gradient-to-b from-songket-cream via-songket-ivory to-songket-cream min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 mb-8 rounded-xl border border-songket-border bg-songket-ivory px-5 py-3 text-sm font-semibold text-songket-text-primary hover:bg-songket-gold hover:text-white hover:border-songket-gold shadow-soft hover:shadow-panel transition-all duration-300 animate-slide-in"
        >
          <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          Kembali ke Beranda
        </button>

        {result ? (
          <div className="space-y-8 lg:space-y-12">
            {/* Hero Header Section */}
            <div className="rounded-3xl bg-gradient-to-br from-songket-maroon from-30% via-songket-dark-gold to-songket-gold to-90% border-2 border-songket-gold p-8 sm:p-12 lg:p-16 shadow-elegant text-white animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-songket-hover" strokeWidth={2} />
                  <span className="text-xs uppercase tracking-widest font-heading font-semibold text-songket-hover">Hasil Klasifikasi</span>
                </div>
                {confidenceScore >= 0.8 && (
                  <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-4 py-2">
                    <CheckCircle2 className="w-5 h-5 text-songket-hover" strokeWidth={2} />
                    <span className="text-sm font-semibold">Kepercayaan Tinggi</span>
                  </div>
                )}
              </div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-4">
                {result.prediction_label}
              </h1>
              <p className="text-lg sm:text-xl text-white text-opacity-90 font-medium">
                Motif Songket Palembang yang Elegan dan Bersejarah
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image & Top Predictions */}
              <div className="lg:col-span-1 space-y-6">
                {/* Image Card */}
                <div className="rounded-2xl overflow-hidden border-4 border-songket-gold shadow-elegant bg-white animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="aspect-square w-full">
                    {result.image_url ? (
                      <img 
                        src={result.image_url} 
                        alt={result.prediction_label} 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        style={{ filter: 'brightness(1.3) contrast(1.25) saturate(1.1)' }}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-songket-pattern">
                        <p className="text-songket-text-secondary text-center px-4">Gambar tidak tersedia</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Predictions Compact */}
                {result.top_predictions && result.top_predictions.length > 0 && (
                  <div className="rounded-2xl bg-songket-ivory border border-songket-border p-6 shadow-soft animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <h3 className="font-heading text-lg font-semibold text-songket-text-primary mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏆</span> Top 3 Prediksi
                    </h3>
                    <div className="space-y-3">
                      {result.top_predictions.slice(0, 3).map((pred, idx) => {
                        const conf = resolveConfidenceScore(pred) ?? 0;
                        const pct = Math.round(conf * 100);
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-songket-text-primary">{idx + 1}. {pred.label || pred.prediction || 'Tidak diketahui'}</span>
                              <span className="text-sm font-bold text-songket-gold">{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Results & Analysis */}
              <div className="lg:col-span-2 space-y-6">
                {/* Confidence Card - Enhanced */}
                <div className="rounded-2xl bg-gradient-to-br from-songket-gold from-20% to-songket-hover to-80% border-2 border-songket-dark-gold p-8 shadow-elegant text-songket-text-primary animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-heading font-semibold text-songket-text-primary text-opacity-80 mb-3">Tingkat Kepercayaan</p>
                      <p className="font-heading text-6xl font-black">
                        {confidenceText}
                      </p>
                      <p className="text-sm font-semibold mt-2 text-songket-text-secondary">
                        Status: {confidenceLabel}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-songket-text-primary opacity-10"></div>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="2" className="text-songket-text-primary text-opacity-20" />
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="50" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            className="text-songket-text-primary transition-all duration-500"
                            strokeDasharray={`${confidenceScore * 314} 314`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <p className="font-heading text-3xl font-bold text-songket-text-primary">{Math.round(confidenceScore * 100)}</p>
                          <p className="text-xs font-semibold text-songket-text-secondary">Skor</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${confidenceScore * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-songket-text-secondary mt-2">Akurasi Prediksi Model AI</p>
                  </div>
                </div>

                {/* Model Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-songket-ivory border border-songket-border p-6 shadow-soft hover:shadow-panel transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <p className="text-xs uppercase tracking-widest font-heading font-semibold text-songket-text-primary text-opacity-70 mb-3">Versi Model</p>
                    <p className="font-heading text-2xl font-bold text-songket-gold">{result.model_version || 'v2.0'}</p>
                  </div>
                  <div className="rounded-2xl bg-songket-ivory border border-songket-border p-6 shadow-soft hover:shadow-panel transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <p className="text-xs uppercase tracking-widest font-heading font-semibold text-songket-text-primary text-opacity-70 mb-3">Tanggal Analisis</p>
                    <p className="font-heading text-xl font-bold text-songket-maroon">
                      {new Date(result.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Information Section */}
            <SongketCultureInfo songketName={result.prediction_label} />

            {/* Tips Section */}
            <div className="rounded-2xl bg-gradient-to-br from-songket-ivory from-20% to-songket-cream to-80% border-2 border-songket-border p-8 sm:p-10 shadow-elegant text-white animate-fade-in">
              <div className="flex gap-6">
                <div className="text-4xl flex-shrink-0">💡</div>
                <div>
                  <h3 className="font-heading text-2xl font-bold mb-4">Tips Mengambil Foto Songket Terbaik</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-songket-hover text-xl font-bold flex-shrink-0">✓</span>
                      <span className="font-medium leading-relaxed">Pastikan motif Songket terlihat jelas dan tidak terpotong dari tepi</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-songket-hover text-xl font-bold flex-shrink-0">✓</span>
                      <span className="font-medium leading-relaxed">Gunakan pencahayaan natural (cahaya matahari) dan minimalkan pantulan atau kilau berlebihan</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-songket-hover text-xl font-bold flex-shrink-0">✓</span>
                      <span className="font-medium leading-relaxed">Hindari latar belakang yang terlalu ramai agar AI dapat fokus pada pola Songket</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-songket-hover text-xl font-bold flex-shrink-0">✓</span>
                      <span className="font-medium leading-relaxed">Ambil foto dari jarak dekat (close-up) untuk detail motif lebih terlihat</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-songket-ivory border-2 border-songket-border p-12 sm:p-16 shadow-elegant text-center animate-fade-in">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="font-heading text-3xl font-bold text-songket-text-primary mb-3">Hasil Tidak Ditemukan</h2>
            <p className="text-songket-text-secondary mb-8 max-w-md mx-auto text-lg">
              Periksa kembali link yang kamu bagikan atau kembali ke halaman utama untuk melakukan klasifikasi baru.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary font-bold px-8 py-4 hover:shadow-elegant transition-all duration-300 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              Kembali ke Beranda
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
