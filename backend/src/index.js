require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/prediction');
const adminRoutes = require('./routes/admin');
const datasetRoutes = require('./routes/dataset');
const explorerRoutes = require('./routes/explorer');
const supabase = require('./services/supabaseClient');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:3000',
    ];

// ======================================
// MIDDLEWARE
// ======================================
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ======================================
// DEBUG REQUEST LOGGER
// ======================================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('================================');
    console.log(`${req.method} ${req.url}`);
    try {
      const safeBody = { ...(req.body || {}) };
      ['password', 'currentPassword', 'newPassword', 'confirmPassword'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(safeBody, key)) safeBody[key] = '[REDACTED]';
      });
      console.log('BODY:', safeBody);
    } catch (e) {}
    console.log('================================');
    next();
  });
}

// ======================================
// ROOT ROUTE
// ======================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API Running'
  });
});

// ======================================
// API ROUTES
// ======================================
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/explorer', explorerRoutes);

// ======================================
// ML SERVICE PROXY ROUTES
// ======================================
const normalizeMlServiceUrl = (rawUrl) => {
  const url = rawUrl?.trim() || 'http://127.0.0.1:8000';
  return url.replace(/^http:\/\/localhost(?::(\d+))?/, 'http://127.0.0.1$1');
};

const mlServiceUrl = normalizeMlServiceUrl(process.env.ML_SERVICE_URL);
console.log('ML SERVICE URL:', mlServiceUrl);

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN SEED: ADMIN_EMAIL or ADMIN_PASSWORD not configured, skipping auto-create.');
    return;
  }

  try {
    const { data: existingAdmin, error: fetchError } = await supabase
      .from('users')
      .select('id,role')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.warn('ADMIN SEED: Failed to verify existing admin user:', fetchError.message || fetchError);
      return;
    }

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', email);

        if (updateError) {
          console.warn('ADMIN SEED: Failed to update existing user role to admin:', updateError.message || updateError);
        } else {
          console.log(`ADMIN SEED: Updated existing user ${email} to admin role.`);
        }
      } else {
        console.log(`ADMIN SEED: Admin user already exists: ${email}`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, role: 'admin' }])
      .select();

    if (insertError) {
      console.warn('ADMIN SEED: Failed to create admin user:', insertError.message || insertError);
      return;
    }

    console.log(`ADMIN SEED: Created admin user ${email}`);
  } catch (error) {
    console.error('ADMIN SEED: Unexpected error while creating admin user:', error);
  }
}

