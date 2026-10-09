"""Encode only the six bundled UI illustrations, preserving every RGBA byte.

Requires Pillow 12.3+ with WebP support. Run from any directory:
  python scripts/optimize-ui-images.py --source /path/to/original/public --output /path/to/new/public
User attachments and PNG character cards are deliberately outside this allowlist.
"""
from pathlib import Path
import argparse
import hashlib
import io
import json
from PIL import Image, features

NAMES = ('button-sprite', 'dock-sprite', 'cloud-pet', 'music-listen', 'via-browser', 'wallpaper')

def optimize(source, output):
    if not features.check('webp'):
        raise RuntimeError('Pillow was built without WebP support')
    output.mkdir(parents=True, exist_ok=True)
    rows = []
    staged = []
    for name in NAMES:
        path = source / (name + '.png')
        original = path.read_bytes()
        with Image.open(io.BytesIO(original)) as image:
            if image.mode not in ('RGB', 'RGBA') or getattr(image, 'n_frames', 1) != 1:
                raise ValueError(f'Expected a single RGB/RGBA frame: {path}')
            pixels = image.convert('RGBA').tobytes()
            if any(key in image.info for key in ('gamma', 'srgb', 'chromaticity')):
                raise ValueError(f'Review color interpretation before conversion: {path}')
            options = dict(lossless=True, exact=True, method=6, quality=100)
            if image.info.get('icc_profile'):
                options['icc_profile'] = image.info['icc_profile']
            buffer = io.BytesIO()
            image.save(buffer, format='WEBP', **options)
            encoded = buffer.getvalue()
            with Image.open(io.BytesIO(encoded)) as decoded:
                if decoded.size != image.size or decoded.convert('RGBA').tobytes() != pixels:
                    raise ValueError(f'Pixel or resolution mismatch: {path}')
                if decoded.info.get('icc_profile') != image.info.get('icc_profile'):
                    raise ValueError(f'ICC profile mismatch: {path}')
            if len(encoded) >= len(original):
                raise ValueError(f'WebP does not save bytes: {path}; retain the original PNG')
            rows.append(dict(source=name + '.png', output=name + '.webp', width=image.width,
                             height=image.height, before=len(original), after=len(encoded),
                             saved_bytes=len(original)-len(encoded), rgba_exact=True,
                             source_sha256=hashlib.sha256(original).hexdigest(),
                             output_sha256=hashlib.sha256(encoded).hexdigest()))
            staged.append((output / (name + '.webp'), encoded))
    # Validate the entire set before making any output visible; never remove originals.
    for target, encoded in staged:
        temporary = target.with_suffix('.webp.tmp')
        temporary.write_bytes(encoded)
        temporary.replace(target)
    return dict(codec='WebP lossless, exact=True, method=6, quality=100', images=rows,
                before=sum(row['before'] for row in rows), after=sum(row['after'] for row in rows))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    report = optimize(args.source, args.output)
    payload = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(payload, encoding='utf-8')
    print(payload)
