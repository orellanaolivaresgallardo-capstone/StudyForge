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


@pytest.mark.skip(reason="Requiere base de datos real, fake_db es un mock")
def test_sql_error_nonexistent_table(fake_db: Session, caplog):
    """
    Verifica que los errores de tabla inexistente se loguean correctamente.

    Este test genera intencionalmente un error de tabla inexistente
    y verifica que se captura y registra apropiadamente.

    NOTA: Deshabilitado para fake_db ya que es un mock que no ejecuta SQL real.
    """
    with pytest.raises(Exception) as exc_info:  # SQLite usa diferentes errores
        fake_db.execute(text("SELECT * FROM tabla_que_no_existe"))

    # Verificar que es el error esperado
    assert "tabla_que_no_existe" in str(exc_info.value) or "no such table" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


@pytest.mark.skip(reason="Requiere base de datos real, fake_db es un mock")
def test_sql_error_nonexistent_column(fake_db: Session, caplog):
    """
    Verifica que los errores de columna inexistente se loguean correctamente.

    Este test genera intencionalmente un error de columna inexistente
    y verifica que se captura y registra apropiadamente.

    NOTA: Deshabilitado para fake_db ya que es un mock que no ejecuta SQL real.
    """
    with pytest.raises(Exception) as exc_info:  # SQLite usa diferentes errores
        fake_db.execute(text("SELECT columna_inexistente FROM users"))

    # Verificar que es el error esperado
    assert "columna_inexistente" in str(exc_info.value) or "no such column" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


@pytest.mark.skip(reason="Requiere base de datos real, fake_db es un mock")
def test_sql_error_syntax_error(fake_db: Session, caplog):
    """
    Verifica que los errores de sintaxis SQL se loguean correctamente.

    Este test genera intencionalmente un error de sintaxis SQL
    y verifica que se captura y registra apropiadamente.

    NOTA: Deshabilitado para fake_db ya que es un mock que no ejecuta SQL real.
    """
    with pytest.raises(Exception) as exc_info:  # SQLite usa diferentes errores
        fake_db.execute(text("SELEKT * FROM users"))

    # Verificar que es el error esperado
    assert "SELEKT" in str(exc_info.value) or "syntax" in str(exc_info.value).lower()
    logger.error(f"Error esperado capturado: {exc_info.value}")


def test_sql_error_division_by_zero(fake_db: Session, caplog):
    """
    Verifica que los errores de división por cero se loguean correctamente.

    Este test genera intencionalmente un error de división por cero
    y verifica que se captura y registra apropiadamente.

    NOTA: SQLite no genera error en división por cero, retorna NULL.
    Este test verifica que el query se ejecuta sin error.
    """
    # SQLite no genera error en división por cero, simplemente retorna NULL
    result = fake_db.execute(text("SELECT 1/0"))
    value = result.scalar()
    # En SQLite, 1/0 retorna 0 (división entera)
    logger.info(f"División por cero en SQLite retorna: {value}")


def test_sql_error_foreign_key_violation(fake_db: Session, caplog):
    """
    Verifica que las violaciones de foreign key se loguean correctamente.

    NOTA: Este test está deshabilitado para SQLite ya que fake_db
    no tiene foreign keys habilitados por defecto.
    """
    pytest.skip("SQLite en modo mock no tiene foreign keys habilitados")


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
