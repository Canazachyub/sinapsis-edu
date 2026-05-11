export interface FileBase64 {
  base64: string;
  mime: string;
  name: string;
  size: number;
}

/**
 * Lee un File del navegador y devuelve el contenido en base64 (sin el
 * prefijo data:URL). Útil para enviarlo en el body de un POST al
 * backend Apps Script.
 */
export function fileToBase64(file: File): Promise<FileBase64> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader devolvió un resultado no-texto'));
        return;
      }
      // dataURL: "data:image/png;base64,iVBOR..."
      const commaAt = result.indexOf(',');
      if (commaAt < 0) {
        reject(new Error('Formato dataURL inesperado'));
        return;
      }
      const meta = result.substring(0, commaAt);
      const base64 = result.substring(commaAt + 1);
      const m = /data:([^;]+);base64/.exec(meta);
      const mime = m ? m[1] : file.type || 'application/octet-stream';
      resolve({ base64, mime, name: file.name, size: file.size });
    };
    reader.onerror = () => reject(reader.error ?? new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}

export const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;
export const VOUCHER_MIMES_OK = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export function validateVoucherFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!VOUCHER_MIMES_OK.includes(file.type)) {
    return { ok: false, error: 'Solo aceptamos JPG, PNG o PDF.' };
  }
  if (file.size > VOUCHER_MAX_BYTES) {
    return { ok: false, error: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo 5 MB.` };
  }
  return { ok: true };
}
