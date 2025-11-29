"""
Router de prueba para verificar logging de errores SQL.

⚠️ SOLO PARA DESARROLLO - Este router solo está disponible cuando DEBUG=True

Este router proporciona endpoints para generar errores SQL intencionalmente
y verificar que el sistema de logging de SQLAlchemy está funcionando correctamente.

Los endpoints están disponibles en:
    http://localhost:8000/docs#/test-errors

Uso:
    1. Inicia el servidor: uvicorn app.main:app --reload
    2. Ve a http://localhost:8000/docs
    3. Expande la sección "test-errors"
    4. Ejecuta cualquier endpoint
    5. Observa la consola del servidor para ver los logs de error

Los errores deben aparecer en:
    - Consola del servidor (formato estructurado)
    - backend/logs/studyforge.log

Nota: Estos errores son intencionados y esperados. No afectan la base de datos
ya que todas las transacciones fallan y hacen rollback automáticamente.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db import get_db
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/test-errors/nonexistent-table")
def test_nonexistent_table(db: Session = Depends(get_db)):
    """Genera error de tabla inexistente."""
    try:
        result = db.execute(text("SELECT * FROM studyforge.tabla_que_no_existe"))
        return {"result": result.fetchall()}
    except Exception as e:
        logger.error(f"Error de prueba capturado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-errors/nonexistent-column")
def test_nonexistent_column(db: Session = Depends(get_db)):
    """Genera error de columna inexistente."""
    try:
        result = db.execute(text("SELECT columna_inexistente FROM studyforge.users"))
        return {"result": result.fetchall()}
    except Exception as e:
        logger.error(f"Error de prueba capturado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-errors/syntax-error")
def test_syntax_error(db: Session = Depends(get_db)):
    """Genera error de sintaxis SQL."""
    try:
        result = db.execute(text("SELEKT * FROM studyforge.users"))
        return {"result": result.fetchall()}
    except Exception as e:
        logger.error(f"Error de prueba capturado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-errors/division-by-zero")
def test_division_by_zero(db: Session = Depends(get_db)):
    """Genera error de división por cero."""
    try:
        result = db.execute(text("SELECT 1/0"))
        return {"result": result.fetchall()}
    except Exception as e:
        logger.error(f"Error de prueba capturado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-errors/foreign-key-violation")
def test_fk_violation(db: Session = Depends(get_db)):
    """Genera error de violación de foreign key."""
    try:
        # Buscar un usuario con documentos
        result = db.execute(text("""
            SELECT user_id FROM studyforge.documents
            LIMIT 1
        """))
        user_id = result.scalar()

        if not user_id:
            return {"message": "No hay usuarios con documentos para probar FK violation"}

        # Intentar eliminar usuario con documentos (debe fallar)
        db.execute(text(f"""
            DELETE FROM studyforge.users
            WHERE id = '{user_id}'
        """))
        db.commit()
        return {"message": "No debería llegar aquí"}
    except Exception as e:
        logger.error(f"Error de prueba capturado: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
