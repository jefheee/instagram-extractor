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
        metadata_files = [f for f in files if f.lower().endswith(('.txt', '.json', '.xz', '.json.xz'))]
        
        should_discard_entire = False
        reason = ""
        
        # Rule 1: Fast Heuristic (Text regex in .txt files)
        for txt in txt_files:
            if check_text_keywords(os.path.join(folder, txt), keywords):
                should_discard_entire = True
                reason = "keyword_match"
                break
                
        if should_discard_entire:
            # Move the ENTIRE folder to Descartados
            if safe_copy_tree(folder, discard_dir):
                discarded += 1
                print_log({"status": "moved", "reason": reason, "folder": folder_name})
        else:
            if sensitivity >= 100:
                # Soft mode: skip Ollama vision check entirely and keep whole folder
                if safe_copy_tree(folder, filtered_dir):
                    print_log({"status": "kept", "folder": folder_name})
            else:
                # Carousel logic with Ollama vision check on individual images
                dest_filtered_folder = os.path.join(filtered_dir, folder_name)
                dest_discarded_folder = os.path.join(discard_dir, folder_name)
                
                # Check for folder collisions and apply suffix if needed
                if os.path.exists(dest_filtered_folder) or os.path.exists(dest_discarded_folder):
                    suffix = f"_{int(time.time())}"
                    dest_filtered_folder += suffix
                    dest_discarded_folder += suffix
                
                # Pre-create the subfolders in both locations
                try:
                    os.makedirs(dest_filtered_folder, exist_ok=True)
                    os.makedirs(dest_discarded_folder, exist_ok=True)
                except Exception as e:
                    print_log({"status": "error", "message": f"Failed to create subfolders for {folder_name}: {str(e)}"})
                    continue
                
                # Copy base metadata files to both locations
                for meta in metadata_files:
                    src_meta = os.path.join(folder, meta)
                    try:
                        shutil.copy2(src_meta, os.path.join(dest_filtered_folder, meta))
                        shutil.copy2(src_meta, os.path.join(dest_discarded_folder, meta))
                    except Exception as e:
                        print_log({"status": "warning", "message": f"Failed to copy metadata {meta} for {folder_name}: {str(e)}"})
                
                kept_imgs = []
                discarded_imgs = []
                total_imgs = len(img_files)
                
                for idx, img in enumerate(img_files):
                    img_path = os.path.join(folder, img)
                    is_text = False
                    
                    try:
                        # Call Ollama
                        is_text = check_image_vision_ollama(img_path)
                    except Exception as e:
                        print_log({"status": "warning", "message": f"Ollama model error on {img}: {str(e)}"})
                        # Default to False (photo) on vision failure
                        is_text = False
                    
                    if is_text:
                        discarded_imgs.append(img)
                        try:
                            shutil.copy2(img_path, os.path.join(dest_discarded_folder, img))
                        except Exception as e:
                            print_log({"status": "error", "message": f"Failed to copy discarded image {img}: {str(e)}"})
                    else:
                        kept_imgs.append(img)
                        try:
                            shutil.copy2(img_path, os.path.join(dest_filtered_folder, img))
                        except Exception as e:
                            print_log({"status": "error", "message": f"Failed to copy kept image {img}: {str(e)}"})
                    
                    # Print log at file level
                    print_log({
                        "status": "info",
                        "message": f"[✓] Imagem {idx + 1} de {total_imgs} validada ({img})"
                    })
                
                # Post-processing clean up and status reporting
                if len(discarded_imgs) == 0:
                    # Nothing discarded. Clean up empty folder in Descartados
                    try:
                        shutil.rmtree(dest_discarded_folder)
                    except Exception:
                        pass
                    print_log({"status": "kept", "folder": folder_name})
                elif len(kept_imgs) == 0:
                    # Everything discarded. Clean up empty folder in Filtrados
                    try:
                        shutil.rmtree(dest_filtered_folder)
                    except Exception:
                        pass
                    print_log({"status": "moved", "reason": "ollama_vision_llava", "folder": folder_name})
                    discarded += 1
                else:
                    # Truly split
                    print_log({
                        "status": "kept",
                        "folder": f"{folder_name} (Dividido: {len(kept_imgs)} fotos mantidas)"
                    })
                    print_log({
                        "status": "moved",
                        "reason": "ollama_vision_split",
                        "folder": f"{folder_name} (Dividido: {len(discarded_imgs)} imagens de texto descartadas)"
                    })
                    discarded += 1
            
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
