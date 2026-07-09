import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { fetchDatasets } from '../services/datasetService';
import { useDataRefresh } from '../context/DataRefreshContext';
import UploadDatasetForm from './UploadDatasetForm';

export default function DatasetManager() {
  const [datasets, setDatasets] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const { refreshVersion, refreshAll } = useDataRefresh();

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDatasets();
      setDatasets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed loading datasets:', error);
      setMessage(error.response?.data?.error || error.message || 'Gagal memuat dataset.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets, refreshVersion]);

  const handleUploadSuccess = useCallback(async () => {
    refreshAll();
    await loadDatasets();
    setSelectedIds([]);
    setMessage('Dataset berhasil diperbarui.');
  }, [loadDatasets, refreshAll]);

  const categories = useMemo(
    () => Array.from(new Set(datasets.map((item) => item.category).filter(Boolean))).sort(),
    [datasets]
  );

  const filteredDatasets = useMemo(() => {
    return datasets.filter((item) => {
      const matchesQuery = query
        ? (item.name || item.label || '').toLowerCase().includes(query.toLowerCase()) ||
          (item.origin || '').toLowerCase().includes(query.toLowerCase()) ||
          (item.category || '').toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesCategory = category ? item.category === category : true;
      return matchesQuery && matchesCategory;
    });
  }, [datasets, query, category]);

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dataset ini?')) return;

    try {
      await api.delete(`/datasets/${id}`);
      refreshAll();
      setDatasets((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      setMessage('Dataset berhasil dihapus.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus dataset.');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDatasets.length && filteredDatasets.length > 0) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredDatasets.map((item) => item.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Apakah Anda ingin menghapus dataset yang dipilih?')) return;

    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/datasets/${id}`)));
      refreshAll();
      setDatasets((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setMessage('Dataset yang dipilih berhasil dihapus.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus dataset yang dipilih.');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('PERHATIAN: Apakah Anda yakin ingin menghapus SELURUH dataset? Tindakan ini akan menghapus semua file fisik dan data di database.')) return;

    setIsDeletingAll(true);
    try {
      await api.delete('/datasets/all');
      refreshAll();
      setDatasets([]);
      setSelectedIds([]);
      setMessage('Semua dataset telah berhasil dibersihkan.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gagal menghapus semua dataset.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <UploadDatasetForm onUploadSuccess={handleUploadSuccess} />

      {message && (
        <div className="rounded-[1.75rem] border border-songket-border bg-songket-cream p-4 text-sm text-songket-text-secondary shadow-sm">
          {message}
        </div>
      )}

      <section className="rounded-[1.25rem] border border-songket-border bg-white p-3 shadow-soft sm:rounded-[1.75rem] sm:p-6">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-songket-text-primary sm:text-2xl">Dataset Tersimpan</h2>
            <p className="text-sm text-songket-text-secondary mt-1">Menampilkan {filteredDatasets.length} dari {datasets.length} entri dataset.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${selectedIds.length === 0 ? 'bg-songket-cream text-songket-text-secondary cursor-not-allowed' : 'bg-songket-gold text-songket-text-primary hover:bg-songket-hover'}`}
            >
              Hapus {selectedIds.length === 0 ? 'Terpilih' : `${selectedIds.length} Terpilih`}
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="w-full rounded-2xl bg-songket-cream px-4 py-3 text-sm font-semibold text-songket-text-secondary transition hover:bg-songket-hover/10 sm:w-auto"
            >
              {isDeletingAll ? 'Memproses...' : 'Hapus Semua'}
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_180px_180px]">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, kategori, atau asal"
            className="input-field min-w-0"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field min-w-0">
            <option value="">Semua Kategori</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button type="button" onClick={() => { setQuery(''); setCategory(''); }} className="btn btn-secondary w-full">
            Reset Filter
          </button>
        </div>

        {loading ? (
          <div className="mt-8 rounded-[1.5rem] border border-songket-border bg-songket-cream p-8 text-center text-songket-text-secondary">Memuat dataset...</div>
        ) : (
          <>
            <div className="mt-6 space-y-3 md:hidden">
              {filteredDatasets.map((item) => (
                <div key={item.id} className="rounded-[1.25rem] border border-songket-border bg-songket-cream/70 p-3 sm:rounded-[1.5rem] sm:p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name || item.label}
                      className="h-14 w-14 shrink-0 rounded-2xl border border-songket-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-songket-text-primary">{item.name || item.label}</p>
                          <p className="mt-1 text-xs text-songket-text-secondary">{item.history ? `${item.history.slice(0, 70)}...` : 'Tanpa deskripsi'}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="mt-1 h-4 w-4 rounded border-songket-border text-songket-gold"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white px-3 py-1 text-songket-text-secondary">{item.category || '-'}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-songket-text-secondary">{item.origin || '-'}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="rounded-2xl bg-songket-cream px-3 py-2 text-xs font-semibold text-songket-text-secondary hover:bg-songket-hover/10"
                        >
                          {selectedIds.includes(item.id) ? 'Batal' : 'Pilih'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDatasets.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-songket-border bg-songket-cream/70 p-8 text-center text-sm text-songket-text-secondary">
                  Tidak ada dataset yang sesuai dengan filter.
                </div>
              )}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-songket-border bg-songket-cream text-songket-text-secondary">
                  <tr>
                    <th className="px-4 py-3 w-14 text-center">
                      <input
                        type="checkbox"
                        checked={filteredDatasets.length > 0 && selectedIds.length === filteredDatasets.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-songket-border text-songket-gold"
                      />
                    </th>
                    <th className="px-4 py-3">Songket</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Asal</th>
                    <th className="px-4 py-3">Upload</th>
                    <th className="px-4 py-3">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDatasets.map((item) => (
                    <tr key={item.id} className={selectedIds.includes(item.id) ? 'bg-songket-cream/80' : ''}>
                      <td className="border-b border-songket-border px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="h-4 w-4 rounded border-songket-border text-songket-gold"
                        />
                      </td>
                      <td className="border-b border-songket-border px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.image_url} alt={item.name || item.label} className="h-14 w-14 rounded-2xl object-cover border border-songket-border" />
                          <div>
                            <p className="font-semibold text-songket-text-primary">{item.name || item.label}</p>
                            <p className="text-xs text-songket-text-secondary">{item.history ? `${item.history.slice(0, 70)}...` : 'Tanpa deskripsi'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-songket-border px-4 py-4">{item.category || '-'}</td>
                      <td className="border-b border-songket-border px-4 py-4">{item.origin || '-'}</td>
                      <td className="border-b border-songket-border px-4 py-4">{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="border-b border-songket-border px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="rounded-2xl bg-songket-cream px-3 py-2 text-xs font-semibold text-songket-text-secondary hover:bg-songket-hover/10"
                          >
                            {selectedIds.includes(item.id) ? 'Batal' : 'Pilih'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDatasets.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-songket-text-secondary">Tidak ada dataset yang sesuai dengan filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
