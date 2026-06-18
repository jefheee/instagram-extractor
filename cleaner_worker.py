import os
import sys
import json
import argparse
import shutil
import re
import traceback
from typing import List
import time

try:
    import pytesseract
    from PIL import Image, UnidentifiedImageError
except ImportError:
    print(json.dumps({"status": "error", "message": "Missing dependencies. Please ensure 'pytesseract' and 'Pillow' are installed."}))
    sys.stdout.flush()
    sys.exit(1)

def print_log(log_data: dict) -> None:
    try:
        print(json.dumps(log_data))
        sys.stdout.flush()
    except Exception:
        pass

def ensure_discard_folder(base_dir: str) -> str:
    discard_dir = os.path.join(base_dir, "Descartados")
    if not os.path.exists(discard_dir):
        try:
            os.makedirs(discard_dir, exist_ok=True)
        except Exception as e:
            print_log({"status": "error", "message": f"Failed to create discard folder: {str(e)}"})
            sys.exit(1)
    return discard_dir

def safe_move(source: str, dest_dir: str) -> bool:
    try:
        if not os.path.exists(source):
            return False
        
        filename = os.path.basename(source)
        dest_path = os.path.join(dest_dir, filename)
        
        if os.path.exists(dest_path):
            base, ext = os.path.splitext(filename)
            dest_path = os.path.join(dest_dir, f"{base}_{int(time.time())}{ext}")
            
        shutil.move(source, dest_path)
        return True
    except PermissionError as pe:
        print_log({"status": "error", "message": f"Permission denied when moving {source}: {str(pe)}"})
        return False
    except Exception as e:
        print_log({"status": "error", "message": f"Failed to move {source}: {str(e)}"})
        return False

def check_text_keywords(txt_path: str, keywords: List[str]) -> bool:
    if not os.path.exists(txt_path) or not keywords:
        return False
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read().lower()
            for kw in keywords:
                if kw and re.search(r'\b' + re.escape(kw.lower()) + r'\b', content):
                    return True
    except Exception as e:
        print_log({"status": "warning", "message": f"Could not read text file {txt_path}: {str(e)}"})
    return False

def check_image_ocr(img_path: str, sensitivity: int) -> bool:
    if sensitivity <= 0:
        return False
    try:
        with Image.open(img_path) as img:
            text = pytesseract.image_to_string(img)
            char_count = len("".join(text.split()))
            if char_count >= sensitivity:
                return True
    except UnidentifiedImageError:
        print_log({"status": "warning", "message": f"Unidentified image format: {os.path.basename(img_path)}"})
    except Exception as e:
        print_log({"status": "warning", "message": f"OCR failed for {os.path.basename(img_path)}: {str(e)}"})
    return False

def process_directory(base_dir: str, keywords: List[str], sensitivity: int) -> None:
    if not os.path.isdir(base_dir):
        print_log({"status": "error", "message": f"Directory not found: {base_dir}"})
        sys.exit(1)

    discard_dir = ensure_discard_folder(base_dir)
    print_log({"status": "info", "message": f"Starting cleanup in {base_dir}"})

    try:
        subdirs = [os.path.join(base_dir, d) for d in os.listdir(base_dir) 
                   if os.path.isdir(os.path.join(base_dir, d)) and d != "Descartados"]
    except Exception as e:
        print_log({"status": "error", "message": f"Failed to read directory {base_dir}: {str(e)}"})
        sys.exit(1)

    total_folders = len(subdirs)
    print_log({"status": "start", "total": total_folders})
    
    processed = 0
    discarded = 0
    
    for folder in subdirs:
        folder_name = os.path.basename(folder)
        try:
            files = os.listdir(folder)
        except Exception as e:
            print_log({"status": "error", "message": f"Failed to read folder {folder_name}: {str(e)}"})
            continue
            
        txt_files = [f for f in files if f.lower().endswith('.txt')]
        img_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        
        should_discard = False
        reason = ""
        
        # Rule 1: Text regex
        for txt in txt_files:
            if check_text_keywords(os.path.join(folder, txt), keywords):
                should_discard = True
                reason = "keyword_match"
                break
                
        # Rule 2: OCR
        if not should_discard and sensitivity > 0:
            for img in img_files:
                if check_image_ocr(os.path.join(folder, img), sensitivity):
                    should_discard = True
                    reason = "ocr_sensitivity"
                    break
        
        if should_discard:
            if safe_move(folder, discard_dir):
                discarded += 1
                print_log({"status": "moved", "reason": reason, "folder": folder_name})
        else:
            print_log({"status": "kept", "folder": folder_name})
            
        processed += 1
        print_log({"status": "progress", "processed": processed, "total": total_folders})
        
    print_log({"status": "done", "total": total_folders, "discarded": discarded})

def main():
    parser = argparse.ArgumentParser(description="Archive Cleaner Worker")
    parser.add_argument('--dir', type=str, required=True, help="Absolute path to the extraction directory")
    parser.add_argument('--keywords', type=str, default="", help="Comma-separated keywords")
    parser.add_argument('--sensitivity', type=int, default=50, help="OCR character count threshold")
    
    args = parser.parse_args()
    
    keywords = [k.strip() for k in args.keywords.split(',')] if args.keywords.strip() else []
    
    process_directory(args.dir, keywords, args.sensitivity)

if __name__ == '__main__':
    main()
