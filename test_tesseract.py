# test_tesseract.py
import os
import pytesseract
from PIL import Image

# Set Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Test with a simple image or your image
image_path = r"C:\Users\Saksham\Documents\Suck.jpg"

if os.path.exists(image_path):
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        print("Tesseract extracted text:")
        print(text)
        print(f"Text length: {len(text)}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print(f"File not found: {image_path}")