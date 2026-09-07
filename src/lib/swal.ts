import Swal from 'sweetalert2';
import { getStoredGeminiApiKey, setStoredGeminiApiKey } from './aiHelper';

// Toast configuration for quick non-blocking alerts
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showToastSuccess = (title: string) => {
  Toast.fire({
    icon: 'success',
    title: title
  });
};

export const showToastError = (title: string) => {
  Toast.fire({
    icon: 'error',
    title: title
  });
};

/**
 * Membersihkan pesan error teknis menjadi bahasa manusia yang ramah, sopan, dan jelas.
 */
export const sanitizeErrorMessage = (rawText: string = ''): {
  cleanMessage: string;
  isAiOrServerIssue: boolean;
  isValidationNotice: boolean;
} => {
  const text = String(rawText || '').trim();

  // Deteksi error serverless Vercel / JSON parse error
  const isVercelJsonError =
    text.includes("Unexpected token 'A'") ||
    text.includes('A server error') ||
    text.includes('is not valid JSON') ||
    text.includes('<!DOCTYPE html>') ||
    text.includes('Server error (HTTP 500)');

  // Deteksi kendala API Key
  const isApiKeyIssue =
    text.includes('GEMINI_API_KEY') ||
    text.includes('API_KEY_INVALID') ||
    text.includes('API key not valid') ||
    text.includes('kunci API') ||
    text.includes('Google Gemini API');

  // Deteksi Timeout
  const isTimeout =
    text.includes('504') ||
    text.includes('TIMEOUT') ||
    text.includes('timed out') ||
    text.includes('melebihi batas waktu');

  // Deteksi Network / Jaringan
  const isNetwork =
    text.includes('Failed to fetch') ||
    text.includes('NetworkError') ||
    text.includes('koneksi internet');

  // Deteksi Form validation notice (bukan fatal crash)
  const isValidationNotice =
    text.startsWith('Silakan') ||
    text.startsWith('Mohon') ||
    text.startsWith('Pilih') ||
    text.startsWith('Belum ada') ||
    text.includes('harus diisi') ||
    text.includes('sudah ada dalam database');

  const isAiOrServerIssue = isVercelJsonError || isApiKeyIssue || isTimeout || text.includes('AI') || text.includes('KBC');

  if (isVercelJsonError) {
    return {
      cleanMessage:
        'Server hosting (Vercel) belum terkonfigurasi dengan Kunci Gemini AI atau mengalami kendala eksekusi serverless.',
      isAiOrServerIssue: true,
      isValidationNotice: false
    };
  }

  if (isTimeout) {
    return {
      cleanMessage:
        'Proses pembuatan dokumen AI memerlukan waktu lebih lama dari batas waktu server hosting Vercel. Silakan coba generate dokumen per modul atau masukkan kunci API sendiri.',
      isAiOrServerIssue: true,
      isValidationNotice: false
    };
  }

  if (isNetwork) {
    return {
      cleanMessage:
        'Koneksi ke server terputus atau tidak merespons. Pastikan koneksi internet Anda stabil.',
      isAiOrServerIssue: true,
      isValidationNotice: false
    };
  }

  if (isApiKeyIssue) {
    return {
      cleanMessage:
        'Kunci Google Gemini AI belum terpasang atau tidak valid. Masukkan kunci API Gemini gratis Anda untuk melanjutkan.',
      isAiOrServerIssue: true,
      isValidationNotice: false
    };
  }

  return {
    cleanMessage: text || 'Terjadi kendala saat memproses permintaan Anda.',
    isAiOrServerIssue,
    isValidationNotice
  };
};

/**
 * Modal dialog khusus untuk kendala AI & Pembuatan Dokumen
 * Menampilkan pesan yang elegan, sopan, serta tombol aksi instan untuk memasukkan Kunci API langsung.
 */
