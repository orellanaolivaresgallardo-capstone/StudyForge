from app.schemas.document_schemas import DocumentIn, DocumentOut, DocumentListOut

# Simulación de almacenamiento en memoria (temporal)
_DB = []
_NEXT_ID = 1

class DocumentRepo:
    def list(self) -> DocumentListOut:
        return DocumentListOut(items=[DocumentOut(**d) for d in _DB])

    def insert(self, data: DocumentIn) -> DocumentOut:
        global _NEXT_ID
        record = {
            "id": _NEXT_ID,
            "title": data.title,
            "description": data.description,
        }
        _DB.append(record)
        _NEXT_ID += 1
        return DocumentOut(**record)
