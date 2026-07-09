const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const supabase = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeAdmin);

const DEFAULT_MODEL_VERSION = 'EfficientNetB3_Advanced';
const ML_SERVICE_DIR = path.resolve(__dirname, '../../../ml_service');
const ML_METRICS_PATH = path.join(ML_SERVICE_DIR, 'metrics.json');
const ML_TRAINING_HISTORY_PATH = path.join(ML_SERVICE_DIR, 'training_history.json');
const ML_TRAINING_STATUS_PATH = path.join(ML_SERVICE_DIR, 'training_status.json');
const ML_EVALUATION_RESULTS_PATH = path.join(ML_SERVICE_DIR, 'models', 'evaluation_results.json');
const ML_VALIDATION_REPORT_PATH = path.join(ML_SERVICE_DIR, 'validation_report.json');
const ML_TRAIN_DIR = path.join(ML_SERVICE_DIR, 'data', 'train');
const ML_PREDICTION_LOG_PATH = path.join(ML_SERVICE_DIR, 'models', 'prediction_log.jsonl');

const toNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeModelVersion = (version) => {
  if (!version || typeof version !== 'string' || version.trim().length === 0) {
    return DEFAULT_MODEL_VERSION;
  }

  const trimmed = version.trim();
  if (/^v\d{8,}$/.test(trimmed)) {
    return DEFAULT_MODEL_VERSION;
  }

  return trimmed;
};

const countLocalTrainSamples = () => {
  try {
    if (!fs.existsSync(ML_TRAIN_DIR)) return null;

    const walkDir = (dir) => {
      let count = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += walkDir(entryPath);
        } else if (entry.isFile()) {
          count += 1;
        }
      }
      return count;
    };

    return walkDir(ML_TRAIN_DIR);
  } catch (err) {
    console.warn('Failed to count local train samples:', err.message || err);
    return null;
  }
};

