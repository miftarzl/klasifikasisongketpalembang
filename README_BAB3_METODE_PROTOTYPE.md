# README Pendukung Bab 3 - Metode Prototype

Dokumen ini dibuat sebagai README pendamping untuk membantu penyusunan Bab 3 Metode Penelitian. Fokus dokumen ini bukan hanya cara menjalankan aplikasi, tetapi juga menjelaskan bagaimana sistem klasifikasi kain tradisional dibangun menggunakan metode prototype.

## 1. Gambaran Umum Penelitian

Penelitian ini mengembangkan prototype aplikasi klasifikasi motif kain tradisional berbasis citra digital. Sistem dibangun untuk menerima input berupa gambar kain, memproses gambar tersebut melalui layanan machine learning, lalu menampilkan hasil klasifikasi beserta nilai confidence kepada pengguna.

Pada implementasi proyek ini, sistem terdiri dari tiga bagian utama:

- Frontend: antarmuka pengguna berbasis React, Vite, dan Tailwind CSS.
- Backend: API berbasis Express.js untuk menghubungkan frontend, database, autentikasi admin, upload dataset, dan layanan machine learning.
- ML Service: layanan FastAPI dan TensorFlow untuk training model, prediksi gambar, evaluasi model, serta visualisasi heatmap.

## 2. Metode Pengembangan Sistem

Metode pengembangan yang digunakan adalah metode prototype. Metode ini dipilih karena sistem membutuhkan proses perancangan, percobaan, evaluasi, dan penyempurnaan secara bertahap. Prototype memungkinkan peneliti membangun versi awal sistem, menguji fungsi utama, menerima masukan, lalu memperbaiki sistem sampai sesuai kebutuhan.

Tahapan metode prototype pada penelitian ini meliputi:

1. Komunikasi dan identifikasi kebutuhan.
2. Perencanaan cepat.
3. Pemodelan atau desain cepat.
4. Pembentukan prototype.
5. Evaluasi prototype.
6. Perbaikan prototype.

## 3. Penerapan Tahapan Prototype

### 3.1 Komunikasi dan Identifikasi Kebutuhan

Pada tahap ini dilakukan identifikasi kebutuhan sistem klasifikasi. Kebutuhan utama sistem adalah:

- Pengguna dapat mengunggah gambar kain melalui halaman web.
- Sistem dapat melakukan klasifikasi gambar berdasarkan kelas yang tersedia.
- Sistem menampilkan hasil prediksi dan tingkat confidence.
- Admin dapat mengelola dataset.
- Admin dapat menjalankan training model.
- Sistem menyediakan informasi evaluasi model seperti accuracy, precision, recall, f1-score, confusion matrix, dan riwayat training.

Aktor yang terlibat dalam sistem:

- Pengguna umum: mengunggah gambar dan melihat hasil klasifikasi.
- Admin: mengelola dataset, menjalankan training, dan melihat analitik sistem.

### 3.2 Perencanaan Cepat

Perencanaan cepat dilakukan dengan menentukan arsitektur sistem, teknologi yang digunakan, dan pembagian modul. Arsitektur yang digunakan adalah client-server dengan layanan machine learning terpisah.

Komponen sistem:

- `frontend/`: halaman pengguna, halaman hasil prediksi, explorer informasi kain, dan dashboard admin.
- `backend/`: autentikasi, upload file, route dataset, route prediksi, dan proxy ke ML service.
- `ml_service/`: training model, inferensi, evaluasi, status training, dan heatmap.
- `sql/`: skema dan migrasi database.
- `ml_service/data/train/`: folder dataset training.

Teknologi yang digunakan:

- React + Vite untuk frontend.
- Tailwind CSS untuk styling.
- Express.js untuk backend.
- Supabase untuk penyimpanan data dan autentikasi admin.
- FastAPI untuk layanan machine learning.
- TensorFlow dan EfficientNetB0 untuk model klasifikasi citra.

### 3.3 Desain Cepat

Desain cepat dilakukan dengan membuat rancangan alur kerja sistem.

Alur prediksi:

1. Pengguna membuka halaman aplikasi.
2. Pengguna mengunggah gambar kain.
3. Frontend mengirim gambar ke backend.
4. Backend meneruskan gambar ke ML service.
5. ML service melakukan preprocessing gambar.
6. Model TensorFlow menghasilkan label prediksi dan nilai confidence.
7. Hasil prediksi dikirim kembali ke frontend.
8. Frontend menampilkan hasil klasifikasi kepada pengguna.

