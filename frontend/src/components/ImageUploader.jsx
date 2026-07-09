import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import Toast from './Toast';

export default function ImageUploader({
  multiple = false,
  label = 'Unggah gambar',
  accept = 'image/*',
  uploadUrl,
  fieldName = 'image',
  onUploaded,
  onSelected,
  disabled = false
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const updateFiles = (selectedFiles) => {
    const imageFiles = Array.from(selectedFiles || []).filter((file) => file.type.startsWith('image/'));
    const mapped = imageFiles.map((file) => ({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.size}-${file.lastModified}` }));
    const nextFiles = multiple ? [...files, ...mapped] : mapped.slice(0, 1);
    setFiles(nextFiles);
    if (!uploadUrl && onSelected) {
      onSelected(nextFiles);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    updateFiles(event.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!uploadUrl) {
      showToast('Simpan item terlebih dahulu sebelum mengunggah.', 'error');
      return;
    }
    if (files.length === 0) {
      showToast('Pilih gambar terlebih dahulu.', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const form = new FormData();
      files.forEach((item) => form.append(fieldName, item.file));
      const { data } = await api.post(uploadUrl, form, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      onUploaded && onUploaded(data);
      showToast(`${multiple ? 'Gallery' : 'Thumbnail'} berhasil diunggah.`, 'success');
      setFiles([]);
      if (!multiple && onSelected) {
        onSelected([]);
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast(err.response?.data?.message || err.message || 'Upload gagal', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className={`rounded-3xl border-2 border-dashed border-songket-border bg-songket-cream p-6 text-center transition duration-200 ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-songket-gold hover:bg-songket-ivory cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => updateFiles(event.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-sm font-semibold text-songket-text-primary">{label}</p>
        <p className="mt-2 text-xs text-songket-text-secondary">Tarik & lepas di sini, atau klik untuk memilih file</p>
      </div>

      {files.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded-3xl border border-songket-border bg-white shadow-sm">
              <img src={item.preview} alt="preview" className="h-28 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="progress-bar overflow-hidden rounded-full">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-songket-text-secondary">Upload {progress}% selesai</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={disabled || uploading || files.length === 0}
        className="btn-primary w-full"
      >
        {uploading ? `${multiple ? 'Mengunggah gallery...' : 'Mengunggah thumbnail...'}` : `Upload ${multiple ? 'Gallery' : 'Thumbnail'}`}
      </button>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
