import React, { useState, useEffect } from "react";
import { Settings, Save, ShieldCheck, School, UserCheck, Trash2, ShieldAlert, KeyRound, Eye, EyeOff, Globe, UploadCloud } from "lucide-react";
import { Pengaturan } from "../types";
import { savePengaturan } from "../lib/firebase";
import { notifySimpanSuccess, notifySimpanError } from "../lib/swal";

interface PengaturanViewProps {
  config: Pengaturan;
  onNavigateToReset?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({ config, onNavigateToReset }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<Pengaturan>({
    Nama_Guru: "",
    NIP_Guru: "",
    Pemerintah: "PEMERINTAH PROVINSI",
    Nama_Sekolah: "",
    Alamat_Sekolah: "",
    Nama_Kepsek: "",
    NIP_Kepsek: "",
    Tempat_Tanda_Tangan: "",
    Logo_Kiri: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    Logo_Kanan: "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
    username: "misyuriyah26@gmail.com",
    password: "123456"
  });

  useEffect(() => {
    if (config) {
      setForm({
        Nama_Guru: config.Nama_Guru || "",
        NIP_Guru: config.NIP_Guru || "",
        Pemerintah: config.Pemerintah || "PEMERINTAH PROVINSI",
        Nama_Sekolah: config.Nama_Sekolah || "",
        Alamat_Sekolah: config.Alamat_Sekolah || "",
        Nama_Kepsek: config.Nama_Kepsek || "",
        NIP_Kepsek: config.NIP_Kepsek || "",
        Tempat_Tanda_Tangan: config.Tempat_Tanda_Tangan || "",
        Logo_Kiri: config.Logo_Kiri || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        Logo_Kanan: config.Logo_Kanan || "https://lh3.googleusercontent.com/d/19TVwFRIp_t7sHTMntziM9SgZVoJAkhQU",
        username: config.username || "misyuriyah26@gmail.com",
        password: config.password || "123456"
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "Logo_Kiri" | "Logo_Kanan") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height *= MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width *= MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        setForm(prev => ({ ...prev, [field]: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePengaturan(form);
      notifySimpanSuccess("Pengaturan profil & kredensial akun tersimpan ke Firebase!");
    } catch (err: any) {
      notifySimpanError(err.message || "Gagal menyimpan pengaturan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Profil Guru & Kop Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Data ini digunakan secara otomatis pada Kop Surat Laporan PDF, Kartu Pelajar, dan Nama Penandatangan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Identitas Guru */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
                <ShieldCheck className="w-4 h-4" />
                Identitas Guru Pengampu
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Guru Lengkap & Gelar</label>
                <input
                  type="text"
                  id="Nama_Guru"
                  value={form.Nama_Guru}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso, S.Pd., M.Pd."
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NIP Guru</label>
                <input
                  type="text"
                  id="NIP_Guru"
                  value={form.NIP_Guru}
                  onChange={handleChange}
                  placeholder="19900101 201501 1 002"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Box 2: Identitas Kepsek */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
                <UserCheck className="w-4 h-4" />
                Identitas Kepala Sekolah
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  id="Nama_Kepsek"
                  value={form.Nama_Kepsek}
                  onChange={handleChange}
                  placeholder="Nama & Gelar Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  id="NIP_Kepsek"
                  value={form.NIP_Kepsek}
                  onChange={handleChange}
                  placeholder="NIP Kepala Sekolah"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Identitas Sekolah & Kop Surat */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b pb-2">
              <School className="w-4 h-4" />
              Identitas Sekolah & Kop Surat Laporan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Pemerintah Prov / Kab / Kota</label>
                <input
                  type="text"
                  id="Pemerintah"
                  value={form.Pemerintah}
                  onChange={handleChange}
                  placeholder="PEMERINTAH PROVINSI / KABUPATEN"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  id="Nama_Sekolah"
                  value={form.Nama_Sekolah}
                  onChange={handleChange}
                  placeholder="SMA NEGERI 1 KOTA"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Alamat Lengkap & Telepon Sekolah</label>
                <input
                  type="text"
                  id="Alamat_Sekolah"
                  value={form.Alamat_Sekolah}
                  onChange={handleChange}
                  placeholder="Jalan Pendidikan No. 1, Telp: 021-xxxxxx"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kota / Tempat Tanda Tangan Laporan</label>
                <input
                  type="text"
                  id="Tempat_Tanda_Tangan"
                  value={form.Tempat_Tanda_Tangan}
                  onChange={handleChange}
                  placeholder="Contoh: Bandung / Jakarta"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Logo Instansi Kiri (Opsional)</label>
                <div className="flex gap-3 items-start">
                  {form.Logo_Kiri && (
                    <img src={form.Logo_Kiri} alt="Logo Kiri" className="h-10 w-10 object-contain rounded-lg border bg-white" />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      id="Logo_Kiri"
                      value={form.Logo_Kiri}
                      onChange={handleChange}
                      placeholder="Link gambar HTTPS logo"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                    />
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Gambar Logo Kiri</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "Logo_Kiri")} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Logo Sekolah Kanan (Opsional)</label>
                <div className="flex gap-3 items-start">
                  {form.Logo_Kanan && (
                    <img src={form.Logo_Kanan} alt="Logo Kanan" className="h-10 w-10 object-contain rounded-lg border bg-white" />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      id="Logo_Kanan"
                      value={form.Logo_Kanan}
                      onChange={handleChange}
                      placeholder="Link gambar HTTPS logo"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 outline-none"
                    />
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Gambar Logo Kanan</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "Logo_Kanan")} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 4: Akses Keamanan & Akun Google */}
          <div className="p-5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-2 border-b border-blue-200 dark:border-blue-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Status Autentikasi Akun Google & Database Cloud API
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Autentikasi aplikasi terhubung khusus via <strong>Akun Google & Firebase Auth</strong>. Seluruh kunci API database, kuota Firebase Spark Plan, dan sinkronisasi real-time secara otomatis diikat ke identitas akun Google aktif Anda.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Metode Login Aktif</span>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Identity & Firebase Auth (OAuth 2.0)</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Koneksi Database Cloud</span>
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Firestore Spark Plan (Auto-Sync)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 5: Informasi & Kredit Pengembang */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Informasi Aplikasi & Kredit Pengembang
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Aplikasi Guru AI (EdAdmin Pro)</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Platform Administrasi Guru, Perangkat Ajar KBC, Modul Kokurikuler, & Asisten AI Terpadu
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full font-bold text-[11px]">
                  Cover By Esa Nursyeh
                </span>
                <div className="mt-1">
                  <a
                    href="mailto:misyuriyah26@gmail.com"
                    className="text-blue-600 dark:text-blue-400 font-mono text-xs hover:underline font-bold"
                  >
                    misyuriyah26@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan ke Firebase</span>
            </button>
          </div>
        </form>

        {/* Zona Bahaya / Reset Total */}
        {onNavigateToReset && (
          <div className="pt-6 border-t border-red-200 dark:border-red-900/50 space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/40">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-900 dark:text-red-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  ZONA BAHAYA: Hapus / Kosongkan Semua Isi Database
                </h4>
                <p className="text-[11px] text-red-700 dark:text-red-300 font-medium">
                  Hapus secara permanen seluruh siswa, absensi, nilai, agenda, bimbingan, dan data sekolah untuk digunakan dari nol.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToReset}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Buka Menu Hapus Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
