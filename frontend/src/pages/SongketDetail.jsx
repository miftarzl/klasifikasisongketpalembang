import { useMemo, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, MapPin, Sparkles, BookOpen, CircleDashed } from 'lucide-react';
import { getSongketBySlug, getRelatedSongket } from '../data/songketData';
import { getSongketGallery, getSongketHeroImage } from '../data/songketImages';
import useSongketData from '../hooks/useSongketData';
import BilingualText from '../components/BilingualText';

const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 520"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" x2="1" y1="0" y2="1"%3E%3Cstop offset="0%25" stop-color="%23f8fafc"/%3E%3Cstop offset="100%25" stop-color="%23dbeafe"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="920" height="520" fill="url(%23g)"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%233c4f76" font-family="Inter, sans-serif" font-size="48" font-weight="700"%3ESongket%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" fill="%23637dff" font-family="Inter, sans-serif" font-size="24"%3EExplorer%3C/text%3E%3C/svg%3E';

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

const SongketDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { grouped } = useSongketData();

  const normalizedSlug = slug?.toString().trim().toLowerCase();
  const datasetSongket = useMemo(() => grouped.find((item) => item.slug === normalizedSlug), [grouped, normalizedSlug]);
  const staticSongket = useMemo(() => getSongketBySlug(slug), [slug]);

  const songket = useMemo(() => {
    if (datasetSongket && staticSongket) {
      return {
        ...staticSongket,
        ...datasetSongket,
        gallery: datasetSongket.gallery?.length
          ? datasetSongket.gallery
          : staticSongket.gallery?.length
            ? staticSongket.gallery
            : getSongketGallery(normalizedSlug),
        image_url: datasetSongket.image_url || datasetSongket.image || staticSongket.image_url || staticSongket.image || getSongketHeroImage(normalizedSlug),
        image: datasetSongket.image || datasetSongket.image_url || staticSongket.image || staticSongket.image_url || getSongketHeroImage(normalizedSlug),
        history: datasetSongket.history || datasetSongket.history_id || staticSongket.history || staticSongket.history_id,
        history_id: datasetSongket.history_id || datasetSongket.history || staticSongket.history_id || staticSongket.history,
        philosophy: datasetSongket.philosophy || datasetSongket.philosophy_en || staticSongket.philosophy || staticSongket.philosophy_en,
        characteristics: datasetSongket.characteristics || datasetSongket.characteristics_id || staticSongket.characteristics || staticSongket.characteristics_id,
        characteristics_id: datasetSongket.characteristics_id || datasetSongket.characteristics || staticSongket.characteristics_id || staticSongket.characteristics,
        usage: datasetSongket.usage || datasetSongket.usage_id || staticSongket.usage || staticSongket.usage_id,
        usage_id: datasetSongket.usage_id || datasetSongket.usage || staticSongket.usage_id || staticSongket.usage,
      };
    }
    return datasetSongket || staticSongket;
  }, [datasetSongket, staticSongket, normalizedSlug]);

  const localGallery = useMemo(() => getSongketGallery(songket?.slug), [songket?.slug]);

  const gallery = useMemo(() => {
    if (localGallery.length) return localGallery;
    if (songket?.gallery?.length) return songket.gallery;
    if (staticSongket?.gallery?.length) return staticSongket.gallery;
    return [];
  }, [localGallery, songket, staticSongket]);

  const related = useMemo(() => {
    if (songket && songket.slug) {
      return getRelatedSongket(songket.slug, 4);
    }
    return [];
  }, [songket]);

  const [heroImage, setHeroImage] = useState(() => {
    if (localGallery.length) return localGallery[0];
    if (songket?.gallery?.length) return songket.gallery[0];
    if (songket?.image_url || songket?.image) return songket.image_url || songket.image;
    return getSongketHeroImage(songket?.slug);
  });

  useEffect(() => {
    if (localGallery.length > 0) {
      setHeroImage(localGallery[0]);
    } else if (gallery.length > 0) {
      setHeroImage(gallery[0]);
    } else if (songket?.image_url || songket?.image) {
      setHeroImage(songket.image_url || songket.image);
    } else if (songket?.slug) {
      setHeroImage(getSongketHeroImage(songket.slug));
    }
  }, [localGallery, gallery, songket?.image, songket?.image_url, songket?.slug]);

  if (!songket) {
    return (
      <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Songket Tidak Ditemukan</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Maaf, kami tidak menemukan detail untuk item tersebut.</h1>
          <p className="mt-4 text-slate-600">Periksa kembali tautan atau kembali ke Songket Explorer untuk melihat koleksi lengkap.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Kembali ke Explorer
            </button>
            <Link
              to="/"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-slate-50 to-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <BilingualText
                className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold"
                translation="Palembang Songket Detail"
              >
                Detail Songket Palembang
              </BilingualText>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                {songket.name || songket.label}
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-600 leading-7">
                {songket.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Explorer
              </button>
              <a
                href="#gallery"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Lihat Galeri
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <img
                  src={heroImage || songket.image_url || songket.image || placeholderImage}
                  alt={songket.imageAlt || `${songket.name || songket.label || 'Songket'} illustration`}
                  className="w-full object-cover"
                  onError={handleImageError}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Asal</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{songket.origin}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Kategori</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{songket.category || '-'}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Penggunaan</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{songket.usage_id || songket.usage_en}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-7">{songket.usage || songket.usage_id || songket.usage_en || 'Informasi penggunaan belum tersedia.'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Sejarah Singkat</p>
                <p className="mt-4 text-slate-600 leading-7">{songket.history || songket.history_id || songket.history_en || 'Sejarah singkat belum tersedia.'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Filsafat Motif</p>
                <p className="mt-4 text-slate-600 leading-7">{songket.philosophy || songket.philosophy_en || 'Filsafat motif belum tersedia.'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Ciri Utama</p>
                <p className="mt-4 text-slate-600 leading-7">{songket.characteristic || songket.characteristics_id || songket.characteristics_en || 'Ciri utama belum tersedia.'}</p>
              </div>
            </div>
          </div>

          <div id="gallery" className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 font-semibold">Galeri dan Rekomendasi</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Lihat koleksi motif lain</h2>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-600 shadow-sm">
                {songket.popularityBadge}
              </div>
            </div>

            <div className="mt-6">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gallery.length > 0 ? (
                      gallery.slice(0, 8).map((imageUrl, index) => (
                        <button
                          key={imageUrl + index}
                          type="button"
                          onClick={() => setHeroImage(imageUrl)}
                          className={`overflow-hidden rounded-[1.5rem] border transition focus:outline-none ${heroImage === imageUrl ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200'}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${songket.name} thumbnail ${index + 1}`}
                            className="h-28 w-full object-cover transition duration-200 hover:scale-105"
                            onError={handleImageError}
                          />
                        </button>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                        <p className="font-semibold">Galeri tidak tersedia</p>
                        <p className="mt-2 text-sm">Tambah aset ke src/assets/img-songket untuk mengaktifkan tampilan galeri.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500 font-semibold">Deskripsi Galeri</p>
                  <p className="mt-4 text-sm text-slate-600 leading-7">
                    {songket.gallery_description || 'Temukan varian foto dan detail tekstur kain yang terkait dengan motif ini. Klik thumbnail untuk mengganti gambar utama di atas.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.slug || item.label}
                  to={`/songket/${item.slug}`}
                  className="group rounded-[1.75rem] border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={getSongketHeroImage(item.slug) || item.image_url || item.image || item.sample?.image_url || placeholderImage}
                    alt={item.name || item.label}
                    className="h-32 w-full rounded-[1.5rem] object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = placeholderImage;
                    }}
                  />
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">{item.name || item.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.category || '-'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SongketDetail;
