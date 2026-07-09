/**
 * Songket Details Database - Palembang
 * Data repository for the Songket Explorer and detail pages.
 * Uses stable public image paths so images load consistently.
 */

const normalizeSongketName = (name) => {
  if (!name) return '';
  return name.toString().trim().toLowerCase().replace(/\s+/g, ' ');
};

const buildSlug = (name) => normalizeSongketName(name).replace(/\s+/g, '-');

const buildImagePath = (slug) => `/images/songket/${slug.toString().replace(/^songket-/, '')}.svg`;

export const songketDetails = {
  "SONGKET LIMAR": {
    id: 1,
    history: "Songket Limar merupakan salah satu jenis Songket Palembang yang telah dikenal sejak masa Kesultanan Palembang Darussalam pada abad ke-18. Nama 'Limar' berasal dari teknik pewarnaan benang sutra yang menghasilkan gradasi warna sebelum proses penenunan dilakukan. Dahulu, kain ini hanya dikenakan oleh keluarga kesultanan dan kaum bangsawan sebagai simbol kemewahan, kehormatan, serta kedudukan sosial yang tinggi. Hingga saat ini, Songket Limar tetap menjadi salah satu warisan budaya Palembang yang sering digunakan dalam upacara adat dan acara resmi.",
    history_en: "Songket Limar is one of the Palembang Songket types known since the Palembang Darussalam Sultanate in the 18th century. The name 'Limar' comes from the thread-dyeing technique that produces gradient colors before weaving. Historically, this cloth was only worn by royal families and nobles as a symbol of luxury, honor, and high social status. Today, Songket Limar remains a cultural heritage often used in traditional ceremonies and official events.",
    characteristics: "Corak Songket Limar menampilkan gradasi warna halus yang menjadi latar bagi ornamen emas yang elegan dan teratur.",
    characteristics_en: "The Limar motif presents subtle color gradients as a backdrop for elegant, orderly gold ornamentation.",
    philosophy: "Melambangkan kemewahan, kehormatan, dan status sosial, sekaligus kecanggihan seni tenun Palembang.",
    philosophy_en: "It symbolizes luxury, honor, social status, and the sophistication of Palembang weaving art.",
    usage: "Biasanya digunakan pada upacara adat, pesta kebesaran, dan acara formal keluarga kerajaan.",
    usage_en: "It is usually used at traditional ceremonies, royal celebrations, and formal events.",
    origin: "Kesultanan Palembang Darussalam",
    keywords: ["limar", "gradasi", "sutra", "bangsawan", "kemewahan"],
    gallery: [
      buildImagePath('songket-limar'),
      buildImagePath('songket-limar'),
      buildImagePath('songket-limar')
    ]
  },
  "SONGKET RAKAM": {
    id: 2,
    history: "Songket Rakam berkembang pada masa Kesultanan Palembang sebagai salah satu kain tenun mewah yang dibuat dengan teknik penyisipan benang emas secara rapat sehingga menghasilkan motif yang kaya akan detail. Kata 'Rakam' mengacu pada proses menghias kain dengan pola-pola yang rumit. Songket ini dahulu menjadi busana kebesaran keluarga kerajaan dan sering digunakan pada upacara adat, pernikahan, serta berbagai acara penting yang menunjukkan kemuliaan dan kemakmuran.",
    history_en: "Songket Rakam developed during the Palembang Sultanate as a luxurious woven cloth created with tightly inserted gold threads that produce richly detailed motifs. The word 'Rakam' refers to the process of decorating the fabric with intricate patterns. This songket was once royal attire and often used in traditional ceremonies, weddings, and important events symbolizing glory and prosperity.",
    characteristics: "Motif Songket Rakam menonjolkan hiasan emas rapat dengan pola rumit yang menunjukkan kemegahan dan detail tinggi.",
    characteristics_en: "The Rakam motif emphasizes dense gold decoration with intricate patterns that represent grandeur and high detail.",
    philosophy: "Melambangkan kemuliaan, kemakmuran, dan status sosial tinggi keluarga kerajaan.",
    philosophy_en: "It symbolizes nobility, prosperity, and the high social status of the royal family.",
    usage: "Tradisional digunakan dalam upacara adat, pernikahan kerajaan, dan acara pemerintahan penting.",
    usage_en: "Traditionally used in ceremonies, royal weddings, and important governmental events.",
    origin: "Istana dan keluarga bangsawan Palembang",
    keywords: ["rakam", "emas", "kerajaan", "motif rumit", "upacara"],
    gallery: [
      buildImagePath('songket-rakam'),
      buildImagePath('songket-rakam'),
      buildImagePath('songket-rakam')
    ]
  },
  "SONGKET POLOS": {
    id: 3,
    history: "Songket Polos merupakan jenis songket dengan tampilan yang lebih sederhana dibandingkan jenis songket lainnya. Meskipun memiliki sedikit ornamen benang emas, Songket Polos tetap mempertahankan kualitas tenunan sutra khas Palembang. Jenis ini berkembang sebagai pilihan masyarakat yang menginginkan kain tradisional dengan desain yang lebih sederhana namun tetap elegan. Hingga kini Songket Polos masih digunakan sebagai busana adat maupun pakaian resmi pada berbagai kegiatan budaya.",
    history_en: "Songket Polos is a songket type with a simpler appearance compared to other songkets. Although it has minimal gold thread ornamentation, Songket Polos retains the high-quality silk weaving typical of Palembang. This type developed as a choice for people who wanted traditional cloth with a more modest design while remaining elegant. Today, Songket Polos is still used as traditional attire and formal clothing at cultural events.",
    characteristics: "Desain Songket Polos menonjolkan kain tenun halus dengan detail minimal namun tetap anggun.",
    characteristics_en: "The Polos design showcases fine woven cloth with minimal details while remaining graceful.",
    philosophy: "Melambangkan kesederhanaan yang elegan, kehormatan, dan keindahan budaya yang tidak berlebihan.",
    philosophy_en: "It symbolizes elegant simplicity, dignity, and understated cultural beauty.",
    usage: "Sering dipakai sebagai busana adat yang lebih sederhana dalam acara budaya dan upacara resmi.",
    usage_en: "Often worn as simpler traditional attire at cultural events and formal ceremonies.",
    origin: "Masyarakat umum Palembang",
    keywords: ["polos", "sederhana", "elegan", "sutra", "busana adat"],
    gallery: [
      buildImagePath('songket-polos'),
      buildImagePath('songket-polos'),
      buildImagePath('songket-polos')
    ]
  },
  "SONGKET LEPUS": {
    id: 4,
    history: "Songket Lepus dikenal sebagai jenis songket paling mewah di Palembang. Nama 'Lepus' berarti seluruh permukaan kain hampir tertutup oleh benang emas sehingga menghasilkan tampilan yang berkilau dan megah. Proses pembuatannya membutuhkan waktu yang sangat lama karena hampir seluruh kain ditenun menggunakan benang emas. Pada masa Kesultanan Palembang, Songket Lepus hanya boleh dikenakan oleh keluarga kerajaan dan bangsawan sebagai lambang kekuasaan, kemakmuran, dan kehormatan.",
    history_en: "Songket Lepus is known as the most luxurious songket type in Palembang. The name 'Lepus' means the entire cloth surface is almost covered with gold thread, creating a glittering and majestic appearance. Its production takes a long time because nearly the whole cloth is woven with gold thread. During the Palembang Sultanate, Songket Lepus could only be worn by the royal family and nobles as a symbol of power, prosperity, and honor.",
    characteristics: "Corak Songket Lepus menutup hampir seluruh kain dengan benang emas yang berkilau, menciptakan kesan megah dan berwibawa.",
    characteristics_en: "The Lepus motif covers almost the entire cloth with shimmering gold thread, creating a majestic and authoritative impression.",
    philosophy: "Melambangkan kekuasaan, kemakmuran, dan kehormatan yang tertinggi dalam tradisi kerajaan.",
    philosophy_en: "It symbolizes supreme power, prosperity, and honor in royal tradition.",
    usage: "Dulunya dipakai oleh keluarga kerajaan dan bangsawan pada acara kenegaraan dan adat penting.",
    usage_en: "It was once worn by royal family members and nobles at state occasions and important traditional ceremonies.",
    origin: "Istana Kesultanan Palembang",
    keywords: ["lepus", "emas", "megah", "kerajaan", "warisan"],
    gallery: [
      buildImagePath('songket-lepus'),
      buildImagePath('songket-lepus'),
      buildImagePath('songket-lepus')
    ]
  },
  "SONGKET TABUR": {
    id: 5,
    history: "Songket Tabur berkembang sebagai salah satu variasi songket yang memiliki susunan motif kecil tersebar merata di seluruh permukaan kain. Nama 'Tabur' berasal dari bentuk penyebaran ornamen yang tampak seperti ditaburkan pada kain. Jenis songket ini menjadi pilihan masyarakat karena memiliki tampilan yang lebih ringan dibandingkan Songket Lepus, namun tetap mempertahankan keindahan benang emas khas Palembang. Songket Tabur banyak digunakan pada acara adat maupun kegiatan budaya.",
    history_en: "Songket Tabur developed as a songket variation with small motifs scattered evenly across the cloth surface. The name 'Tabur' comes from the appearance of ornaments sprinkled on the fabric. This songket became a popular choice because it has a lighter look than Songket Lepus while still preserving the beauty of Palembang gold thread. Songket Tabur is widely used at traditional ceremonies and cultural activities.",
    characteristics: "Polanya menampilkan ornamen kecil yang tersebar merata dengan efek halus dan elegan.",
    characteristics_en: "Its pattern features small ornaments scattered evenly with a subtle and elegant effect.",
    philosophy: "Melambangkan keseimbangan antara kemegahan dan kesederhanaan dalam seni songket.",
    philosophy_en: "It symbolizes the balance between grandeur and simplicity in songket art.",
    usage: "Sering dipilih untuk acara adat sehari-hari dan kegiatan budaya yang lebih ringan.",
    usage_en: "Often chosen for everyday traditional ceremonies and lighter cultural activities.",
    origin: "Masyarakat Palembang",
    keywords: ["tabur", "tersebar", "ringan", "tradisi", "ornamen"],
    gallery: [
      buildImagePath('songket-tabur'),
      buildImagePath('songket-tabur'),
      buildImagePath('songket-tabur')
    ]
  },
  "SONGKET SELER": {
    id: 6,
    history: "Songket Seler merupakan salah satu jenis Songket Palembang yang dikenal melalui susunan motif memanjang menyerupai garis-garis vertikal pada permukaan kain. Nama 'Seler' mengacu pada bentuk pola yang tersusun sejajar mengikuti arah tenunan. Songket ini berkembang sebagai busana adat yang memberikan kesan anggun, rapi, dan elegan sehingga sering digunakan dalam berbagai acara resmi, penyambutan tamu kehormatan, hingga kegiatan adat masyarakat Palembang.",
    history_en: "Songket Seler is one of the Palembang Songket types known for its elongated motifs resembling vertical lines across the cloth surface. The name 'Seler' refers to the pattern arranged in parallel along the weaving direction. This songket developed as traditional attire that conveys a graceful, neat, and elegant impression, often used in formal events, welcoming honored guests, and traditional Palembang ceremonies.",
    characteristics: "Corak memanjang vertikal menciptakan tampilan anggun dan rapi yang khas.",
    characteristics_en: "The vertical elongated motif creates a distinctive graceful and neat appearance.",
    philosophy: "Melambangkan keanggunan, keteraturan, dan citra resmi dalam tradisi adat.",
    philosophy_en: "It symbolizes elegance, order, and a formal identity in traditional ceremonies.",
    usage: "Biasa digunakan pada acara resmi, penyambutan tamu kehormatan, dan upacara adat.",
    usage_en: "Commonly used at formal events, guest receptions, and traditional ceremonies.",
    origin: "Budaya formal Palembang",
    keywords: ["seler", "vertikal", "anggun", "rapi", "resmi"],
    gallery: [
      buildImagePath('songket-seler'),
      buildImagePath('songket-seler'),
      buildImagePath('songket-seler')
    ]
  }
};

