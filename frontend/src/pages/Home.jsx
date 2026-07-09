import { useState, useEffect } from 'react';
import ImageUpload from '../components/ImageUpload';
import PredictionResult from '../components/PredictionResult';
import { resolveConfidenceScore } from '../utils/confidence';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

export default function Home() {
  const [result, setResult] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleResult = (data, imageUrl) => {
    const resolvedImageUrl = data.image_url || data.image || data.image_path || imageUrl;
    const resolvedLabel = data.prediction_label || data.label || data.result?.label || 'Tidak diketahui';
    const resolvedConfidence = resolveConfidenceScore(data);

    const resultData = {
      ...data,
      prediction_label: resolvedLabel,
      confidence_score: resolvedConfidence,
      image_url: resolvedImageUrl,
      image: resolvedImageUrl,
      image_path: resolvedImageUrl,
    };

    setResult(resultData);
    setUploadedImageUrl(resolvedImageUrl);
  };

  // Cleanup object URL saat component unmount atau result di-reset
  useEffect(() => {
    return () => {
      if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(uploadedImageUrl);
        } catch (e) {
          // Ignore revoke errors
        }
      }
    };
  }, [uploadedImageUrl]);

  const handleReset = () => {
    if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(uploadedImageUrl);
      } catch (e) {}
    }
    setResult(null);
    setUploadedImageUrl(null);
  };

  return (
    <main className="bg-songket-cream min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-12 sm:mb-16 pt-16 sm:pt-20 pb-12 sm:pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://i1-c.pinimg.com/1200x/10/12/30/10123025995894eff10fc9792d4aa072.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-songket-gold/3 via-transparent to-songket-maroon/3" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border-2 border-songket-gold bg-songket-ivory/50 px-6 py-2 mb-6 gap-2">
              <Sparkles className="w-4 h-4 text-songket-gold" />
              <span className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-songket-text-primary">Klasifikasi Songket Palembang</span>
            </div>
            <h1 className="font-heading mt-6 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-songket-text-primary leading-tight">
              Unggah Songket Palembang dan Biarkan AI Mengenali Motifnya
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-songket-text-secondary leading-8">
              Platform kecerdasan buatan premium untuk identifikasi motif Songket khas Palembang dengan analisis mendalam dan penjelasan budaya.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#upload"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary px-8 py-4 text-sm font-bold shadow-elegant transition-all hover:shadow-panel active:scale-95"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                Mulai Klasifikasi Sekarang
              </a>
              <a
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-songket-gold bg-songket-ivory/50 text-songket-text-primary px-8 py-4 text-sm font-bold transition-all hover:bg-songket-ivory active:scale-95"
              >
                <BookOpen className="w-5 h-5" strokeWidth={2.5} />
                Jelajahi Songket Explorer
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12 max-w-7xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: '⚡',
              title: 'Klasifikasi Real-time',
              description: 'Unggah satu gambar Songket Palembang dan dapatkan hasil dalam hitungan detik.'
            },
            {
              icon: '📊',
              title: 'Analisis Model AI',
              description: 'Lihat confidence, prediksi terbaik, serta detail motif yang terdeteksi.'
            },
            {
              icon: '🧵',
              title: 'AI Spesialis Songket',
              description: 'Model dilatih khusus untuk motif Songket Palembang yang kaya ornamen.'
            },
            {
              icon: '📷',
              title: 'Optimasi Kualitas Foto',
              description: 'Terima rekomendasi pengambilan gambar untuk hasil klasifikasi maksimal.'
            }
          ].map((item) => (
            <div key={item.title} className="h-full rounded-2xl border-2 border-songket-border bg-songket-ivory p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-panel flex flex-col justify-between">
              <div>
                <p className="text-3xl mb-3">{item.icon}</p>
                <p className="font-heading text-lg font-bold text-songket-text-primary mb-2">{item.title}</p>
                <p className="text-sm text-songket-text-secondary leading-6">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14 max-w-7xl mx-auto">
        {!result ? (
          // Upload State
          <div className="flex flex-col gap-12">
            <div className="mx-auto max-w-3xl text-center animate-fade-in">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-songket-text-primary leading-tight">
                Mari Mulai Klasifikasi
              </h2>
              <p className="mt-4 text-base sm:text-lg text-songket-text-secondary max-w-2xl mx-auto leading-8">
                Pilih atau seret gambar Songket Palembang untuk mulai analisis mendalam dengan AI specialist kami.
              </p>
            </div>

            <div className="mx-auto w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ImageUpload onResult={handleResult} />
            </div>

            <div className="mx-auto w-full max-w-5xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="h-full rounded-2xl border-2 border-songket-border bg-songket-ivory p-6 shadow-soft">
                  <p className="font-heading text-xs uppercase tracking-widest text-songket-gold font-bold mb-3">Langkah 1</p>
                  <h3 className="font-heading text-lg font-semibold text-songket-text-primary mb-2">Unggah Foto</h3>
                  <p className="text-sm text-songket-text-secondary leading-6">Seret atau pilih foto Songket Palembang yang akan diklasifikasikan dengan detail.</p>
                </div>
                <div className="h-full rounded-2xl border-2 border-songket-border bg-songket-ivory p-6 shadow-soft">
                  <p className="font-heading text-xs uppercase tracking-widest text-songket-maroon font-bold mb-3">Langkah 2</p>
                  <h3 className="font-heading text-lg font-semibold text-songket-text-primary mb-2">Tunggu Hasil</h3>
                  <p className="text-sm text-songket-text-secondary leading-6">Sistem akan memproses dan memberi prediksi beserta confidence score dan analisis.</p>
                </div>
                <div className="h-full rounded-2xl border-2 border-songket-border bg-songket-ivory p-6 shadow-soft">
                  <p className="font-heading text-xs uppercase tracking-widest text-songket-emerald font-bold mb-3">Langkah 3</p>
                  <h3 className="font-heading text-lg font-semibold text-songket-text-primary mb-2">Pelajari Hasil</h3>
                  <p className="text-sm text-songket-text-secondary leading-6">Dapatkan top-3 prediksi, tips foto, dan penjelasan lengkap tentang motif Songket.</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6 animate-fade-in w-full">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-songket-gold hover:text-songket-dark-gold font-bold transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              Unggah Gambar Lain
            </button>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 order-2 md:order-1">
                <div className="sticky top-4 space-y-4">
                  <div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-songket-text-primary flex items-center gap-2">
                      <span>📸</span>
                      <span>Gambar Songket</span>
                    </h3>
                    <p className="text-xs text-songket-text-secondary">Foto yang diunggah</p>
                  </div>
                  {uploadedImageUrl && (
                    <div className="rounded-2xl overflow-hidden border-4 border-songket-gold shadow-elegant bg-songket-ivory aspect-square">
                      <img
                        src={uploadedImageUrl}
                        alt="Gambar Songket yang diunggah"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.target.alt = 'Gambar gagal dimuat';
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleReset}
                    className="w-full rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary px-4 py-3 font-bold transition-all hover:shadow-elegant active:scale-95 text-sm sm:text-base"
                  >
                    Unggah Gambar Baru
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 order-1 md:order-2">
                <div className="space-y-3 mb-6">
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-songket-text-primary flex items-center gap-2">
                    <span>🎯</span>
                    <span>Hasil Analisis</span>
                  </h3>
                  <p className="text-sm text-songket-text-secondary">Hasil klasifikasi dan analisis mendalam tentang motif Songket</p>
                </div>
                <PredictionResult result={result} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        /* Responsive typography scaling */
        @media (max-width: 640px) {
          body {
            font-size: 14px;
          }
        }

        /* Safe area padding for notch devices */
        @supports (padding: max(0px)) {
          body {
            padding-left: max(1rem, env(safe-area-inset-left));
            padding-right: max(1rem, env(safe-area-inset-right));
          }
        }

        /* Prevent zoom on input focus on iOS */
        input, textarea, select {
          font-size: 16px;
        }

        /* Touch optimization */
        button, input[type="file"], a {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
    </main>
  );
}
