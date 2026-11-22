import { Link } from 'react-router-dom'
export function About() {
  return <article className="prose-page">
    <p className="eyebrow">TENTANG</p>
    <h1>Tentang Statistictable</h1>
    <p className="lead">Referensi tabel statistik untuk nilai kritis, distribusi peluang, dan batas uji. Situs statis, tanpa akun, dan dapat dipakai offline setelah kunjungan pertama.</p>

    <h2>Apa ini</h2>
    <p>Statistictable memuat 26 tabel statistik parametrik dan nonparametrik. Setiap halaman menyediakan kotak pencarian nilai berdasarkan parameter, tabel lengkap yang dapat dicetak, dan catatan metode. Ini bukan aplikasi hitung data mentah: tidak ada unggah data atau analisis data di sini.</p>

    <h2>Bagaimana angkanya dibuat</h2>
    <p>Nilai pada tabel berbasis rumus dihitung langsung dari fungsi distribusinya: normal, Student t, Fisher F, chi-square, binomial, Poisson, dan uji peringkat. Untuk uji peringkat, distribusi eksak dipakai pada sampel kecil dan aproksimasi pada sampel besar; batasnya dicantumkan di setiap halaman.</p>
    <p>Tujuh tabel tanpa bentuk kuantil sederhana dihitung numerik dari definisinya dan dicocokkan dengan nilai jangkar pada tabel terbit. Desimal menggunakan titik. Angka di layar dibulatkan, sedangkan CSV menyimpan presisi hasil komputasi.</p>

    <h2>Batasan</h2>
    <ul>
      <li>Mann-Whitney eksak untuk n₁,n₂ ≤ 20; Wilcoxon untuk n ≤ 25; Spearman untuk n ≤ 10. Semuanya mengasumsikan tanpa ties.</li>
      <li>K-S satu sampel eksak sampai n = 100 dengan parameter distribusi diketahui sebelumnya. K-S dua sampel memakai aproksimasi asimptotik dan hanya tersedia untuk α .05 atau .01.</li>
      <li>Kruskal-Wallis, Friedman, Kendall W, dan Cochran Q memakai aproksimasi chi-square. Kendall tau dan Runs memakai aproksimasi normal dan kurang andal pada sampel kecil.</li>
      <li>Durbin-Watson memberi batas dL/dU, bukan p-value untuk matriks prediktor tertentu. Dunnett hanya untuk perbandingan dengan satu kontrol, bukan semua pasangan.</li>
      <li>Pada beberapa sampel kecil, daerah penolakan eksak tidak tersedia untuk α yang dipilih. Grid menampilkan tanda —, bukan nilai perkiraan.</li>
      <li>Parameter di luar jangkauan tabel tidak diberi angka. Nilai yang diinterpolasi antar titik diberi awalan ≈.</li>
      <li>Mode p-value tersedia untuk 17 tabel yang distribusinya dapat dihitung langsung dari statistik uji. Tabel Binomial dan Poisson sudah menampilkan peluang, sedangkan tujuh tabel kritikal terhitung tidak menyediakan p-value karena memerlukan distribusi tambahan di luar data yang tersedia.</li>
    </ul>

    <h2>Tabel tanpa bentuk tertutup</h2>
    <p>Ketujuh tabel berikut dihitung dari definisi distribusinya. Nilai tidak diisi manual; setiap perhitungan dicocokkan pada beberapa titik dengan tabel terbit.</p>
    <ul>
      <li><Link to="/t/durbin-watson">Durbin-Watson</Link> — batas dL/dU dari integral Imhof. Jangkar: n=15, k=1 → 1.08/1.36; n=50, k=4 → 1.38/1.72.</li>
      <li><Link to="/t/tukey-q">Tukey q</Link> — kuantil studentized range. Jangkar: k=3, df=10 → 3.88.</li>
      <li><Link to="/t/dunnett">Dunnett</Link> — kuantil t multivariat dua sisi. Untuk k=2 hasilnya identik dengan t dua sisi; k=3, df=10 → 2.57.</li>
      <li><Link to="/t/f-max">Hartley F-max</Link> — kuantil rasio varians maksimum/minimum. k=3, df=10 → 4.85, sesuai simulasi.</li>
      <li><Link to="/t/toleransi">Faktor toleransi</Link> — k agar interval memuat proporsi P dengan keyakinan γ. Satu sisi memakai t non-sentral; dua sisi diselesaikan dari definisi cakupan.</li>
      <li><Link to="/t/shapiro-wilk">Shapiro-Wilk</Link> dan <Link to="/t/lillefors">Lilliefors</Link> — kuantil distribusi nol dari simulasi 400.000 sampel dengan seed tetap. Nilai W memakai koefisien Royston, sehingga untuk n besar dapat berbeda sampai sekitar 0.005 dari tabel cetak; Lilliefors berbeda ≤ 0.003.</li>
    </ul>
    <p>Jangkauan parameter dibatasi seperti tabel buku, misalnya Durbin-Watson n 6–100 dan k 1–5, agar hasil di luar jangkauan tidak dipaksakan.</p>

    <section id="glosarium">
      <h2>Glosarium</h2>
      <div className="glossary">
        <details className="glossary-item"><summary><span>α (alpha)</span><span aria-hidden="true">+</span></summary><p>Peluang menolak hipotesis nol yang benar (kesalahan tipe I). Bukan tingkat kepercayaan.</p></details>
        <details className="glossary-item"><summary><span>p-value</span><span aria-hidden="true">+</span></summary><p>Peluang memperoleh statistik uji sekurang-kurangnya sebesar nilai teramati jika hipotesis nol benar. Dibandingkan dengan α, bukan dengan nilai kritis.</p></details>
        <details className="glossary-item"><summary><span>Nilai kritis</span><span aria-hidden="true">+</span></summary><p>Batas statistik uji yang memisahkan daerah penerimaan dan penolakan pada α tertentu.</p></details>
        <details className="glossary-item"><summary><span>Statistik uji</span><span aria-hidden="true">+</span></summary><p>Angka hasil hitung dari sampel, misalnya t, F, χ², U, atau T. Masukkan angka ini pada mode p-value.</p></details>
        <details className="glossary-item"><summary><span>Satu ekor / dua ekor</span><span aria-hidden="true">+</span></summary><p>Satu ekor untuk hipotesis berarah; dua ekor untuk hipotesis tanpa arah. Nilai kritis dua ekor lebih besar pada α yang sama.</p></details>
        <details className="glossary-item"><summary><span>df (derajat kebebasan)</span><span aria-hidden="true">+</span></summary><p>Banyaknya informasi bebas yang tersisa setelah parameter diestimasi. Menentukan bentuk distribusi t, F, dan χ².</p></details>
        <details className="glossary-item"><summary><span>Eksak dan asimptotik</span><span aria-hidden="true">+</span></summary><p>Eksak dihitung dari distribusi lengkap; asimptotik memakai aproksimasi yang semakin baik pada sampel besar. Batasnya dicantumkan per tabel.</p></details>
        <details className="glossary-item"><summary><span>Ties</span><span aria-hidden="true">+</span></summary><p>Nilai kembar pada data peringkat. Tabel peringkat di sini mengasumsikan tanpa ties; koreksi ties tidak diterapkan.</p></details>
        <details className="glossary-item"><summary><span>≈ (interpolasi)</span><span aria-hidden="true">+</span></summary><p>Nilai di antara dua titik tabel, dihitung dengan interpolasi. Bukan angka yang tercetak pada tabel sumber.</p></details>
        <details className="glossary-item"><summary><span>dL / dU</span><span aria-hidden="true">+</span></summary><p>Batas bawah dan atas Durbin-Watson. Daerah ragu antara dL dan dU tidak memberi keputusan tegas.</p></details>
        <details className="glossary-item"><summary><span>γ dan P (toleransi)</span><span aria-hidden="true">+</span></summary><p>γ adalah keyakinan bahwa interval memuat sekurang-kurangnya proporsi populasi P. Keduanya harus dipilih sebelum menghitung faktor k.</p></details>
        <details className="glossary-item"><summary><span>D (Kolmogorov-Smirnov)</span><span aria-hidden="true">+</span></summary><p>Jarak maksimum antara distribusi empiris dan distribusi pembanding. Pada K-S dua sampel, jarak antara dua distribusi empiris.</p></details>
        <details className="glossary-item"><summary><span>W (Shapiro-Wilk)</span><span aria-hidden="true">+</span></summary><p>Statistik kesesuaian dengan distribusi normal; nilai kecil menunjukkan penyimpangan dari normalitas.</p></details>
      </div>
    </section>

    <h2>Referensi metodologi</h2>
    <ul>
      <li><a href="https://www.itl.nist.gov/div898/handbook/" target="_blank" rel="noreferrer">NIST/SEMATECH e-Handbook of Statistical Methods</a></li>
      <li>Marsaglia, Tsang &amp; Wang (2003), Evaluating Kolmogorov’s Distribution, Journal of Statistical Software 8(18).</li>
      <li>Distribusi peringkat eksak dibentuk dari kombinasi dan permutasi tanpa ties, bukan hasil pemindaian tabel cetak.</li>
    </ul>

    <h2>Privasi dan penggunaan offline</h2>
    <p>Tidak ada login, unggah data, atau analitik pihak ketiga. Riwayat lima tabel terakhir, favorit, dan preferensi desimal hanya disimpan di browser. Setelah situs produksi dibuka dan cache selesai, halaman dapat dipakai offline. Mode pengembangan tidak mengaktifkan cache offline.</p>
    <p>Periksa asumsi uji sebelum memakai nilai apa pun. Hasil numerik di sini adalah referensi, bukan pengganti pertimbangan metodologis.</p>
    <Link className="back-link" to="/">← Kembali ke daftar tabel</Link>
  </article>
}
