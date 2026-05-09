'use strict';

// BluetoothPrinter — hanya aktif di platform Android via Capacitor
// Menggunakan @e-is/capacitor-bluetooth-serial

class BluetoothPrinter {
    async getDevices() {
        const { BluetoothSerial } = await import('@e-is/capacitor-bluetooth-serial');
        const { devices } = await BluetoothSerial.list();
        return devices; // [{ name, address }]
    }

    async connect(address) {
        const { BluetoothSerial } = await import('@e-is/capacitor-bluetooth-serial');
        await BluetoothSerial.connect({ address });
    }

    async disconnect() {
        const { BluetoothSerial } = await import('@e-is/capacitor-bluetooth-serial');
        await BluetoothSerial.disconnect();
    }

    async printReceipt(transaction, storeName) {
        const { BluetoothSerial } = await import('@e-is/capacitor-bluetooth-serial');
        const text = this._buildReceiptText(transaction, storeName);
        const encoder = new TextEncoder();
        const data = Array.from(encoder.encode(text));
        await BluetoothSerial.write({ value: btoa(String.fromCharCode(...data)) });
    }

    _buildReceiptText(transaction, storeName) {
        const line = '-'.repeat(32);
        const fmt  = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
        const fmtDate = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';

        let text = '';
        text += `\x1B\x61\x01`;                                 // center align
        text += `${storeName}\n`;
        text += `${line}\n`;
        text += `\x1B\x61\x00`;                                 // left align
        text += `No: ${transaction.transaction_code || transaction.code}\n`;
        text += `Tgl: ${fmtDate(transaction.created_at)}\n`;
        text += `Kasir: ${transaction.cashier_name || '-'}\n`;
        text += `${line}\n`;

        const items = transaction.items || [];
        for (const item of items) {
            const name = item.product_name || item.name;
            text += `${name}\n`;
            text += `  ${item.quantity || item.qty} x ${fmt(item.price)} = ${fmt(item.subtotal)}\n`;
        }

        text += `${line}\n`;
        text += `Total   : ${fmt(transaction.total_amount || transaction.total)}\n`;
        text += `Bayar   : ${fmt(transaction.payment_amount || transaction.paid)}\n`;
        text += `Kembali : ${fmt(transaction.change_amount || transaction.change)}\n`;
        text += `${line}\n`;
        text += `\x1B\x61\x01Terima kasih!\n\n\n`;              // center + line feed
        text += `\x1D\x56\x42\x00`;                             // cut paper
        return text;
    }
}

const bluetoothPrinter = new BluetoothPrinter();

// Tampilkan dialog pilih printer jika ada lebih dari 1 device
async function showDevicePicker(devices) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';

        const box = document.createElement('div');
        box.style.cssText = 'background:#fff;border-radius:8px;padding:20px;min-width:260px;max-width:90vw';
        box.innerHTML = `<h3 style="margin:0 0 12px">Pilih Printer</h3>`;

        devices.forEach(dev => {
            const btn = document.createElement('button');
            btn.textContent = `${dev.name || 'Unknown'} (${dev.address})`;
            btn.style.cssText = 'display:block;width:100%;padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;background:#f9f9f9;cursor:pointer;text-align:left';
            btn.onclick = () => { document.body.removeChild(overlay); resolve(dev); };
            box.appendChild(btn);
        });

        const cancel = document.createElement('button');
        cancel.textContent = 'Batal';
        cancel.style.cssText = 'display:block;width:100%;padding:10px;border:none;background:#eee;border-radius:6px;cursor:pointer';
        cancel.onclick = () => { document.body.removeChild(overlay); resolve(null); };
        box.appendChild(cancel);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
}

// Fungsi utama cetak struk — dipanggil dari kasir.js
async function printReceiptAndroid(transaction) {
    if (window.APP_CONFIG?.platform !== 'android') {
        window.print(); // fallback browser print
        return;
    }

    let devices;
    try {
        devices = await bluetoothPrinter.getDevices();
    } catch (err) {
        showToast('Gagal mengakses Bluetooth: ' + err.message, 'error');
        return;
    }

    if (!devices || devices.length === 0) {
        showToast('Tidak ada printer Bluetooth ditemukan', 'error');
        return;
    }

    const selectedDevice = devices.length === 1
        ? devices[0]
        : await showDevicePicker(devices);

    if (!selectedDevice) return; // user cancel

    try {
        showToast('Menghubungkan ke printer...', 'info');
        await bluetoothPrinter.connect(selectedDevice.address);

        const storeName = window.APP_CONFIG?.storeName || 'POS System';
        await bluetoothPrinter.printReceipt(transaction, storeName);
        await bluetoothPrinter.disconnect();
        showToast('Struk berhasil dicetak', 'success');
    } catch (err) {
        showToast('Gagal mencetak: ' + err.message, 'error');
        try { await bluetoothPrinter.disconnect(); } catch (_) {}
    }
}
