import type { jsPDF } from 'jspdf';

// Caching base64 to avoid refetching on subsequent exports
let robotoRegularBase64: string | null = null;
let robotoBoldBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Process in chunks of 8192 to avoid call stack overflow with large fonts
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return window.btoa(binary);
}

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch font: ${url} (${res.status})`);
  }
  const buffer = await res.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

export async function registerVietnameseFonts(doc: jsPDF) {
  try {
    // 1. Fetch & Register Roboto Regular
    if (!robotoRegularBase64) {
      robotoRegularBase64 = await fetchFontAsBase64('/fonts/Roboto-Regular.ttf');
    }
    doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

    // 2. Fetch & Register Roboto Bold
    if (!robotoBoldBase64) {
      robotoBoldBase64 = await fetchFontAsBase64('/fonts/Roboto-Bold.ttf');
    }
    doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

    // Set default font to Roboto
    doc.setFont('Roboto');
  } catch (error) {
    console.warn('Không tải được font Roboto, sử dụng font mặc định:', error);
    // Fallback — jsPDF default Helvetica (no Vietnamese diacritics)
  }
}

