const express = require('express');
const supabase = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const {
  uploadSupabaseFile,
  removeStorageFiles,
  getStoragePathFromUrl,
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE,
} = require('../utils/storage');

const router = express.Router();
const adminAuth = [authenticateToken, authorizeAdmin];

// Use memory storage and upload to Supabase storage (bucket: 'dataset')
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new Error('INVALID_FILE_TYPE'));
  }
  cb(null, true);
}

const THUMBNAIL_FOLDER = 'explorer/thumbnail';
const GALLERY_FOLDER = 'explorer/gallery';

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE }, fileFilter });

function runMulter(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        if (err.message === 'INVALID_FILE_TYPE') {
          return res.status(400).json({ error: 'INVALID_FILE_TYPE', detail: 'Hanya jpg, jpeg, png, webp diperbolehkan' });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'FILE_TOO_LARGE', detail: 'Ukuran file melebihi batas maksimum.' });
        }
        return res.status(500).json({ error: 'UPLOAD_ERROR', detail: err.message || err });
      }
      next();
    });
  };
}

const INVALID_EXPLORER_TOKENS = ['e2e', 'test', 'dummy', 'sample', 'placeholder'];

const getExplorerText = (value) => (value ?? '').toString().trim();

const containsInvalidExplorerToken = (value) => INVALID_EXPLORER_TOKENS.some((token) => getExplorerText(value).toLowerCase().includes(token));

function isInvalidExplorerRecord(item = {}) {
  if (!item || item.is_builtin) return false;

  const name = getExplorerText(item.name).toLowerCase();
  const category = getExplorerText(item.category).toLowerCase();
  const description = getExplorerText(item.gallery_description || item.description || item.summary || item.history || item.philosophy || item.usage).toLowerCase();
  const thumbnail = getExplorerText(item.thumbnail);

  const hasInvalidName = containsInvalidExplorerToken(name);
  const hasEmptyThumbnail = !thumbnail || thumbnail === 'null' || thumbnail === 'undefined';
  const hasInvalidCategory = category === 'uncategorized' || category === 'unclassified';
  const hasPlaceholderDescription = description === '' || description === 'deskripsi singkat belum tersedia.' || description === 'deskripsi belum tersedia';
  const isTestingCrud = /(crud|testing)/i.test(getExplorerText(item.name));

  return hasInvalidName || hasEmptyThumbnail || hasInvalidCategory || hasPlaceholderDescription || isTestingCrud;
}

function isVisibleExplorerRecord(item = {}) {
  if (!item) return false;
  if (isInvalidExplorerRecord(item)) return false;
  return Boolean(item.published);
}

function validateExplorerPayload(payload = {}) {
  const errors = [];
  if (!getExplorerText(payload.name)) {
    errors.push('Nama songket wajib diisi.');
  }
  if (!getExplorerText(payload.category)) {
    errors.push('Kategori wajib diisi.');
  }
  if (!getExplorerText(payload.thumbnail)) {
    errors.push('Thumbnail wajib diisi.');
  }

  const descriptionCandidate = getExplorerText(payload.gallery_description || payload.description || payload.summary || payload.history || payload.philosophy || payload.usage);
  if (!descriptionCandidate) {
    errors.push('Deskripsi/penjelasan wajib diisi.');
  }

  return { valid: errors.length === 0, errors };
}

// Public: list published explorer songkets
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('explorer_songkets')
      .select('*')
      .eq('published', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[Explorer] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal mengambil data explorer' });
    }

    const visibleItems = (data || []).filter((item) => isVisibleExplorerRecord(item));
    res.json(visibleItems);
  } catch (err) {
    console.error('[Explorer] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: list all (including unpublished)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('explorer_songkets').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[Explorer Admin] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal mengambil data explorer admin' });
    }
    const visibleItems = (data || []).filter((item) => !isInvalidExplorerRecord(item));
    res.json(visibleItems);
  } catch (err) {
    console.error('[Explorer Admin] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: fetch gallery for a songket
router.get('/:id/gallery', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID diperlukan' });
    const gallery = await fetchGalleryBySongketId(id);
    res.json(gallery);
  } catch (err) {
    console.error('[Explorer Gallery] Route error:', err);
    res.status(500).json({ message: 'Gagal mengambil galeri' });
  }
});

