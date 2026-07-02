# PowerShell script to run Tesseract OCR on brochure pages

$tesseractPath = "C:\Program Files\Tesseract-OCR\tesseract.exe"
$imagesDir = "d:\3D\root\brochure_pages"
$outputMergedFile = "d:\3D\root\brochure_ocr_text.txt"

# Clear output file if it exists
if (Test-Path $outputMergedFile) {
    Remove-Item $outputMergedFile
}

$images = Get-ChildItem -Path $imagesDir -Filter "*.png" | Sort-Object Name

foreach ($img in $images) {
    Write-Host "Running OCR on $($img.Name)..."
    
    # Define a temp file name for this page
    $tempTextFileBase = Join-Path $imagesDir ($img.BaseName + "_temp")
    $tempTextFile = $tempTextFileBase + ".txt"
    
    # Run Tesseract
    & $tesseractPath $img.FullName $tempTextFileBase --oem 1 --psm 3
    
    if (Test-Path $tempTextFile) {
        $content = Get-Content -Path $tempTextFile -Raw
        
        Add-Content -Path $outputMergedFile -Value "--- PAGE $($img.BaseName) ---"
        Add-Content -Path $outputMergedFile -Value $content
        Add-Content -Path $outputMergedFile -Value "`n`n"
        
        # Clean up temp file
        Remove-Item $tempTextFile
    } else {
        Write-Warning "Failed to generate OCR text for $($img.Name)"
    }
}

Write-Host "OCR processing complete! Merged text saved in $outputMergedFile"
