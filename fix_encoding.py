file = r'd:\Develop\Destop\Project_POS\desktop\src\views\products.html'
with open(file, 'rb') as f:
    raw = f.read()

# Show hex around corrupt sequences to identify the exact byte patterns
markers = [b'Cetak Label Terpilih', b'Cari nama produk', b'Cetak Label Barcode',
           b'Refresh Preview', b'Download Template', b'Gunakan printer']
for m in markers:
    idx = raw.find(m)
    if idx >= 0:
        print(f"Before '{m.decode()}': {raw[idx-12:idx].hex()}")
