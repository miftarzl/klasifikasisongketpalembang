# Klasifikasi-Songket-Palembang

Satu dokumentasi utama untuk seluruh proyek.

## Ringkasan Proyek

Proyek ini adalah aplikasi klasifikasi songket Sumatera Selatan dengan arsitektur full-stack:
- `frontend/` : aplikasi React + Vite + Tailwind untuk UI pengguna.
- `backend/` : API Express.js untuk otentikasi, upload gambar, dan komunikasi dengan ML service.
- `ml_service/` : layanan FastAPI untuk training model TensorFlow, inferensi gambar, evaluasi, dan heatmap.

## Struktur Utama

- `/frontend` : sumber frontend React.
- `/backend` : sumber API backend Node.js.
- `/ml_service` : layanan machine learning Python.
- `/ml_service/data/train` : dataset training terstruktur menurut label songket.
- `/ml_service/models` : model dan hasil evaluasi tersimpan.
- `/ml_service/heatmaps` : hasil heatmap explainability.

## Fitur Utama

- Klasifikasi gambar songket Sumatera Selatan dengan model TensorFlow.
- Endpoint prediksi dan heatmap untuk visualisasi hasil.
- Endpoint analitik dan histori training.
- Integrasi backend dengan Supabase untuk data dan otentikasi admin.
- UI admin/dashboard untuk manajemen dataset, training, dan prediksi.

## Sejarah Singkat dan Ciri Khas Songket Sumatera Selatan

Songket Sumatera Selatan dikenal sebagai kain tenun tradisional yang kaya makna dan simbol. Enam label utama yang digunakan dalam proyek ini adalah:

1. **Limar**
   - Bahasa Indonesia: Songket Limar sering menampilkan motif geometris berulang dengan latar warna terang, digunakan dalam acara resmi dan adat.
   - English: Limar songket typically features repeated geometric patterns on a bright base, used in formal and ceremonial occasions.

2. **Rakam**
   - Bahasa Indonesia: Songket Rakam menonjolkan motif tumbuhan dan dedaunan, mencerminkan hubungan kuat dengan alam dan upacara tradisional.
   - English: Rakam songket highlights plant and leaf motifs, reflecting a strong connection to nature and traditional ceremonies.

3. **Polos**
   - Bahasa Indonesia: Songket Polos sederhana dan elegan, biasanya digunakan untuk kegiatan sehari-hari atau acara yang tidak terlalu resmi.
   - English: Polos songket is simple and elegant, usually worn for daily activities or less formal events.

4. **Lepus**
   - Bahasa Indonesia: Songket Lepus memiliki motif kembang dan lengkungan yang anggun, melambangkan kemakmuran dan keindahan.
   - English: Lepus songket features graceful floral and arching motifs, symbolizing prosperity and beauty.

5. **Tabur**
   - Bahasa Indonesia: Songket Tabur ditandai oleh taburan motif kecil di seluruh kain, menciptakan efek visual yang halus dan mewah.
   - English: Tabur songket is characterized by scattered small motifs across the fabric, creating a subtle and luxurious visual effect.

6. **Seler**
   - Bahasa Indonesia: Songket Seler sering menggunakan garis warna dan pola berulang yang dinamis, khas untuk tampilan yang lebih modern.
   - English: Seler songket often uses colored stripes and repeating patterns in a dynamic style, typical for a more modern appearance.

## Setup Lingkungan

### 1. Backend

```powershell
cd backend
npm install
copy .env.example .env
```

**Catatan:**
- Frontend akan berjalan di `http://localhost:5173`
- Setiap perubahan file React/CSS akan langsung ter-reload di browser (HMR)
- Proxy API otomatis ke backend di `http://127.0.0.1:5000`
- Pastikan ketiga service (ML, Backend, Frontend) semua berjalan untuk aplikasi berfungsi penuh

Edit `backend/.env` dengan konfigurasi berikut:
- `ML_SERVICE_URL=http://127.0.0.1:8000`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 2. Frontend

```powershell
cd frontend
npm install
```

### 3. ML Service

