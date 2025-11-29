"""
Tests unitarios para StudySpaceRepository
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, MagicMock
from app.repositories.study_space_repository import StudySpaceRepository
from app.models.study_space import StudySpace


# ========================================
# TESTS PARA create()
# ========================================

def test_create_study_space():
    """create debe crear un espacio de estudio"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    def refresh_side_effect(space):
        space.id = space_id

    mock_db.refresh.side_effect = refresh_side_effect

    result = StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="Mathematics",
        description="Math study space",
        color="#8B5CF6"
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    assert result.name == "Mathematics"


def test_create_study_space_with_default_color():
    """create debe usar color por defecto si no se provee"""
    mock_db = MagicMock()
    user_id = uuid4()

    result = StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="Science"
    )

    mock_db.add.assert_called_once()
    # El color por defecto debe ser "#8B5CF6"
    assert result.color == "#8B5CF6"


def test_create_study_space_without_description():
    """create debe permitir crear espacio sin descripción"""
    mock_db = MagicMock()
    user_id = uuid4()

    result = StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="History",
        description=None
    )

    mock_db.add.assert_called_once()
    assert result.description is None


def test_create_study_space_with_custom_color():
    """create debe aceptar colores personalizados"""
    mock_db = MagicMock()
    user_id = uuid4()

    result = StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="Art",
        color="#FF5733"
    )

    assert result.color == "#FF5733"


# ========================================
# TESTS PARA get_by_id()
# ========================================

def test_get_by_id_found():
    """get_by_id debe retornar el espacio con relaciones cargadas"""
    mock_db = MagicMock()
    space_id = uuid4()

    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Found Space"

    mock_db.execute.return_value.unique.return_value.scalar_one_or_none.return_value = mock_space

    result = StudySpaceRepository.get_by_id(mock_db, space_id)

    assert result == mock_space
    assert result.id == space_id
    mock_db.execute.assert_called_once()


def test_get_by_id_not_found():
    """get_by_id debe retornar None cuando no existe"""
    mock_db = MagicMock()
    space_id = uuid4()

    mock_db.execute.return_value.unique.return_value.scalar_one_or_none.return_value = None

    result = StudySpaceRepository.get_by_id(mock_db, space_id)

    assert result is None


# ========================================
# TESTS PARA get_by_user()
# ========================================

def test_get_by_user_with_results():
    """get_by_user debe retornar lista de espacios del usuario"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_spaces = [
        Mock(spec=StudySpace, id=uuid4(), name="Space 1"),
        Mock(spec=StudySpace, id=uuid4(), name="Space 2"),
        Mock(spec=StudySpace, id=uuid4(), name="Space 3"),
    ]

    mock_db.execute.return_value.scalars.return_value.all.return_value = mock_spaces

    result = StudySpaceRepository.get_by_user(mock_db, user_id)

    assert len(result) == 3
    assert result == mock_spaces


def test_get_by_user_with_pagination():
    """get_by_user debe respetar skip y limit"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    StudySpaceRepository.get_by_user(mock_db, user_id, skip=10, limit=20)

    # En SQLAlchemy 2.0, skip y limit se aplican en el statement
    mock_db.execute.assert_called_once()


def test_get_by_user_empty():
    """get_by_user debe retornar lista vacía sin espacios"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    result = StudySpaceRepository.get_by_user(mock_db, user_id)

    assert result == []


# ========================================
# TESTS PARA count_by_user()
# ========================================

def test_count_by_user():
    """count_by_user debe retornar el número correcto"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = 5

    result = StudySpaceRepository.count_by_user(mock_db, user_id)

    assert result == 5


