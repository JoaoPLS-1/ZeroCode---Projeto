Add-Type -AssemblyName System.Drawing

$bgPath = "assets/backgrounds/fase1/sala-dev.png"
$playerPath = "assets/player/main/down.png"
$npcPath = "assets/npcs/edu.png"

$bg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $bgPath))
$bmp = New-Object System.Drawing.Bitmap $bg.Width, $bg.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($bg, 0, 0, $bg.Width, $bg.Height)

# Current sizes: Player h=84 at (836, 760), NPC Edu h=92 at (530, 625)
$pImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $playerPath))
$pW = [int]($pImg.Width * 84 / $pImg.Height)
$g.DrawImage($pImg, [int](836 - $pW/2), [int](760 - 84), $pW, 84)

$nImg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) $npcPath))
$nW = [int]($nImg.Width * 92 / $nImg.Height)
$g.DrawImage($nImg, [int](530 - $nW/2), [int](625 - 92), $nW, 92)

# Also let's crop a 800x600 region around Edu (530, 625) and desk to inspect closely
$cropBmp = New-Object System.Drawing.Bitmap 800, 600
$cropG = [System.Drawing.Graphics]::FromImage($cropBmp)
$cropG.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, 800, 600), (New-Object System.Drawing.Rectangle 200, 250, 800, 600), [System.Drawing.GraphicsUnit]::Pixel)

$cropBmp.Save((Join-Path (Get-Location) "dev_room_crop_current.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$pImg.Dispose()
$nImg.Dispose()
$bg.Dispose()
$cropG.Dispose()
$cropBmp.Dispose()
$g.Dispose()
$bmp.Dispose()
Write-Output "Saved dev_room_crop_current.png"
