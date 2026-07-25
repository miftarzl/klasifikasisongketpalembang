const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';

// Allowed image MIME types and max file count/size (size handled by multer if configured)
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Konfigurasi Multer untuk penyimpanan sementara
const upload = multer({ dest: 'temp_uploads/' });

// Path ke folder training ML Service
const ML_SERVICE_TRAIN_DIR = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'ml_service',
  'data',
  'train'
);

/**
 * Helper: Mengekstrak path file dari URL publik Supabase
 */
function getStoragePathFromUrl(publicUrl) {
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/');
    const bucketIndex = parts.indexOf('dataset');

    if (bucketIndex !== -1 && bucketIndex + 1 < parts.length) {
      return parts.slice(bucketIndex + 1).join('/');
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Helper: Memastikan direktori training berlabel tersedia
 */
async function ensureTrainPath(label) {
  const labelDir = path.join(ML_SERVICE_TRAIN_DIR, label);
  await fs.mkdir(labelDir, { recursive: true });
  return labelDir;
}

/**
 * POST /upload
 * Upload dataset
 */
router.post(
  '/upload',
  authenticateToken,
  authorizeAdmin,
  upload.array('images', 50),
  async (req, res, next) => {
    try {
        let {
          label,
          name,
          category,
          origin,
          usage,
          history,
          philosophy,
          characteristic,
          gallery_description
        } = req.body || {};

        label = label ? String(label).trim() : '';
        name = name ? String(name).trim() : '';

        if (!req.files || req.files.length === 0 || !label || !name) {
          return res.status(400).json({
            message: 'Nama Songket, label, dan minimal satu gambar wajib diunggah.',
          });
        }

        if (name.length > 200 || label.length > 200) {
          return res.status(400).json({ message: 'Field name atau label terlalu panjang.' });
        }

        const supabaseInserts = [];
        const labelDir = await ensureTrainPath(label);

        for (const file of req.files) {
          if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
            // Clean up temp files
            await fs.unlink(file.path).catch(() => {});
            return res.status(400).json({ message: `Tipe file tidak didukung: ${file.mimetype}` });
          }
          const uniqueFileName = `${Date.now()}-${uuidv4()}${path.extname(
            file.originalname
          )}`;

          const storagePath = `batik/${uniqueFileName}`;

          // Read file
          const fileBuffer = await fs.readFile(file.path);

          // Upload ke Supabase Storage dengan fallback lokal jika bucket belum dibuat
          let imageUrl = null;
          try {
            const { error: uploadError } = await supabase.storage
              .from('dataset')
              .upload(storagePath, fileBuffer, {
                contentType: file.mimetype,
                upsert: true,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from('dataset')
                .getPublicUrl(storagePath);
              imageUrl = urlData?.publicUrl;
            } else {
              if (isDev) console.warn('Supabase storage notice:', uploadError.message);
            }
          } catch (sErr) {
            if (isDev) console.warn('Supabase storage error, using local fallback:', sErr.message);
          }

          // Fallback lokal jika Supabase storage tidak tersedia
          if (!imageUrl) {
            const datasetUploadsDir = path.join(process.cwd(), 'uploads', 'dataset');
            await fs.mkdir(datasetUploadsDir, { recursive: true });
            await fs.writeFile(path.join(datasetUploadsDir, uniqueFileName), fileBuffer);
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/dataset/${uniqueFileName}`;
          }

          // Simpan lokal untuk training ML Service
          const localFilePath = path.join(labelDir, uniqueFileName);
          await fs.writeFile(localFilePath, fileBuffer);

          // Insert database payload
          supabaseInserts.push({
            image_url: imageUrl,
            label: label,
            name: name,
            category: category || null,
            origin: origin || null,
            usage: usage || null,
            history: history || null,
            philosophy: philosophy || null,
            characteristic: characteristic || null,
            gallery_description: gallery_description || null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

          // Hapus temp file
          await fs.unlink(file.path).catch(() => {});
        }

        // Simpan ke database
        const { data: dbData, error: dbError } = await supabase
          .from('datasets')
          .insert(supabaseInserts)
          .select();

        if (dbError) {
          if (isDev) console.error('DB INSERT ERROR:', dbError);
          throw new Error(`Database Error: ${dbError.message}`);
        }

      res.status(201).json({
        message: `${req.files.length} gambar berhasil ditambahkan.`,
        data: dbData,
      });
    } catch (error) {
      if (isDev) console.error('UPLOAD ERROR:', error);

      if (req.files) {
        for (const file of req.files) {
          if (existsSync(file.path)) {
            await fs.unlink(file.path).catch(() => {});
          }
        }
      }

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

async function seedDefaultDatasets() {
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

  try {
    const { data: inserted, error } = await supabase
      .from('datasets')
      .insert(defaultDatasets)
      .select();
    if (!error && inserted) return inserted;
  } catch (err) {
    if (isDev) console.error('Auto seed datasets error:', err);
  }
  return defaultDatasets;
}

/**
 * GET /
 * Ambil semua dataset
 */
router.get('/', async (req, res) => {
  try {
    if (isDev) console.log('GET /api/datasets called');

    let { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const seededData = await seedDefaultDatasets();
      return res.status(200).json(seededData || []);
    }

    res.status(200).json(data || []);
  } catch (error) {
    if (isDev) console.error('DATASET ROUTE ERROR:', error);
    const fallbackData = await seedDefaultDatasets();
    res.status(200).json(fallbackData || []);
  }
});

/**
 * DELETE /all
 * Hapus semua dataset
 */
router.delete(
  '/all',
  authenticateToken,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const { data: datasets, error: fetchError } = await supabase
        .from('datasets')
        .select('image_url');

      if (fetchError) throw fetchError;

      if (datasets && datasets.length > 0) {
        // Hapus storage
        const storagePaths = datasets
          .map((d) => getStoragePathFromUrl(d.image_url))
          .filter((p) => p !== null);

        if (storagePaths.length > 0) {
          await supabase.storage.from('dataset').remove(storagePaths);
        }

        // Hapus database
        const { error: dbError } = await supabase
          .from('datasets')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (dbError) throw dbError;
      }

      // Bersihkan folder ML lokal
      if (existsSync(ML_SERVICE_TRAIN_DIR)) {
        await fs.rm(ML_SERVICE_TRAIN_DIR, {
          recursive: true,
          force: true,
        });

        await fs.mkdir(ML_SERVICE_TRAIN_DIR, {
          recursive: true,
        });
      }

      res.json({
        message: 'Seluruh dataset berhasil dibersihkan.',
      });
    } catch (error) {
      console.error('DELETE ALL ERROR:', error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /:id
 * Hapus satu dataset
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Ambil data
      const { data: item, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({
          message: 'Dataset tidak ditemukan.',
        });
      }

      // Hapus storage
      const storagePath = getStoragePathFromUrl(item.image_url);

      if (storagePath) {
        await supabase.storage.from('dataset').remove([storagePath]);
      }

      // Hapus lokal
      const fileName = path.basename(storagePath);

      const localPath = path.join(
        ML_SERVICE_TRAIN_DIR,
        item.label,
        fileName
      );

      if (existsSync(localPath)) {
        await fs.unlink(localPath);
      }

      // Hapus database
      const { error: dbError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      res.json({
        message: 'Dataset berhasil dihapus.',
      });
    } catch (error) {
      console.error('DELETE DATASET ERROR:', error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;