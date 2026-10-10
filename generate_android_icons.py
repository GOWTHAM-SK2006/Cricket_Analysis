import os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def generate_icons():
    # 1. Load source CPI logo
    src_path = os.path.join("frontend", "public", "cpi-logo.png")
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source logo not found at {src_path}")
    
    src = Image.open(src_path).convert("RGB")
    arr = np.array(src, dtype=float)
    
    # 2. Extract clean alpha channel (remove off-white background)
    bg_color = np.array([244.0, 244.0, 244.0])
    dist = np.sqrt(np.sum((arr - bg_color)**2, axis=2))
    
    # Smooth antialiased cutoff
    alpha = np.clip((dist - 18.0) / 22.0, 0.0, 1.0) * 255.0
    rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
    cleaned = Image.fromarray(rgba, "RGBA")
    
    # Crop to content bounding box
    mask = alpha > 15
    coords = np.argwhere(mask)
    ymin, xmin = coords.min(axis=0)
    ymax, xmax = coords.max(axis=0)
    
    # Add 2px margin around logo
    ymin = max(0, ymin - 2)
    xmin = max(0, xmin - 2)
    ymax = min(src.height - 1, ymax + 2)
    xmax = min(src.width - 1, xmax + 2)
    
    logo = cleaned.crop((xmin, ymin, xmax + 1, ymax + 1))
    logo_w, logo_h = logo.size
    print(f"Extracted logo dimensions: {logo_w}x{logo_h}")
    
    # Target densities and sizes
    # (density_name, standard_icon_size, foreground_icon_size)
    densities = [
        ("mdpi", 48, 108),
        ("hdpi", 72, 162),
        ("xhdpi", 96, 216),
        ("xxhdpi", 144, 324),
        ("xxxhdpi", 192, 432),
    ]
    
    res_dir = os.path.join("android", "app", "src", "main", "res")
    
    for density, std_size, fg_size in densities:
        folder = os.path.join(res_dir, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)
        
        # ---------------------------------------------------------
        # A. Generate ic_launcher_foreground.png (Adaptive Foreground)
        # ---------------------------------------------------------
        # Target height is ~64% of fg_size to guarantee 100% safe zone clearance
        fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        target_h = int(fg_size * 0.64)
        target_w = int(logo_w * (target_h / logo_h))
        
        scaled_logo = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        pos_x = (fg_size - target_w) // 2
        pos_y = (fg_size - target_h) // 2
        fg_canvas.paste(scaled_logo, (pos_x, pos_y), scaled_logo)
        
        fg_path = os.path.join(folder, "ic_launcher_foreground.png")
        fg_canvas.save(fg_path, "PNG")
        print(f"Saved: {fg_path} ({fg_size}x{fg_size})")
        
        # ---------------------------------------------------------
        # B. Generate ic_launcher.png (Standard / Rounded Squircle)
        # ---------------------------------------------------------
        # Crisp white background with rounded corners and subtle border
        std_canvas = Image.new("RGBA", (std_size, std_size), (0, 0, 0, 0))
        draw_std = ImageDraw.Draw(std_canvas)
        
        corner_radius = max(4, int(std_size * 0.18))
        # Draw soft border and white fill
        draw_std.rounded_rectangle(
            [(1, 1), (std_size - 2, std_size - 2)],
            radius=corner_radius,
            fill=(255, 255, 255, 255),
            outline=(226, 232, 240, 255),
            width=1
        )
        
        # Logo inside standard launcher (~76% of canvas height)
        logo_h_std = int(std_size * 0.76)
        logo_w_std = int(logo_w * (logo_h_std / logo_h))
        scaled_std = logo.resize((logo_w_std, logo_h_std), Image.Resampling.LANCZOS)
        
        pos_x_std = (std_size - logo_w_std) // 2
        pos_y_std = (std_size - logo_h_std) // 2
        std_canvas.paste(scaled_std, (pos_x_std, pos_y_std), scaled_std)
        
        std_path = os.path.join(folder, "ic_launcher.png")
        std_canvas.save(std_path, "PNG")
        print(f"Saved: {std_path} ({std_size}x{std_size})")
        
        # ---------------------------------------------------------
        # C. Generate ic_launcher_round.png (Round Launcher)
        # ---------------------------------------------------------
        round_canvas = Image.new("RGBA", (std_size, std_size), (0, 0, 0, 0))
        draw_round = ImageDraw.Draw(round_canvas)
        
        # Draw white circle
        draw_round.ellipse(
            [(1, 1), (std_size - 2, std_size - 2)],
            fill=(255, 255, 255, 255),
            outline=(226, 232, 240, 255),
            width=1
        )
        
        # Logo inside round launcher (~70% of diameter so it never clips)
        logo_h_round = int(std_size * 0.70)
        logo_w_round = int(logo_w * (logo_h_round / logo_h))
        scaled_round = logo.resize((logo_w_round, logo_h_round), Image.Resampling.LANCZOS)
        
        pos_x_round = (std_size - logo_w_round) // 2
        pos_y_round = (std_size - logo_h_round) // 2
        round_canvas.paste(scaled_round, (pos_x_round, pos_y_round), scaled_round)
        
        round_path = os.path.join(folder, "ic_launcher_round.png")
        round_canvas.save(round_path, "PNG")
        print(f"Saved: {round_path} ({std_size}x{std_size})")

    # ---------------------------------------------------------
    # D. Generate Splash Screens with CPI Logo (Centered on White)
    # ---------------------------------------------------------
    splash_targets = [
        ("drawable", 480, 320),
        ("drawable-land-hdpi", 800, 480),
        ("drawable-land-mdpi", 480, 320),
        ("drawable-land-xhdpi", 1280, 720),
        ("drawable-land-xxhdpi", 1600, 960),
        ("drawable-land-xxxhdpi", 1920, 1280),
        ("drawable-port-hdpi", 480, 800),
        ("drawable-port-mdpi", 320, 480),
        ("drawable-port-xhdpi", 720, 1280),
        ("drawable-port-xxhdpi", 960, 1600),
        ("drawable-port-xxxhdpi", 1280, 1920),
    ]

    for d_name, sw, sh in splash_targets:
        splash_folder = os.path.join(res_dir, d_name)
        os.makedirs(splash_folder, exist_ok=True)
        splash_canvas = Image.new("RGBA", (sw, sh), (255, 255, 255, 255))
        
        # Scale logo to ~35% of the smaller dimension
        smaller_dim = min(sw, sh)
        target_logo_h = int(smaller_dim * 0.40)
        target_logo_w = int(logo_w * (target_logo_h / logo_h))
        
        scaled_splash_logo = logo.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)
        sp_x = (sw - target_logo_w) // 2
        sp_y = (sh - target_logo_h) // 2
        
        splash_canvas.paste(scaled_splash_logo, (sp_x, sp_y), scaled_splash_logo)
        sp_path = os.path.join(splash_folder, "splash.png")
        splash_canvas.save(sp_path, "PNG")
        print(f"Saved splash: {sp_path} ({sw}x{sh})")

    # 3. Clean up test file if it exists
    if os.path.exists("test_cropped.png"):
        os.remove("test_cropped.png")
        
    print("\nAll Android CPI launcher icons and splash screens generated successfully!")

if __name__ == "__main__":
    generate_icons()
