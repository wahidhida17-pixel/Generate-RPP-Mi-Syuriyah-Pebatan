// Helper to fetch from AI endpoints with custom API key support and safe error parsing

export const getStoredGeminiApiKey = (): string => {
  return localStorage.getItem("edadmin_gemini_api_key") || "";
};

export const setStoredGeminiApiKey = (key: string): void => {
  if (key && key.trim()) {
    localStorage.setItem("edadmin_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("edadmin_gemini_api_key");
  }
};

export const postAiApi = async (url: string, body: any): Promise<any> => {
  const customKey = getStoredGeminiApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (customKey) {
    headers["x-gemini-api-key"] = customKey;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  } catch (networkErr: any) {
    throw new Error("Gagal terhubung ke server. Periksa koneksi internet Anda: " + (networkErr?.message || ""));
  }

  const rawText = await res.text();
  let data: any = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    // Non-JSON response (e.g., Vercel 500 HTML/Text error)
    if (!res.ok) {
      if (res.status === 504 || rawText.includes("TIMEOUT")) {
        throw new Error("Proses AI memerlukan waktu lebih lama dari batas timeout server Vercel (15-60 detik). Silakan coba generate dokumen per modul.");
      }
      throw new Error(
        `Server Vercel memberikan respon error (HTTP ${res.status}). Pastikan Anda telah menambahkan Environment Variable GEMINI_API_KEY di Vercel Dashboard (Project Settings > Environment Variables) atau masukkan Gemini API Key di menu Pengaturan aplikasi.`
      );
    }
    throw new Error("Respon dari server tidak dalam format JSON yang valid.");
  }

  if (!res.ok || data.status === "error") {
    throw new Error(data.message || `Terjadi kesalahan saat memproses AI (HTTP ${res.status}).`);
  }

  return data;
};
