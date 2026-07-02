import pdfplumber

pdf = pdfplumber.open("d:/3D/root/E-Publicity Brochure 2026.pdf")
print(f"Total pages: {len(pdf.pages)}")

with open("d:/3D/root/brochure_text2.txt", "w", encoding="utf-8") as f:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        f.write(f"--- PAGE {i+1} ---\n")
        if text:
            f.write(text + "\n\n")
        else:
            f.write("[NO TEXT EXTRACTED - likely image-based]\n\n")

pdf.close()
print("Done.")
