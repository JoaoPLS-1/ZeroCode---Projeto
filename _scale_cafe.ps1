Add-Type -AssemblyName System.Drawing

# Test cafe room with Luna (735, 330) and Mateus (850, 335)
$bgCafe = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/backgrounds/fase1/sala-cafe.png"))
$lunaImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/luna.png"))
$mateusImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/mateus.png"))

foreach ($h in @(92, 120, 130)) {
    $bmp = New-Object System.Drawing.Bitmap $bgCafe.Width, $bgCafe.Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($bgCafe, 0, 0, $bgCafe.Width, $bgCafe.Height)

    # Luna facing right
    $lW = [int]($lunaImg.Width * $h / $lunaImg.Height)
    $g.DrawImage($lunaImg, [int](735 - $lW/2), [int](330 - $h), $lW, $h)

    # Mateus facing left (mirrored)
    $mW = [int]($mateusImg.Width * $h / $mateusImg.Height)
    $mRect = New-Object System.Drawing.Rectangle ([int](850 + $mW/2)), ([int](335 - $h)), (-$mW), $h
    $g.DrawImage($mateusImg, $mRect)

    # Crop around cafe table
    $cropBmp = New-Object System.Drawing.Bitmap 800, 600
    $cropG = [System.Drawing.Graphics]::FromImage($cropBmp)
    $cropG.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, 800, 600), (New-Object System.Drawing.Rectangle 400, 100, 800, 600), [System.Drawing.GraphicsUnit]::Pixel)
    $cropBmp.Save((Join-Path (Get-Location) "cafe_h_$h.png"), [System.Drawing.Imaging.ImageFormat]::Png)

    $cropG.Dispose()
    $cropBmp.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}

$lunaImg.Dispose()
$mateusImg.Dispose()
$bgCafe.Dispose()
Write-Output "Cafe test images generated"
