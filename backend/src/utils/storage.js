const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabaseClient');

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatStorageError(error) {
  const message = error?.message ? String(error.message).toLowerCase() : String(error || '');
  if (message.includes('bucket')) {
    return 'Bucket dataset tidak ditemukan.';
  }
  if (message.includes('file too large') || message.includes('limit') || message.includes('maximum size')) {
    return 'Ukuran file melebihi batas maksimum.';
  }
  return 'Upload gagal ke Supabase Storage.';
}

function getUniqueFileName(originalname) {
  const extension = path.extname(originalname).toLowerCase() || '.png';
  const baseName = path.basename(originalname, extension).replace(/[^a-zA-Z0-9-_\.]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || uuidv4();
  return `${baseName}-${Date.now()}${extension}`;
}

async function uploadSupabaseFile(file, folder) {
  if (!file || !file.buffer) {
    throw new Error('File tidak valid untuk upload.');
  }

  const uniqueFileName = getUniqueFileName(file.originalname || file.filename || 'upload.png');
  const storagePath = `${folder}/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage
    .from('dataset')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(formatStorageError(uploadError));
  }

  const { data: urlData, error: urlError } = supabase.storage.from('dataset').getPublicUrl(storagePath);
  if (urlError || !urlData?.publicUrl) {
    throw new Error(formatStorageError(urlError || 'Gagal mendapatkan public URL.'));
  }

  return {
    publicUrl: urlData.publicUrl,
    storagePath,
  };
}

async function removeStorageFiles(paths) {
  if (!paths || paths.length === 0) return null;
  const { error } = await supabase.storage.from('dataset').remove(paths);
  return error;
}

function getStoragePathFromUrl(publicUrl) {
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const bucketIndex = parts.indexOf('dataset');
    if (bucketIndex !== -1 && bucketIndex + 1 < parts.length) {
      return parts.slice(bucketIndex + 1).join('/');
    }
    const publicIndex = parts.indexOf('public');
    if (publicIndex !== -1 && parts[publicIndex + 1] === 'dataset') {
      return parts.slice(publicIndex + 2).join('/');
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE,
  uploadSupabaseFile,
  removeStorageFiles,
  getStoragePathFromUrl,
};
