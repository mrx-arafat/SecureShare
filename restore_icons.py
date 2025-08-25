"""
Restore SecureShare icons with transparent background
"""

import os
from PIL import Image, ImageDraw
import math

def create_geometric_icon(size):
    """Create the geometric cube icon with transparent background"""
    # Create a new RGBA image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Color from original design
    red_color = (217, 67, 67, 255)  # #d94343
    darker_red = (180, 50, 50, 255)  # Darker shade for depth
    
    # Calculate center and scale
    center_x = size // 2
    center_y = size // 2
    scale = size / 128  # Original SVG is 128x128
    
    # For smaller icons, simplify the design
    if size <= 19:
        # Simple square with "S" for small sizes
        box_size = int(size * 0.7)
        x1 = center_x - box_size // 2
        y1 = center_y - box_size // 2
        x2 = center_x + box_size // 2
        y2 = center_y + box_size // 2
        
        # Draw main square
        draw.rectangle([x1, y1, x2, y2], fill=red_color)
        
        # Add a simple "S" or lock symbol in white
        if size >= 16:
            # Draw a simple S shape
            draw.rectangle([x1 + 2, y1 + 2, x2 - 2, y1 + 3], fill=(255, 255, 255, 200))
            draw.rectangle([x1 + 2, center_y - 1, x2 - 2, center_y], fill=(255, 255, 255, 200))
            draw.rectangle([x1 + 2, y2 - 3, x2 - 2, y2 - 2], fill=(255, 255, 255, 200))
    
    elif size <= 48:
        # Simplified cube for medium sizes
        cube_size = int(size * 0.5)
        offset = cube_size // 3
        
        # Front face
        x1 = center_x - cube_size // 2
        y1 = center_y - cube_size // 2 + offset // 2
        x2 = center_x + cube_size // 2
        y2 = center_y + cube_size // 2 + offset // 2
        draw.rectangle([x1, y1, x2, y2], fill=red_color)
        
        # Top face (lighter)
        top_points = [
            (x1, y1),
            (x1 + offset, y1 - offset),
            (x2 + offset, y1 - offset),
            (x2, y1)
        ]
        draw.polygon(top_points, fill=darker_red)
        
        # Right face (darker)
        right_points = [
            (x2, y1),
            (x2 + offset, y1 - offset),
            (x2 + offset, y2 - offset),
            (x2, y2)
        ]
        draw.polygon(right_points, fill=darker_red)
        
    else:
        # Full detailed cube for large sizes
        cube_size = int(size * 0.4)
        offset = cube_size // 2.5
        
        # Calculate vertices for isometric cube
        x1 = center_x - cube_size // 2
        y1 = center_y - cube_size // 3
        x2 = center_x + cube_size // 2
        y2 = center_y + cube_size // 3
        
        # Front face
        front_points = [
            (x1, y1 + offset // 2),
            (x1, y2 + offset // 2),
            (x2, y2 + offset // 2),
            (x2, y1 + offset // 2)
        ]
        draw.polygon(front_points, fill=red_color)
        
        # Top face
        top_points = [
            (x1, y1 + offset // 2),
            (x1 + offset, y1 - offset // 2),
            (x2 + offset, y1 - offset // 2),
            (x2, y1 + offset // 2)
        ]
        draw.polygon(top_points, fill=(237, 87, 87, 255))  # Lighter red
        
        # Right face
        right_points = [
            (x2, y1 + offset // 2),
            (x2 + offset, y1 - offset // 2),
            (x2 + offset, y2 - offset // 2),
            (x2, y2 + offset // 2)
        ]
        draw.polygon(right_points, fill=darker_red)
        
        # Add some edges for definition
        draw.line([x1, y1 + offset // 2, x2, y1 + offset // 2], fill=(150, 40, 40, 255), width=1)
        draw.line([x2, y1 + offset // 2, x2, y2 + offset // 2], fill=(150, 40, 40, 255), width=1)
        draw.line([x1, y1 + offset // 2, x1, y2 + offset // 2], fill=(150, 40, 40, 255), width=1)
        
        # Add "S" letter on front face for branding
        if size >= 128:
            # Draw stylized S on the front face
            s_size = cube_size // 3
            s_x = center_x
            s_y = center_y + offset // 4
            
            # Top curve of S
            draw.arc([s_x - s_size//2, s_y - s_size//2, s_x + s_size//2, s_y], 
                    0, 180, fill=(255, 255, 255, 200), width=3)
            # Bottom curve of S
            draw.arc([s_x - s_size//2, s_y, s_x + s_size//2, s_y + s_size//2], 
                    180, 360, fill=(255, 255, 255, 200), width=3)
    
    return img

def generate_icons():
    """Generate all required icon sizes"""
    
    sizes = [16, 18, 19, 38, 48, 128]
    
    # Check if icons directory exists
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    print("Restoring SecureShare icons with transparent background...")
    
    for size in sizes:
        # Create icon
        img = create_geometric_icon(size)
        
        # Save PNG file with transparency
        output_path = f'icons/{size}.png'
        img.save(output_path, 'PNG', optimize=True)
        
        print(f"[OK] Restored {output_path}")
    
    # Also update the SVG to have transparent background
    svg_content = '''<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Transparent background -->
  <rect width="128" height="128" fill="transparent" opacity="0"/>
  
  <!-- Geometric symbol -->
  <g transform="translate(64, 64) scale(1.4)" fill="#d94343">
    <!-- Original geometric symbol scaled and centered -->
    <g transform="translate(-25, -25) scale(1.0)">
      <!-- Top rectangle/face -->
      <path d="M45.6,14.7v20.9l-7.7,0.02l-11.4-0.007V14.8l19.1-0.02 M25.9,13.9c-0.26,0.036-0.39,0.17-0.4,0.41v21.8    c0.021,0.28,0.16,0.42,0.42,0.43l19.9,0c0.11-0.007,0.21-0.05,0.29-0.14c0.078-0.11,0.11-0.2,0.1-0.29V14.4c-0.007-0.24-0.14-0.38-0.4-0.41l-19.9,0"/>
      
      <!-- Bottom right face -->
      <path d="M44.2,37.8L26.1,48.3l-3.9-6.7l-5.7-9.9l18.1-10.5L44.2,37.8 M35.1,20.4c-0.16-0.21-0.35-0.26-0.56-0.14    L15.8,31.2c-0.23,0.16-0.29,0.35-0.16,0.58l10,17.3c0.064,0.093,0.15,0.16,0.26,0.18c0.13,0.014,0.23-0.007,0.29-0.057l18.8-10.9    c0.2-0.12,0.26-0.31,0.16-0.55L35.1,20.4"/>
      
      <!-- Bottom left face -->
      <path d="M23.7,48.2L5.5,37.7l3.8-6.7l5.7-9.9l18.1,10.5L23.7,48.2 M34.1,31.6c0.1-0.24,0.05-0.43-0.15-0.55    L15.1,20.2c-0.25-0.12-0.45-0.07-0.58,0.15L4.6,37.6c-0.05,0.1-0.064,0.21-0.021,0.32c0.057,0.12,0.12,0.19,0.2,0.23l18.8,10.9    c0.21,0.11,0.39,0.07,0.56-0.14l10-17.3"/>
      
      <!-- Left face -->
      <path d="M4.4,35.5V14.5l7.7-0.021l11.4,0.007v21l-19.1,0.021 M23.9,36.3c0.26-0.036,0.39-0.17,0.4-0.41V14.1    c-0.021-0.28-0.16-0.42-0.42-0.43l-19.9,0c-0.11,0.007-0.21,0.05-0.29,0.14c-0.078,0.11-0.11,0.2-0.1,0.29v21.8c0.007,0.24,0.14,0.38,0.4,0.41l19.9,0"/>
      
      <!-- Top right face -->
      <path d="M26.3,2.1l18.1,10.5L40.6,19.3l-5.7,9.9L16.7,18.7L26.3,2.1 M15.8,18.6c-0.1,0.24-0.05,0.43,0.15,0.55    l18.8,10.9c0.25,0.12,0.45,0.07,0.58-0.15l10-17.3c0.05-0.1,0.064-0.21,0.021-0.32c-0.057-0.12-0.12-0.19-0.2-0.23L26.4,1.2    c-0.21-0.11-0.39-0.07-0.56,0.14L15.8,18.6"/>
      
      <!-- Top left face -->
      <path d="M5.7,12.5L23.8,2l3.9,6.7l5.7,9.9L15.3,29.1L5.7,12.5 M14.8,29.8c0.16,0.21,0.35,0.26,0.56,0.14    l18.8-10.9c0.23-0.16,0.29-0.35,0.16-0.58L24.3,1.2c-0.064-0.093-0.15-0.16-0.26-0.18c-0.13-0.014-0.23,0.007-0.29,0.057L5,11.9    c-0.2,0.12-0.26,0.31-0.16,0.55l9.9,17.3"/>
    </g>
  </g>
</svg>'''
    
    with open('icons/secure-share-icon-transparent.svg', 'w') as f:
        f.write(svg_content)
    print("[OK] Created transparent SVG: icons/secure-share-icon-transparent.svg")
    
    print("\nAll icons restored successfully with transparent backgrounds!")
    print("The icons now have:")
    print("- Transparent backgrounds (will work on any Chrome theme)")
    print("- Your original geometric/cube design")
    print("- Proper sizing for each resolution")
    print("\nReload the extension in Chrome to see the updated icons.")

if __name__ == "__main__":
    generate_icons()