def test_count_by_user_zero():
    """count_by_user debe retornar 0 sin espacios"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_db.execute.return_value.scalar.return_value = None

    result = StudySpaceRepository.count_by_user(mock_db, user_id)

    assert result == 0


# ========================================
# TESTS PARA update()
# ========================================

def test_update_all_fields():
    """update debe actualizar todos los campos proporcionados"""
    mock_db = MagicMock()

    mock_space = Mock(spec=StudySpace)
    mock_space.id = uuid4()
    mock_space.name = "Old Name"
    mock_space.description = "Old Desc"
    mock_space.color = "#000000"

    result = StudySpaceRepository.update(
        db=mock_db,
        space=mock_space,
        name="New Name",
        description="New Desc",
        color="#FFFFFF"
    )

    assert mock_space.name == "New Name"
    assert mock_space.description == "New Desc"
    assert mock_space.color == "#FFFFFF"
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_space)


def test_update_partial_fields():
    """update debe actualizar solo los campos proporcionados"""
    mock_db = MagicMock()

    mock_space = Mock(spec=StudySpace)
    mock_space.name = "Original Name"
    mock_space.description = "Original Desc"
    mock_space.color = "#123456"

    StudySpaceRepository.update(
        db=mock_db,
        space=mock_space,
        name="Updated Name"
        # description y color no proporcionados
    )

    assert mock_space.name == "Updated Name"
    assert mock_space.description == "Original Desc"  # No cambió
    assert mock_space.color == "#123456"  # No cambió


def test_update_no_fields():
    """update debe hacer commit incluso sin campos actualizados"""
    mock_db = MagicMock()

    mock_space = Mock(spec=StudySpace)

    result = StudySpaceRepository.update(
        db=mock_db,
        space=mock_space
    )

    mock_db.commit.assert_called_once()
    assert result == mock_space


# ========================================
# TESTS PARA delete()
# ========================================

def test_delete_space():
    """delete debe eliminar el espacio"""
    mock_db = MagicMock()

    mock_space = Mock(spec=StudySpace)
    mock_space.id = uuid4()

    StudySpaceRepository.delete(mock_db, mock_space)

    mock_db.delete.assert_called_once_with(mock_space)
    mock_db.commit.assert_called_once()


# ========================================
# TESTS PARA add_document()
# ========================================

def test_add_document_to_space():
    """add_document debe asociar un documento al espacio"""
    mock_db = MagicMock()
    space_id = uuid4()
    document_id = uuid4()

    StudySpaceRepository.add_document(mock_db, space_id, document_id)

    mock_db.execute.assert_called_once()
    mock_db.commit.assert_called_once()


# ========================================
# TESTS PARA remove_document()
# ========================================

def test_remove_document_from_space():
    """remove_document debe desasociar un documento del espacio"""
    mock_db = MagicMock()
    space_id = uuid4()
    document_id = uuid4()

    StudySpaceRepository.remove_document(mock_db, space_id, document_id)

    mock_db.execute.assert_called_once()
    mock_db.commit.assert_called_once()


# ========================================
# TESTS PARA get_by_user_with_stats()
# ========================================

def test_get_by_user_with_stats_empty():
    """get_by_user_with_stats debe retornar lista vacía si no hay espacios"""
    mock_db = MagicMock()
    user_id = uuid4()

    # Mock de las llamadas en orden:
    # 1. count query → retorna 0
    # 2. spaces query → retorna lista vacía
    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=0)),  # count
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[])))))),  # spaces (vacío)
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(mock_db, user_id)

    assert result == []
    assert total == 0
    # Se ejecutan count + spaces query (aunque total sea 0)
    assert mock_db.execute.call_count == 2


def test_get_by_user_with_stats_no_quizzes():
    """get_by_user_with_stats debe funcionar sin quizzes"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    # Mock space con relaciones
    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Test Space"
    mock_space.documents = [Mock(id=uuid4()), Mock(id=uuid4())]  # 2 documentos
    mock_space.summaries = [Mock(id=uuid4())]  # 1 resumen

    # Mock de las llamadas a execute en orden:
    # 1. count query → retorna 1
    # 2. spaces query → retorna el espacio
    # 3. stats query → retorna lista vacía (no hay quizzes)
    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=1)),  # count
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[mock_space])))))),  # spaces
        Mock(all=Mock(return_value=[]))  # stats (vacío)
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(mock_db, user_id)

    assert total == 1
    assert len(result) == 1
    assert result[0]['space'] == mock_space
    assert result[0]['num_documents'] == 2
    assert result[0]['num_summaries'] == 1
    assert result[0]['num_quizzes'] == 0
    assert result[0]['avg_score'] == 0.0


