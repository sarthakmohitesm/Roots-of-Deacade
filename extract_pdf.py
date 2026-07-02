from pypdf import PdfReader

reader = PdfReader("d:/3D/root/E-Publicity Brochure 2026.pdf")
print("Total pages:", len(reader.pages))

text = ""
for i, page in enumerate(reader.pages):
    text += f"--- PAGE {i+1} ---\n"
    text += page.extract_text() + "\n"

with open("d:/3D/root/brochure_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Extraction complete.")