async function ensureBuiltinDatasets() {
  try {
    const { data: existing, error } = await supabase
      .from('datasets')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('DATASET SEED: Check error:', error.message || error);
      return;
    }

    if (existing && existing.length > 0) {
      console.log('DATASET SEED: Datasets already present in database.');
      return;
    }

    const defaultDatasets = [
      {
        name: 'Songket Limar',
        label: 'Songket Limar',
        category: 'Luxury',
        origin: 'Palembang',
        usage: 'Biasanya digunakan pada upacara adat, pesta kebesaran, dan acara formal keluarga kerajaan.',
        history: "Songket Limar merupakan salah satu jenis Songket Palembang yang telah dikenal sejak masa Kesultanan Palembang Darussalam pada abad ke-18. Nama 'Limar' berasal dari teknik pewarnaan benang sutra yang menghasilkan gradasi warna sebelum proses penenunan dilakukan.",
        philosophy: 'Melambangkan kemewahan, kehormatan, dan status sosial, sekaligus kecanggihan seni tenun Palembang.',
        characteristic: 'Corak Songket Limar menampilkan gradasi warna halus yang menjadi latar bagi ornamen emas yang elegan dan teratur.',
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Songket Rakam',
        label: 'Songket Rakam',
        category: 'Royalty',
        origin: 'Palembang',
        usage: 'Tradisional digunakan dalam upacara adat, pernikahan kerajaan, dan acara pemerintahan penting.',
        history: "Songket Rakam berkembang pada masa Kesultanan Palembang sebagai salah satu kain tenun mewah yang dibuat dengan teknik penyisipan benang emas secara rapat sehingga menghasilkan motif yang kaya akan detail.",
        philosophy: 'Melambangkan kemuliaan, kemakmuran, dan status sosial tinggi keluarga kerajaan.',
        characteristic: 'Motif Songket Rakam menonjolkan hiasan emas rapat dengan pola rumit yang menunjukkan kemegahan dan detail tinggi.',
        image_url: 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Songket Polos',
        label: 'Songket Polos',
        category: 'Everyday',
        origin: 'Palembang',
        usage: 'Sering dipakai sebagai busana adat yang lebih sederhana dalam acara budaya dan upacara resmi.',
        history: 'Songket Polos merupakan jenis songket dengan tampilan yang lebih sederhana dibandingkan jenis songket lainnya. Meskipun memiliki sedikit ornamen benang emas, Songket Polos tetap mempertahankan kualitas tenunan sutra khas Palembang.',
        philosophy: 'Melambangkan kesederhanaan yang elegan, kehormatan, dan keindahan budaya yang tidak berlebihan.',
        characteristic: 'Desain Songket Polos menonjolkan kain tenun halus dengan detail minimal namun tetap anggun.',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Songket Lepus',
        label: 'Songket Lepus',
        category: 'Heritage',
        origin: 'Palembang',
        usage: 'Dulunya dipakai oleh keluarga kerajaan dan bangsawan pada acara kenegaraan dan adat penting.',
        history: "Songket Lepus dikenal sebagai jenis songket paling mewah di Palembang. Nama 'Lepus' berarti seluruh permukaan kain hampir tertutup oleh benang emas sehingga menghasilkan tampilan yang berkilau dan megah.",
        philosophy: 'Melambangkan kekuasaan, kemakmuran, dan kehormatan yang tertinggi dalam tradisi kerajaan.',
        characteristic: 'Corak Songket Lepus menutup hampir seluruh kain dengan benang emas yang berkilau, menciptakan kesan megah dan berwibawa.',
        image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Songket Tabur',
        label: 'Songket Tabur',
        category: 'Classic',
        origin: 'Palembang',
        usage: 'Sering dipilih untuk acara adat sehari-hari dan kegiatan budaya yang lebih ringan.',
        history: "Songket Tabur berkembang sebagai salah satu variasi songket yang memiliki susunan motif kecil tersebar merata di seluruh permukaan kain. Nama 'Tabur' berasal dari bentuk penyebaran ornamen yang tampak seperti ditaburkan pada kain.",
        philosophy: 'Melambangkan keseimbangan antara kemegahan dan kesederhanaan dalam seni songket.',
        characteristic: 'Polanya menampilkan ornamen kecil yang tersebar merata dengan efek halus dan elegan.',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Songket Seler',
        label: 'Songket Seler',
        category: 'Formal',
        origin: 'Palembang',
        usage: 'Biasa digunakan pada acara resmi, penyambutan tamu kehormatan, dan upacara adat.',
        history: "Songket Seler merupakan salah satu jenis Songket Palembang yang dikenal melalui susunan motif memanjang menyerupai garis-garis vertikal pada permukaan kain.",
        philosophy: 'Melambangkan keanggunan, keteraturan, dan citra resmi dalam tradisi adat.',
        characteristic: 'Corak memanjang vertikal menciptakan tampilan anggun dan rapi yang khas.',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { error: insertErr } = await supabase.from('datasets').insert(defaultDatasets);
    if (insertErr) {
      console.warn('DATASET SEED: Insert error:', insertErr.message || insertErr);
    } else {
      console.log('DATASET SEED: Successfully auto-seeded initial songket datasets!');
    }
  } catch (err) {
    console.error('DATASET SEED: Unexpected error:', err);
  }
}

app.get('/api/ml/analytics', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Analytics proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch ML analytics' });
  }
});

app.get('/api/ml/training-history', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/training-history`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Training history proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch training history' });
  }
});

app.get('/api/ml/training-status', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/training-status`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Training status proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch training status' });
  }
});

app.get('/api/ml/evaluation', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/evaluation`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Evaluation proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation results' });
  }
});

app.get('/api/ml/model-metrics', async (req, res) => {
  try {
    const response = await fetch(`${mlServiceUrl.replace(/\/$/, '')}/model-metrics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('ML Model metrics proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch model metrics' });
  }
});

// ======================================
// 404 HANDLER
// ======================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan'
  });
});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================
app.use(errorHandler);

// ======================================
// SERVER
// ======================================
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
let activePort = DEFAULT_PORT;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log('================================');
    console.log(`Backend berjalan di: http://localhost:${port}`);
    console.log('================================');
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} sudah digunakan, mencoba port ${port + 1}...`);
      activePort = port + 1;
      startServer(activePort);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
};

(async () => {
  await ensureAdminUser();
  await ensureBuiltinDatasets();
  startServer(activePort);
})();
