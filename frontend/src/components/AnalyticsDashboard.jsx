import { useState, useEffect } from 'react';
import { api } from '../services/api';

const formatPercent = (value) => {
  if (value == null || Number.isNaN(value)) return 'N/A';
  const ratio = Number(value);
  if (Number.isNaN(ratio)) return 'N/A';
  return `${(ratio * 100).toFixed(1)}%`;
};

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return Intl.NumberFormat('id-ID').format(value);
};

export default function AnalyticsDashboard({ refreshTrigger }) {
  const [dashboard, setDashboard] = useState(null);
  const [modelSummary, setModelSummary] = useState(null);
  const [trainingSummary, setTrainingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const normalizeResponse = (result) => {
        const data = result?.data;
        if (!data || typeof data !== 'object') return null;
        if (data.error || data.detail) return null;
        return data;
      };

      const [dashboardRes, modelRes, trainingRes] = await Promise.all([
        api.get('/admin/dashboard').catch(() => ({ data: null })),
        api.get('/admin/model-summary').catch(() => ({ data: null })),
        api.get('/admin/training-summary').catch(() => ({ data: null })),
      ]);

      setDashboard(normalizeResponse(dashboardRes));
      setModelSummary(normalizeResponse(modelRes));
      setTrainingSummary(normalizeResponse(trainingRes));
    } catch (err) {
      console.error('Analytics load error:', err);
      setError('Gagal memuat data analytics dari backend. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => {
    if (!dashboard && !modelSummary) return null;

    const totalPredictions = dashboard?.totalPredictions ?? 'N/A';
    const totalDatasets = dashboard?.totalDatasets ?? 'N/A';
    const successRate = dashboard?.successRate != null ? `${dashboard.successRate}%` : 'N/A';
    const avgConfidence = modelSummary?.average_confidence != null ? formatPercent(modelSummary.average_confidence) : 'N/A';

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-songket-text-secondary sm:text-sm sm:tracking-[0.24em]">Total Prediksi</p>
          <p className="mt-4 text-2xl font-semibold text-songket-text-primary sm:text-3xl">{formatNumber(totalPredictions)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-songket-text-secondary sm:text-sm sm:tracking-[0.24em]">Total Dataset</p>
          <p className="mt-4 text-2xl font-semibold text-songket-text-primary sm:text-3xl">{formatNumber(totalDatasets)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-songket-text-secondary sm:text-sm sm:tracking-[0.24em]">Tingkat Keberhasilan</p>
          <p className="mt-4 text-2xl font-semibold text-songket-text-primary sm:text-3xl">{successRate}</p>
        </div>
        <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-songket-text-secondary sm:text-sm sm:tracking-[0.24em]">Confidence Rata-rata</p>
          <p className="mt-4 text-2xl font-semibold text-songket-text-primary sm:text-3xl">{avgConfidence}</p>
        </div>
      </div>
    );
  };

  const renderModelMetrics = () => {
    if (!modelSummary) return null;

    const accuracy = modelSummary?.accuracy ?? null;
    const precision = modelSummary?.precision ?? null;
    const recall = modelSummary?.recall ?? null;
    const f1 = modelSummary?.f1_score ?? null;
    const datasetCount = modelSummary?.dataset_count ?? null;
    const modelVersion = modelSummary?.model_version ?? null;
    const trainedAt = modelSummary?.training_date || modelSummary?.last_training || null;
    const status = modelSummary?.status || dashboard?.modelStatus || 'Ready';

    return (
      <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-songket-text-primary mb-4">Ringkasan Model</h2>
            <p className="text-sm text-songket-text-secondary">Status: <span className="font-semibold text-songket-text-primary">{status}</span></p>
          </div>
          <div className="text-sm text-songket-text-secondary">Terakhir diperbarui: {trainedAt ? new Date(trainedAt).toLocaleString('id-ID') : 'Belum tersedia'}</div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 text-songket-text-secondary sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Accuracy</span>
              <span className="font-semibold text-songket-text-primary">{formatPercent(accuracy)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Precision</span>
              <span className="font-semibold text-songket-text-primary">{precision != null ? formatPercent(precision) : 'Belum terhitung'}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Recall</span>
              <span className="font-semibold text-songket-text-primary">{recall != null ? formatPercent(recall) : 'Belum terhitung'}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>F1 Score</span>
              <span className="font-semibold text-songket-text-primary">{f1 != null ? formatPercent(f1) : 'Belum terhitung'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Dataset Count</span>
              <span className="font-semibold text-songket-text-primary">{datasetCount != null ? formatNumber(datasetCount) : 'Belum tersedia'}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Model Version</span>
              <span className="font-semibold text-songket-text-primary">{modelVersion || 'Belum tersedia'}</span>
            </div>
          </div>
        </div>
        {(precision == null || recall == null || f1 == null) && (
          <div className="mt-4 rounded-2xl bg-songket-cream p-4 text-sm text-songket-text-secondary">
            <p className="font-semibold text-songket-text-primary">Catatan:</p>
            <p>Precision, Recall, dan F1 hanya muncul setelah evaluasi model selesai dan metrik tersimpan.</p>
          </div>
        )}
      </div>
    );
  };

  const renderTrainingSummary = () => {
    if (!trainingSummary) return null;

    const lastAccuracy = trainingSummary?.last_accuracy ?? null;
    const lastLoss = trainingSummary?.last_loss ?? null;
    const lastValAccuracy = trainingSummary?.last_val_accuracy ?? null;
    const lastValLoss = trainingSummary?.last_val_loss ?? null;
    const epochs = trainingSummary?.epochs ?? null;

    return (
      <div className="rounded-[1.25rem] border border-songket-border bg-white p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-songket-text-primary mb-4">Ringkasan Training</h2>
            <p className="text-sm text-songket-text-secondary">Ringkasan hasil training terbaru dan indikator konvergensi.</p>
          </div>
          <div className="text-sm font-semibold text-songket-text-primary">Epochs: {epochs != null ? formatNumber(epochs) : 'N/A'}</div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 text-songket-text-secondary sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Akurasi terakhir</span>
              <span className="font-semibold text-songket-text-primary">{formatPercent(lastAccuracy)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Loss terakhir</span>
              <span className="font-semibold text-songket-text-primary">{formatNumber(lastLoss)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Akurasi validasi</span>
              <span className="font-semibold text-songket-text-primary">{formatPercent(lastValAccuracy)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span>Loss validasi</span>
              <span className="font-semibold text-songket-text-primary">{formatNumber(lastValLoss)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-songket-gold"></div>
        <span className="ml-3 text-songket-text-secondary">Memuat analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-6 shadow-soft">
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={loadAnalytics} className="btn-primary">Muat ulang</button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="rounded-[1.25rem] border border-songket-border bg-songket-cream p-4 shadow-soft sm:rounded-[1.75rem] sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-songket-text-primary sm:text-3xl">AI Model Analytics</h1>
        <p className="text-sm text-songket-text-secondary">Menampilkan metrik model dan ringkasan training langsung dari backend.</p>
      </div>
      {renderSummaryCards()}
      {renderModelMetrics()}
      {renderTrainingSummary()}
    </div>
  );
}
