"""Text extraction from PDF, DOCX, and plain text."""
import io


def extract_text(filename: str, content: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return _pdf(content)
    if name.endswith(".docx"):
        return _docx(content)
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1", errors="replace")


def _pdf(content: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(p.extract_text() or "" for p in reader.pages)
    except Exception:
        return "[PDF extraction failed — install pypdf]"


def _docx(content: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception:
        return "[DOCX extraction failed — install python-docx]"
