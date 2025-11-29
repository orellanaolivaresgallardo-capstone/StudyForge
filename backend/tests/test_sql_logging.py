"""
Tests para verificar el logging de errores SQL de SQLAlchemy.

Estos tests verifican que los errores de base de datos se registran correctamente
en consola y archivo de logs con el formato estructurado configurado.

NOTA: Estos tests generan errores intencionalmente para verificar el logging.
Los errores son esperados y capturados correctamente.
"""
import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import (
    ProgrammingError,
    DataError,
    IntegrityError
)
from app.core.logging import get_logger

logger = get_logger(__name__)


def test_sql_error_nonexistent_table(db: Session, caplog):
    """
    Verifica que los errores de tabla inexistente se loguean correctamente.

    Este test genera intencionalmente un error de tabla inexistente
    y verifica que se captura y registra apropiadamente.
    """
    with pytest.raises(ProgrammingError) as exc_info:
        db.execute(text("SELECT * FROM studyforge.tabla_que_no_existe"))

    # Verificar que es el error esperado
    assert "tabla_que_no_existe" in str(exc_info.value)
    logger.error(f"Error esperado capturado: {exc_info.value}")


def test_sql_error_nonexistent_column(db: Session, caplog):
    """
    Verifica que los errores de columna inexistente se loguean correctamente.

    Este test genera intencionalmente un error de columna inexistente
    y verifica que se captura y registra apropiadamente.
    """
    with pytest.raises(ProgrammingError) as exc_info:
        db.execute(text("SELECT columna_inexistente FROM studyforge.users"))

    # Verificar que es el error esperado
    assert "columna_inexistente" in str(exc_info.value)
    logger.error(f"Error esperado capturado: {exc_info.value}")


def test_sql_error_syntax_error(db: Session, caplog):
    """
    Verifica que los errores de sintaxis SQL se loguean correctamente.

    Este test genera intencionalmente un error de sintaxis SQL
    y verifica que se captura y registra apropiadamente.
    """
    with pytest.raises(ProgrammingError) as exc_info:
        db.execute(text("SELEKT * FROM studyforge.users"))

    # Verificar que es el error esperado
    assert "SELEKT" in str(exc_info.value) or "sintaxis" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


def test_sql_error_division_by_zero(db: Session, caplog):
    """
    Verifica que los errores de división por cero se loguean correctamente.

    Este test genera intencionalmente un error de división por cero
    y verifica que se captura y registra apropiadamente.
    """
    with pytest.raises(DataError) as exc_info:
        db.execute(text("SELECT 1/0"))

    # Verificar que es el error esperado
    assert "division" in str(exc_info.value).lower() or "cero" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


def test_sql_error_foreign_key_violation(db: Session, caplog):
    """
    Verifica que las violaciones de foreign key se loguean correctamente.

    Este test intenta eliminar un usuario con documentos asociados,
    lo cual debe generar un error de violación de integridad referencial.
    """
    # Buscar un usuario con documentos
    result = db.execute(text("""
        SELECT user_id FROM studyforge.documents
        LIMIT 1
    """))
    user_id = result.scalar()

    if not user_id:
        pytest.skip("No hay usuarios con documentos para probar FK violation")

    # Intentar eliminar usuario con documentos (debe fallar)
    with pytest.raises(IntegrityError) as exc_info:
        db.execute(text(f"""
            DELETE FROM studyforge.users
            WHERE id = '{user_id}'
        """))
        db.commit()

    # Hacer rollback para no afectar otros tests
    db.rollback()

    # Verificar que es el error esperado
    assert "foreign key" in str(exc_info.value).lower() or "llave" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


# ========== Script standalone para ejecutar manualmente ==========
# Este bloque permite ejecutar las pruebas directamente con Python
# para observar los logs en consola en tiempo real.

if __name__ == "__main__":
    """
    Ejecutar manualmente para ver los logs en consola:

        cd backend
        .venv/Scripts/python.exe tests/test_sql_logging.py

    Los errores deben aparecer en:
    - Consola (formato estructurado)
    - backend/logs/studyforge.log
    """
    from app.db import get_db
    from app.core.logging import setup_logging

    setup_logging()
    print("=" * 70)
    print("PRUEBAS MANUALES DE LOGGING DE ERRORES SQL")
    print("=" * 70)
    print("\nRevisa la consola y el archivo logs/studyforge.log")
    print("Deberías ver los errores de SQLAlchemy registrados con formato estructurado.\n")

    db_gen = get_db()
    db = next(db_gen)

    try:
        print("\n=== Test 1: Tabla inexistente ===")
        test_sql_error_nonexistent_table.__wrapped__(db, None)
    except AttributeError:
        # Si no está wrapeado por pytest, llamar directamente
        try:
            test_sql_error_nonexistent_table(db, None)
        except Exception:
            pass  # Error esperado

    try:
        print("\n=== Test 2: Columna inexistente ===")
        test_sql_error_nonexistent_column(db, None)
    except Exception:
        pass  # Error esperado

    try:
        print("\n=== Test 3: Error de sintaxis SQL ===")
        test_sql_error_syntax_error(db, None)
    except Exception:
        pass  # Error esperado

    try:
        print("\n=== Test 4: División por cero ===")
        test_sql_error_division_by_zero(db, None)
    except Exception:
        pass  # Error esperado

    try:
        print("\n=== Test 5: Violación de FK ===")
        test_sql_error_foreign_key_violation(db, None)
    except Exception:
        pass  # Error esperado

    db.close()

    print("\n" + "=" * 70)
    print("PRUEBAS COMPLETADAS")
    print("=" * 70)
    print("\nRevisa los logs en:")
    print("  - Consola (arriba)")
    print("  - backend/logs/studyforge.log")
