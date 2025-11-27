"""
Test temporal para verificar la eliminación de espacios con documentos.
"""
import sys
sys.path.insert(0, '.')

from app.db import get_db
from app.models import User, StudySpace, Document
from app.repositories.study_space_repository import StudySpaceRepository
from app.repositories.document_repository import DocumentRepository
from app.models.study_space import study_space_documents
from sqlalchemy.exc import IntegrityError
import uuid

def test_deletion():
    db = next(get_db())

    # Buscar un usuario existente
    user = db.query(User).first()
    if not user:
        print("[ERROR] No hay usuarios en la base de datos")
        return

    print(f"[OK] Usuario encontrado: {user.email}")

    # Crear un espacio de prueba
    space = StudySpace(
        user_id=user.id,
        name="Test Space for Deletion",
        description="Testing deletion behavior"
    )
    db.add(space)
    db.commit()
    db.refresh(space)
    print(f"[OK] Espacio creado: {space.name} (ID: {space.id})")

    # Obtener o crear un documento
    document = db.query(Document).filter(Document.user_id == user.id).first()
    if not document:
        # Crear documento de prueba
        document = Document(
            user_id=user.id,
            title="Test Document",
            file_name="test.txt",
            file_type="txt",
            file_size_bytes=100,
            file_content=b"test content",
            extracted_text="test content"
        )
        db.add(document)
        db.commit()
        db.refresh(document)

    print(f"[OK] Documento: {document.title} (ID: {document.id})")

    # Asociar documento al espacio
    stmt = study_space_documents.insert().values(
        study_space_id=space.id,
        document_id=document.id
    )
    db.execute(stmt)
    db.commit()
    print("[OK] Documento asociado al espacio")

    # Intentar eliminar el espacio
    print("\n[TESTING] Intentando eliminar el espacio con documento asociado...")
    try:
        db.delete(space)
        db.commit()
        print("[OK] Espacio eliminado exitosamente")
        print("[OK] Las junction tables tienen CASCADE configurado correctamente")

        # Verificar que el documento NO se eliminó
        doc_exists = db.query(Document).filter(Document.id == document.id).first()
        if doc_exists:
            print("[OK] El documento NO fue eliminado (correcto)")
        else:
            print("[ERROR] El documento fue eliminado (INCORRECTO)")

    except IntegrityError as e:
        db.rollback()
        print("[ERROR] ERROR: Fallo la eliminación por violación de integridad referencial")
        print(f"   Detalle: {str(e.orig)}")
        print("\n[BUG] BUG ENCONTRADO:")
        print("   Las foreign keys en study_space_documents NO tienen CASCADE configurado")
        print("   Esto impide eliminar espacios que tienen documentos asociados")

        # Limpiar manualmente
        db.execute(
            study_space_documents.delete().where(
                study_space_documents.c.study_space_id == space.id
            )
        )
        db.delete(space)
        db.commit()
        print("   [OK] Limpieza manual completada")

    finally:
        db.close()

if __name__ == "__main__":
    test_deletion()