// Public: get single by id or slug
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await fetchSongketByIdentifier(id);
    const { data, error } = result;
    if (error) {
      console.error('[Explorer] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal mengambil data explorer' });
    }
    if (!data) return res.status(404).json({ message: 'Item tidak ditemukan' });
    res.json(data);
  } catch (err) {
    console.error('[Explorer] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function resolveUniqueSlug(baseValue, currentId = null) {
  const baseSlug = slugify(baseValue || 'songket');
  const fallbackSlug = baseSlug || `songket-${Date.now()}`;
  let candidate = fallbackSlug;
  let counter = 1;

  if (typeof supabase?.from !== 'function') {
    return candidate;
  }

  while (true) {
    try {
      let query = supabase.from('explorer_songkets').select('id').eq('slug', candidate);
      if (currentId && typeof query.neq === 'function') {
        query = query.neq('id', currentId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        console.warn('[Explorer] Slug check warning:', error.message || error);
        return candidate;
      }

      if (!data) {
        return candidate;
      }

      candidate = `${fallbackSlug}-${counter}`;
      counter += 1;
    } catch (err) {
      console.warn('[Explorer] Slug check failed, using fallback slug:', err.message || err);
      return candidate;
    }
  }
}

// Admin create
router.post('/', adminAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    payload.created_at = new Date().toISOString();
    payload.updated_at = new Date().toISOString();

    const validation = validateExplorerPayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Data tidak valid.', errors: validation.errors });
    }

    if (!payload.slug && payload.name) {
      payload.slug = payload.name;
    }
    if (payload.slug) {
      payload.slug = await resolveUniqueSlug(payload.slug);
    } else {
      payload.slug = await resolveUniqueSlug(payload.name || 'songket');
    }

    const { data, error } = await supabase.from('explorer_songkets').insert([payload]).select();
    if (error) {
      console.error('[Explorer Create] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal menyimpan data' });
    }
    res.status(201).json(data?.[0] || null);
  } catch (err) {
    console.error('[Explorer Create] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function handleThumbnailUpload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required', message: 'File gambar tidak ditemukan.' });

    const { publicUrl } = await uploadSupabaseFile(req.file, THUMBNAIL_FOLDER);
    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('[Explorer Upload Thumb] error:', err);
    const message = err.message || 'Upload gagal ke Supabase Storage.';
    const status = message === 'Bucket dataset tidak ditemukan.' ? 500 : 500;
    return res.status(status).json({ error: 'UPLOAD_ERROR', message });
  }
}

router.post('/upload', adminAuth, runMulter(upload.single('image')), handleThumbnailUpload);
router.post('/upload/thumbnail', adminAuth, runMulter(upload.single('image')), handleThumbnailUpload);

async function fetchGalleryBySongketId(songketId) {
  const { data, error } = await supabase
    .from('explorer_songket_images')
    .select('id,image_url,image_order,is_cover,created_at')
    .eq('explorer_songket_id', songketId)
    .order('image_order', { ascending: true });

  if (error) {
    throw error;
  }
  return data || [];
}

async function fetchSongketByIdentifier(id) {
  let result;
  if (id && id.length === 36) {
    result = await supabase.from('explorer_songkets').select('*, gallery:explorer_songket_images(id,image_url,image_order,is_cover,created_at)').eq('id', id).maybeSingle();
  }
  if (!result || result.error || !result.data) {
    result = await supabase.from('explorer_songkets').select('*, gallery:explorer_songket_images(id,image_url,image_order,is_cover,created_at)').eq('slug', id).maybeSingle();
  }
  return result;
}

