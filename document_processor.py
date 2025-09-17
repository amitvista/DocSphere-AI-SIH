# document_processor.py
import os
import sys
import json
import re
import cv2
import numpy as np
from PIL import Image
import pdf2image
import camelot
from PyPDF2 import PdfReader
from paddleocr import PaddleOCR
import spacy
from typing import List, Dict, Tuple, Any

# ---------- Config ----------
MIN_TEXT_LEN_FOR_SUCCESS = 30      # stop trying variants when we reach this many chars
CONFIDENCE_THRESHOLD = 0.35        # ignore tokens below this confidence
PDF_DPI = 300                      # when rasterizing PDF pages
# ----------------------------

class DocumentProcessor:
    def __init__(self):
        # initialize PaddleOCR
        self.ocr = PaddleOCR(lang='en')

        # spaCy
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            print("[WARN] spaCy model not available. Run: python -m spacy download en_core_web_sm")
            self.nlp = None

    # -------------------------
    # Utils
    # -------------------------
    def load_image_cv(self, path: str) -> np.ndarray:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is None:
            pil = Image.open(path).convert("RGB")
            img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
        return img

    def preprocessing_variants(self, img: np.ndarray) -> List[Tuple[str, np.ndarray]]:
        h, w = img.shape[:2]
        variants = []
        variants.append(("original", self.resize_if_needed(img)))

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(gray)
        variants.append(("clahe", cv2.cvtColor(clahe, cv2.COLOR_GRAY2BGR)))

        # sharpen
        den = cv2.fastNlMeansDenoising(gray, h=10)
        kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
        sharp = cv2.filter2D(den, -1, kernel)
        variants.append(("denoise_sharp", cv2.cvtColor(sharp, cv2.COLOR_GRAY2BGR)))

        # threshold + morph
        thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 15, 8)
        kernel2 = cv2.getStructuringElement(cv2.MORPH_RECT, (2,2))
        close = cv2.morphologyEx(thr, cv2.MORPH_CLOSE, kernel2)
        variants.append(("thr_close", cv2.cvtColor(close, cv2.COLOR_GRAY2BGR)))

        # inverted
        inv = cv2.bitwise_not(gray)
        variants.append(("inverted", cv2.cvtColor(inv, cv2.COLOR_GRAY2BGR)))

        return variants

    def resize_if_needed(self, img: np.ndarray, max_side=2000) -> np.ndarray:
        h, w = img.shape[:2]
        if max(h, w) > max_side:
            scale = max_side / max(h, w)
            return cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)
        return img

    # -------------------------
    # OCR & token parsing
    # -------------------------
    def run_paddle(self, image: np.ndarray) -> Any:
        try:
            if hasattr(self.ocr, "ocr"):
                return self.ocr.ocr(image)
        except Exception as e:
            print(f"[DEBUG] paddle .ocr() failed: {e}")
        try:
            if hasattr(self.ocr, "predict"):
                return self.ocr.predict(image)
        except Exception as e:
            print(f"[ERROR] paddle .predict() failed: {e}")
        return None

    def extract_tokens_from_paddle_output(self, raw_out: Any) -> List[Dict]:
        tokens = []
        if not raw_out:
            return tokens

        # Case A: PaddleOCR list-of-lists
        if isinstance(raw_out, list) and raw_out and isinstance(raw_out[0], list):
            for page in raw_out:
                for item in page:
                    try:
                        box = item[0]
                        text, conf = item[1]
                        if not text.strip():
                            continue
                        xmin = min(pt[0] for pt in box)
                        xmax = max(pt[0] for pt in box)
                        ymin = min(pt[1] for pt in box)
                        ymax = max(pt[1] for pt in box)
                        tokens.append({
                            "text": text.strip(),
                            "conf": float(conf),
                            "xmin": xmin, "xmax": xmax, "ymin": ymin, "ymax": ymax,
                            "cx": (xmin+xmax)/2, "cy": (ymin+ymax)/2,
                            "w": xmax-xmin, "h": ymax-ymin
                        })
                    except Exception:
                        continue

        # Case B: dict-like output (paddlex)
        elif isinstance(raw_out, list) and raw_out and isinstance(raw_out[0], dict):
            for pd in raw_out:
                for d in pd.get("data", []):
                    text = d.get("text", "")
                    if not text.strip():
                        continue
                    conf = float(d.get("confidence", 1.0))
                    pos = d.get("position") or []
                    if pos and isinstance(pos, (list,tuple)) and len(pos) >= 4:
                        xmin = min(pt[0] for pt in pos)
                        xmax = max(pt[0] for pt in pos)
                        ymin = min(pt[1] for pt in pos)
                        ymax = max(pt[1] for pt in pos)
                    else:
                        xmin=xmax=ymin=ymax=0
                    tokens.append({
                        "text": text.strip(),
                        "conf": conf,
                        "xmin": xmin, "xmax": xmax, "ymin": ymin, "ymax": ymax,
                        "cx": (xmin+xmax)/2, "cy": (ymin+ymax)/2,
                        "w": xmax-xmin, "h": ymax-ymin
                    })

        # confidence filter
        return [t for t in tokens if t.get("conf", 1.0) >= CONFIDENCE_THRESHOLD]

    def group_tokens_to_lines(self, tokens: List[Dict]) -> List[List[Dict]]:
        if not tokens: return []
        tokens_sorted = sorted(tokens, key=lambda t: t['cy'])
        heights = [max(1, t['h']) for t in tokens_sorted]
        median_h = float(np.median(heights)) if heights else 12.0
        line_tol = max(10.0, median_h*0.7)

        lines, current = [], [tokens_sorted[0]]
        last_cy = tokens_sorted[0]['cy']
        for tok in tokens_sorted[1:]:
            if abs(tok['cy']-last_cy) <= line_tol:
                current.append(tok)
                last_cy = (last_cy*(len(current)-1)+tok['cy'])/len(current)
            else:
                lines.append(sorted(current, key=lambda t: t['xmin']))
                current = [tok]
                last_cy = tok['cy']
        if current: lines.append(sorted(current, key=lambda t: t['xmin']))
        return lines

    def reconstruct_text_from_lines(self, lines: List[List[Dict]]) -> str:
        out_lines = []
        widths = [max(1, t['w']) for line in lines for t in line]
        median_w = float(np.median(widths)) if widths else 10.0
        for line in lines:
            if not line: continue
            parts = [line[0]['text']]
            for prev, tok in zip(line, line[1:]):
                gap = tok['xmin'] - prev['xmax']
                if gap > median_w*0.6:
                    parts.append(" " + tok['text'])
                else:
                    parts.append(tok['text'])
            out_lines.append("".join(parts))
        return "\n".join(out_lines)

    # -------------------------
    # High-level flows
    # -------------------------
    def ocr_image_with_variants(self, img: np.ndarray, debug_prefix=None) -> Tuple[str, List[Dict]]:
        variants = self.preprocessing_variants(img)
        best_text, best_tokens = "", []
        for label, vimg in variants:
            raw_out = self.run_paddle(vimg)
            tokens = self.extract_tokens_from_paddle_output(raw_out)
            lines = self.group_tokens_to_lines(tokens)
            text = self.reconstruct_text_from_lines(lines)
            if len(text.strip()) >= MIN_TEXT_LEN_FOR_SUCCESS:
                return text.strip(), tokens
            if len(text) > len(best_text):
                best_text, best_tokens = text, tokens
        return best_text.strip(), best_tokens

    def process_pdf(self, file_path: str) -> Dict[str, Any]:
        result = {"file_type":"pdf","file_name":os.path.basename(file_path),
                  "pages":[],"tables":[],"full_text":""}
        try:
            pdf = PdfReader(file_path)
            texts = [p.extract_text() or "" for p in pdf.pages]
            if sum(len(t) for t in texts) > MIN_TEXT_LEN_FOR_SUCCESS:
                result["pages"]=[{"page_number":i+1,"text":t,"ocr_tokens":[]} for i,t in enumerate(texts)]
                result["full_text"]="\n".join(texts)
                return result
        except: pass

        pages = pdf2image.convert_from_path(file_path, dpi=PDF_DPI)
        page_texts=[]
        for i,p in enumerate(pages,1):
            img=cv2.cvtColor(np.array(p),cv2.COLOR_RGB2BGR)
            text,tokens=self.ocr_image_with_variants(img,debug_prefix=f"debug_p{i}")
            result["pages"].append({"page_number":i,"text":text,"ocr_tokens":tokens})
            page_texts.append(text)
        result["full_text"]="\n".join(page_texts)
        try:
            tables=camelot.read_pdf(file_path,pages="all")
            result["tables"]=[{"page":int(t.page),"data":t.df.to_dict()} for t in tables]
        except: pass
        return result

    def process_image(self, file_path:str)->Dict[str,Any]:
        img=self.load_image_cv(file_path)
        text,tokens=self.ocr_image_with_variants(img,"debug_img")
        return {"file_type":"image","file_name":os.path.basename(file_path),
                "pages":[{"page_number":1,"text":text,"ocr_tokens":tokens}],
                "tables":[],"full_text":text}

    def process_document(self,file_path:str)->Dict[str,Any]:
        file_path=file_path.replace("file:///","")
        file_path=os.path.normpath(file_path)
        if not os.path.exists(file_path):
            return {"error":f"File not found: {file_path}"}
        if file_path.lower().endswith(".pdf"):
            return self.process_pdf(file_path)
        return self.process_image(file_path)

    # -------------------------
    # Detail extraction
    # -------------------------
    def detect_document_type(self,text:str)->str:
        low=text.lower()
        if "marksheet" in low or "roll no" in low: return "marksheet"
        if "invoice" in low or "amount due" in low: return "financial_bill"
        if "abstract" in low or "references" in low: return "research_paper"
        if "contract" in low or "agreement" in low: return "legal_document"
        if "schedule" in low or "deadline" in low: return "schedule"
        return "general"

    def extract_important_details(self,res:Dict[str,Any])->Dict[str,Any]:
        text=res.get("full_text","") or ""
        doc_type=self.detect_document_type(text)
        out={"document_type":doc_type}
        if self.nlp:
            doc=self.nlp(text)
            out["persons"]=[e.text for e in doc.ents if e.label_=="PERSON"][:5]
            out["organizations"]=[e.text for e in doc.ents if e.label_=="ORG"][:5]
        out["raw_preview"]=text[:800]
        return out

# -------------------------
def normalize_input_path(p:str)->str:
    if p.startswith("file:///"): p=p.replace("file:///","",1)
    return os.path.normpath(os.path.expanduser(p))

def main():
    if len(sys.argv)<2:
        print("Usage: python document_processor.py <file>")
        return
    file_path=normalize_input_path(sys.argv[1])
    proc=DocumentProcessor()
    res=proc.process_document(file_path)
    with open("processing_result.json","w",encoding="utf-8") as f: json.dump(res,f,indent=2,ensure_ascii=False)
    imp=proc.extract_important_details(res)
    with open("important_details.json","w",encoding="utf-8") as f: json.dump(imp,f,indent=2,ensure_ascii=False)
    print("✅ Done. See processing_result.json & important_details.json")

if __name__=="__main__":
    main()