Alur training:

1. Admin login ke dashboard.
2. Admin mengunggah atau mengelola dataset.
3. Admin menjalankan proses training.
4. ML service membaca dataset dari folder training atau Supabase.
5. Model dilatih menggunakan dataset yang tersedia.
6. Sistem menyimpan model, label, metrik, riwayat training, dan status training.
7. Admin melihat hasil evaluasi melalui dashboard.

## 4. Dataset Penelitian

Dataset disimpan dalam struktur folder:

```text
ml_service/data/train/<nama_kelas>/
```

Kelas utama yang digunakan oleh model berdasarkan `ml_service/labels.json` adalah:

- Songket Lepus
- Songket Limar
- Songket Polos
- Songket Rakam
- Songket Seler
- Songket Tabur

Contoh distribusi dataset lokal yang terbaca pada folder training:

| Kelas | Jumlah Gambar |
| --- | ---: |
| Songket Lepus | 30 |
| Songket Limar | 30 |
| Songket Polos | 30 |
| Songket Rakam | 30 |
| Songket Seler | 30 |
| Songket Tabur | 35 |

Catatan: folder eksperimen seperti `jamal`, `Songket Jamal`, dan `TestSongket` sebaiknya dipisahkan dari dataset final apabila tidak digunakan sebagai kelas penelitian utama.

## 5. Rancangan Model Machine Learning

Model klasifikasi citra dibangun menggunakan transfer learning dengan arsitektur EfficientNetB0. Model menerima input gambar berukuran 180 x 180 piksel dan menghasilkan output berupa kelas klasifikasi.

Tahapan pemrosesan model:

1. Gambar dibaca dari dataset training.
2. Dataset dibagi menjadi data training dan validation dengan validation split 20%.
3. Data training diberi augmentasi seperti rotasi, pergeseran, zoom, flip, perubahan brightness, blur, dan compression.
4. Feature extractor menggunakan EfficientNetB0 dengan bobot ImageNet.
5. Lapisan klasifikasi tambahan terdiri dari dropout, dense layer, batch normalization, dan output softmax.
6. Model dilatih menggunakan optimizer Adam dan loss `sparse_categorical_crossentropy`.
7. Model terbaik disimpan ke `ml_service/model.h5`.

Parameter utama:

| Parameter | Nilai |
| --- | --- |
| Ukuran gambar | 180 x 180 |
| Batch size | 16 |
| Epoch maksimum | 10 |
| Optimizer | Adam |
| Learning rate awal | 0.001 |
| Validation split | 20% |
| Base model | EfficientNetB0 |

## 6. Rancangan Pengujian

Pengujian dilakukan untuk memastikan prototype berjalan sesuai kebutuhan.

### 6.1 Pengujian Fungsional

Pengujian fungsional dapat ditulis menggunakan pendekatan black box.

| No | Fitur | Skenario Uji | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| 1 | Upload gambar | Pengguna mengunggah file gambar | Sistem menerima gambar dan memproses prediksi |
| 2 | Validasi file | Pengguna mengunggah file bukan gambar | Sistem menolak file |
| 3 | Prediksi | Gambar valid dikirim ke ML service | Sistem menampilkan label dan confidence |
| 4 | Login admin | Admin memasukkan email dan password | Admin masuk ke dashboard |
| 5 | Manajemen dataset | Admin mengunggah dataset | Dataset tersimpan sesuai label |
| 6 | Training model | Admin menjalankan training | Status training berjalan dan selesai |
| 7 | Evaluasi model | Admin membuka evaluasi | Sistem menampilkan metrik model |

### 6.2 Pengujian Model

Pengujian model dilakukan menggunakan data validation yang dipisahkan dari dataset training. Metrik evaluasi yang digunakan:

- Accuracy
- Precision
- Recall
- F1-score
- Confusion matrix
- Loss dan validation loss

Contoh hasil training terakhir dari `ml_service/training_status.json`:

| Metrik | Nilai |
| --- | ---: |
| Accuracy validation | 0.8919 |
| Loss validation | 0.5011 |
| Epoch trained | 10 |
| Jumlah kelas | 6 |

Nilai tersebut dapat digunakan sebagai bukti awal bahwa prototype model sudah dapat melakukan klasifikasi, tetapi tetap perlu divalidasi kembali menggunakan dataset final penelitian.

