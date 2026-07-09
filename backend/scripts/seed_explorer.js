require('dotenv').config();
const supabase = require('../src/services/supabaseClient');

async function ensureSongket(entry) {
  try {
    const { data: existing, error: selectErr } = await supabase.from('explorer_songkets').select('id').eq('name', entry.name).maybeSingle();
    if (selectErr) {
      console.warn('Select warning for', entry.name, selectErr.message || selectErr);
    }
    if (existing) {
      console.log('Already exists:', entry.name);
      return { inserted: false };
    }

    const { data, error } = await supabase.from('explorer_songkets').insert([entry]).select();
    if (error) {
      console.error('Insert failed for', entry.name, error.message || error);
      return { inserted: false, error };
    }
    console.log('Inserted:', entry.name);
    return { inserted: true, id: data?.[0]?.id };
  } catch (err) {
    console.error('Unexpected error for', entry.name, err);
    return { inserted: false, error: err };
  }
}

async function run() {
  const builtins = [
    {
      name: 'Songket Tabur',
      slug: 'songket-tabur',
      category: 'Tabur',
      origin: 'Palembang',
      history: 'Songket Tabur berkembang sebagai salah satu variasi songket yang memiliki susunan motif kecil tersebar merata di seluruh permukaan kain. Nama "Tabur" berasal dari bentuk penyebaran ornamen yang tampak seperti ditaburkan pada kain. Jenis songket ini menjadi pilihan masyarakat karena memiliki tampilan yang lebih ringan dibandingkan Songket Lepus, namun tetap mempertahankan keindahan benang emas khas Palembang. Songket Tabur banyak digunakan pada acara adat maupun kegiatan budaya.',
      philosophy: 'Melambangkan keindahan tersebar dan keseimbangan estetika.',
      characteristic: 'Motif kecil tersebar merata di seluruh kain, tampilan lebih ringan namun elegan.',
      gallery_description: 'Galeri menampilkan variasi motif Tabur dari koleksi sejarah.',
      thumbnail: null,
      published: true,
      is_builtin: true
    },
    {
      name: 'Songket Lepus',
      slug: 'songket-lepus',
      category: 'Lepus',
      origin: 'Palembang',
      history: 'Songket Lepus dikenal sebagai jenis songket paling mewah di Palembang. Nama "Lepus" berarti seluruh permukaan kain hampir tertutup oleh benang emas sehingga menghasilkan tampilan yang berkilau dan megah. Proses pembuatannya membutuhkan waktu yang sangat lama karena hampir seluruh kain ditenun menggunakan benang emas. Pada masa Kesultanan Palembang, Songket Lepus hanya boleh dikenakan oleh keluarga kerajaan dan bangsawan sebagai lambang kekuasaan, kemakmuran, dan kehormatan.',
      philosophy: 'Simbol kemewahan, kemuliaan, dan status tinggi.',
      characteristic: 'Permukaan hampir seluruhnya ditutup benang emas; tampilan sangat berkilau.',
      gallery_description: 'Galeri memperlihatkan contoh Lepus penuh ornamen emas.',
      thumbnail: null,
      published: true,
      is_builtin: true
    },
    {
      name: 'Songket Limar',
      slug: 'songket-limar',
      category: 'Limar',
      origin: 'Palembang',
      history: 'Songket Limar merupakan salah satu jenis Songket Palembang yang telah dikenal sejak masa Kesultanan Palembang Darussalam pada abad ke-18. Nama "Limar" berasal dari teknik pewarnaan benang sutra yang menghasilkan gradasi warna sebelum proses penenunan dilakukan. Dahulu, kain ini hanya dikenakan oleh keluarga kesultanan dan kaum bangsawan sebagai simbol kemewahan, kehormatan, serta kedudukan sosial yang tinggi. Hingga saat ini, Songket Limar tetap menjadi salah satu warisan budaya Palembang yang sering digunakan dalam upacara adat dan acara resmi.',
      philosophy: 'Melambangkan gradasi warna dan kebangsawanan.',
      characteristic: 'Teknik pewarnaan gradasi pada benang sutra; motif elegan.',
      gallery_description: 'Galeri menampilkan Ragam Limar dari koleksi.',
      thumbnail: null,
      published: true,
      is_builtin: true
    },
    {
      name: 'Songket Polos',
      slug: 'songket-polos',
      category: 'Polos',
      origin: 'Palembang',
      history: 'Songket Polos merupakan jenis songket dengan tampilan yang lebih sederhana dibandingkan jenis songket lainnya. Meskipun memiliki sedikit ornamen benang emas, Songket Polos tetap mempertahankan kualitas tenunan sutra khas Palembang. Jenis ini berkembang sebagai pilihan masyarakat yang menginginkan kain tradisional dengan desain yang lebih sederhana namun tetap elegan. Hingga kini Songket Polos masih digunakan sebagai busana adat maupun pakaian resmi pada berbagai kegiatan budaya.',
      philosophy: 'Melambangkan kesederhanaan yang anggun dan kebersahajaan budaya.',
      characteristic: 'Tampilan minimalis dengan sedikit ornamen, menonjolkan kualitas tenunan.',
      gallery_description: 'Galeri menampilkan contoh Songket Polos dari koleksi.',
      thumbnail: null,
      published: true,
      is_builtin: true
    },
    {
      name: 'Songket Rakam',
      slug: 'songket-rakam',
      category: 'Rakam',
      origin: 'Palembang',
      history: 'Songket Rakam berkembang pada masa Kesultanan Palembang sebagai salah satu kain tenun mewah yang dibuat dengan teknik penyisipan benang emas secara rapat sehingga menghasilkan motif yang kaya akan detail. Kata "Rakam" mengacu pada proses menghias kain dengan pola-pola yang rumit. Songket ini dahulu menjadi busana kebesaran keluarga kerajaan dan sering digunakan pada upacara adat, pernikahan, serta berbagai acara penting yang menunjukkan kemuliaan dan kemakmuran.',
      philosophy: 'Melambangkan kehalusan detail dan kemegahan pola.',
      characteristic: 'Motif rapat dengan detail tinggi, sering digunakan untuk upacara resmi.',
      gallery_description: 'Galeri menampilkan motif Rakam yang rinci dan kaya ornamen.',
      thumbnail: null,
      published: true,
      is_builtin: true
    },
    {
      name: 'Songket Seler',
      slug: 'songket-seler',
      category: 'Seler',
      origin: 'Palembang',
      history: 'Songket Seler merupakan salah satu jenis Songket Palembang yang dikenal melalui susunan motif memanjang menyerupai garis-garis vertikal pada permukaan kain. Nama "Seler" mengacu pada bentuk pola yang tersusun sejajar mengikuti arah tenunan. Songket ini berkembang sebagai busana adat yang memberikan kesan anggun, rapi, dan elegan sehingga sering digunakan dalam berbagai acara resmi, penyambutan tamu kehormatan, hingga kegiatan adat masyarakat Palembang.',
      philosophy: 'Melambangkan keteraturan dan kesopanan dalam motif vertikal.',
      characteristic: 'Motif memanjang sejajar mengikuti arah tenunan; kesan rapi dan anggun.',
      gallery_description: 'Galeri menampilkan varian Seler yang dominan vertikal.',
      thumbnail: null,
      published: true,
      is_builtin: true
    }
  ];

  for (const item of builtins) {
    // set timestamps
    item.created_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    const res = await ensureSongket(item);
    // small delay to avoid overwhelming the API
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('Seeding complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