export const notifyAiError = async (
  docTitleOrAction: string = 'Dokumen AI',
  rawError: any = null,
  onKeySavedCallback?: () => void
) => {
  const errMsg = typeof rawError === 'string' ? rawError : rawError?.message || '';
  const { cleanMessage } = sanitizeErrorMessage(errMsg);

  const result = await Swal.fire({
    icon: 'warning',
    title: 'Kendala Generator AI',
    html: `
      <div style="text-align: left; font-size: 13px; line-height: 1.6;">
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;">
          <div style="font-weight: 700; color: #9f1239; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span>
            <span>Gagal Menyusun: ${docTitleOrAction}</span>
          </div>
          <p style="color: #475569; margin: 0; font-size: 12.5px;">
            ${cleanMessage}
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>💡</span>
            <span>Solusi Cepat:</span>
          </div>
          <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
            <li>Klik tombol <strong>"🔑 Pasang Kunci API"</strong> di bawah untuk memasukkan Gemini API Key gratis.</li>
            <li>Atau tambahkan <code>GEMINI_API_KEY</code> di Vercel Dashboard (Project Settings &rarr; Environment Variables).</li>
            <li>Dapatkan API Key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #d97706; font-weight: bold; text-decoration: underline;">Google AI Studio</a>.</li>
          </ul>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: '#d97706',
    cancelButtonColor: '#64748b',
    confirmButtonText: '🔑 Pasang Kunci API Sekarang',
    cancelButtonText: 'Tutup',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    // Tampilkan prompt input Kunci API langsung di tempat
    const currentKey = getStoredGeminiApiKey();
    const { value: apiKey } = await Swal.fire({
      title: 'Kunci Google Gemini API',
      input: 'password',
      inputLabel: 'Masukkan Gemini API Key gratis Anda (AIzaSy...):',
      inputValue: currentKey,
      inputPlaceholder: 'Contoh: AIzaSyD...',
      showCancelButton: true,
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Simpan Kunci API',
      cancelButtonText: 'Batal',
      footer: '<a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #d97706; font-weight: 600; font-size: 12px;">Dapatkan API Key Gratis di Google AI Studio &rarr;</a>',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Kunci API tidak boleh kosong!';
        }
        return null;
      }
    });

    if (apiKey && apiKey.trim()) {
      setStoredGeminiApiKey(apiKey.trim());
      await Swal.fire({
        icon: 'success',
        title: 'Kunci API Berhasil Disimpan!',
        text: 'Kunci Gemini API tersimpan di browser ini. Silakan klik tombol buat kembali untuk melanjutkan.',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'Siap, Mengerti'
      });
      if (onKeySavedCallback) {
        onKeySavedCallback();
      }
    }
  }
};

// Modal Alerts for key actions
export const showSuccessAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'OK'
  });
};

export const showErrorAlert = (title: string, text?: string) => {
  const { cleanMessage, isAiOrServerIssue } = sanitizeErrorMessage(text || '');
  if (isAiOrServerIssue) {
    return notifyAiError(title, text);
  }

  return Swal.fire({
    icon: 'error',
    title: title,
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

// Standard CRUD & Export notifications
export const notifySimpanSuccess = (pesan: string = 'Data berhasil disimpan!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Disimpan!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifySimpanError = (pesan: string = 'Gagal menyimpan data!') => {
  const { cleanMessage, isAiOrServerIssue, isValidationNotice } = sanitizeErrorMessage(pesan);

  // Jika ini kendala AI atau Vercel Server, alihkan ke dialog ramah AI
  if (isAiOrServerIssue || pesan.includes('Gagal membuat') || pesan.includes('AI') || pesan.includes('KBC')) {
    return notifyAiError('Dokumen AI / Perangkat Ajar', pesan);
  }

  // Jika ini sekadar peringatan validasi input pengguna
  if (isValidationNotice) {
    return Swal.fire({
      icon: 'warning',
      title: 'Periksa Formulir Anda',
      text: cleanMessage,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Saya Mengerti'
    });
  }

  // Error umum
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Menyimpan',
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

export const notifyEditSuccess = (pesan: string = 'Data berhasil diperbarui!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Diperbarui!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifyEditError = (pesan: string = 'Gagal memperbarui data!') => {
  const { cleanMessage, isValidationNotice } = sanitizeErrorMessage(pesan);
  if (isValidationNotice) {
    return Swal.fire({
      icon: 'warning',
      title: 'Periksa Formulir Anda',
      text: cleanMessage,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Saya Mengerti'
    });
  }
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Memperbarui',
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

export const notifyHapusSuccess = (pesan: string = 'Data berhasil dihapus!') => {
  return Swal.fire({
    icon: 'success',
    title: 'Berhasil Dihapus!',
    text: pesan,
    timer: 2000,
    showConfirmButton: false
  });
};

export const notifyHapusError = (pesan: string = 'Gagal menghapus data!') => {
  const { cleanMessage } = sanitizeErrorMessage(pesan);
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Menghapus',
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

export const notifyCetakSuccess = (pesan: string = 'Dokumen siap dicetak!') => {
  return Toast.fire({
    icon: 'success',
    title: pesan
  });
};

export const notifyCetakError = (pesan: string = 'Gagal mencetak dokumen!') => {
  const { cleanMessage } = sanitizeErrorMessage(pesan);
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Mencetak',
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

export const notifyUnduhSuccess = (pesan: string = 'File berhasil diunduh!') => {
  return Toast.fire({
    icon: 'success',
    title: pesan
  });
};

export const notifyUnduhError = (pesan: string = 'Gagal mengunduh file!') => {
  const { cleanMessage } = sanitizeErrorMessage(pesan);
  return Swal.fire({
    icon: 'error',
    title: 'Gagal Mengunduh',
    text: cleanMessage,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Tutup'
  });
};

// Confirmation dialog for delete actions
export const confirmDeleteAlert = async (
  title: string = 'Apakah Anda yakin?',
  text: string = 'Data yang dihapus tidak dapat dikembalikan!'
) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true
  });
  return result.isConfirmed;
};

export default Swal;
