-- Seed explorer songkets (safe to run multiple times). Run in Supabase SQL editor or via psql.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Tabur') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Tabur', 'songket-tabur', 'Tabur', 'Palembang',
      'Songket Tabur berkembang sebagai salah satu variasi songket yang memiliki susunan motif kecil tersebar merata di seluruh permukaan kain. Nama "Tabur" berasal dari bentuk penyebaran ornamen yang tampak seperti ditaburkan pada kain. Jenis songket ini menjadi pilihan masyarakat karena memiliki tampilan yang lebih ringan dibandingkan Songket Lepus, namun tetap mempertahankan keindahan benang emas khas Palembang. Songket Tabur banyak digunakan pada acara adat maupun kegiatan budaya.',
      'Melambangkan keindahan tersebar dan keseimbangan estetika.',
      'Motif kecil tersebar merata di seluruh kain, tampilan lebih ringan namun elegan.',
      'Galeri menampilkan variasi motif Tabur dari koleksi sejarah.',
      NULL, true, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Lepus') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Lepus', 'songket-lepus', 'Lepus', 'Palembang',
      'Songket Lepus dikenal sebagai jenis songket paling mewah di Palembang. Nama "Lepus" berarti seluruh permukaan kain hampir tertutup oleh benang emas sehingga menghasilkan tampilan yang berkilau dan megah. Proses pembuatannya membutuhkan waktu yang sangat lama karena hampir seluruh kain ditenun menggunakan benang emas. Pada masa Kesultanan Palembang, Songket Lepus hanya boleh dikenakan oleh keluarga kerajaan dan bangsawan sebagai lambang kekuasaan, kemakmuran, dan kehormatan.',
      'Simbol kemewahan, kemuliaan, dan status tinggi.',
      'Permukaan hampir seluruhnya ditutup benang emas; tampilan sangat berkilau.',
      'Galeri memperlihatkan contoh Lepus penuh ornamen emas.',
      NULL, true, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Limar') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Limar', 'songket-limar', 'Limar', 'Palembang',
      'Songket Limar merupakan salah satu jenis Songket Palembang yang telah dikenal sejak masa Kesultanan Palembang Darussalam pada abad ke-18. Nama "Limar" berasal dari teknik pewarnaan benang sutra yang menghasilkan gradasi warna sebelum proses penenunan dilakukan. Dahulu, kain ini hanya dikenakan oleh keluarga kesultanan dan kaum bangsawan sebagai simbol kemewahan, kehormatan, serta kedudukan sosial yang tinggi. Hingga saat ini, Songket Limar tetap menjadi salah satu warisan budaya Palembang yang sering digunakan dalam upacara adat dan acara resmi.',
      'Melambangkan gradasi warna dan kebangsawanan.',
      'Teknik pewarnaan gradasi pada benang sutra; motif elegan.',
      'Galeri menampilkan Ragam Limar dari koleksi.',
      NULL, true, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Polos') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Polos', 'songket-polos', 'Polos', 'Palembang',
      'Songket Polos merupakan jenis songket dengan tampilan yang lebih sederhana dibandingkan jenis songket lainnya. Meskipun memiliki sedikit ornamen benang emas, Songket Polos tetap mempertahankan kualitas tenunan sutra khas Palembang. Jenis ini berkembang sebagai pilihan masyarakat yang menginginkan kain tradisional dengan desain yang lebih sederhana namun tetap elegan. Hingga kini Songket Polos masih digunakan sebagai busana adat maupun pakaian resmi pada berbagai kegiatan budaya.',
      'Melambangkan kesederhanaan yang anggun dan kebersahajaan budaya.',
      'Tampilan minimalis dengan sedikit ornamen, menonjolkan kualitas tenunan.',
      'Galeri menampilkan contoh Songket Polos dari koleksi.',
      NULL, true, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Rakam') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Rakam', 'songket-rakam', 'Rakam', 'Palembang',
      'Songket Rakam berkembang pada masa Kesultanan Palembang sebagai salah satu kain tenun mewah yang dibuat dengan teknik penyisipan benang emas secara rapat sehingga menghasilkan motif yang kaya akan detail. Kata "Rakam" mengacu pada proses menghias kain dengan pola-pola yang rumit. Songket ini dahulu menjadi busana kebesaran keluarga kerajaan dan sering digunakan pada upacara adat, pernikahan, serta berbagai acara penting yang menunjukkan kemuliaan dan kemakmuran.',
      'Melambangkan kehalusan detail dan kemegahan pola.',
      'Motif rapat dengan detail tinggi, sering digunakan untuk upacara resmi.',
      'Galeri menampilkan motif Rakam yang rinci dan kaya ornamen.',
      NULL, true, true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM explorer_songkets WHERE name = 'Songket Seler') THEN
    INSERT INTO explorer_songkets (name, slug, category, origin, history, philosophy, characteristic, gallery_description, thumbnail, published, is_builtin)
    VALUES (
      'Songket Seler', 'songket-seler', 'Seler', 'Palembang',
      'Songket Seler merupakan salah satu jenis Songket Palembang yang dikenal melalui susunan motif memanjang menyerupai garis-garis vertikal pada permukaan kain. Nama "Seler" mengacu pada bentuk pola yang tersusun sejajar mengikuti arah tenunan. Songket ini berkembang sebagai busana adat yang memberikan kesan anggun, rapi, dan elegan sehingga sering digunakan dalam berbagai acara resmi, penyambutan tamu kehormatan, hingga kegiatan adat masyarakat Palembang.',
      'Melambangkan keteraturan dan kesopanan dalam motif vertikal.',
      'Motif memanjang sejajar mengikuti arah tenunan; kesan rapi dan anggun.',
      'Galeri menampilkan varian Seler yang dominan vertikal.',
      NULL, true, true
    );
  END IF;
END$$;

-- End seed
