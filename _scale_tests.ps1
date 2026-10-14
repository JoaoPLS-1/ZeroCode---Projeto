Add-Type -AssemblyName System.Drawing

$bgPath = "assets/backgrounds/fase1/sala-dev.png"
$playerPath = "assets/player/main/down.png"
$npcPath = "assets/npcs/edu.png"

$scales = @(92, 120, 135, 145, 155)

foreach ($targetH in $scales) {
    $bg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $bgPath))
    $bmp = New-Object System.Drawing.Bitmap $bg.Width, $bg.Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($bg, 0, 0, $bg.Width, $bg.Height)

    # Player at (836, 760)
    $pImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $playerPath))
    # Note: opaque height ratio for down.png is 1464/1536 = 0.953, width is 786/1024
    $pW = [int]($pImg.Width * $targetH / $pImg.Height)
    $g.DrawImage($pImg, [int](836 - $pW/2), [int](760 - $targetH), $pW, $targetH)

    # NPC Edu at (530, 625)
    $nImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $npcPath))
    $nW = [int]($nImg.Width * $targetH / $nImg.Height)
    $g.DrawImage($nImg, [int](530 - $nW/2), [int](625 - $targetH), $nW, $targetH)

    # Crop around Edu and the desk chair (x: 200..1000, y: 250..850)
    $cropBmp = New-Object System.Drawing.Bitmap 800, 600
    $cropG = [System.Drawing.Graphics]::FromImage($cropBmp)
    $cropG.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, 800, 600), (New-Object System.Drawing.Rectangle 200, 250, 800, 600), [System.Drawing.GraphicsUnit]::Pixel)

    $cropBmp.Save((Join-Path (Get-Location) "dev_room_h_$targetH.png"), [System.Drawing.Imaging.ImageFormat]::Png)

    $pImg.Dispose()
    $nImg.Dispose()
    $bg.Dispose()
    $cropG.Dispose()
    $cropBmp.Dispose()
    $g.Dispose()
    $bmp.Dispose()
}
Write-Output "Generated scale test images"