```powershell
cd ml_service
python -m venv .\venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Menjalankan Aplikasi

1. Jalankan ML service:

```powershell
cd ml_service
.\venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

2. Jalankan backend:

```powershell
cd backend
npm run start
```

3. Jalankan frontend:

```powershell
cd frontend
npm run dev
```

## Endpoint Penting

### ML Service
- `GET /analytics` : statistik prediksi dan ringkasan.
- `GET /training-history` : histori training.
- `GET /evaluation` : hasil evaluasi model.
- `GET /model-metrics` : metrik performa.
- `GET /evaluate` : evaluasi dataset pada model.
- `POST /predict` : prediksi gambar songket.
- `POST /generate-heatmap` : hasil heatmap explainability.

### Backend
- `POST /api/predictions` : upload gambar untuk klasifikasi lewat backend.
- `POST /api/admin/train` : aktifkan training model lewat backend.
- `GET /api/ml/analytics` : data analitik dari ML service.
- `GET /api/ml/training-history` : histori training lewat backend.
- `GET /api/ml/evaluation` : hasil evaluasi lewat backend.

## Aturan Dataset

- Dataset training disimpan di `ml_service/data/train/<label>/`.
- Setiap label songket disimpan dalam folder terpisah.
- Label yang digunakan dalam proyek ini:
  - `Limar`
  - `Rakam`
  - `Polos`
  - `Lepus`
  - `Tabur`
  - `Seler`
- Setiap label harus berisi beberapa gambar representatif agar model dapat belajar pola motif songket.
- Gambar sebaiknya di-crop dan difokuskan pada kain songket untuk mengurangi noise latar.

## Catatan Penting

- Pastikan `ml_service` berjalan sebelum backend atau frontend mengirim permintaan inferensi.
- Backend harus terhubung ke alamat ML service di `.env`.
- `ml_service` memakai FastAPI dan TensorFlow, sehingga model dan data harus bisa diakses dari folder `ml_service`.
- Jika dataset ditambah atau label baru ditambahkan, jalankan ulang training agar model mengenali kelas baru.

## Keterangan Teknis

### Backend
- Express.js dengan middleware untuk CORS, upload file, dan Supabase.
- Menggunakan `axios`, `bcrypt`, `jsonwebtoken`, `multer`, `uuid`.

### Frontend
- Dibangun dengan React + Vite + Tailwind.
- Menggunakan `axios`, `react-router-dom`, `chart.js`, `react-chartjs-2`.

### ML Service
- FastAPI dengan endpoint training, prediksi, evaluasi, dan heatmap.
- Model TensorFlow disimpan di `ml_service/models/model.h5`.
- Hasil evaluasi disimpan di `ml_service/metrics.json` dan `ml_service/training_history.json`.

## Perubahan dan Verifikasi Terakhir
- `frontend/src/services/api.js`: menetapkan `baseURL` deterministik, menghapus runtime probe debug, menjaga interceptor request/response.
- `backend/src/routes/auth.js`: menghapus log sensitif dan membatasi debug hanya ke lingkungan non-production.
- `backend/src/routes/dataset.js`: menambahkan validasi input `label`/`name`, validasi MIME image, penanganan error Supabase lebih baik, dan logging debug non-production.
- `backend/src/services/supabaseClient.js`: hanya menampilkan peringatan koneksi Supabase pada dev, tidak lagi mengekspos kunci di output.
- `backend/src/routes/prediction.js`: logging prediksi diturunkan ke mode development saja.
- `backend/src/index.js`: request logging global hanya di non-production.
- `sql/migration_add_dataset_metadata_columns.sql`: penambahan kolom metadata `datasets` untuk menyesuaikan upload dataset baru.

### Verifikasi
- Frontend build berhasil dijalankan dengan `cd frontend && npm run build`.
- Backend source berhasil diperiksa dengan `node -c` pada file-file yang diubah.

## Login Demo Admin

- Email: `admin@example.com`
- Password: `admin123`

## Catatan Akhir

Dokumentasi ini adalah referensi utama proyek `Songket Klasifikasi Sumatera Selatan`.
