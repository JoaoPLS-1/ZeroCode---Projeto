Add-Type -AssemblyName System.Drawing

$h = 125

# 1. room_dev: Edu at (530, 625), Rick at (1120, 555), Player at (836, 760)
$devBg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/backgrounds/fase1/sala-dev.png"))
$bmp1 = New-Object System.Drawing.Bitmap $devBg.Width, $devBg.Height
$g1 = [System.Drawing.Graphics]::FromImage($bmp1)
$g1.DrawImage($devBg, 0, 0, $devBg.Width, $devBg.Height)

$edu = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/edu.png"))
$eduW = [int]($edu.Width * $h / $edu.Height)
$g1.DrawImage($edu, (New-Object System.Drawing.Rectangle ([int](530 + $eduW/2)), ([int](625 - $h)), (-$eduW), $h))

$rick = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/rick.png"))
$rickW = [int]($rick.Width * $h / $rick.Height)
$g1.DrawImage($rick, [int](1120 - $rickW/2), [int](555 - $h), $rickW, $h)

$player = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/player/main/down.png"))
$pW = [int]($player.Width * $h / $player.Height)
$g1.DrawImage($player, [int](836 - $pW/2), [int](760 - $h), $pW, $h)

$bmp1.Save((Join-Path (Get-Location) "preview_dev_125.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g1.Dispose()
$bmp1.Dispose()
$devBg.Dispose()
$edu.Dispose()
$rick.Dispose()
$player.Dispose()

# 2. room_meeting: Livia at (970, 550)
$meetBg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/backgrounds/fase1/sala-reuniao.png"))
$bmp2 = New-Object System.Drawing.Bitmap $meetBg.Width, $meetBg.Height
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.DrawImage($meetBg, 0, 0, $meetBg.Width, $meetBg.Height)

$livia = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/livia.png"))
$liviaW = [int]($livia.Width * $h / $livia.Height)
$g2.DrawImage($livia, (New-Object System.Drawing.Rectangle ([int](970 + $liviaW/2)), ([int](550 - $h)), (-$liviaW), $h))

$bmp2.Save((Join-Path (Get-Location) "preview_meeting_125.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose()
$bmp2.Dispose()
$meetBg.Dispose()
$livia.Dispose()

# 3. room_qa_infra: Mark at (665, 650), Steve at (1310, 720)
$qaBg = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/backgrounds/fase1/sala-qa-infra.png"))
$bmp3 = New-Object System.Drawing.Bitmap $qaBg.Width, $qaBg.Height
$g3 = [System.Drawing.Graphics]::FromImage($bmp3)
$g3.DrawImage($qaBg, 0, 0, $qaBg.Width, $qaBg.Height)

$mark = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/mark.png"))
$markW = [int]($mark.Width * $h / $mark.Height)
$g3.DrawImage($mark, (New-Object System.Drawing.Rectangle ([int](665 + $markW/2)), ([int](650 - $h)), (-$markW), $h))

$steve = [System.Drawing.Image]::FromFile((Join-Path (Get-Location) "assets/npcs/steve.png"))
$steveW = [int]($steve.Width * $h / $steve.Height)
$g3.DrawImage($steve, [int](1310 - $steveW/2), [int](720 - $h), $steveW, $h)

$bmp3.Save((Join-Path (Get-Location) "preview_qa_125.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g3.Dispose()
$bmp3.Dispose()
$qaBg.Dispose()
$mark.Dispose()
$steve.Dispose()

Write-Output "All previews rendered"