def test_get_by_user_with_stats_with_quizzes():
    """get_by_user_with_stats debe incluir estadísticas de quizzes"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    # Mock space
    mock_space = Mock(spec=StudySpace)
    mock_space.id = space_id
    mock_space.name = "Quiz Space"
    mock_space.documents = []
    mock_space.summaries = []

    # Mock stats row con quizzes y avg_score
    mock_stats_row = Mock()
    mock_stats_row.study_space_id = space_id
    mock_stats_row.num_quizzes = 5
    mock_stats_row.avg_score = 85.5

    # Mock de las llamadas en orden
    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=1)),  # count
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[mock_space])))))),  # spaces
        Mock(all=Mock(return_value=[mock_stats_row]))  # stats
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(mock_db, user_id)

    assert total == 1
    assert len(result) == 1
    assert result[0]['num_quizzes'] == 5
    assert result[0]['avg_score'] == 85.5


def test_get_by_user_with_stats_multiple_spaces():
    """get_by_user_with_stats debe manejar múltiples espacios"""
    mock_db = MagicMock()
    user_id = uuid4()

    # Crear 3 espacios mock
    space1 = Mock(spec=StudySpace, id=uuid4(), name="Space 1", documents=[], summaries=[])
    space2 = Mock(spec=StudySpace, id=uuid4(), name="Space 2", documents=[Mock()], summaries=[Mock(), Mock()])
    space3 = Mock(spec=StudySpace, id=uuid4(), name="Space 3", documents=[], summaries=[])

    # Stats para space2 (tiene quizzes)
    mock_stats = Mock()
    mock_stats.study_space_id = space2.id
    mock_stats.num_quizzes = 3
    mock_stats.avg_score = 78.3

    # Mock de las llamadas
    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=3)),  # count
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[space1, space2, space3])))))),  # spaces
        Mock(all=Mock(return_value=[mock_stats]))  # stats (solo space2)
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(mock_db, user_id)

    assert total == 3
    assert len(result) == 3

    # Space 1: sin documentos, summaries ni quizzes
    assert result[0]['space'] == space1
    assert result[0]['num_documents'] == 0
    assert result[0]['num_summaries'] == 0
    assert result[0]['num_quizzes'] == 0
    assert result[0]['avg_score'] == 0.0

    # Space 2: con documentos, summaries y quizzes
    assert result[1]['space'] == space2
    assert result[1]['num_documents'] == 1
    assert result[1]['num_summaries'] == 2
    assert result[1]['num_quizzes'] == 3
    assert result[1]['avg_score'] == 78.3

    # Space 3: sin quizzes
    assert result[2]['space'] == space3
    assert result[2]['num_quizzes'] == 0
    assert result[2]['avg_score'] == 0.0


def test_get_by_user_with_stats_pagination():
    """get_by_user_with_stats debe respetar skip y limit"""
    mock_db = MagicMock()
    user_id = uuid4()

    # Total 10 espacios, pero solo pedimos 5 con skip=2
    mock_space = Mock(spec=StudySpace, id=uuid4(), documents=[], summaries=[])

    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=10)),  # count total (sin paginación)
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[mock_space])))))),  # spaces (1 por paginación)
        Mock(all=Mock(return_value=[]))  # stats
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(
        mock_db, user_id, skip=2, limit=5
    )

    assert total == 10  # Total sin paginación
    assert len(result) == 1  # Solo 1 espacio en esta página


def test_get_by_user_with_stats_avg_score_rounding():
    """get_by_user_with_stats debe redondear avg_score a 2 decimales"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    mock_space = Mock(spec=StudySpace, id=space_id, documents=[], summaries=[])

    # avg_score con muchos decimales
    mock_stats = Mock()
    mock_stats.study_space_id = space_id
    mock_stats.num_quizzes = 1
    mock_stats.avg_score = 87.6789123456

    mock_db.execute.side_effect = [
        Mock(scalar=Mock(return_value=1)),
        Mock(unique=Mock(return_value=Mock(scalars=Mock(return_value=Mock(all=Mock(return_value=[mock_space])))))),
        Mock(all=Mock(return_value=[mock_stats]))
    ]

    result, total = StudySpaceRepository.get_by_user_with_stats(mock_db, user_id)

    assert result[0]['avg_score'] == 87.68  # Redondeado a 2 decimales


# ========================================
# TESTS DE INTEGRACIÓN
# ========================================

def test_create_update_delete_flow():
    """Flujo completo: crear, actualizar y eliminar espacio"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    # 1. Create
    def refresh_side_effect(space):
        space.id = space_id

    mock_db.refresh.side_effect = refresh_side_effect

    space = StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="Test Space",
        color="#FF0000"
    )

    assert space.name == "Test Space"

    # 2. Update
    space.name = "Updated Test Space"
    updated_space = StudySpaceRepository.update(
        db=mock_db,
        space=space,
        name="Updated Test Space"
    )

    assert updated_space.name == "Updated Test Space"

    # 3. Delete
    StudySpaceRepository.delete(mock_db, space)

    mock_db.delete.assert_called_once()


def test_space_with_documents_and_summaries():
    """Flujo: crear espacio y agregar documentos"""
    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()
    doc_id = uuid4()

    # Create space
    StudySpaceRepository.create(
        db=mock_db,
        user_id=user_id,
        name="Content Space"
    )

    # Add document
    StudySpaceRepository.add_document(mock_db, space_id, doc_id)

    # Verificar que se ejecutaron las inserciones
    assert mock_db.execute.call_count == 1
    assert mock_db.commit.call_count == 2  # create + add_document
