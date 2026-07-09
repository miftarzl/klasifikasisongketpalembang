import React, { useEffect, useState } from 'react';
import ExplorerList from './ExplorerList';
import ExplorerEditor from './ExplorerEditor';
import Toast from './Toast';
import { explorerApi } from '../services/explorerApi';
import { useDataRefresh } from '../context/DataRefreshContext';
import { Link, useNavigate } from 'react-router-dom';

export default function ManageExplorer() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSelection, setDeleteSelection] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [needAuth, setNeedAuth] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { refreshVersion, refreshAll } = useDataRefresh();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await explorerApi.adminList();
      setItems(data || []);
    } catch (err) {
      console.error('Failed loading explorer', err);
      const status = err.status || err.response?.status;
      const message = err.response?.data?.message || err.message || 'Gagal memuat data explorer.';
      showToast(message, 'error');
      if (status === 401 || status === 403) {
        setNeedAuth(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshVersion]);

  const handleEdit = (item) => setEditing(item);
  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await explorerApi.delete(deleteTarget.id);
      refreshAll();
      setItems((prevItems) => prevItems.filter((i) => i.id !== deleteTarget.id));
      setDeleteSelection((prev) => (prev === deleteTarget.id ? '' : prev));
      setDeleteTarget(null);
      showToast('Songket berhasil dihapus.', 'success');
    } catch (err) {
      console.error('Delete failed', err);
      showToast(err.response?.data?.message || err.message || 'Gagal menghapus songket.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelection = () => {
    if (!deleteSelection) {
      showToast('Pilih songket yang ingin dihapus terlebih dahulu.', 'error');
      return;
    }

    const selectedItem = items.find((item) => item.id === deleteSelection);
    if (selectedItem) {
      setDeleteTarget(selectedItem);
    }
  };

  const handleSaved = (saved) => {
    setEditing(null);
    refreshAll();
    load();
    showToast('Data berhasil diperbarui.', 'success');
  };

  const filtered = items.filter(i => {
    if (query && !(i.name || '').toLowerCase().includes(query.toLowerCase())) return false;
    if (category && (i.category || '') !== category) return false;
    return true;
  });

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-3 w-full sm:grid-cols-[1fr_260px_220px]">
          <input placeholder="Cari songket..." value={query} onChange={e=>setQuery(e.target.value)} className="input-field" />
          <select value={category} onChange={e=>setCategory(e.target.value)} className="input-field">
            <option value="">Semua Kategori</option>
            {categories.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.24em] text-songket-text-secondary">Hapus Explorer</label>
            <select value={deleteSelection} onChange={(e) => setDeleteSelection(e.target.value)} className="input-field">
              <option value="">Pilih item yang ingin dihapus</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name || 'Tanpa nama'}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button onClick={handleDeleteSelection} className="btn btn-danger w-full sm:w-auto" disabled={!deleteSelection || deleting}>
            {deleting ? 'Menghapus...' : 'Hapus terpilih'}
          </button>
          <button onClick={()=>setEditing({})} className="btn btn-primary w-full sm:w-auto">Tambah Songket Baru</button>
        </div>
      </div>

      {editing ? (
        <ExplorerEditor item={editing} onSaved={handleSaved} onCancel={()=>setEditing(null)} />
      ) : (
        <div>
          {needAuth && (
            <div className="rounded-[1.75rem] border border-songket-border bg-white p-6 text-center mb-6">
              <p className="text-lg font-semibold">Akses Admin Diperlukan</p>
              <p className="mt-2 text-sm text-songket-text-secondary">Anda perlu masuk sebagai admin untuk mengelola Explorer.</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link to="/admin/login" className="btn btn-primary">Masuk sebagai Admin</Link>
              </div>
            </div>
          )}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse rounded-[1.75rem] border border-songket-border bg-songket-cream p-6">
                  <div className="mb-4 h-40 rounded-3xl bg-slate-200" />
                  <div className="h-5 w-3/4 rounded-full bg-slate-200 mb-2" />
                  <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          ) : (
            <ExplorerList items={filtered} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-songket-border bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.28em] text-songket-text-secondary font-semibold">Konfirmasi Penghapusan</p>
            <h3 className="mt-3 text-xl font-semibold text-songket-text-primary">Hapus explorer songket ini?</h3>
            <p className="mt-2 text-sm text-songket-text-secondary">
              Anda akan menghapus <span className="font-semibold text-songket-text-primary">{deleteTarget.name || 'item ini'}</span> dari daftar explorer.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-sm" disabled={deleting}>Batal</button>
              <button type="button" onClick={confirmDelete} className="btn btn-sm btn-danger" disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
