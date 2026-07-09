import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import Toast from './Toast';
import { explorerApi } from '../services/explorerApi';
import { useDataRefresh } from '../context/DataRefreshContext';

const requiredFields = [
  { key: 'name', label: 'Nama Songket' },
  { key: 'slug', label: 'Slug' },
  { key: 'category', label: 'Kategori' },
  { key: 'origin', label: 'Asal' },
  { key: 'usage', label: 'Penggunaan' },
  { key: 'history', label: 'Sejarah' },
  { key: 'philosophy', label: 'Filosofi' },
  { key: 'characteristic', label: 'Ciri utama' }
];

export default function ExplorerEditor({ item = null, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category: '',
    origin: '',
    usage: '',
    history: '',
    philosophy: '',
    characteristic: '',
    gallery_description: '',
    thumbnail: '',
    published: false,
    id: null
  });
  const [gallery, setGallery] = useState([]);
  const [pendingGallery, setPendingGallery] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { refreshAll } = useDataRefresh();

  useEffect(() => {
    const loadSongket = async (songket) => {
      if (!songket?.id) return;
      try {
        const { data } = await explorerApi.get(songket.id);
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          category: data.category || '',
          origin: data.origin || '',
          usage: data.usage || '',
          history: data.history || '',
          philosophy: data.philosophy || '',
          characteristic: data.characteristic || '',
          gallery_description: data.gallery_description || '',
          thumbnail: data.thumbnail || '',
          published: data.published || false,
          id: data.id || null
        });
        setGallery(data.gallery || []);
        setErrors({});
      } catch (err) {
        console.error('Failed to load songket details', err);
        showToast('Gagal memuat detail songket.', 'error');
      }
    };

    if (item && Object.keys(item).length > 0) {
      if (item.id) {
        loadSongket(item);
      } else {
        setForm({
          name: '',
          slug: '',
          category: '',
          origin: '',
          usage: '',
          history: '',
          philosophy: '',
          characteristic: '',
          gallery_description: '',
          thumbnail: '',
          published: false,
          id: null
        });
        setGallery([]);
        setPendingGallery([]);
        setErrors({});
      }
    } else if (!item) {
      setForm((prev) => ({ ...prev, id: null }));
    }
  }, [item]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleThumbUploaded = (data) => {
    const url = data?.url || data;
    setForm((prev) => ({ ...prev, thumbnail: url }));
    showToast('Thumbnail berhasil diunggah.', 'success');
  };

  const handleGalleryUploaded = (data) => {
    const added = Array.isArray(data) ? data : data?.urls || data;
    if (!Array.isArray(added)) return;
    setGallery((prev) => [...prev, ...added]);
    showToast('Gallery berhasil ditambahkan.', 'success');
  };

  const handleGallerySelected = (files) => {
    setPendingGallery(files || []);
  };

  const handleRemoveGallery = async (imageId) => {
    if (!imageId) return;
    try {
      await explorerApi.deleteGalleryImage(imageId);
      setGallery((prev) => prev.filter((item) => item.id !== imageId));
      showToast('Gambar gallery dihapus.', 'success');
    } catch (err) {
      console.error('Gallery delete failed', err);
      showToast(err.response?.data?.message || err.message || 'Gagal menghapus gambar.', 'error');
    }
  };

  const handleRemovePendingGallery = (index) => {
    setPendingGallery((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    const nextErrors = {};
    requiredFields.forEach((field) => {
      if (!form[field.key]?.toString().trim()) {
        nextErrors[field.key] = `${field.label} wajib diisi.`;
      }
    });

    if (!form.thumbnail?.toString().trim()) {
      nextErrors.thumbnail = 'Thumbnail wajib diisi.';
    }

    const descriptionCandidate = form.gallery_description?.toString().trim() || form.history?.toString().trim() || form.usage?.toString().trim() || form.philosophy?.toString().trim();
    if (!descriptionCandidate) {
      nextErrors.gallery_description = 'Deskripsi/penjelasan wajib diisi.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadPendingGallery = async (savedId) => {
    if (!savedId || pendingGallery.length === 0) return;
    const formData = new FormData();
    pendingGallery.forEach((item) => formData.append('images', item.file));
    const { data } = await explorerApi.uploadGallery(savedId, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const added = data || [];
    setGallery((prev) => [...prev, ...added]);
    setPendingGallery([]);
    return added;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast('Lengkapi form sebelum menyimpan.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        origin: form.origin,
        usage: form.usage,
        history: form.history,
        philosophy: form.philosophy,
        characteristic: form.characteristic,
        gallery_description: form.gallery_description,
        thumbnail: form.thumbnail,
        published: form.published
      };

      const response = form.id
        ? await explorerApi.update(form.id, payload)
        : await explorerApi.create(payload);

      const saved = response.data;
      if (!saved?.id) {
        throw new Error('Gagal memperoleh ID item setelah penyimpanan.');
      }

      if (pendingGallery.length > 0) {
        await uploadPendingGallery(saved.id);
      }

      refreshAll();
      setForm((prev) => ({ ...prev, id: saved.id }));
      onSaved && onSaved(saved);
      showToast('Data berhasil disimpan.', 'success');
    } catch (err) {
      console.error('Save failed', err);
      showToast(err.response?.data?.message || err.message || 'Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-songket-border bg-white p-6 shadow-soft">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-songket-text-secondary font-semibold">Aset Visual</p>
            <h2 className="mt-3 text-xl font-semibold text-songket-text-primary">Thumbnail & Gallery</h2>
            <p className="mt-2 text-sm text-songket-text-secondary">Unggah aset visual untuk tampilan Songket Explorer.</p>
          </div>

          <div className="rounded-[1.5rem] border border-songket-border bg-songket-cream p-4">
            <p className="field-label">Thumbnail</p>
            {form.thumbnail ? (
              <div className="mb-4 overflow-hidden rounded-3xl border border-songket-border bg-white">
                <img src={form.thumbnail} alt="Thumbnail" className="h-52 w-full object-cover" />
              </div>
            ) : (
              <div className="mb-4 flex h-52 items-center justify-center rounded-3xl border border-dashed border-songket-border bg-white text-songket-text-secondary">Thumbnail belum dipilih</div>
            )}
            <ImageUploader
              multiple={false}
              uploadUrl="/explorer/upload/thumbnail"
              fieldName="image"
              onUploaded={handleThumbUploaded}
              label="Pilih thumbnail"
            />
            {errors.thumbnail && <p className="mt-2 text-xs text-red-600">{errors.thumbnail}</p>}
          </div>

          <div className="rounded-[1.5rem] border border-songket-border bg-songket-cream p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="field-label">Gallery</p>
                <p className="text-xs text-songket-text-secondary">Kelola galeri foto untuk detail motif.</p>
              </div>
              {!form.id && (
                <p className="text-xs text-songket-text-warning">Simpan item terlebih dahulu untuk mengunggah gallery.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-3xl border border-songket-border bg-white">
                  <img src={item.image_url} alt={item.image_url} className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGallery(item.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {pendingGallery.map((item, index) => (
                <div key={item.id} className="relative overflow-hidden rounded-3xl border border-dashed border-songket-border bg-songket-cream">
                  <img src={item.preview} alt={item.file.name} className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePendingGallery(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {gallery.length === 0 && pendingGallery.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-songket-border bg-white p-6 text-center text-songket-text-secondary">Tidak ada gambar gallery</div>
              )}
            </div>

            <div className="mt-4">
              <ImageUploader
                multiple
                uploadUrl={form.id ? `/explorer/${form.id}/gallery` : undefined}
                fieldName="images"
                onUploaded={(data) => {
                  if (form.id) {
                    handleGalleryUploaded(data);
                  }
                }}
                onSelected={handleGallerySelected}
                label="Unggah gallery"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-songket-text-secondary font-semibold">Data Songket</p>
            <h2 className="mt-3 text-xl font-semibold text-songket-text-primary">Informasi Dasar</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Nama Songket *</label>
              <input value={form.name} onChange={handleChange('name')} className="input-field" placeholder="Songket Tabur" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="field-label">Slug *</label>
              <input value={form.slug} onChange={handleChange('slug')} className="input-field" placeholder="songket-tabur" />
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
            <div>
              <label className="field-label">Kategori *</label>
              <input value={form.category} onChange={handleChange('category')} className="input-field" placeholder="Tabur" />
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>
            <div>
              <label className="field-label">Asal *</label>
              <input value={form.origin} onChange={handleChange('origin')} className="input-field" placeholder="Palembang" />
              {errors.origin && <p className="mt-1 text-xs text-red-600">{errors.origin}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Penggunaan *</label>
              <textarea value={form.usage} onChange={handleChange('usage')} className="textarea" rows={3} placeholder="Digunakan pada acara..." />
              {errors.usage && <p className="mt-1 text-xs text-red-600">{errors.usage}</p>}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="field-label">Sejarah *</label>
              <textarea value={form.history} onChange={handleChange('history')} className="textarea" rows={4} placeholder="Sejarah songket..." />
              {errors.history && <p className="mt-1 text-xs text-red-600">{errors.history}</p>}
            </div>
            <div>
              <label className="field-label">Filosofi *</label>
              <textarea value={form.philosophy} onChange={handleChange('philosophy')} className="textarea" rows={4} placeholder="Filosofi motif..." />
              {errors.philosophy && <p className="mt-1 text-xs text-red-600">{errors.philosophy}</p>}
            </div>
            <div>
              <label className="field-label">Ciri utama *</label>
              <textarea value={form.characteristic} onChange={handleChange('characteristic')} className="textarea" rows={4} placeholder="Ciri khas film..." />
              {errors.characteristic && <p className="mt-1 text-xs text-red-600">{errors.characteristic}</p>}
            </div>
            <div>
              <label className="field-label">Deskripsi Galeri</label>
              <textarea value={form.gallery_description} onChange={handleChange('gallery_description')} className="textarea" rows={4} placeholder="Deskripsi singkat galeri" />
              {errors.gallery_description && <p className="mt-1 text-xs text-red-600">{errors.gallery_description}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-songket-text-secondary">
              <input type="checkbox" checked={form.published} onChange={handleChange('published')} className="h-5 w-5 rounded border-songket-border text-songket-gold" />
              Publish
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              <button type="button" onClick={onCancel} className="btn btn-ghost">
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
