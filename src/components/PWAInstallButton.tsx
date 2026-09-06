import React, { useState } from 'react';
import { Download, CheckCircle2, X, Smartphone, Monitor, Laptop, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card' | 'badge';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  // If already installed in standalone mode
  if (isInstalled && variant === 'header') {
    return (
      <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Terinstal di Chrome</span>
      </div>
    );
  }

  // Header compact button
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer ${className}`}
          title="Download dan Install Aplikasi ini di Google Chrome / HP"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">Download Aplikasi</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} onTryInstall={install} isInstallable={isInstallable} />}
      </>
    );
  }

  // Sidebar item button
  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800 hover:to-indigo-800 text-blue-200 border border-blue-700/50 transition-all ${className}`}
        >
          <div className="flex items-center space-x-2.5">
            <Download className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left">
              <span className="block font-bold text-white text-[11px]">Download di Chrome</span>
              <span className="block text-[10px] text-blue-300">Install aplikasi ke Desktop / HP</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
        </button>

        {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} onTryInstall={install} isInstallable={isInstallable} />}
      </>
    );
  }

  // Card view for Pengaturan / Settings
  return (
    <>
      <div className={`p-4 rounded-2xl border ${isInstalled ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-900/80 border-blue-200 dark:border-slate-700'} ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isInstalled ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-md'}`}>
              {isInstalled ? <CheckCircle2 className="w-6 h-6" /> : <Download className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Download & Install Aplikasi di Chrome (PWA)
                {isInstalled && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                    Aplikasi Terinstal
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Aplikasi ini mendukung teknologi Progressive Web App (PWA). Anda dapat mengunduh dan memasangnya langsung di Google Chrome Desktop (PC/Laptop) maupun Google Chrome di HP (Android & iOS) tanpa melalui Play Store.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isInstallable ? 'Install Sekarang' : 'Panduan Download'}</span>
            </button>
          </div>
        </div>
      </div>

      {showGuide && <InstallGuideModal onClose={() => setShowGuide(false)} onTryInstall={install} isInstallable={isInstallable} />}
    </>
  );
};

interface InstallGuideModalProps {
  onClose: () => void;
  onTryInstall: () => Promise<boolean>;
  isInstallable: boolean;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose, onTryInstall, isInstallable }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Download Aplikasi di Google Chrome
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pemasangan PWA (Progressive Web App) Resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
          {isInstallable && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                Browser mendukung instalasi langsung 1-klik!
              </span>
              <button
                onClick={async () => {
                  const res = await onTryInstall();
                  if (res) onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
              >
                Klik Install
              </button>
            </div>
          )}

          {/* Device tabs / steps */}
          <div className="space-y-3">
            {/* Desktop Chrome */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-bold">
                <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>1. Di Google Chrome Komputer / Laptop (Windows & Mac)</span>
              </div>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                <li>Buka aplikasi ini di tab peramban <strong>Google Chrome</strong>.</li>
                <li>Lihat ke <strong>Bilah Alamat URL</strong> (Address Bar) di sebelah kanan, klik ikon <strong>Install / Download Aplikasi</strong> (ikon monitor dengan panah ke bawah).</li>
                <li>Atau klik menu titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome &gt; <strong>Simpan dan Bagikan</strong> &gt; <strong>Instal Aplikasi Guru AI</strong>.</li>
                <li>Aplikasi akan terpasang di Desktop/Laptop Anda dan dapat dibuka langsung layaknya aplikasi komputer asli!</li>
              </ol>
            </div>

            {/* Android Chrome */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-bold">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Di HP Android (Google Chrome Mobile)</span>
              </div>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                <li>Buka aplikasi ini di Google Chrome di HP Anda.</li>
                <li>Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas layar Chrome.</li>
                <li>Pilih opsi <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                <li>Aplikasi akan muncul di menu aplikasi HP dengan logo dan nama resmi Aplikasi Guru AI.</li>
              </ol>
            </div>

            {/* iOS Safari */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-bold">
                <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>3. Di iPhone / iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1.5 pl-1 leading-relaxed">
                <li>Buka di browser Safari.</li>
                <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.</li>
                <li>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
