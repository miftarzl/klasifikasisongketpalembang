const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabaseClient');
const { sendToMlService, generateHeatmap } = require('../services/mlService');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();
const isDev = process.env.NODE_ENV !== 'production';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// PUBLIC: User bisa klasifikasi gambar tanpa login
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Gambar batik harus diunggah.' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    if (isDev) console.log(`[Prediction] Processing image: ${req.file.filename}`);
    
    const mlResponse = await sendToMlService(req.file.path);
    if (isDev) console.log(`[Prediction] ML Response:`, mlResponse);

    const normalizedLabel = mlResponse?.label || mlResponse?.prediction_label || mlResponse?.prediction || (mlResponse?.result && mlResponse.result.label);
    let normalizedConfidence = mlResponse?.confidence ?? mlResponse?.confidence_score ?? (mlResponse?.confidence_score_pct != null ? Number(mlResponse.confidence_score_pct) / 100 : undefined);
    if (typeof normalizedConfidence === 'string') {
      normalizedConfidence = parseFloat(normalizedConfidence);
    }

    if (!normalizedLabel || normalizedConfidence === undefined || normalizedConfidence === null || Number.isNaN(normalizedConfidence)) {
      console.error('[Prediction] Invalid ML response:', mlResponse);
      return res.status(500).json({
        message: 'ML Service mengembalikan data tidak valid.',
        received: mlResponse,
      });
    }

    const lowConfidenceWarning = parseFloat(process.env.LOW_CONFIDENCE_WARNING || '0.35');
    const lowConfidence = normalizedConfidence < lowConfidenceWarning;

    const prediction = {
      image_url: imageUrl,
      prediction_label: normalizedLabel,
      confidence_score: normalizedConfidence,
      created_at: new Date().toISOString(),
    };

    const responsePayload = {
      ...prediction,
      prediction: normalizedLabel,
      label: normalizedLabel,
      confidence: normalizedConfidence,
      low_confidence: lowConfidence,
      warning_message: lowConfidence ? 'Confidence rendah — hasil mungkin kurang pasti.' : null,
      model_version:
        mlResponse.model_version ||
        mlResponse.modelVersion ||
        mlResponse.metadata?.model_version ||
        mlResponse.metadata?.modelVersion ||
        'v2.0',
      top_predictions:
        mlResponse.top_predictions ||
        mlResponse.topPredictions ||
        mlResponse.metadata?.top_predictions ||
        mlResponse.metadata?.topPredictions ||
        [],
      confidence_score_pct: normalizedConfidence != null ? normalizedConfidence * 100 : undefined,
    };

    if (isDev) console.log(`[Prediction] Saving to DB:`, prediction);
    const { error } = await supabase.from('batik_predictions').insert([prediction]);

    if (error) {
      if (isDev) console.error('[Prediction] DB Error:', error);
      responsePayload.db_error = error.message || 'Gagal menyimpan hasil klasifikasi.';
    }

    if (isDev) console.log(`[Prediction] Success: ${prediction.prediction_label} (${prediction.confidence_score})`);
    res.json(responsePayload);
  } catch (error) {
    console.error('[Prediction] Route error:', error.message);
    next(error);
  }
});

function resolveUploadPath(imageUrl) {
  try {
    const url = new URL(imageUrl, 'http://localhost');
    if (url.pathname.startsWith('/uploads/')) {
      return path.join(process.cwd(), url.pathname);
    }
  } catch (err) {
    return null;
  }
  return null;
}

async function downloadRemoteImage(imageUrl) {
  const fileName = path.basename(new URL(imageUrl).pathname) || `heatmap-${uuidv4()}.jpg`;
  const tempPath = path.join(os.tmpdir(), `${uuidv4()}-${fileName}`);
  const response = await axios.get(imageUrl, { responseType: 'stream', timeout: 60000 });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return tempPath;
}

router.post('/heatmap', async (req, res, next) => {
  try {
    const { image_url: imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Parameter image_url diperlukan.' });
    }

    let imagePath = resolveUploadPath(imageUrl);
    let tempFile = null;

    if (!imagePath || !fs.existsSync(imagePath)) {
      tempFile = await downloadRemoteImage(imageUrl);
      imagePath = tempFile;
    }

    const heatmapResponse = await generateHeatmap(imagePath);

    if (tempFile) {
      fs.unlink(tempFile, () => {});
    }

    res.json(heatmapResponse);
  } catch (error) {
    console.error('[Prediction Heatmap] Route error:', error.message);
    next(error);
  }
});

// ADMIN: Get riwayat klasifikasi semua
router.get('/history', async (req, res, next) => {
  try {
    if (isDev) console.log('[History] Fetching predictions from DB...');
    
    const { data, error } = await supabase
      .from('batik_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[History] Supabase error:', error);
      throw error;
    }

    // Filter out invalid records (missing required fields)
    const validPredictions = (data || []).filter(item => {
      return item && item.prediction_label && item.confidence_score !== null && item.confidence_score !== undefined;
    });

    console.log(`[History] Found ${data?.length || 0} records, ${validPredictions.length} valid`);
    res.json(validPredictions);
  } catch (error) {
    console.error('[History] Route error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil riwayat', error: error.message });
  }
});

module.exports = router;
