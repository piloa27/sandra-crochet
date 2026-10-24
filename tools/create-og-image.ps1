# Genera una tarjeta social propia, sin descargar fotos de Internet.
param([string]$ProductImage = (Join-Path $PSScriptRoot '..\assets\img\og-conjunto-verde.png'))
Add-Type -AssemblyName System.Drawing
$projectPath = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $projectPath 'assets\img\og-image.jpg'
$bitmap = New-Object System.Drawing.Bitmap 1200,630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
function Brush([string]$color) { return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color)) }
$cream = Brush '#fbf6ef'; $rose = Brush '#ad6265'; $blush = Brush '#efd3ce'; $earth = Brush '#72534a'; $white = Brush '#fffdf9'
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#fbf6ef'))
$graphics.FillEllipse($blush,920,-90,400,400)
$graphics.FillEllipse($blush,-100,490,320,300)
$small = New-Object System.Drawing.Font 'Arial',12,([System.Drawing.FontStyle]::Bold)
$title = New-Object System.Drawing.Font 'Georgia',43,([System.Drawing.FontStyle]::Regular)
$subtitle = New-Object System.Drawing.Font 'Arial',21,([System.Drawing.FontStyle]::Regular)
$quote = New-Object System.Drawing.Font 'Georgia',20,([System.Drawing.FontStyle]::Italic)
$graphics.DrawString('HECHO A MANO EN URUGUAY',$small,$rose,78,119)
$graphics.DrawString('Sandra Crochet',$title,$earth,72,178)
$graphics.DrawString(('Crochet artesanal para beb' + [char]0x00E9 + 's'),$subtitle,$earth,78,284)
$graphics.FillRectangle($blush,80,354,92,4)
$graphics.DrawString(('Peque' + [char]0x00F1 + 'as creaciones,'),$quote,$rose,78,390)
$graphics.DrawString('hechas con mucho amor',$quote,$rose,78,435)
if ($ProductImage -and (Test-Path -LiteralPath $ProductImage)) {
  $product = [System.Drawing.Image]::FromFile($ProductImage)
  $ratio = [Math]::Min(490 / $product.Width,480 / $product.Height)
  $width = [int]($product.Width * $ratio); $height = [int]($product.Height * $ratio)
  $graphics.DrawImage($product, [int](895-$width/2), [int](315-$height/2),$width,$height)
  $product.Dispose()
} else {
  $graphics.FillEllipse($blush,845,175,240,240)
  $graphics.DrawString('SC',$title,$rose,880,250)
}
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),([long]88)
$bitmap.Save($destination,$codec,$parameters)
$parameters.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
@($cream,$rose,$blush,$earth,$white,$small,$title,$subtitle,$quote) | ForEach-Object { $_.Dispose() }
Write-Output $destination
