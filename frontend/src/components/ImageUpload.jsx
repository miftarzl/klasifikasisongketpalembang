import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

export default function ImageUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previousUrlRef = useRef(null);

  const revokePreviousPreview = useCallback(() => {
    if (previousUrlRef.current) {
      try {
        URL.revokeObjectURL(previousUrlRef.current);
      } catch (cleanupError) {
        console.warn('Failed revoking preview URL', cleanupError);
      }
      previousUrlRef.current = null;
    }
  }, []);

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!droppedFile.type.startsWith('image/')) {
      setError('Hanya file gambar yang diterima.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (droppedFile.size > maxSize) {
      setError('Ukuran file terlalu besar (maks 10MB).');
      return;
    }

    revokePreviousPreview();
    const nextPreviewUrl = URL.createObjectURL(droppedFile);
    previousUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setFile(droppedFile);
    setError('');
  }, [revokePreviousPreview]);

  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Hanya file gambar yang diterima.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Ukuran file terlalu besar (maks 10MB).');
      return;
    }

    revokePreviousPreview();
    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    previousUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setFile(selectedFile);
    setError('');
  }, [revokePreviousPreview]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Pilih gambar Songket terlebih dahulu.');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      let imageUrl = previewUrl || null;
      if (!imageUrl && file) {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Gagal menyiapkan preview gambar.'));
          reader.readAsDataURL(file);
        });
        previousUrlRef.current = imageUrl;
        setPreviewUrl(imageUrl);
      }

      const response = await api.post('/predictions', formData);
      onResult?.(response.data, imageUrl);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout: layanan ML mungkin sibuk. Coba lagi nanti.');
      } else if (err.response) {
        setError(err.response?.data?.message || `Server error (${err.response?.status})`);
      } else {
        setError(err.message || 'Gagal melakukan klasifikasi.');
      }
    } finally {
      setLoading(false);
    }
  }, [file, onResult, previewUrl]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    return () => {
      if (previewUrl && previousUrlRef.current === previewUrl) {
        revokePreviousPreview();
      }
    };
  }, [file, previewUrl, revokePreviousPreview]);

  useEffect(() => {
    return () => {
      revokePreviousPreview();
    };
  }, [revokePreviousPreview]);

  return (
    <div className="w-full card-shell surface p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200">
      <div className="mb-5 sm:mb-7">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-950 mb-1">Unggah Gambar Songket</h2>
        <p className="text-sm text-slate-500">Drag & drop atau klik untuk memilih gambar Songket.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed p-6 sm:p-8 min-h-[220px] transition-all duration-200 cursor-pointer text-center ${
            dragActive
              ? 'border-songket-gold bg-songket-gold/10 scale-102'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={loading}
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <svg
              className={`w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 transition-colors ${
                dragActive ? 'text-primary' : 'text-slate-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-sm sm:text-base text-slate-700 font-semibold leading-snug">
              {dragActive ? 'Lepas gambar di sini' : 'Drag gambar atau klik untuk memilih'}
            </p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG (Maks. 10MB)</p>
          </label>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 px-2">💡 Catatan: Foto selain Songket Palembang mungkin tidak akan diklasifikasikan dengan akurat.</p>

        {file && (
          <div className="space-y-3 sm:space-y-4 animate-fadeIn">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img
                src={previewUrl}
                alt="Preview Songket"
                className="w-full object-cover max-h-64 sm:max-h-80"
                style={{ filter: 'brightness(1.3) contrast(1.25) saturate(1.15)' }}
                loading="lazy"
              />
            </div>
            <p className="text-sm text-slate-700 text-center break-words px-1">
              📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white font-semibold transition-all duration-200 flex flex-col items-center gap-1 min-h-[54px] touch-manipulation text-sm sm:text-base ${
            loading
              ? 'bg-slate-400 cursor-not-allowed'
              : file
              ? 'btn-primary hover:shadow-xl active:scale-[0.98]'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <span className="flex items-center gap-2"><span className="inline-block animate-spin">⚙️</span>Memproses...</span>
              <span className="text-xs text-slate-100">Processing...</span>
            </>
          ) : (
            <span>{file ? 'Klasifikasikan Gambar' : 'Pilih Gambar Terlebih Dahulu'}</span>
          )}
        </button>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
        )}
      </form>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @media (max-width: 640px) {
          input[type="file"] {
            font-size: 16px;
          }
        }

        input, button, textarea {
          font-size: 16px;
        }

        @supports (padding: max(0px)) {
          .touch-manipulation {
            -webkit-user-select: none;
            user-select: none;
          }
        }
      `}</style>
    </div>
  );
}
