# PowerShell script to perform OCR on all brochure page images using Windows OCR API

# Load necessary assemblies
[void][Windows.Security.Credentials.PasswordVault, Windows.Security.Credentials, ContentType = WindowsRuntime]
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]

$imagesDir = "d:\3D\root\brochure_pages"
$outputFile = "d:\3D\root\brochure_ocr_text.txt"

# Clear output file if it exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
Write-Host "Using OCR Language: $($engine.RecognizerLanguage.DisplayName)"

$images = Get-ChildItem -Path $imagesDir -Filter "*.png" | Sort-Object Name

foreach ($img in $images) {
    Write-Host "Processing $($img.Name)..."
    try {
        $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($img.FullName).GetResults()
        $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetResults()
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
        
        # GetSoftwareBitmapAsync is required for OcrEngine
        $softwareBitmap = $decoder.GetSoftwareBitmapAsync().GetResults()
        
        $ocrResult = $engine.RecognizeAsync($softwareBitmap).GetResults()
        
        Add-Content -Path $outputFile -Value "--- PAGE $($img.BaseName) ---"
        Add-Content -Path $outputFile -Value $ocrResult.Text
        Add-Content -Path $outputFile -Value "`n"
    } catch {
        Write-Error "Error processing $($img.Name): $_"
    }
}

Write-Host "OCR processing complete. Output saved to $outputFile"
