import os
import sys
import json
import argparse
import shutil
import re
import traceback
from typing import List
from concurrent.futures import ThreadPoolExecutor

try:
    import ollama
except ImportError:
    pass # Tratado no main se necessário

def print_log(log_data: dict) -> None:
    try:
        print(json.dumps(log_data))
        sys.stdout.flush()
    except Exception:
        pass

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
        print_log({"status": "warning", "message": f"Ollama model error on {os.path.basename(img_path)}: {str(e)}"})
        return False

def copy_file_safe(src: str, dest: str):
    try:
        shutil.copy2(src, dest)
    except Exception as e:
        print_log({"status": "warning", "message": f"Falha ao copiar {src}: {str(e)}"})

def process_directory(source_dir: str, dest_dir: str, keywords: List[str], sensitivity: int, disable_ocr: bool) -> None:
    if not os.path.isdir(source_dir):
        print_log({"status": "error", "message": f"Source Directory not found: {source_dir}"})
        sys.exit(1)

    discard_dir = os.path.join(dest_dir, "Descartados")
    filtered_dir = os.path.join(dest_dir, "Filtrados")

    print_log({"status": "info", "message": f"Scanning {source_dir} -> Saving to {dest_dir}"})

    try:
        profiles = [d for d in os.listdir(source_dir) if os.path.isdir(os.path.join(source_dir, d))]
    except Exception as e:
        print_log({"status": "error", "message": f"Failed to read source directory: {str(e)}"})
        sys.exit(1)

    total_posts = 0
    discarded_posts = 0
    processed_posts = 0

    profile_posts_map = {}
    for profile in profiles:
        profile_path = os.path.join(source_dir, profile)
        try:
            files = os.listdir(profile_path)
            txt_files = [f for f in files if f.lower().endswith('.txt')]
            base_names = [f[:-4] for f in txt_files] 
            
            base_names = list(set(base_names))
            
            profile_posts_map[profile] = {
                "base_names": base_names,
                "all_files": files,
                "profile_path": profile_path
            }
            total_posts += len(base_names)
        except Exception:
            continue

    print_log({"status": "start", "total": total_posts})
    
    executor = ThreadPoolExecutor(max_workers=8)

    for profile, data in profile_posts_map.items():
        base_names = data["base_names"]
        files = data["all_files"]
        profile_path = data["profile_path"]

        profile_filtered_dir = os.path.join(filtered_dir, profile)
        profile_discard_dir = os.path.join(discard_dir, profile)

        for base_name in base_names:
            post_files = [f for f in files if f.startswith(base_name)]
            txt_file = f"{base_name}.txt"
            
            should_discard_entire = False
            reason = ""
            
            if txt_file in post_files:
                if check_text_keywords(os.path.join(profile_path, txt_file), keywords):
                    should_discard_entire = True
                    reason = "keyword_match"

            post_dest_filtered = os.path.join(profile_filtered_dir, base_name)
            post_dest_discarded = os.path.join(profile_discard_dir, base_name)
            
            if should_discard_entire:
                os.makedirs(post_dest_discarded, exist_ok=True)
                futures = []
                for pf in post_files:
                    futures.append(executor.submit(copy_file_safe, os.path.join(profile_path, pf), os.path.join(post_dest_discarded, pf)))
                for f in futures: f.result()
                discarded_posts += 1
                print_log({"status": "moved", "reason": reason, "folder": f"{profile}/{base_name}"})
            else:
                if disable_ocr or sensitivity >= 100:
                    os.makedirs(post_dest_filtered, exist_ok=True)
                    futures = []
                    for pf in post_files:
                        futures.append(executor.submit(copy_file_safe, os.path.join(profile_path, pf), os.path.join(post_dest_filtered, pf)))
                    for f in futures: f.result()
                    print_log({"status": "info", "message": f"[INFO] Post agrupado e movido: {base_name} -> Filtrados"})
                    print_log({"status": "kept", "folder": f"{profile}/{base_name}"})
                else:
                    os.makedirs(post_dest_filtered, exist_ok=True)
                    os.makedirs(post_dest_discarded, exist_ok=True)
                    
                    img_files = [f for f in post_files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                    metadata_files = [f for f in post_files if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                    
                    futures = []
                    for meta in metadata_files:
                        futures.append(executor.submit(copy_file_safe, os.path.join(profile_path, meta), os.path.join(post_dest_filtered, meta)))
                        futures.append(executor.submit(copy_file_safe, os.path.join(profile_path, meta), os.path.join(post_dest_discarded, meta)))
                    for f in futures: f.result()
                    
                    kept_imgs = []
                    discarded_imgs = []
                    total_imgs = len(img_files)
                    
                    for idx, img in enumerate(img_files):
                        img_path = os.path.join(profile_path, img)
                        is_text = False
                        
                        try:
                            is_text = check_image_vision_ollama(img_path)
                        except Exception as e:
                            print_log({"status": "warning", "message": f"Ollama model error on {img}: {str(e)}"})
                            is_text = False
                        
                        if is_text:
                            discarded_imgs.append(img)
                            copy_file_safe(img_path, os.path.join(post_dest_discarded, img))
                        else:
                            kept_imgs.append(img)
                            copy_file_safe(img_path, os.path.join(post_dest_filtered, img))
                        
                        print_log({
                            "status": "info",
                            "message": f"[✓] Imagem {idx + 1} de {total_imgs} validada ({img})"
                        })
                    
                    if len(discarded_imgs) == 0:
                        try: shutil.rmtree(post_dest_discarded)
                        except: pass
                        print_log({"status": "info", "message": f"[INFO] Post agrupado e movido: {base_name} -> Filtrados"})
                        print_log({"status": "kept", "folder": f"{profile}/{base_name}"})
                    elif len(kept_imgs) == 0:
                        try: shutil.rmtree(post_dest_filtered)
                        except: pass
                        print_log({"status": "moved", "reason": "ollama_vision_llava", "folder": f"{profile}/{base_name}"})
                        discarded_posts += 1
                    else:
                        print_log({"status": "kept", "folder": f"{profile}/{base_name} (Dividido: {len(kept_imgs)} fotos mantidas)"})
                        print_log({"status": "moved", "reason": "ollama_vision_split", "folder": f"{profile}/{base_name} (Dividido: {len(discarded_imgs)} imagens de texto descartadas)"})
                        discarded_posts += 1

            processed_posts += 1
            print_log({"status": "progress", "processed": processed_posts, "total": total_posts})
            
    executor.shutdown(wait=True)
    print_log({"status": "done", "total": total_posts, "discarded": discarded_posts})

def main():
    parser = argparse.ArgumentParser(description="Archive Cleaner Worker")
    parser.add_argument('--source', type=str, required=True, help="Absolute path to the source extraction directory")
    parser.add_argument('--destination', type=str, required=True, help="Absolute path to save results")
    parser.add_argument('--keywords', type=str, default="", help="Comma-separated keywords")
    parser.add_argument('--sensitivity', type=int, default=50, help="Clean level (0-100)")
    parser.add_argument('--disable-ocr', action='store_true', help="Disable Ollama Vision OCR completely")
    
    args = parser.parse_args()
    
    keywords = [k.strip() for k in args.keywords.split(',')] if args.keywords.strip() else []
    
    if not args.disable_ocr and args.sensitivity < 100:
        try:
            import ollama
        except ImportError:
            print_log({"status": "error", "message": "Missing dependency 'ollama'. Run: pip install ollama"})
            sys.exit(1)
            
    process_directory(args.source, args.destination, keywords, args.sensitivity, args.disable_ocr)

if __name__ == '__main__':
    main()
