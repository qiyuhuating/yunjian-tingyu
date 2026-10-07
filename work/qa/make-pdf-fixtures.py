"""Optional fixture regeneration; requires reportlab==4.4.9, not an APK dependency."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pdfencrypt import StandardEncryption
target=Path(__file__).resolve().parent/'fixtures'
target.mkdir(exist_ok=True)
for name,encrypt,text in [('reading.pdf',None,'Actual PDF text'),('encrypted.pdf',StandardEncryption('test-pass'),'Encrypted PDF text')]:
    doc=canvas.Canvas(str(target/name),encrypt=encrypt,invariant=1)
    doc.drawString(50,750,text)
    doc.save()
