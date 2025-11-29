"""
Script de prueba para verificar SQL logging.

Ejecutar:
    python test_sql_logging.py

Luego verificar:
    tail -50 logs/studyforge.log | grep "SELECT"
"""
import os

# Configurar SQL logging
os.environ['LOG_SQL_QUERIES'] = 'True'
os.environ['LOG_SQL_LEVEL'] = 'INFO'
os.environ['LOG_SQL_TO_SEPARATE_FILE'] = 'False'

from app.core.logging import setup_logging
from app.db import engine
from sqlalchemy import text

def main():
    """Ejecuta queries de prueba."""
    # Inicializar logging
    logger = setup_logging()
    logger.info("=== Iniciando test de SQL logging ===")

    # Ejecutar queries de ejemplo
    with engine.connect() as conn:
        # Query 1: Información de la base de datos
        logger.info("Ejecutando Query 1: Database info")
        result = conn.execute(text('SELECT current_database(), current_schema()'))
        db_info = result.fetchone()
        logger.info(f"Database: {db_info[0]}, Schema: {db_info[1]}")

        # Query 2: Versión de PostgreSQL
        logger.info("Ejecutando Query 2: PostgreSQL version")
        result = conn.execute(text('SELECT version()'))
        version = result.fetchone()
        logger.info(f"PostgreSQL: {version[0][:50]}...")

        # Query 3: Tablas existentes
        logger.info("Ejecutando Query 3: List tables")
        result = conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'studyforge'
            ORDER BY table_name
            LIMIT 5
        """))
        tables = result.fetchall()
        logger.info(f"Tablas encontradas: {[t[0] for t in tables]}")

    logger.info("=== Test de SQL logging completado ===")
    print("\n✅ Test completado!")
    print("📁 Ver logs: tail -50 logs/studyforge.log | grep 'SELECT'")

if __name__ == "__main__":
    main()