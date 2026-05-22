import os
from PIL import Image

def process_favicon():
    source_path = '/Users/kixel/.gemini/antigravity-ide/brain/f05e7d8f-b071-4566-aa84-5c90ea1bf5ec/media__1779436735482.png'
    dest_path = '/Users/kixel/Developer/Projects/KSPF/public/favicon.png'
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return
        
    img = Image.open(source_path).convert('RGBA')
    width, height = img.size
    print(f"Loaded source image: {width}x{height}")
    
    # We want to zoom in strictly on the gorgeous central faceted "eye" jewel of the feather.
    # The colorful faceted gemstone sits inside X=[245, 435] (width = 190) and Y=[65, 255] (height = 190).
    # Since width and height are both exactly 190 pixels, this is a perfect 1:1 square!
    # By cropping this perfect 1:1 square, we get ZERO padding, so it will fill 100% of the favicon canvas.
    min_x, max_x = 245, 435
    min_y, max_y = 65, 255
    
    cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    c_w, c_h = cropped.size
    print(f"Cropped square gem size: {c_w}x{c_h}")
    
    # Make background pixels transparent, and gemstone pixels fully opaque
    # Let's inspect corner pixels to determine background
    corners = [
        cropped.getpixel((0, 0)),
        cropped.getpixel((c_w - 1, 0)),
        cropped.getpixel((0, c_h - 1)),
        cropped.getpixel((c_w - 1, c_h - 1))
    ]
    r_avg = sum(c[0] for c in corners) / 4
    g_avg = sum(c[1] for c in corners) / 4
    b_avg = sum(c[2] for c in corners) / 4
    
    is_white_bg = (r_avg > 200 and g_avg > 200 and b_avg > 200)
    print("Detected background type:", "WHITE" if is_white_bg else "BLACK")
    
    threshold = 240 if is_white_bg else 15
    
    new_data = []
    for y in range(c_h):
        for x in range(c_w):
            pixel = cropped.getpixel((x, y))
            r, g, b, a = pixel
            
            is_bg = False
            if is_white_bg:
                if r >= threshold and g >= threshold and b >= threshold:
                    is_bg = True
            else:
                if r <= threshold and g <= threshold and b <= threshold:
                    is_bg = True
            
            if is_bg:
                new_data.append((0, 0, 0, 0)) # transparent background
            else:
                new_data.append((r, g, b, 255)) # opaque colored gem
                
    cropped.putdata(new_data)
    
    # Resize to standard high-res favicon size (512x512) for crisp rendering
    final_favicon = cropped.resize((512, 512), Image.Resampling.LANCZOS)
    
    # Save the file
    final_favicon.save(dest_path, 'PNG')
    print(f"Successfully processed and saved transparent square centered favicon to {dest_path}")

if __name__ == '__main__':
    process_favicon()
