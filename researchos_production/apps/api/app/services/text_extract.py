from io import BytesIO
from pypdf import PdfReader
from docx import Document as DocxDocument

MAX_EXTRACT_CHARS = 250_000

def extract_text(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith('.pdf'):
        reader = PdfReader(BytesIO(content))
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
    elif lower.endswith('.docx'):
        doc = DocxDocument(BytesIO(content))
        text = '\n'.join(p.text for p in doc.paragraphs)
    else:
        text = content.decode('utf-8', errors='ignore')
    return text[:MAX_EXTRACT_CHARS]
