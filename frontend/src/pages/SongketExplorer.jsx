import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Sparkles, BookOpen, MapPin, CircleDashed, ChevronDown } from 'lucide-react';
import { songketDataList } from '../data/songketData';
import { getSongketGallery, getSongketHeroImage } from '../data/songketImages';
import useSongketData from '../hooks/useSongketData';

const normalizeText = (value) => {
  if (!value) return '';
  return value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
};

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 520"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" x2="1" y1="0" y2="1"%3E%3Cstop offset="0%25" stop-color="%23f8fafc"/%3E%3Cstop offset="100%25" stop-color="%23dbeafe"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="920" height="520" fill="url(%23g)"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%233c4f76" font-family="Inter, sans-serif" font-size="48" font-weight="700"%3ESongket%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" fill="%23637dff" font-family="Inter, sans-serif" font-size="24"%3EPalembang Explorer%3C/text%3E%3C/svg%3E';

const handleImageError = (event) => {
  const target = event.currentTarget;
  if (target.dataset.fallbackAttempted) {
    target.onerror = null;
    target.src = placeholderImage;
    return;
  }
  target.dataset.fallbackAttempted = 'true';
  const src = target.src.replace(/[?#].*$/, '');
  const base = src.replace(/\.(svg|png|jpe?g)$/i, '');
  if (src.toLowerCase().endsWith('.svg')) {
    target.src = `${base}.png`;
  } else if (src.toLowerCase().endsWith('.png')) {
    target.src = `${base}.jpg`;
  } else if (src.toLowerCase().endsWith('.jpg') || src.toLowerCase().endsWith('.jpeg')) {
    target.src = placeholderImage;
  } else {
    target.src = `${base}.svg`;
  }
};

const levenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
};

const fuzzyMatch = (source, query) => {
  if (!source || !query) return false;
  const normalizedSource = normalizeText(source);
  const normalizedQuery = normalizeText(query);
  if (normalizedSource.includes(normalizedQuery)) return true;
  const sourceWords = normalizedSource.split(' ').filter(Boolean);
  return sourceWords.some((word) => levenshteinDistance(word, normalizedQuery) <= 1);
};

const SongketExplorer = () => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const navigate = useNavigate();
  const { grouped, loading } = useSongketData();

  const songketGroups = useMemo(() => {
    if (grouped.length > 0) return grouped;
    return songketDataList.map((item) => ({
      label: item.name,
      name: item.name,
      slug: item.slug,
      category: item.category,
      origin: item.origin,
      summary: item.summary,
      gallery: item.gallery && item.gallery.length ? item.gallery : getSongketGallery(item.slug),
      image_url: item.image || getSongketHeroImage(item.slug),
      image: item.image || getSongketHeroImage(item.slug),
      keywords: item.keywords,
      popularityBadge: item.popularityBadge,
      sample: item,
    }));
  }, [grouped]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(songketGroups.map((item) => item.category || 'Uncategorized')))];
  }, [songketGroups]);

  const filteredSongkets = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const hasImage = (item) => {
      // Consider item has image if it has gallery assets or an explicit image_url/image
      const gallery = getSongketGallery(item.slug || item.name);
      if (gallery && gallery.length) return true;
      if (item.image_url || item.image) return true;
      if (item.sample && (item.sample.image_url || item.sample.image)) return true;
      return false;
    };

    return songketGroups.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      if (!matchesCategory) return false;

      // remove items that do not have any usable image
      if (!hasImage(item)) return false;

      if (!normalizedQuery) return true;
      const mass = [item.label, item.summary, item.category, item.origin, (item.keywords || []).join(' ')].join(' ');
      return fuzzyMatch(mass, normalizedQuery);
    });
  }, [query, activeCategory, songketGroups]);

  const recommendedSongkets = useMemo(() => songketGroups.slice(0, 4), [songketGroups]);
  const manualFeaturedSongkets = useMemo(() => [
    { slug: 'limar', name: 'Songket Limar', thumb: getSongketHeroImage('limar') },
    { slug: 'rakam', name: 'Songket Rakam', thumb: getSongketHeroImage('rakam') },
    { slug: 'polos', name: 'Songket Polos', thumb: getSongketHeroImage('polos') },
    { slug: 'lepus', name: 'Songket Lepus', thumb: getSongketHeroImage('lepus') },
    { slug: 'tabur', name: 'Songket Tabur', thumb: getSongketHeroImage('tabur') },
    { slug: 'seler', name: 'Songket Seler', thumb: getSongketHeroImage('seler') }
  ], []);

  return (
    <main className="bg-songket-cream min-h-screen w-full overflow-x-hidden py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] items-start">
          <section className="space-y-6">
            <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-6 shadow-soft">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest font-heading font-bold text-songket-gold mb-2">Jelajahi Songket Palembang</p>
                  <h1 className="font-heading text-4xl sm:text-5xl font-black text-songket-text-primary leading-tight">
                    Songket Explorer
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm sm:text-base text-songket-text-secondary leading-7">
                    Cari dan pelajari karakteristik motif Songket Palembang tanpa harus mengunggah gambar. Cocok untuk eksplorasi budaya, inspirasi desain, dan referensi tradisi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary px-6 py-3 text-sm font-bold transition-all hover:shadow-elegant active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                    Kembali ke Klasifikasi
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="rounded-2xl border-2 border-songket-border bg-songket-cream p-4 flex items-center gap-3 max-w-2xl shadow-soft">
                  <Search className="w-5 h-5 text-songket-gold" strokeWidth={2.5} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari: limar, rakam, pola, kerajaan..."
                    className="w-full min-w-0 bg-transparent text-songket-text-primary placeholder:text-songket-text-secondary focus:outline-none font-body"
                  />
                </div>
                <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-4 w-full lg:w-auto shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Filter className="w-5 h-5 text-songket-gold" strokeWidth={2.5} />
                      <div>
                        <p className="font-heading text-sm font-semibold text-songket-text-primary">Kategori</p>
                        <p className="text-xs text-songket-text-secondary">Pilih motif yang ingin ditampilkan</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCategoriesOpen((open) => !open)}
                      className="rounded-xl border-2 border-songket-gold bg-songket-cream px-4 py-2 text-sm font-bold text-songket-text-primary transition hover:bg-songket-ivory"
                    >
                      {activeCategory} {isCategoriesOpen ? <ChevronDown className="w-4 h-4 inline" strokeWidth={2.5} /> : <ChevronDown className="w-4 h-4 inline transform rotate-180" strokeWidth={2.5} />}
                    </button>
                  </div>
                  {isCategoriesOpen && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setActiveCategory(category);
                            setIsCategoriesOpen(false);
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            activeCategory === category
                              ? 'bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary shadow-soft'
                              : 'bg-songket-cream text-songket-text-primary hover:bg-songket-ivory border border-songket-border'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Hasil Pencarian</h2>
                  <p className="text-sm text-slate-500">
                    Menampilkan {filteredSongkets.length} dari {songketGroups.length} motif.
                  </p>
                </div>
                {query && (
                  <p className="text-sm text-slate-500">Pencarian untuk “{query}”</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSongkets.map((songket) => (
                  <Link
                    key={songket.slug}
                    to={`/songket/${songket.slug}`}
                    className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-100">
                      <img
                        src={getSongketGallery(songket.slug)[0] || songket.image_url || songket.image || (songket.sample && songket.sample.image_url) || getSongketHeroImage(songket.slug)}
                        alt={songket.name || songket.label}
                        className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                        style={{ filter: 'brightness(1.15) contrast(1.05) saturate(1.05)' }}
                        onError={handleImageError}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-200">{songket.category}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-slate-900">{songket.name || songket.label}</h3>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{songket.popularityBadge || 'Terkenal'}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-6">{songket.summary || 'Deskripsi singkat belum tersedia.'}</p>
                      <div className="flex flex-wrap gap-2">
                        {(songket.keywords || []).slice(0, 3).map((keyword) => (
                          <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{keyword}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}

                {filteredSongkets.length === 0 && (
                  <div className="rounded-[1.75rem] border border-slate-200 bg-white p-12 text-center text-slate-600 shadow-sm">
                    <CircleDashed className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                    <p className="text-lg font-semibold">Tidak ada hasil</p>
                    <p className="mt-2 text-sm text-slate-500">Coba kata kunci lain atau reset filter kategori.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Cepat & Lokal</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">Pencarian instan langsung di browser</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600 leading-7">
                Semua daftar dan deskripsi disimpan di sisi klien. Ketik kata kunci, pilih kategori, dan jelajahi tanpa memuat ulang halaman.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-6 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] font-semibold">Belajar lebih dalam</p>
                  <p className="mt-2 text-base font-semibold">Detail motif & penggunaan</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200">
                Setiap Songket hadir dengan ringkasan, sejarah, filosofi, dan rekomendasi budaya yang membantu menjadikan eksplorasi Anda lebih bermakna.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Kunci eksplorasi</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Gunakan nama motif atau kata kunci sederhana.</li>
                <li>• Filter berdasarkan kategori motif.</li>
                <li>• Klik kartu untuk membuka detail lengkap.</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">Sorotan Gambar</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Koleksi Songket Pilihan</h3>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {manualFeaturedSongkets.map((songket) => (
              <Link
                key={songket.slug}
                to={`/songket/${songket.slug}`}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={songket.thumb}
                    alt={songket.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={handleImageError}
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{songket.name}</p>
                  <p className="mt-2 text-sm text-slate-600">Dari koleksi manual yang ada di folder <span className="font-semibold">img songket</span>.</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">Rekomendasi</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">Lihat motif lain</h3>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendedSongkets.map((songket) => (
              <Link
                key={songket.slug}
                to={`/songket/${songket.slug}`}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm">
                    <MapPin className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{songket.name}</p>
                    <p className="text-xs text-slate-500">{songket.category}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">{songket.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SongketExplorer;
