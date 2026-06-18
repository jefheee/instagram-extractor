import os
import sys
import json
import argparse
import shutil
import re
import traceback
from typing import List
import time
import lzma

try:
    import ollama
except ImportError:
    print(json.dumps({"status": "error", "message": "Missing dependency 'ollama'. Run: pip install ollama"}))
    sys.stdout.flush()
    sys.exit(1)

def print_log(log_data: dict) -> None:
    try:
        print(json.dumps(log_data))
        sys.stdout.flush()
    except Exception:
        pass

def ensure_folders(dest_dir: str):
    discard_dir = os.path.join(dest_dir, "Descartados")
    filtered_dir = os.path.join(dest_dir, "Filtrados")
    for d in [discard_dir, filtered_dir]:
        if not os.path.exists(d):
            try:
                os.makedirs(d, exist_ok=True)
            except Exception as e:
                print_log({"status": "error", "message": f"Failed to create folder {d}: {str(e)}"})
                sys.exit(1)
    return discard_dir, filtered_dir

def safe_copy_tree(src_folder: str, target_base: str) -> bool:
    try:
        if not os.path.exists(src_folder):
            return False
        
        folder_name = os.path.basename(src_folder)
        dest_path = os.path.join(target_base, folder_name)
        
        if os.path.exists(dest_path):
            dest_path = dest_path + f"_{int(time.time())}"
            
        shutil.copytree(src_folder, dest_path, dirs_exist_ok=True)
        return True
    except PermissionError as pe:
        print_log({"status": "error", "message": f"Permission denied copying {src_folder}: {str(pe)}"})
        return False
    except Exception as e:
        print_log({"status": "error", "message": f"Failed to copy {src_folder}: {str(e)}"})
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

def check_image_vision_ollama(img_path: str) -> bool:
    try:
        # Prompt from instructions
        prompt = "Responda apenas TRUE ou FALSE. Esta imagem é um aviso, panfleto, meme ou contém majoritariamente texto gráfico sobreposto, em vez de ser uma fotografia fotorealista de pessoas ou lugares?"
        
        res = ollama.chat(
            model="llava",
            messages=[{
                "role": "user",
                "content": prompt,
                "images": [img_path]
            }]
        )
        
        ans = res['message']['content'].strip().upper()
        if 'TRUE' in ans:
            return True
        return False
    except Exception as e:
        print_log({"status": "warning", "message": f"Ollama Vision failed for {os.path.basename(img_path)}: {str(e)}"})
        return False

def process_directory(source_dir: str, dest_dir: str, keywords: List[str], sensitivity: int) -> None:
    if not os.path.isdir(source_dir):
        print_log({"status": "error", "message": f"Source Directory not found: {source_dir}"})
        sys.exit(1)

    discard_dir, filtered_dir = ensure_folders(dest_dir)
    print_log({"status": "info", "message": f"Scanning {source_dir} -> Saving to {dest_dir}"})

    try:
        subdirs = [os.path.join(source_dir, d) for d in os.listdir(source_dir) 
                   if os.path.isdir(os.path.join(source_dir, d))]
    except Exception as e:
        print_log({"status": "error", "message": f"Failed to read source directory: {str(e)}"})
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
        
        # We can also parse JSON with lzma if needed, but not strictly requested for the condition,
        # prompt said: "importe a lib lzma se for ler metadados"
        
        should_discard = False
        reason = ""
        
        # Rule 1: Fast Heuristic (Text regex)
        for txt in txt_files:
            if check_text_keywords(os.path.join(folder, txt), keywords):
                should_discard = True
                reason = "keyword_match"
                break
                
        # Rule 2: CV Ollama Fallback
        # If sensitivity < 100, we use it. If it's 100 (soft), maybe we skip ollama?
        # Let's say sensitivity < 100 means we engage Ollama to be aggressive.
        if not should_discard and sensitivity < 100:
            for img in img_files:
                if check_image_vision_ollama(os.path.join(folder, img)):
                    should_discard = True
                    reason = "ollama_vision_llava"
                    break
        
        if should_discard:
            if safe_copy_tree(folder, discard_dir):
                discarded += 1
                print_log({"status": "moved", "reason": reason, "folder": folder_name})
        else:
            if safe_copy_tree(folder, filtered_dir):
                print_log({"status": "kept", "folder": folder_name})
            
        processed += 1
        print_log({"status": "progress", "processed": processed, "total": total_folders})
        
    print_log({"status": "done", "total": total_folders, "discarded": discarded})

def main():
    parser = argparse.ArgumentParser(description="Archive Cleaner Worker")
    parser.add_argument('--source', type=str, required=True, help="Absolute path to the source extraction directory")
    parser.add_argument('--destination', type=str, required=True, help="Absolute path to save results")
    parser.add_argument('--keywords', type=str, default="", help="Comma-separated keywords")
    parser.add_argument('--sensitivity', type=int, default=50, help="Clean level (0-100)")
    
    args = parser.parse_args()
    
    keywords = [k.strip() for k in args.keywords.split(',')] if args.keywords.strip() else []
    
    process_directory(args.source, args.destination, keywords, args.sensitivity)

if __name__ == '__main__':
    main()
