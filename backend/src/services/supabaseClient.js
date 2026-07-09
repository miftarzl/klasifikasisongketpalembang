const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;

const keyCandidates = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_KEY,
  process.env.SUPABASE_ANON_KEY,
];
const supabaseKey = keyCandidates.find(Boolean);

let keyType = 'UNKNOWN';
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  keyType = 'SERVICE_ROLE';
} else if (process.env.SUPABASE_KEY) {
  keyType = 'PUBLIC';
} else if (process.env.SUPABASE_ANON_KEY) {
  keyType = 'ANON';
}

const createErrorResponse = (message) => ({ data: null, error: new Error(message) });

const createStubQuery = () => {
  const stub = {
    select: () => stub,
    eq: () => stub,
    maybeSingle: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    single: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    insert: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    update: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    delete: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    upsert: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    order: () => stub,
    limit: () => stub,
  };
  return stub;
};

const createStubStorage = () => ({
  from: () => ({
    upload: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    download: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    remove: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
    list: async () => createErrorResponse('Supabase tidak terkonfigurasi'),
  }),
});

let supabase;
const isDev = process.env.NODE_ENV !== 'production';
if (!supabaseUrl || !supabaseKey) {
  if (isDev) {
    console.warn('================================');
    console.warn('SUPABASE ENV WARNING: Supabase belum dikonfigurasi. Hanya fallback login lokal akan aktif.');
    console.warn('SUPABASE_URL:', supabaseUrl);
    console.warn('SUPABASE_KEY:', supabaseKey ? '[MASKED]' : 'MISSING');
    console.warn('================================');
  }

  supabase = {
    from: () => createStubQuery(),
    storage: createStubStorage(),
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  if (isDev) {
    console.log('================================');
    console.log('SUPABASE CONNECTED');
    console.log('URL:', supabaseUrl);
    console.log('KEY TYPE:', keyType);
    console.log('================================');
  }
}

module.exports = supabase;
