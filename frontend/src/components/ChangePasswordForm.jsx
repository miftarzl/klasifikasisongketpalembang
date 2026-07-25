import { useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import Toast from './Toast';

const initialValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

function getNewPasswordErrors(password, currentPassword) {
  const errors = [];
  if (password.length < 8) errors.push('Minimal 8 karakter.');
  if (!/[A-Z]/.test(password)) errors.push('Minimal 1 huruf besar.');
  if (!/[a-z]/.test(password)) errors.push('Minimal 1 huruf kecil.');
  if (!/\d/.test(password)) errors.push('Minimal 1 angka.');
  if (!/[^A-Za-z0-9\s]/.test(password)) errors.push('Minimal 1 simbol.');
  if (password && password === currentPassword) errors.push('Tidak boleh sama dengan password saat ini.');
  return errors;
}

export default function ChangePasswordForm({ onLogout }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [visible, setVisible] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const newPasswordErrors = useMemo(
    () => getNewPasswordErrors(values.newPassword, values.currentPassword),
    [values.newPassword, values.currentPassword],
  );
  const confirmationError = values.confirmPassword && values.confirmPassword !== values.newPassword
    ? 'Konfirmasi password baru harus sama.'
    : '';
  const formValid = Boolean(values.currentPassword && values.newPassword && values.confirmPassword)
    && newPasswordErrors.length === 0
    && !confirmationError;

  const updateField = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setTouched({});
    setVisible({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    if (!formValid || saving) return;

    setSaving(true);
    try {
      const response = await api.put('/admin/change-password', values);
      setToast({ show: true, message: response.data?.message || 'Password berhasil diperbarui.', type: 'success' });
      resetForm();

      // The current client session is cleared after a successful password
      // change so the admin must authenticate again with the new password.
      window.setTimeout(onLogout, 1400);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password gagal diperbarui. Silakan coba lagi.';
      setToast({ show: true, message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: 'currentPassword', label: 'Password Saat Ini', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Password Baru', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Konfirmasi Password Baru', autoComplete: 'new-password' },
  ];

  return (
    <section className="mx-auto max-w-2xl animate-[fadeIn_250ms_ease-out] rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
      <div className="flex items-start gap-3 border-b border-songket-border pb-5">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-songket-gold/10 text-songket-gold">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-songket-text-secondary">Account Settings</p>
          <h2 className="mt-1 text-xl font-semibold text-songket-text-primary sm:text-2xl">Ganti Password</h2>
          <p className="mt-2 text-sm leading-6 text-songket-text-secondary">Untuk keamanan, Anda akan logout otomatis dan masuk kembali memakai password baru.</p>
        </div>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => {
          const fieldError = field.name === 'newPassword' && touched.newPassword && newPasswordErrors.length
            ? newPasswordErrors
            : field.name === 'confirmPassword' && touched.confirmPassword && confirmationError
              ? [confirmationError]
              : [];
          const isVisible = visible[field.name];
          return (
            <div className="space-y-2" key={field.name}>
              <label className="block text-sm font-semibold text-songket-text-primary" htmlFor={field.name}>{field.label}</label>
              <div className="relative">
                <input
                  id={field.name}
                  name={field.name}
                  type={isVisible ? 'text' : 'password'}
                  autoComplete={field.autoComplete}
                  value={values[field.name]}
                  onChange={(event) => updateField(field.name, event.target.value)}
                  onBlur={() => setTouched((previous) => ({ ...previous, [field.name]: true }))}
                  aria-invalid={fieldError.length > 0}
                  aria-describedby={fieldError.length ? `${field.name}-error` : undefined}
                  className={`input-primary pr-14 ${fieldError.length ? 'border-red-400 focus:border-red-500 focus:shadow-red-100' : ''}`}
                  disabled={saving}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-songket-text-secondary hover:bg-songket-cream hover:text-songket-text-primary"
                  onClick={() => setVisible((previous) => ({ ...previous, [field.name]: !previous[field.name] }))}
                  aria-label={isVisible ? `Sembunyikan ${field.label.toLowerCase()}` : `Tampilkan ${field.label.toLowerCase()}`}
                >
                  {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldError.length > 0 && (
                <ul id={`${field.name}-error`} className="space-y-1 text-xs leading-5 text-red-600">
                  {fieldError.map((error) => <li key={error}>{error}</li>)}
                </ul>
              )}
            </div>
          );
        })}

        <div className="rounded-2xl bg-songket-cream p-4 text-sm text-songket-text-secondary">
          <span className="flex items-center gap-2 font-semibold text-songket-text-primary"><ShieldCheck className="h-4 w-4 text-songket-success" /> Ketentuan password</span>
          <p className="mt-1 leading-6">Gunakan minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol.</p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={resetForm} disabled={saving}>Batal</button>
          <button type="submit" className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={!formValid || saving}>
            {saving ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Password'}
          </button>
        </div>
      </form>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((previous) => ({ ...previous, show: false }))} />
    </section>
  );
}
