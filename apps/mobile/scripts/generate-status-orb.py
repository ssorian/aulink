"""Author the soft orb's alpha mask; runtime tint supplies the attendance color.

Procedural UI effect, no stock/model imagery. Requires Pillow only offline.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, PngImagePlugin

size = 512
alpha = Image.new('L', (size, size), 0)
ImageDraw.Draw(alpha).ellipse((120, 120, 392, 392), fill=255)
alpha = alpha.filter(ImageFilter.GaussianBlur(38))
image = Image.new('RGBA', alpha.size, (255, 255, 255, 0))
image.putalpha(alpha)
meta = PngImagePlugin.PngInfo()
meta.add_text('Source', 'Procedural blurred sphere; apps/mobile/scripts/generate-status-orb.py')
path = Path(__file__).resolve().parent.parent / 'assets/images/status-orb.png'
image.save(path, pnginfo=meta, optimize=True)
print(path)
