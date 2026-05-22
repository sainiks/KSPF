import os
from PIL import Image

def inspect_favicon():
    path = '/Users/kixel/Developer/Projects/KSPF/public/favicon.png'
    if not os.path.exists(path):
        print("Favicon not found")
        return
    img = Image.open(path)
    print(f"Favicon size: {img.size}")
    print(f"Favicon mode: {img.mode}")
    
    # Check bounding box of active pixels (non-zero alpha)
    w, h = img.size
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    print(f"Active pixel bounding box in favicon.png: X=[{min_x}, {max_x}] ({max_x - min_x + 1} px), Y=[{min_y}, {max_y}] ({max_y - min_y + 1} px)")

if __name__ == '__main__':
    inspect_favicon()
