'use strict';

// camera.js — Foto produk & scan barcode via Capacitor Camera
// Hanya aktif di platform Android

// ── Foto Produk ──────────────────────────────────────────────

async function pickProductImage() {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Blob,
        source: CameraSource.Prompt, // dialog: kamera atau galeri
    });

    const blob = image.blob;
    const file = new File([blob], `product-${Date.now()}.jpg`, { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', file);
    const result = await apiClient.uploadFile('/products/upload-image', formData);
    return result.image_url;
}

// ── Scan Barcode via ZXing (web-based, bekerja di Capacitor WebView) ──

async function initBarcodeScanner(videoElementId) {
    // ZXing dimuat via CDN di HTML, tidak perlu npm install
    if (typeof ZXing === 'undefined') {
        throw new Error('ZXing library belum dimuat');
    }

    const codeReader = new ZXing.BrowserMultiFormatReader();
    const videoEl = document.getElementById(videoElementId);

    return new Promise((resolve, reject) => {
        codeReader.decodeFromVideoDevice(null, videoEl, (result, err) => {
            if (result) {
                codeReader.reset();
                resolve(result.getText());
            }
            // err bisa undefined di setiap frame — abaikan kecuali NotFoundException sudah lama
        });

        // Timeout 30 detik jika tidak ada barcode terbaca
        setTimeout(() => {
            codeReader.reset();
            reject(new Error('Timeout: barcode tidak terbaca dalam 30 detik'));
        }, 30000);
    });
}

// ── Scan Barcode Modal ────────────────────────────────────────

function openBarcodeScannerModal(onSuccess) {
    const existing = document.getElementById('barcode-scanner-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'barcode-scanner-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center';
    modal.innerHTML = `
        <p style="color:#fff;margin-bottom:12px;font-size:14px">Arahkan kamera ke barcode produk</p>
        <video id="barcode-scanner-video" style="width:100%;max-width:400px;border-radius:8px"></video>
        <button id="btn-cancel-scan" style="margin-top:16px;padding:10px 24px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">Batal</button>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-cancel-scan').onclick = () => modal.remove();

    initBarcodeScanner('barcode-scanner-video')
        .then(code => {
            modal.remove();
            onSuccess(code);
        })
        .catch(err => {
            modal.remove();
            if (err.message !== 'Timeout: barcode tidak terbaca dalam 30 detik') return;
            showToast(err.message, 'error');
        });
}