// Admin update
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};
    payload.updated_at = new Date().toISOString();

    const { data: existing, error: fetchError } = await supabase.from('explorer_songkets').select('*').eq('id', id).maybeSingle();
    if (fetchError) {
      console.error('[Explorer Update] Fetch error:', fetchError);
      return res.status(500).json({ message: 'Gagal mengambil item' });
    }
    const item = existing?.data || existing;
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });

    const validation = validateExplorerPayload(payload);
    if (!validation.valid) {
      return res.status(400).json({ message: 'Data tidak valid.', errors: validation.errors });
    }

    if (payload.slug || payload.name || item?.name) {
      payload.slug = await resolveUniqueSlug(payload.slug || payload.name || item?.name, id);
    }

    let oldThumbnailPath = null;
    if (payload.thumbnail && item.thumbnail && payload.thumbnail !== item.thumbnail) {
      oldThumbnailPath = getStoragePathFromUrl(item.thumbnail);
    }

    const { data, error } = await supabase.from('explorer_songkets').update(payload).eq('id', id).select();
    if (error) {
      console.error('[Explorer Update] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal memperbarui data' });
    }

    if (oldThumbnailPath) {
      const removeError = await removeStorageFiles([oldThumbnailPath]);
      if (removeError) console.warn('[Explorer Update] Failed to remove old thumbnail:', removeError.message || removeError);
    }

    res.json(data?.[0] || null);
  } catch (err) {
    console.error('[Explorer Update] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin delete (prevent deletion of built-in songkets)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { data: existing, error: fetchError } = await supabase.from('explorer_songkets').select('*').eq('id', id).maybeSingle();
    if (fetchError) {
      console.error('[Explorer Delete] Fetch error:', fetchError);
      return res.status(500).json({ message: 'Gagal mengambil item' });
    }
    const item = existing?.data || existing;
    if (!item) return res.status(404).json({ message: 'Item tidak ditemukan' });
    if (item.is_builtin) return res.status(403).json({ message: 'Item bawaan tidak boleh dihapus.' });

    // delete thumbnail if exists
    try {
      if (item.thumbnail) {
        const thumbPath = getStoragePathFromUrl(item.thumbnail);
        if (thumbPath) await supabase.storage.from('dataset').remove([thumbPath]);
      }
    } catch (remErr) {
      console.warn('[Explorer Delete] Failed to remove thumbnail:', remErr.message || remErr);
    }

    // delete gallery images from storage and DB
    try {
      const { data: images, error: imgErr } = await supabase.from('explorer_songket_images').select('id,image_url').eq('explorer_songket_id', id);
      if (imgErr) throw imgErr;
      const paths = images.map((g) => getStoragePathFromUrl(g.image_url)).filter(Boolean);
      if (paths.length > 0) {
        const { error: removeErr } = await supabase.storage.from('dataset').remove(paths);
        if (removeErr) console.warn('[Explorer Delete] Some storage removals failed:', removeErr.message || removeErr);
      }
      // delete gallery rows
      const { error: delGalleryErr } = await supabase.from('explorer_songket_images').delete().eq('explorer_songket_id', id);
      if (delGalleryErr) console.warn('[Explorer Delete] Failed to delete gallery rows:', delGalleryErr.message || delGalleryErr);
    } catch (err) {
      console.warn('[Explorer Delete] Failed while cleaning gallery:', err.message || err);
    }

    const { error } = await supabase.from('explorer_songkets').delete().eq('id', id);
    if (error) {
      console.error('[Explorer Delete] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal menghapus item' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Explorer Delete] Route error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

async function uploadGalleryFiles(files, songketId, startOrder) {
  const uploaded = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const { publicUrl } = await uploadSupabaseFile(file, `${GALLERY_FOLDER}/${songketId}`);

    uploaded.push({
      explorer_songket_id: songketId,
      image_url: publicUrl,
      image_order: startOrder + index + 1,
    });
  }
  return uploaded;
}

// Admin: add gallery images to specific songket
router.post('/:id/gallery', adminAuth, runMulter(upload.array('images', 20)), async (req, res) => {
  try {
    const songketId = req.params.id;
    if (!songketId) return res.status(400).json({ message: 'ID songket diperlukan' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Images required' });

    const { data: existingOrder, error: orderError } = await supabase
      .from('explorer_songket_images')
      .select('image_order')
      .eq('explorer_songket_id', songketId)
      .order('image_order', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('[Explorer Gallery Order] Supabase error:', orderError);
      return res.status(500).json({ message: 'Gagal menentukan urutan gallery' });
    }

    const startOrder = existingOrder?.[0]?.image_order ?? -1;
    const images = await uploadGalleryFiles(req.files, songketId, startOrder);

    const { data, error } = await supabase.from('explorer_songket_images').insert(images).select();
    if (error) {
      console.error('[Explorer Gallery Create] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal menyimpan gallery' });
    }
    res.json(data || []);
  } catch (err) {
    console.error('[Explorer Gallery Create] Route error:', err);
    const message = err.message || 'Gagal mengunggah gallery images';
    res.status(500).json({ message });
  }
});

// Admin: delete gallery image by id
router.delete('/gallery/:imageId', adminAuth, async (req, res) => {
  try {
    const { imageId } = req.params;
    // fetch the row to know storage path
    const { data: existing, error: fetchErr } = await supabase.from('explorer_songket_images').select('*').eq('id', imageId).maybeSingle();
    if (fetchErr) {
      console.error('[Explorer Gallery Delete] Fetch error:', fetchErr);
      return res.status(500).json({ message: 'Gagal mengambil gallery image' });
    }
    const row = existing?.data || existing;
    if (!row) return res.status(404).json({ message: 'Image not found' });

    try {
      const storagePath = getStoragePathFromUrl(row.image_url);
      if (storagePath) {
        const { error: removeErr } = await supabase.storage.from('dataset').remove([storagePath]);
        if (removeErr) console.warn('[Explorer Gallery Delete] Storage remove error:', removeErr.message || removeErr);
      }
    } catch (remErr) {
      console.warn('[Explorer Gallery Delete] Failed to remove storage file:', remErr.message || remErr);
    }

    const { error } = await supabase.from('explorer_songket_images').delete().eq('id', imageId);
    if (error) {
      console.error('[Explorer Gallery Delete] Supabase error:', error);
      return res.status(500).json({ message: 'Gagal menghapus gallery image' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Explorer Gallery Delete] Route error:', err);
    res.status(500).json({ message: 'Gagal menghapus gallery image' });
  }
});

// Admin: reorder gallery images
router.put('/gallery/reorder', adminAuth, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ message: 'Order harus array' });

    const updates = await Promise.all(order.map((item, index) => {
      return supabase.from('explorer_songket_images').update({ image_order: index }).eq('id', item.id);
    }));

    const errors = updates.filter((result) => result.error).map((result) => result.error);
    if (errors.length) {
      console.error('[Explorer Gallery Reorder] Errors:', errors);
      return res.status(500).json({ message: 'Gagal menyusun ulang gallery' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Explorer Gallery Reorder] Route error:', err);
    res.status(500).json({ message: 'Gagal menyusun ulang gallery' });
  }
});

module.exports = router;
