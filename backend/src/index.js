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
    try { console.log('BODY:', req.body); } catch (e) {}
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
    console.log(`Backend berjalan di:`);
    console.log(`http://localhost:${port}`);
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
  startServer(activePort);
})();