const readPredictionLog = () => {
  try {
    if (!fs.existsSync(ML_PREDICTION_LOG_PATH)) return [];
    const lines = fs.readFileSync(ML_PREDICTION_LOG_PATH, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    return lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  } catch (err) {
    console.warn('Failed to read prediction log:', err.message || err);
    return [];
  }
};

const getPredictionLogAverageConfidence = () => {
  const entries = readPredictionLog();
  if (!entries.length) return null;
  const confidences = entries
    .map((entry) => toNumber(entry.confidence, null))
    .filter((val) => val !== null);
  if (!confidences.length) return null;
  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
};

const formatVersionFromTimestamp = (timestamp) => {
  if (timestamp == null) return null;
  const numeric = Number(timestamp);
  let date;

  if (Number.isFinite(numeric)) {
    const millis = numeric < 1e12 ? numeric * 1000 : numeric;
    date = new Date(millis);
  } else {
    date = new Date(timestamp);
  }

  if (!date || !Number.isFinite(date.getTime())) {
    return null;
  }

  const utc = date.toISOString().replace(/[-:]/g, '').split('.')[0];
  return `v${utc.replace('T', '')}`;
};

const normalizeMlServiceUrl = (rawUrl) => {
  const url = rawUrl?.trim() || 'http://127.0.0.1:8000';
  return url.replace(/^http:\/\/localhost(?::(\d+))?/, 'http://127.0.0.1$1');
};

const DEFAULT_ML_URL = normalizeMlServiceUrl(process.env.ML_SERVICE_URL);
console.log('ML SERVICE CONFIGURATION:', DEFAULT_ML_URL);

const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Failed reading JSON file ${filePath}:`, error.message || error);
    return null;
  }
};

const computeMetricsFromConfusionMatrix = (matrix) => {
  if (!Array.isArray(matrix) || matrix.length === 0) return null;
  const size = matrix.length;
  const precisionPerClass = [];
  const recallPerClass = [];
  const f1PerClass = [];
  let totalCorrect = 0;
  let totalSamples = 0;

  for (let i = 0; i < size; i += 1) {
    const row = matrix[i] || [];
    const tp = toNumber(row[i], 0);
    const fn = row.reduce((sum, value, j) => (j !== i ? sum + toNumber(value, 0) : sum), 0);
    const colSum = matrix.reduce((sum, currentRow) => sum + toNumber(currentRow[i], 0), 0);
    const fp = colSum - tp;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    precisionPerClass.push(precision);
    recallPerClass.push(recall);
    f1PerClass.push(f1);
    totalCorrect += tp;
    totalSamples += row.reduce((sum, value) => sum + toNumber(value, 0), 0);
  }

  const macroPrecision = precisionPerClass.length ? precisionPerClass.reduce((sum, v) => sum + v, 0) / precisionPerClass.length : 0;
  const macroRecall = recallPerClass.length ? recallPerClass.reduce((sum, v) => sum + v, 0) / recallPerClass.length : 0;
  const macroF1 = f1PerClass.length ? f1PerClass.reduce((sum, v) => sum + v, 0) / f1PerClass.length : 0;
  const accuracy = totalSamples > 0 ? totalCorrect / totalSamples : 0;

  return {
    precision: macroPrecision,
    recall: macroRecall,
    f1_score: macroF1,
    accuracy,
    dataset_count: totalSamples,
  };
};

const ensureModelStatisticsCompleteness = async (statistics) => {
  if (!statistics) return null;

  const needsComputation = (
    statistics.precision == null ||
    statistics.recall == null ||
    statistics.f1_score == null ||
    statistics.accuracy == null ||
    statistics.dataset_count == null
  );

  if (!needsComputation || !statistics.confusion_matrix) {
    return statistics;
  }

  const computed = computeMetricsFromConfusionMatrix(statistics.confusion_matrix);
  if (!computed) return statistics;

  const updated = {
    ...statistics,
    precision: statistics.precision ?? computed.precision,
    recall: statistics.recall ?? computed.recall,
    f1_score: statistics.f1_score ?? computed.f1_score,
    accuracy: statistics.accuracy ?? computed.accuracy,
    dataset_count: statistics.dataset_count ?? computed.dataset_count,
  };

  if (statistics.id) {
    const { error: updateError } = await supabase
      .from('model_statistics')
      .update({
        precision: updated.precision,
        recall: updated.recall,
        f1_score: updated.f1_score,
        accuracy: updated.accuracy,
        dataset_count: updated.dataset_count,
      })
      .eq('id', statistics.id);

    if (updateError) {
      console.warn('Failed to update model_statistics completeness:', updateError.message || updateError);
    }
  }

  return updated;
};

const getLatestStoredModelSummary = async () => {
  const { data, error } = await supabase
    .from('model_statistics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn('MODEL_STATISTICS TABLE MISSING: falling back to local ML files');
      return null;
    }

    console.error('MODEL_STATISTICS QUERY ERROR:', error);
    return null;
  }

  const latest = data?.[0] || null;
  if (!latest) {
    return null;
  }

  return latest;
};

const getFallbackMetricsFromFiles = async () => {
  const metricsData = readJsonFile(ML_METRICS_PATH);
  const trainingHistory = readJsonFile(ML_TRAINING_HISTORY_PATH);
  const trainingStatus = readJsonFile(ML_TRAINING_STATUS_PATH);
  const evaluationResults = readJsonFile(ML_EVALUATION_RESULTS_PATH);
  const validationReport = readJsonFile(ML_VALIDATION_REPORT_PATH);

  if (!metricsData && !trainingHistory && !trainingStatus && !evaluationResults && !validationReport) return null;

  const parseTimestamp = (ts) => {
    if (ts == null) return null;
    const value = Number(ts);
    if (Number.isFinite(value)) {
      const millis = value < 1e12 ? value * 1000 : value;
      const date = new Date(millis);
      return Number.isFinite(date.getTime()) ? date.toISOString() : null;
    }

    const date = new Date(ts);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  };

  const getReportMetrics = (report) => {
    if (!report) return {};
    return {
      precision: toNumber(report?.['macro avg']?.precision ?? report?.['weighted avg']?.precision ?? null, null),
      recall: toNumber(report?.['macro avg']?.recall ?? report?.['weighted avg']?.recall ?? null, null),
      f1_score: toNumber(report?.['macro avg']?.['f1-score'] ?? report?.['macro avg']?.f1_score ?? report?.['weighted avg']?.['f1-score'] ?? report?.['weighted avg']?.f1_score ?? null, null),
      dataset_count: toNumber(report?.samples ?? report?.['macro avg']?.support ?? report?.['weighted avg']?.support ?? null, null),
    };
  };

  const reportMetrics = getReportMetrics(evaluationResults?.classification_report || evaluationResults?.report || validationReport?.report || null);
  const modelVersionSource = metricsData?.model_version || trainingStatus?.details?.model_version;
  const fallbackModelVersion = modelVersionSource || DEFAULT_MODEL_VERSION;
  const fallbackTrainingDate = parseTimestamp(metricsData?.timestamp ?? trainingStatus?.details?.timestamp ?? trainingStatus?.details?.started_at) || parseTimestamp(trainingHistory?.timestamp);

  const fallbackAverageConfidence = getPredictionLogAverageConfidence();

  const result = {
    accuracy: toNumber(metricsData?.accuracy, metricsData?.final_accuracy ?? trainingStatus?.details?.accuracy ?? null),
    precision: toNumber(metricsData?.precision ?? reportMetrics.precision ?? evaluationResults?.precision ?? evaluationResults?.precision_score ?? null, null),
    recall: toNumber(metricsData?.recall ?? reportMetrics.recall ?? null, null),
    f1_score: toNumber(metricsData?.f1_score ?? reportMetrics.f1_score ?? null, null),
    dataset_count: toNumber(metricsData?.dataset_count ?? reportMetrics.dataset_count ?? evaluationResults?.samples ?? evaluationResults?.dataset_count ?? countLocalTrainSamples() ?? null),
    average_confidence: toNumber(metricsData?.average_confidence ?? evaluationResults?.average_confidence ?? fallbackAverageConfidence ?? null),
    model_version: fallbackModelVersion,
    training_date: fallbackTrainingDate,
    training_duration_seconds: toNumber(metricsData?.training_duration_seconds ?? trainingStatus?.details?.training_duration_seconds ?? null),
    status: trainingStatus?.state || metricsData?.status || 'completed',
  };

  if (!result.precision && !result.recall && !result.f1_score && Array.isArray(metricsData?.confusion_matrix)) {
    const computed = computeMetricsFromConfusionMatrix(metricsData.confusion_matrix);
    if (computed) {
      result.precision = result.precision ?? computed.precision;
      result.recall = result.recall ?? computed.recall;
      result.f1_score = result.f1_score ?? computed.f1_score;
      result.accuracy = result.accuracy ?? computed.accuracy;
      result.dataset_count = result.dataset_count ?? computed.dataset_count;
    }
  }

  if (!result.precision && !result.recall && !result.f1_score && validationReport?.report) {
    const computedFromValidation = getReportMetrics(validationReport.report);
    result.precision = result.precision ?? computedFromValidation.precision;
    result.recall = result.recall ?? computedFromValidation.recall;
    result.f1_score = result.f1_score ?? computedFromValidation.f1_score;
    result.dataset_count = result.dataset_count ?? computedFromValidation.dataset_count;
  }

  if (!result.training_date && trainingHistory?.loss?.length) {
    result.training_date = fallbackTrainingDate || new Date().toISOString();
  }

  if (!result.model_version) {
    result.model_version = DEFAULT_MODEL_VERSION;
  }

  result.model_version = normalizeModelVersion(result.model_version);

  return result;
};

const getLatestModelSummary = async () => {
  let summary = await getLatestStoredModelSummary();
  if (summary) {
    summary = await ensureModelStatisticsCompleteness(summary);
    summary.model_version = normalizeModelVersion(summary.model_version);
    return summary;
  }

  const fallback = await getFallbackMetricsFromFiles();
  if (fallback) {
    return fallback;
  }

  return {
    accuracy: null,
    precision: null,
    recall: null,
    f1_score: null,
    dataset_count: null,
    average_confidence: null,
    model_version: null,
    training_date: null,
    training_duration_seconds: null,
    status: null,
    created_at: null,
  };
};

const getLatestTrainingSummary = async () => {
  const summary = await getLatestModelSummary();
  const historyData = readJsonFile(ML_TRAINING_HISTORY_PATH);
  const lastIdx = historyData?.loss?.length ? historyData.loss.length - 1 : null;

  return {
    ...summary,
    last_accuracy: lastIdx != null ? toNumber(historyData.accuracy?.[lastIdx], null) : null,
    last_loss: lastIdx != null ? toNumber(historyData.loss?.[lastIdx], null) : null,
    last_val_accuracy: lastIdx != null ? toNumber(historyData.val_accuracy?.[lastIdx], null) : null,
    last_val_loss: lastIdx != null ? toNumber(historyData.val_loss?.[lastIdx], null) : null,
    epochs: historyData?.loss?.length ?? summary?.training_duration_seconds ?? null,
    history: historyData || null,
  };
};

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log('GET /api/admin/dashboard called');

    const [
      { count: totalPredictions, error: predError },
      { count: totalDatasets, error: dataError },
      { count: totalExplorer, error: explorerError }
    ] = await Promise.all([
      supabase
        .from('batik_predictions')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('datasets')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('explorer_songkets')
        .select('*', { count: 'exact', head: true })
    ]);

    if (predError) {
      console.error('PREDICTION ERROR:', predError);

      return res.status(500).json({
        success: false,
        error: predError.message
      });
    }

    if (dataError) {
      console.error('DATASET ERROR:', dataError);

      return res.status(500).json({
        success: false,
        error: dataError.message
      });
    }

    const { data: latestPredictions, error: latestError } =
      await supabase
        .from('batik_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (latestError) {
      console.error('LATEST ERROR:', latestError);

      return res.status(500).json({
        success: false,
        error: latestError.message
      });
    }

    const modelSummary = await getLatestModelSummary();
    const successRate = modelSummary?.accuracy != null ? Math.round((modelSummary.accuracy > 1 ? modelSummary.accuracy : modelSummary.accuracy * 100) || 0) : 0;

    res.status(200).json({
      totalPredictions: toNumber(totalPredictions, 0),
      totalDatasets: toNumber(totalDatasets, 0),
      totalExplorer: toNumber(totalExplorer, 0),
      latestPredictions: latestPredictions || [],
      modelStatus: modelSummary?.status || 'Ready',
      modelVersion: modelSummary?.model_version || DEFAULT_MODEL_VERSION,
      successRate,
      average_confidence: modelSummary?.average_confidence ?? null,
      modelSummary,
    });

  } catch (error) {
    console.error('DASHBOARD ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/train
 */
router.post('/train', async (req, res) => {
  try {
    console.log('==============================');
    console.log('TRAINING DIMULAI');
    console.log('==============================');

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

    const { data: datasets, error: dbError } = await supabase
      .from('datasets')
      .select('label');

    if (dbError) {
      console.error('DATABASE ERROR:', dbError);

      return res.status(500).json({
        success: false,
        error: dbError.message
      });
    }

    const uniqueLabels = [
      ...new Set((datasets || []).map((d) => d.label))
    ];

    console.log('LABEL:', uniqueLabels);

    const trainUrl = `${mlServiceUrl.replace(/\/$/, '')}/train`;
    
    console.log('TRAIN URL:', trainUrl);
    console.log('ML SERVICE URL:', mlServiceUrl);

    // Trigger training on ML service (background) and then poll for completion
    const triggerResp = await axios.post(
      trainUrl,
      {},
      {
        timeout: 10000, // short timeout for trigger request
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('ML TRAIN TRIGGER RESPONSE:', triggerResp.status, triggerResp.data);

    // If ML service accepted background training (202), poll its training-status
    const mlBase = mlServiceUrl.replace(/\/$/, '');
    const statusUrl = `${mlBase}/training-status`;
    const metricsUrl = `${mlBase}/model-metrics`;
    const evalUrl = `${mlBase}/evaluation`;
    const historyUrl = `${mlBase}/training-history`;

    let finalMetrics = null;
    let evaluation = null;
    let history = null;
    let trainingStatus = null;

    // Polling loop: wait for 'completed' or 'failed' state
    const pollIntervalMs = 5000; // 5s
    const maxAttempts = 120; // ~10 minutes
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const statusResp = await axios.get(statusUrl, { timeout: 10000 });
        trainingStatus = statusResp.data;
        if (trainingStatus && trainingStatus.state === 'completed') {
          // fetch metrics/evaluation/history
          try {
            const [metricsResp, evalResp, histResp] = await Promise.all([
              axios.get(metricsUrl, { timeout: 10000 }).catch(() => null),
              axios.get(evalUrl, { timeout: 20000 }).catch(() => null),
              axios.get(historyUrl, { timeout: 10000 }).catch(() => null),
            ]);

            finalMetrics = metricsResp && metricsResp.data ? metricsResp.data : null;
            evaluation = evalResp && evalResp.data ? evalResp.data : null;
            history = histResp && histResp.data ? histResp.data : null;
          } catch (errFetch) {
            console.warn('Failed to fetch metrics/eval/history after training:', errFetch.message || errFetch);
          }
          break;
        }

        if (trainingStatus && trainingStatus.state === 'failed') {
          return res.status(500).json({ success: false, message: 'Training gagal pada ML service', details: trainingStatus });
        }
      } catch (err) {
        console.warn('Training status poll error:', err.message || err);
      }

      // wait
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }

    // If we exited loop without completion
    if (!trainingStatus || trainingStatus.state !== 'completed') {
      return res.status(202).json({ success: true, message: 'Training berjalan di latar, belum selesai. Periksa /api/admin/performance atau /api/ml/training-status.' });
    }

    // Prepare statistics payload to persist
    const stats = {
      accuracy: finalMetrics?.accuracy ?? null,
      precision: null,
      recall: null,
      f1_score: null,
      confusion_matrix: evaluation?.confusion_matrix ?? null,
      dataset_count: evaluation?.samples ?? null,
      training_date: finalMetrics?.timestamp ? new Date(finalMetrics.timestamp).toISOString() : new Date().toISOString(),
      training_duration_seconds: trainingStatus?.details?.training_duration_seconds ?? null,
      average_confidence: finalMetrics?.average_confidence ?? null,
      model_version: normalizeModelVersion(finalMetrics?.model_version),
      last_training: new Date().toISOString(),
      status: 'completed'
    };

    // Try to extract precision/recall/f1 from evaluation report (macro or weighted)
    try {
      const report = evaluation?.report || evaluation?.classification_report || (finalMetrics && finalMetrics.classification_report) || null;
      if (report) {
        const agg = report['macro avg'] || report['weighted avg'] || report['average'] || null;
        if (agg) {
          stats.precision = agg.precision ?? agg.precision_score ?? null;
          stats.recall = agg.recall ?? null;
          stats.f1_score = agg['f1-score'] ?? agg.f1_score ?? null;
        }
      }
    } catch (err) {
      console.warn('Failed to extract precision/recall/f1 from evaluation report:', err.message || err);
    }

    // Persist to Supabase model_metrics (legacy) and model_statistics (new)
    try {
      const insertMetrics = {
        accuracy: stats.accuracy ?? 0,
        loss: finalMetrics?.loss ?? null,
        created_at: new Date().toISOString()
      };
      const { error: metricError } = await supabase.from('model_metrics').insert([insertMetrics]);
      if (metricError) console.error('METRIC INSERT ERROR:', metricError);

      const statPayload = {
        accuracy: stats.accuracy,
        precision: stats.precision,
        recall: stats.recall,
        f1_score: stats.f1_score,
        confusion_matrix: stats.confusion_matrix,
        dataset_count: stats.dataset_count,
        training_date: stats.training_date,
        training_duration_seconds: stats.training_duration_seconds,
        average_confidence: stats.average_confidence,
        model_version: stats.model_version,
        last_training: stats.last_training,
        status: stats.status,
      };

      const { error: statError } = await supabase.from('model_statistics').insert([statPayload]);
      if (statError) console.error('STATISTICS INSERT ERROR:', statError);
    } catch (dbErr) {
      console.error('Failed to persist metrics/statistics to Supabase:', dbErr);
    }

    res.status(200).json({ message: 'Training selesai dan statistik disimpan.', metrics: stats });

  } catch (error) {
    console.error('================================');
    console.error('TRAINING ERROR');
    console.error(error);
    console.error('================================');

    if (error.response) {
      console.error('ML Service Response Status:', error.response.status);
      console.error('ML Service Response Data:', error.response.data);
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'ML Service Error',
        detail: error.response.data
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({
        success: false,
        message: 'ML Service tidak berjalan. Pastikan service FastAPI di folder ml_service dijalankan sebelum training.',
        detail: {
          serviceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
          command: 'cd ml_service && python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000'
        },
        code: 'ECONNREFUSED'
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'Training timeout - ML Service tidak merespons dalam waktu 10 menit',
        detail: {
          serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000'
        },
        code: error.code
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

/**
 * GET /api/admin/history
 */
router.get('/history', async (req, res) => {
  try {
    console.log('GET /api/admin/history');

    const { data, error } = await supabase
      .from('batik_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('HISTORY ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const validPredictions = (data || []).filter((item) => item && item.prediction_label && item.confidence_score !== null && item.confidence_score !== undefined);
    console.log('History returned:', validPredictions.length, 'records');
    res.status(200).json(validPredictions);
  } catch (error) {
    console.error('HISTORY SERVER ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/predictions/history
 * Legacy alias for dashboard clients.
 */
router.get('/predictions/history', async (req, res) => {
  try {
    console.log('GET /api/admin/predictions/history');
    const { data, error } = await supabase
      .from('batik_predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('HISTORY ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const validPredictions = (data || []).filter((item) => item && item.prediction_label && item.confidence_score !== null && item.confidence_score !== undefined);
    res.status(200).json(validPredictions);

  } catch (error) {
    console.error('HISTORY SERVER ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/predictions/history
 */
router.delete('/predictions/history', async (req, res) => {
  try {
    const { error } = await supabase
      .from('batik_predictions')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('DELETE HISTORY ERROR:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Riwayat klasifikasi berhasil dihapus.'
    });
  } catch (error) {
    console.error('DELETE HISTORY SERVER ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/model-summary
 */
router.get('/model-summary', async (req, res) => {
  try {
    console.log('GET /api/admin/model-summary');
    const summary = await getLatestModelSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('MODEL SUMMARY ERROR:', error.stack || error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/training-summary
 */
router.get('/training-summary', async (req, res) => {
  try {
    console.log('GET /api/admin/training-summary');
    const summary = await getLatestTrainingSummary();
    res.status(200).json(summary);
  } catch (error) {
    console.error('TRAINING SUMMARY ERROR:', error.stack || error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/performance
 */
router.get('/performance', async (req, res) => {
  try {
    console.log('GET PERFORMANCE');

    const { data, error } = await supabase
      .from('model_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('PERFORMANCE ERROR:', error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(200).json(
      data?.[0] || {
        accuracy: 0,
        loss: 0,
        updated_at: null
      }
    );

  } catch (error) {
    console.error('PERFORMANCE SERVER ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/model-statistics
 * Return latest stored model statistics (from model_statistics table)
 */
router.get('/model-statistics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('model_statistics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('MODEL_STATISTICS ERROR:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const latest = data?.[0] || null;

    if (!latest) {
      const { data: metricsData, error: metricsError } = await supabase
        .from('model_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!metricsError && metricsData?.[0]) {
        return res.status(200).json({
          accuracy: metricsData[0].accuracy ?? null,
          precision: null,
          recall: null,
          f1_score: null,
          dataset_count: null,
          average_confidence: null,
          model_version: null,
          last_training: metricsData[0].created_at || null,
          status: 'completed',
          created_at: metricsData[0].created_at || null,
        });
      }
    }

    const payload = latest || {
      accuracy: null,
      precision: null,
      recall: null,
      f1_score: null,
      dataset_count: null,
      average_confidence: null,
      model_version: null,
      last_training: null,
      status: 'pending',
      created_at: null,
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error('MODEL_STATISTICS SERVER ERROR:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;