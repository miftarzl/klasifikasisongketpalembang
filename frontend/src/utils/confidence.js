export const resolveConfidenceScore = (item) => {
  if (item == null) return null;

  let score = item.confidence_score ?? item.confidence ?? (item.confidence_score_pct != null ? Number(item.confidence_score_pct) / 100 : null);
  if (typeof score === 'string') {
    score = parseFloat(score);
  }

  return Number.isFinite(score) ? score : null;
};

export const formatConfidencePercent = (score, decimals = 2) => {
  if (score == null) return 'N/A';
  return `${(score * 100).toFixed(decimals)}%`;
};

export const getConfidenceLabel = (score) => {
  if (score == null) return 'N/A';
  if (score >= 0.8) return 'Sangat Yakin';
  if (score >= 0.6) return 'Cukup Yakin';
  return 'Kurang Yakin';
};

export const getConfidenceLabelEn = (score) => {
  if (score == null) return 'N/A';
  if (score >= 0.8) return 'Very Confident';
  if (score >= 0.6) return 'Moderately Confident';
  return 'Less Confident';
};

export const getConfidenceBadgeClasses = (score) => {
  if (score == null) return 'bg-slate-100 text-slate-600';
  if (score >= 0.8) return 'bg-emerald-100 text-emerald-700';
  if (score >= 0.6) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

export const getConfidenceProgressClasses = (score) => {
  if (score == null) return 'bg-slate-200';
  if (score >= 0.8) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
  if (score >= 0.6) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
  return 'bg-gradient-to-r from-rose-500 to-rose-400';
};

export const getConfidenceStatusIcon = (score) => {
  if (score == null) return '!';
  if (score >= 0.8) return '✓';
  if (score >= 0.6) return '◐';
  return '!';
};
