const normalizeSongketName = (name) => {
  if (!name) return '';
  return name.toString().trim().replace(/^songket\s*/i, '').toLowerCase();
};

export const songketInformation = {
  'Songket Tabur': {
    sejarah:
      'Songket Tabur merupakan salah satu motif Songket Palembang yang telah dikenal sejak masa Kesultanan Palembang Darussalam. Motif ini memiliki ciri khas berupa hiasan kecil yang tersebar merata di seluruh permukaan kain sehingga menyerupai taburan bunga atau bintang. Pada masa lalu, Songket Tabur banyak dikenakan oleh kalangan bangsawan dalam berbagai upacara adat sebagai lambang kemakmuran, keindahan, dan keberkahan. Seiring perkembangan zaman, motif ini tetap dilestarikan oleh para pengrajin dan menjadi salah satu jenis songket yang paling populer karena tampilannya yang sederhana namun tetap elegan.',
    acara: [
      'Pernikahan adat Palembang',
      'Penyambutan tamu kehormatan',
      'Festival budaya',
      'Acara resmi daerah',
      'Pagelaran seni tradisional'
    ],
    digunakanOleh: ['Pengantin wanita', 'Pengantin pria', 'Tokoh adat', 'Penari tradisional', 'Masyarakat Palembang'],
    filosofi:
      'Motif Tabur melambangkan keberkahan, harapan akan rezeki yang melimpah, serta kehidupan yang harmonis.'
  },
  'Songket Lepus': {
    sejarah:
      'Songket Lepus merupakan salah satu songket paling mewah dari Palembang karena hampir seluruh permukaan kainnya dipenuhi benang emas. Pada masa Kesultanan Palembang, kain ini hanya dikenakan oleh sultan, keluarga kerajaan, dan kalangan bangsawan sebagai simbol kehormatan, kekuasaan, serta kemakmuran. Proses pembuatannya membutuhkan ketelitian dan waktu yang lama sehingga nilainya sangat tinggi. Hingga saat ini, Songket Lepus tetap menjadi salah satu warisan budaya Palembang yang sering digunakan pada acara-acara adat dan upacara resmi.',
    acara: ['Pernikahan adat', 'Penobatan adat', 'Penyambutan pejabat', 'Festival budaya', 'Acara kenegaraan'],
    digunakanOleh: ['Sultan', 'Bangsawan', 'Pengantin', 'Tokoh adat'],
    filosofi: 'Melambangkan kemuliaan, kehormatan, kejayaan, dan kemakmuran.'
  },
  'Songket Limar': {
    sejarah:
      'Songket Limar dikenal sebagai salah satu jenis Songket Palembang yang memiliki perpaduan warna lembut dengan teknik pewarnaan khas sehingga menghasilkan gradasi yang indah. Motif ini berkembang sebagai kain yang dapat digunakan dalam berbagai kesempatan tanpa mengurangi nilai budaya yang dimilikinya. Keindahan perpaduan warna dan motif menjadikan Songket Limar banyak diminati oleh masyarakat Palembang hingga sekarang. Selain memiliki nilai estetika yang tinggi, songket ini juga mencerminkan kreativitas para pengrajin dalam mengembangkan seni tenun tradisional.',
    acara: ['Pernikahan', 'Acara keluarga', 'Festival budaya', 'Penyambutan tamu'],
    digunakanOleh: ['Masyarakat umum', 'Pengantin', 'Penari tradisional', 'Perempuan Palembang'],
    filosofi:
      'Melambangkan keharmonisan, kelembutan, keseimbangan, dan keindahan hidup.'
  },
  'Songket Polos': {
    sejarah:
      'Songket Polos merupakan jenis songket yang memiliki motif lebih sederhana dibandingkan motif Songket Palembang lainnya. Kesederhanaan tersebut justru menjadi daya tarik karena mampu menampilkan keanggunan kain tanpa ornamen yang terlalu padat. Sejak dahulu, Songket Polos sering digunakan sebagai busana adat maupun pakaian resmi masyarakat Palembang. Hingga kini, motif ini masih dipertahankan sebagai bagian dari warisan budaya karena mencerminkan kesederhanaan yang tetap elegan dan berkelas.',
    acara: ['Acara keluarga', 'Kegiatan adat', 'Busana resmi', 'Festival budaya'],
    digunakanOleh: ['Masyarakat umum', 'Tokoh adat', 'Penari', 'Pelajar seni budaya'],
    filosofi:
      'Melambangkan kesederhanaan, ketulusan, dan keanggunan dalam kehidupan.'
  },
  'Songket Rakam': {
    sejarah:
      'Songket Rakam merupakan salah satu motif Songket Palembang yang dibuat menggunakan teknik menyisipkan benang emas atau perak secara teliti sehingga membentuk motif yang rumit dan indah. Proses pembuatannya membutuhkan keterampilan tinggi serta ketekunan para pengrajin karena setiap detail motif dikerjakan secara manual. Sejak masa Kesultanan Palembang, Songket Rakam menjadi simbol keahlian seni tenun masyarakat Palembang dan hingga kini tetap dilestarikan sebagai salah satu warisan budaya yang bernilai tinggi.',
    acara: ['Pernikahan adat', 'Festival budaya', 'Pertunjukan seni', 'Acara resmi'],
    digunakanOleh: ['Pengantin', 'Penari tradisional', 'Tokoh adat', 'Masyarakat Palembang'],
    filosofi:
      'Melambangkan ketelitian, kesabaran, kreativitas, dan nilai seni yang tinggi.'
  },
  'Songket Seler': {
    sejarah:
      'Songket Seler merupakan salah satu motif khas Songket Palembang yang memiliki susunan motif besar dan tersusun rapi sehingga memberikan kesan megah dan elegan. Motif ini berkembang sebagai kain yang banyak digunakan dalam berbagai kegiatan adat maupun acara resmi karena tampilannya yang mewah namun tetap anggun. Keindahan motif yang simetris menunjukkan tingginya kemampuan para pengrajin Palembang dalam menghasilkan karya tenun berkualitas. Hingga sekarang, Songket Seler masih menjadi salah satu pilihan utama dalam pelestarian budaya dan busana adat Palembang.',
    acara: ['Pernikahan adat', 'Penyambutan tamu kehormatan', 'Festival budaya', 'Acara resmi pemerintahan', 'Pagelaran seni'],
    digunakanOleh: ['Pengantin', 'Tokoh adat', 'Penari tradisional', 'Masyarakat Palembang', 'Tamu kehormatan'],
    filosofi:
      'Melambangkan kewibawaan, kehormatan, kemakmuran, dan keindahan budaya Palembang.'
  }
};

const normalizedSongketInformation = Object.fromEntries(
  Object.entries(songketInformation).map(([name, value]) => [normalizeSongketName(name), value])
);

export const getSongketInformation = (songketName) => {
  if (!songketName) return null;
  const normalized = normalizeSongketName(songketName);
  return songketInformation[songketName] || normalizedSongketInformation[normalized] || null;
};