const songketList = Object.entries(songketDetails).map(([name, detail]) => {
  const slug = buildSlug(name);
  return {
    ...detail,
    name,
    slug,
    image: detail.image || buildImagePath(slug),
    gallery: detail.gallery || [buildImagePath(slug)],
    summary: detail.history ? `${detail.history.split('. ')[0]}.` : '',
    category: detail.category || 'Palembang',
    popularityBadge: detail.popularityBadge || 'Terkenal',
    history_id: detail.history,
    characteristics_id: detail.characteristics,
    usage_id: detail.usage,
    keywords: detail.keywords || [slug]
  };
});

const slugSongketMap = Object.fromEntries(songketList.map((item) => [item.slug, item]));

export { songketList };

export const getSongketDetailBySlug = (slug) => {
  if (!slug) return null;
  return slugSongketMap[normalizeSongketName(slug.replace(/-/g, ' '))] || null;
};

export const getSongketDetail = (songketName) => {
  if (!songketName) return null;
  const normalizedKey = normalizeSongketName(songketName);
  const shortKey = normalizedKey.replace(/^songket\s+/, '');
  const slugKey = normalizedKey.replace(/\s+/g, '-');

  return (
    songketDetails[songketName] ||
    songketDetails[normalizedKey.toUpperCase()] ||
    songketDetails[shortKey.toUpperCase()] ||
    slugSongketMap[normalizedKey] ||
    slugSongketMap[shortKey] ||
    slugSongketMap[slugKey] ||
    null
  );
};

export const getAllSongketNames = () => Object.keys(songketDetails);

export const isSongketDetailAvailable = (songketName) => {
  if (!songketName) return false;
  const normalizedKey = normalizeSongketName(songketName);
  return normalizedKey in slugSongketMap;
};
