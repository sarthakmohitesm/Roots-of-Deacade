import pypdfium2 as pdfium
import os

pdf = pdfium.PdfDocument("d:/3D/root/E-Publicity Brochure 2026.pdf")
out_dir = "d:/3D/root/brochure_pages"
os.makedirs(out_dir, exist_ok=True)

for i in range(len(pdf)):
    page = pdf[i]
    # Render at 2x for readability
    bitmap = page.render(scale=2)
    img = bitmap.to_pil()
    img.save(os.path.join(out_dir, f"page_{i+1:02d}.png"))
    print(f"Saved page {i+1}")

pdf.close()
print("All pages saved.")
