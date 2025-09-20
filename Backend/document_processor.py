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
from typing import Dict, Any

# Try to import pytesseract and set the path
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    if os.name == 'nt':  # Windows
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
except ImportError:
    TESSERACT_AVAILABLE = False

# ---------- Config ----------
MIN_TEXT_LEN_FOR_SUCCESS = 30
CONFIDENCE_THRESHOLD = 0.35
PDF_DPI = 300
# ----------------------------


class DocumentProcessor:
    def __init__(self):
        self.ocr = PaddleOCR(lang='en')
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            self.nlp = None

    def load_image_cv(self, path: str) -> np.ndarray:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is None:
            try:
                pil = Image.open(path).convert("RGB")
                img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
            except Exception:
                return None
        return img

    def run_paddle(self, image: np.ndarray) -> Any:
        try:
            return self.ocr.ocr(image)
        except Exception:
            return None

    def run_tesseract(self, image: np.ndarray) -> str:
        if not TESSERACT_AVAILABLE:
            return ""
        try:
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
            text = pytesseract.image_to_string(pil_image)
            return text
        except Exception:
            return ""

    def extract_text_from_image(self, img: np.ndarray) -> str:
        raw_out = self.run_paddle(img)
        if raw_out:
            try:
                text_lines = []
                if isinstance(raw_out, list) and raw_out and isinstance(raw_out[0], list):
                    for page in raw_out:
                        for item in page:
                            if len(item) >= 2 and len(item[1]) >= 2:
                                text_lines.append(item[1][0])
                if text_lines:
                    text = " ".join(text_lines)
                    if len(text.strip()) >= MIN_TEXT_LEN_FOR_SUCCESS:
                        return text
            except Exception:
                pass
        return self.run_tesseract(img)

    def process_pdf(self, file_path: str) -> Dict[str, Any]:
        result = {"file_type": "pdf", "file_name": os.path.basename(file_path), "text": ""}
        print(f"📄 Processing PDF: {file_path}")

        # --- Try PyPDF2 ---
        try:
            pdf = PdfReader(file_path)
            texts = [p.extract_text() or "" for p in pdf.pages]
            print(f"🔎 PyPDF2 extracted {sum(len(t) for t in texts)} characters")
            if sum(len(t) for t in texts) > MIN_TEXT_LEN_FOR_SUCCESS:
                result["text"] = "\n".join(texts)
                return result
        except Exception as e:
            print(f"⚠️ PyPDF2 failed: {e}")

        # --- Fallback: OCR via images ---
        try:
            print("📸 Falling back to OCR (pdf2image + Paddle/Tesseract)")
            pages = pdf2image.convert_from_path(file_path, dpi=PDF_DPI)
            page_texts = []
            for idx, p in enumerate(pages):
                img = cv2.cvtColor(np.array(p), cv2.COLOR_RGB2BGR)
                text = self.extract_text_from_image(img)
                print(f"📝 OCR Page {idx+1}: extracted {len(text)} characters")
                page_texts.append(text)
            result["text"] = "\n".join(page_texts)
        except Exception as e:
            print(f"⚠️ OCR fallback failed: {e}")

        return result

    def process_image(self, file_path: str) -> Dict[str, Any]:
        img = self.load_image_cv(file_path)
        if img is None:
            return {"error": f"Failed to load image: {file_path}",
                    "file_type": "image",
                    "file_name": os.path.basename(file_path)}
        text = self.extract_text_from_image(img)
        return {"file_type": "image", "file_name": os.path.basename(file_path), "text": text}

    def process_document(self, file_path: str) -> Dict[str, Any]:
        file_path = file_path.replace("file:///", "")
        file_path = os.path.normpath(file_path)
        if not os.path.exists(file_path):
            return {"error": f"File not found: {file_path}"}
        if file_path.lower().endswith(".pdf"):
            return self.process_pdf(file_path)
        return self.process_image(file_path)

    def extract_important_details(self, res: Dict[str, Any]) -> Dict[str, Any]:
        text = res.get("text", "") or ""
        doc_type = self.detect_document_type(text)
        out = {"document_type": doc_type}
        if self.nlp:
            doc = self.nlp(text)
            out["persons"] = [e.text for e in doc.ents if e.label_ == "PERSON"][:5]
            out["organizations"] = [e.text for e in doc.ents if e.label_ == "ORG"][:5]
        out["raw_preview"] = text[:800]
        return out

    def detect_document_type(self, text: str) -> str:
        low = text.lower()
        if "marksheet" in low or "roll no" in low:
            return "marksheet"
        if "invoice" in low or "amount due" in low:
            return "financial_bill"
        if "abstract" in low or "references" in low:
            return "research_paper"
        if "contract" in low or "agreement" in low:
            return "legal_document"
        if "schedule" in low or "deadline" in low:
            return "schedule"
        return "general"


def normalize_input_path(p: str) -> str:
    if p.startswith("file:///"):
        p = p.replace("file:///", "", 1)
    return os.path.normpath(os.path.expanduser(p))


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file provided"}))
        return

    file_path = normalize_input_path(sys.argv[1])
    proc = DocumentProcessor()
    res = proc.process_document(file_path)

    # 🔑 Always save results inside Backend folder
    base_dir = os.path.dirname(os.path.abspath(__file__))
    result_path = os.path.join(base_dir, "processing_result.json")
    details_path = os.path.join(base_dir, "important_details.json")

    processing_result = {
        "file_type": res.get("file_type", ""),
        "file_name": res.get("file_name", ""),
        "text": res.get("text", ""),
        "error": res.get("error", "")
    }

    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(processing_result, f, indent=2, ensure_ascii=False)

    important_details = proc.extract_important_details(res)
    with open(details_path, "w", encoding="utf-8") as f:
        json.dump(important_details, f, indent=2, ensure_ascii=False)

    # 🔑 Print combined JSON for Node.js
    combined_output = {
        "rawText": processing_result.get("text", ""),
        "parsedJson": important_details,
        "suggestedCollection": important_details.get("document_type", "general")
    }
    print(json.dumps(combined_output, ensure_ascii=False))


if __name__ == "__main__":
    main()