## 7. Kebutuhan Sistem

### 7.1 Perangkat Lunak

- Node.js
- Python
- npm
- Supabase project
- Browser modern

### 7.2 Library Utama

Frontend:

- React
- Vite
- Tailwind CSS
- Axios
- React Router DOM

Backend:

- Express.js
- Multer
- Axios
- JWT
- Bcrypt
- Supabase JS

Machine Learning:

- FastAPI
- TensorFlow
- Scikit-learn
- OpenCV
- Pillow
- Albumentations
- Pandas
- Matplotlib
- Seaborn

## 8. Cara Menjalankan Prototype

### 8.1 Menjalankan ML Service

```powershell
cd ml_service
python -m venv .\venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

### 8.2 Menjalankan Backend

```powershell
cd backend
npm install
npm run start
```

Variabel `.env` backend yang dibutuhkan:

```text
ML_SERVICE_URL=http://127.0.0.1:8000
SUPABASE_URL=<isi_url_supabase>
SUPABASE_SERVICE_ROLE_KEY=<isi_service_role_key>
ADMIN_EMAIL=<email_admin>
ADMIN_PASSWORD=<password_admin>
```

### 8.3 Menjalankan Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend berjalan pada:

```text
http://localhost:5173
```

Backend berjalan pada:

```text
http://localhost:5000
```

ML service berjalan pada:

```text
http://127.0.0.1:8000
```

## 9. Endpoint Penting

ML Service:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/health` | Mengecek status layanan ML |
| POST | `/predict` | Melakukan prediksi gambar |
| POST | `/train` | Menjalankan training model |
| GET | `/training-status` | Melihat status training |
| GET | `/training-history` | Melihat riwayat training |
| GET | `/evaluation` | Melihat hasil evaluasi model |
| GET | `/model-metrics` | Melihat metrik model |
| POST | `/generate-heatmap` | Membuat heatmap prediksi |

Backend:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/auth/login` | Login admin |
| POST | `/api/predictions` | Upload gambar untuk klasifikasi |
| POST | `/api/admin/train` | Menjalankan training melalui backend |
| GET | `/api/ml/training-status` | Proxy status training |
| GET | `/api/ml/evaluation` | Proxy evaluasi model |
| GET | `/api/datasets` | Mengambil data dataset |
| POST | `/api/datasets` | Menambah data dataset |

## 10. Keterkaitan README Ini dengan Bab 3

Bagian yang dapat langsung dijadikan dasar penulisan Bab 3:

- Metode pengembangan sistem: gunakan bagian 2 dan 3.
- Analisis kebutuhan sistem: gunakan bagian 3.1.
- Perancangan sistem: gunakan bagian 3.2 dan 3.3.
- Dataset penelitian: gunakan bagian 4.
- Rancangan model: gunakan bagian 5.
- Rancangan pengujian: gunakan bagian 6.
- Implementasi prototype: gunakan bagian 7, 8, dan 9.

Contoh kalimat untuk Bab 3:

```text
Metode pengembangan sistem yang digunakan dalam penelitian ini adalah metode prototype. Metode ini dipilih karena proses pengembangan sistem klasifikasi citra membutuhkan evaluasi dan perbaikan secara bertahap. Tahapan yang dilakukan meliputi komunikasi dan identifikasi kebutuhan, perencanaan cepat, desain cepat, pembentukan prototype, evaluasi prototype, dan perbaikan prototype.
```

```text
Prototype sistem dibangun dengan arsitektur client-server yang terdiri dari frontend React, backend Express.js, dan layanan machine learning berbasis FastAPI. Model klasifikasi citra dikembangkan menggunakan transfer learning EfficientNetB0 untuk mengklasifikasikan gambar kain ke dalam kelas yang telah ditentukan.
```

## 11. Catatan Untuk Penulisan Skripsi

- Samakan istilah penelitian, apakah ingin memakai "batik", "songket", atau "kain tradisional". Di kode masih ada beberapa istilah yang bercampur.
- Gunakan dataset final yang bersih untuk hasil akhir penelitian.
- Pisahkan folder eksperimen dari folder dataset final.
- Jalankan ulang training setelah dataset final diperbaiki.
- Screenshot halaman aplikasi, dashboard admin, proses upload, hasil prediksi, dan hasil evaluasi dapat dimasukkan ke Bab 4.
- Untuk Bab 3, fokuskan pembahasan pada rancangan dan metode, bukan hasil akhir sistem.

