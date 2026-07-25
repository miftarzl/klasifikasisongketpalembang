import { useMemo, useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, FileImage, ImagePlus, Layers3, Loader2, Save, UploadCloud, X, ChevronDown, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import Toast from './Toast';

const defaultCategories = ['Luxury', 'Royalty', 'Everyday', 'Heritage', 'Classic', 'Formal'];

const fieldList = [
  { name: 'name', label: 'Nama Songket', placeholder: 'Songket Seler', required: true, helper: 'Gunakan nama motif yang jelas dan mudah dikenali.' },
  { name: 'category', label: 'Kategori', placeholder: 'Formal', required: true, helper: 'Pilih kategori yang paling sesuai dengan karakter motif.' },
  { name: 'origin', label: 'Asal', placeholder: 'Palembang', required: true, helper: 'Sebutkan asal budaya atau daerah motif tersebut.' },
  { name: 'usage', label: 'Penggunaan', placeholder: 'Biasanya dipakai pada acara resmi, pernikahan, dan upacara adat.', required: true, helper: 'Jelaskan fungsi dan konteks pemakaian songket.' },
  { name: 'history', label: 'Sejarah Singkat', placeholder: 'Songket ini berkembang dari tradisi tenun...', required: true, helper: 'Tuliskan latar belakang singkat, sejarah, dan perkembangan motif.' },
  { name: 'philosophy', label: 'Filsafat Motif', placeholder: 'Melambangkan keanggunan, ketenangan, dan kehormatan.', required: true, helper: 'Jelaskan makna filosofis yang terkandung dalam motif.' },
  { name: 'characteristic', label: 'Ciri Utama', placeholder: 'Corak memanjang vertikal, benang emas rapat, dan tekstur halus.', required: true, helper: 'Sebutkan ciri identitas visual yang membedakan motif.' },
  { name: 'gallery_description', label: 'Deskripsi Galeri', placeholder: 'Jelaskan isi galeri, tekstur kain, detail motif, atau informasi tambahan.', required: false, helper: 'Opsional, tetapi sangat membantu untuk konteks galeri.' }
];

const characterLimits = {
  usage: 500,
  history: 500,
  philosophy: 500,
  characteristic: 500,
  gallery_description: 500,
};

// Styled input component for consistency
const StyledInput = ({ label, placeholder, value, onChange, onBlur, required, helper, error, disabled }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-songket-text-primary">
      {label}{required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition ${
        error 
          ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' 
          : 'border-songket-border bg-songket-ivory focus:border-songket-gold focus:ring-2 focus:ring-songket-gold/20'
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    />
    {helper && <p className="text-xs text-songket-text-secondary">{helper}</p>}
    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

const StyledSelect = ({ label, value, onChange, options, required, helper, error, disabled }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-songket-text-primary">
      {label}{required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none appearance-none transition cursor-pointer ${
          error
            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
            : 'border-songket-border bg-songket-ivory focus:border-songket-gold focus:ring-2 focus:ring-songket-gold/20'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-songket-gold pointer-events-none" />
    </div>
    {helper && <p className="text-xs text-songket-text-secondary">{helper}</p>}
    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

const StyledTextarea = ({ label, placeholder, value, onChange, onBlur, required, helper, error, disabled, rows = 4, maxLength }) => {
  const currentLength = value.length;
  const isNearLimit = maxLength && currentLength > maxLength * 0.85;
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-songket-text-primary">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition resize-none ${
          error 
            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200' 
            : 'border-songket-border bg-songket-ivory focus:border-songket-gold focus:ring-2 focus:ring-songket-gold/20'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      />
      <div className="flex justify-between items-center">
        {helper && <p className="text-xs text-songket-text-secondary">{helper}</p>}
        {maxLength && <p className={`text-xs font-medium ${isNearLimit ? 'text-songket-gold' : 'text-songket-text-secondary'}`}>{currentLength} / {maxLength}</p>}
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const buildPreview = (files) => {
  return files.map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    url: URL.createObjectURL(file)
  }));
};

const UploadDatasetForm = ({ onUploadSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    category: 'Formal',
    origin: '',
    usage: '',
    history: '',
    philosophy: '',
    characteristic: '',
    gallery_description: ''
  });
  const [files, setFiles] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewItems]);

  const selectedCategoryOptions = useMemo(() => defaultCategories, []);

  const handleInput = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const getFieldError = (fieldName) => {
    if (!submitAttempted && !touched[fieldName]) return '';
    if (fieldName === 'category') {
      return form.category?.trim() ? '' : 'Kategori wajib dipilih.';
    }
    const value = form[fieldName]?.trim() || '';
    if (!value) {
      return `${fieldList.find((field) => field.name === fieldName)?.label || fieldName} wajib diisi.`;
    }
    return '';
  };

  const handleFiles = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles || []).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Pilih file gambar yang valid.', 'error');
      return;
    }

    setFiles((prevFiles) => {
      const existingKeys = new Set(prevFiles.map((f) => `${f.name}-${f.size}`));
      const newUniqueFiles = validFiles.filter((f) => !existingKeys.has(`${f.name}-${f.size}`));
      const combined = [...prevFiles, ...newUniqueFiles].slice(0, 30);

      const newPreviews = newUniqueFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file)
      }));

      setPreviewItems((prevPreviews) => [...prevPreviews, ...newPreviews].slice(0, 30));

      return combined;
    });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleRemovePreview = (id) => {
    setPreviewItems((prev) => prev.filter((item) => item.id !== id));
    setFiles((prev) => prev.filter((item) => `${item.name}-${item.size}-${item.lastModified}` !== id));
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'Formal',
      origin: '',
      usage: '',
      history: '',
      philosophy: '',
      characteristic: '',
      gallery_description: ''
    });
    setFiles([]);
    setPreviewItems([]);
    setProgress(0);
    setTouched({});
    setSubmitAttempted(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const validationChecks = useMemo(() => [
    { label: 'Nama sudah diisi', valid: Boolean(form.name.trim()) },
    { label: 'Kategori dipilih', valid: Boolean(form.category?.trim()) },
    { label: 'Minimal gambar terpenuhi', valid: files.length >= 5 },
    { label: 'Metadata lengkap', valid: ['origin', 'usage', 'history', 'philosophy', 'characteristic'].every((field) => form[field].trim()) }
  ], [form, files]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const missingField = fieldList.find((field) => field.required && !form[field.name].trim());
    if (missingField) {
      showToast(`${missingField.label} wajib diisi.`, 'error');
      return;
    }

    if (files.length < 5) {
      showToast('Unggah minimal 5 gambar untuk galeri.', 'error');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      formData.append('name', form.name);
      formData.append('label', form.name);
      formData.append('category', form.category);
      formData.append('origin', form.origin);
      formData.append('usage', form.usage);
      formData.append('history', form.history);
      formData.append('philosophy', form.philosophy);
      formData.append('characteristic', form.characteristic);
      formData.append('gallery_description', form.gallery_description);

      await api.post('/datasets/upload', formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        }
      });

      showToast('Dataset berhasil diunggah.', 'success');
      resetForm();
      setProgress(100);
      onUploadSuccess?.();

    } catch (error) {
      console.error('Upload Dataset Error:', error);
      const message = error.response?.data?.message || error.message || 'Gagal mengunggah dataset.';
      showToast(message, 'error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[1.25rem] border border-songket-border bg-white shadow-soft sm:rounded-[2rem]">
        <div className="bg-songket-cream p-4 sm:p-6 lg:p-10">
          {/* Header */}
          <div className="mb-5 sm:mb-6">
          <span className="mb-3 inline-flex items-center rounded-full bg-songket-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-songket-gold">
            Upload Dataset
          </span>
          <h1 className="mb-3 text-2xl font-black text-songket-text-primary sm:text-4xl">Tambah Dataset Songket</h1>
          <p className="max-w-3xl text-sm leading-6 text-songket-text-secondary sm:text-base sm:leading-7">
            Bangun galeri songket baru dengan pengalaman unggah yang profesional, rapi, dan mudah dipantau. Lengkapi informasi dasar dan pilih minimal 5 gambar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-0 sm:space-y-6">
          {/* Main Content: 2-column layout */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] xl:gap-6">
            
            {/* Left Column: Upload & Preview (40%) */}
            <div className="space-y-6">
              
              {/* Upload Card */}
              <div className="overflow-hidden rounded-2xl border-2 border-songket-border bg-songket-ivory shadow-soft">
                <div className="border-b-2 border-songket-border p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-songket-gold/20 rounded-xl">
                      <UploadCloud className="h-5 w-5 text-songket-gold" />
                    </div>
                    <h2 className="text-lg font-bold text-songket-text-primary">Upload Gambar</h2>
                  </div>
                  <p className="mt-2 text-sm text-songket-text-secondary sm:ml-12 sm:mt-0">Drag & drop atau klik untuk memilih file gambar</p>
                </div>

                <div className="p-4 sm:p-6">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all sm:p-8 ${
                      dragActive 
                        ? 'border-songket-gold bg-songket-gold/10' 
                        : 'border-songket-gold/40 bg-songket-cream hover:border-songket-gold/60'
                    }`}
                  >
                    <input
                      id="dataset-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        handleFiles(event.target.files);
                        event.target.value = '';
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label htmlFor="dataset-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-songket-gold/20 rounded-2xl mb-3">
                          <ImagePlus className="h-8 w-8 text-songket-gold" />
                        </div>
                        <p className="mb-1 text-sm font-bold text-songket-text-primary sm:text-base">Drag & drop gambar di sini</p>
                        <p className="text-sm text-songket-text-secondary mb-4">atau klik untuk memilih file</p>
                        <span className="rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover px-5 py-2.5 text-sm font-bold text-white transition hover:shadow-elegant inline-block">
                          Pilih Gambar
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-songket-gold/15 text-songket-gold rounded-lg text-xs font-semibold">
                      JPG, PNG, WebP
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-songket-gold/15 text-songket-gold rounded-lg text-xs font-semibold">
                      Maks 30 gambar
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-songket-gold/15 text-songket-gold rounded-lg text-xs font-semibold">
                      Min 5 gambar
                    </span>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-5 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-900">
                          <span className="font-black text-base">{files.length}</span> gambar siap diunggah
                        </span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                          files.length >= 5 
                            ? 'bg-emerald-200 text-emerald-900' 
                            : 'bg-amber-200 text-amber-900'
                        }`}>
                          {files.length >= 5 ? '✓ OK' : 'Perlu tambah'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Gallery Card */}
              <div className="overflow-hidden rounded-2xl border-2 border-songket-border bg-songket-ivory shadow-soft">
                <div className="border-b-2 border-songket-border p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-songket-gold/20 rounded-xl">
                        <FileImage className="h-5 w-5 text-songket-gold" />
                      </div>
                      <h2 className="text-lg font-bold text-songket-text-primary">Preview Galeri</h2>
                    </div>
                    {previewItems.length > 0 && (
                      <span className="text-xs font-bold bg-songket-gold/20 text-songket-gold px-3 py-1.5 rounded-lg">
                        {previewItems.length} item
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {previewItems.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {previewItems.slice(0, 9).map((item) => (
                          <div key={item.id} className="relative group rounded-xl overflow-hidden border-2 border-songket-border bg-songket-cream">
                            <img src={item.url} alt="Preview" className="h-28 w-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                              <p className="text-[10px] text-white truncate w-full font-medium">{item.file.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePreview(item.id)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-red-100"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {previewItems.length > 9 && (
                        <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-songket-gold/40 bg-songket-cream text-sm font-bold text-songket-gold">
                          +{previewItems.length - 9} gambar lainnya
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-songket-text-secondary">
                      <FileImage className="h-8 w-8 mb-3 text-songket-gold/30" />
                      <p className="text-sm font-medium">Preview galeri akan muncul di sini</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Upload Card */}
              {(isUploading || progress > 0) && (
                <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-4 shadow-soft sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-songket-text-primary">Progress Upload</h3>
                    <span className="text-sm font-black text-songket-gold">{progress}%</span>
                  </div>
                  <div className="w-full bg-songket-border rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-songket-gold to-songket-hover transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-medium text-songket-text-secondary">
                    {files.length} dari 30 gambar · {isUploading ? 'Sedang diunggah...' : 'Selesai'}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Form Fields (60%) */}
            <div className="space-y-6">
              
              {/* Informasi Dasar Card */}
              <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-4 shadow-soft sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-songket-gold/20 rounded-xl">
                    <Layers3 className="h-5 w-5 text-songket-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-songket-text-primary">Informasi Dasar</h3>
                </div>
                
                <div className="space-y-4">
                  <StyledInput
                    label="Nama Songket"
                    placeholder="Songket Seler"
                    value={form.name}
                    onChange={(e) => handleInput('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    required
                    helper="Gunakan nama motif yang jelas dan mudah dikenali."
                    error={getFieldError('name')}
                    disabled={isUploading}
                  />
                  
                  <StyledSelect
                    label="Kategori"
                    value={form.category}
                    onChange={(e) => handleInput('category', e.target.value)}
                    options={selectedCategoryOptions}
                    required
                    helper="Pilih kategori yang paling sesuai dengan karakter motif."
                    error={getFieldError('category')}
                    disabled={isUploading}
                  />
                  
                  <StyledInput
                    label="Asal"
                    placeholder="Palembang"
                    value={form.origin}
                    onChange={(e) => handleInput('origin', e.target.value)}
                    onBlur={() => handleBlur('origin')}
                    required
                    helper="Sebutkan asal budaya atau daerah motif tersebut."
                    error={getFieldError('origin')}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Informasi Budaya Card */}
              <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-4 shadow-soft sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-songket-gold/20 rounded-xl">
                    <Layers3 className="h-5 w-5 text-songket-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-songket-text-primary">Informasi Budaya</h3>
                </div>
                
                <div className="space-y-4">
                  <StyledTextarea
                    label="Penggunaan"
                    placeholder="Biasanya dipakai pada acara resmi, pernikahan, dan upacara adat."
                    value={form.usage}
                    onChange={(e) => handleInput('usage', e.target.value)}
                    onBlur={() => handleBlur('usage')}
                    required
                    helper="Jelaskan fungsi dan konteks pemakaian songket."
                    error={getFieldError('usage')}
                    disabled={isUploading}
                    maxLength={characterLimits.usage}
                    rows={3}
                  />

                  <StyledTextarea
                    label="Sejarah Singkat"
                    placeholder="Songket ini berkembang dari tradisi tenun..."
                    value={form.history}
                    onChange={(e) => handleInput('history', e.target.value)}
                    onBlur={() => handleBlur('history')}
                    required
                    helper="Tuliskan latar belakang singkat, sejarah, dan perkembangan motif."
                    error={getFieldError('history')}
                    disabled={isUploading}
                    maxLength={characterLimits.history}
                    rows={3}
                  />

                  <StyledTextarea
                    label="Filsafat Motif"
                    placeholder="Melambangkan keanggunan, ketenangan, dan kehormatan."
                    value={form.philosophy}
                    onChange={(e) => handleInput('philosophy', e.target.value)}
                    onBlur={() => handleBlur('philosophy')}
                    required
                    helper="Jelaskan makna filosofis yang terkandung dalam motif."
                    error={getFieldError('philosophy')}
                    disabled={isUploading}
                    maxLength={characterLimits.philosophy}
                    rows={3}
                  />

                  <StyledTextarea
                    label="Ciri Utama"
                    placeholder="Corak memanjang vertikal, benang emas rapat, dan tekstur halus."
                    value={form.characteristic}
                    onChange={(e) => handleInput('characteristic', e.target.value)}
                    onBlur={() => handleBlur('characteristic')}
                    required
                    helper="Sebutkan ciri identitas visual yang membedakan motif."
                    error={getFieldError('characteristic')}
                    disabled={isUploading}
                    maxLength={characterLimits.characteristic}
                    rows={3}
                  />
                </div>
              </div>

              {/* Galeri Card */}
              <div className="rounded-2xl border-2 border-songket-border bg-songket-ivory p-4 shadow-soft sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-songket-gold/20 rounded-xl">
                    <ImagePlus className="h-5 w-5 text-songket-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-songket-text-primary">Galeri</h3>
                </div>

                <StyledTextarea
                  label="Deskripsi Galeri"
                  placeholder="Jelaskan isi galeri, tekstur kain, detail motif, atau informasi tambahan."
                  value={form.gallery_description}
                  onChange={(e) => handleInput('gallery_description', e.target.value)}
                  onBlur={() => handleBlur('gallery_description')}
                  required={false}
                  helper="Opsional, tetapi sangat membantu untuk konteks galeri."
                  error={getFieldError('gallery_description')}
                  disabled={isUploading}
                  maxLength={characterLimits.gallery_description}
                  rows={3}
                />
              </div>

              {/* Ringkasan Validasi Card */}
              <div className="bg-songket-ivory rounded-2xl border-2 border-songket-border shadow-soft p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-songket-gold/20 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-songket-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-songket-text-primary">Ringkasan Validasi</h3>
                </div>
                
                <div className="space-y-2.5">
                  {validationChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition ${
                        check.valid
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-red-50/50 border-red-200'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${
                        check.valid ? 'text-emerald-900' : 'text-red-900'
                      }`}>
                        {check.label}
                      </span>
                      {check.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col justify-end gap-3 border-t-2 border-songket-border pt-5 sm:mt-8 sm:flex-row sm:pt-7">
            <button
              type="button"
              onClick={resetForm}
              disabled={isUploading}
              className="px-6 py-3 rounded-xl border-2 border-songket-border bg-songket-ivory text-songket-text-primary font-bold hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-songket-gold to-songket-hover text-songket-text-primary font-bold shadow-elegant hover:shadow-xl hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Dataset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default UploadDatasetForm;
