"""
Tests unitarios para QuizService
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi import HTTPException, UploadFile
from app.services.quiz_service import QuizService


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_no_history(mock_settings):
    """Sin historial previo retorna dificultad 2 (default)"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    assert difficulty == 2


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_high_scores(mock_settings):
    """Scores altos (>=90%) retornan dificultad 5"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Mock de 5 intentos con scores altos
    attempts = [
        Mock(score=95.0),
        Mock(score=92.5),
        Mock(score=90.0),
        Mock(score=93.0),
        Mock(score=91.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    assert difficulty == 5


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_medium_scores(mock_settings):
    """Scores medios (60-74%) retornan dificultad 3"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    attempts = [
        Mock(score=65.0),
        Mock(score=68.0),
        Mock(score=62.0),
        Mock(score=66.0),
        Mock(score=64.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 65%, debería ser dificultad 3
    assert difficulty == 3


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_low_scores(mock_settings):
    """Scores bajos (<40%) retornan dificultad 1"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    attempts = [
        Mock(score=30.0),
        Mock(score=35.0),
        Mock(score=32.0),
        Mock(score=28.0),
        Mock(score=35.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 32%, debería ser dificultad 1
    assert difficulty == 1


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_with_less_than_5_attempts(mock_settings):
    """Con menos de 5 intentos, calcula promedio correctamente"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Solo 3 intentos
    attempts = [
        Mock(score=80.0),
        Mock(score=82.0),
        Mock(score=78.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 80%, debería ser dificultad 4
    assert difficulty == 4


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_all_scores_none(mock_settings):
    """Con attempts que tienen score=None, debe retornar dificultad 2 (default)"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Attempts existen pero todos tienen score=None
    attempts = [
        Mock(score=None),
        Mock(score=None),
        Mock(score=None),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # Cuando todos los scores son None, la lista de scores válidos está vacía
    # Debe retornar 2 (dificultad por defecto)
    assert difficulty == 2


@patch('app.services.openai_service.settings')
def test_adaptive_difficulty_easy_range(mock_settings):
    """Scores en rango 40-60% retornan dificultad 2 (Fácil)"""
    mock_settings.OPENAI_API_KEY = "sk-test-key"
    mock_settings.OPENAI_MODEL = "gpt-4"

    mock_db = Mock()

    # Scores en el rango 40-60%
    attempts = [
        Mock(score=45.0),
        Mock(score=50.0),
        Mock(score=55.0),
        Mock(score=48.0),
        Mock(score=52.0),
    ]
    mock_db.execute.return_value.scalars.return_value.all.return_value = attempts

    service = QuizService()
    difficulty = service.calculate_adaptive_difficulty(mock_db, "user-123", "mathematics")

    # avg = 50%, debería ser dificultad 2 (Fácil)
    assert difficulty == 2


# ========================================
# TESTS PARA create_quiz_from_file()
# ========================================

@patch('app.services.quiz_service.settings')
@patch('app.services.quiz_service.FileProcessor')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
@pytest.mark.asyncio
async def test_create_quiz_from_file_success(mock_openai_settings, mock_quiz_repo, mock_file_processor, mock_settings):
    """create_quiz_from_file debe crear quiz exitosamente con dificultad adaptativa"""
    # Setup mocks
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30
    mock_settings.DEFAULT_QUIZ_QUESTIONS = 10

    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()

    # Mock file
    mock_file = Mock(spec=UploadFile)
    mock_file.filename = "test.pdf"

    # Mock file processor
    mock_file_processor.validate_file.return_value = ("test.pdf", "application/pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Sample text content for quiz")

    # Mock adaptive difficulty (no history)
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    # Mock quiz creation
    mock_quiz = Mock()
    mock_quiz.id = uuid4()
    mock_quiz.title = "Cuestionario: test.pdf"
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    # Create service and call method
    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[
        {"question": "Q1", "options": {"correct": "A", "B": "wrong"}, "explanation": "Exp1"},
        {"question": "Q2", "options": {"correct": "C", "D": "wrong"}, "explanation": "Exp2"},
    ]):
        result = await service.create_quiz_from_file(mock_db, user_id, space_id, mock_file, max_questions=None)

    # Assertions
    assert result == mock_quiz
    mock_file_processor.validate_file.assert_called_once()
    mock_file_processor.extract_text.assert_called_once()
    mock_quiz_repo.create_quiz.assert_called_once()

    # Verify difficulty was calculated (no history = 2)
    call_args = mock_quiz_repo.create_quiz.call_args
    assert call_args.kwargs['difficulty_level'] == 2
    assert call_args.kwargs['study_space_id'] == space_id
    assert call_args.kwargs['source_type'] == 'study_space'


@patch('app.services.quiz_service.settings')
@patch('app.services.quiz_service.FileProcessor')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
@pytest.mark.asyncio
async def test_create_quiz_from_file_with_custom_questions(mock_openai_settings, mock_quiz_repo, mock_file_processor, mock_settings):
    """create_quiz_from_file debe respetar límites de preguntas min/max"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30
    mock_settings.DEFAULT_QUIZ_QUESTIONS = 10

    mock_db = MagicMock()
    user_id = uuid4()
    space_id = uuid4()
    mock_file = Mock(spec=UploadFile)

    mock_file_processor.validate_file.return_value = ("test.pdf", "application/pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Sample text")
    mock_db.execute.return_value.scalars.return_value.all.return_value = []
    mock_quiz_repo.create_quiz.return_value = Mock(id=uuid4())

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[{"q": "1"}] * 50):
        # Test: max_questions = 100 should be clamped to MAX (30)
        await service.create_quiz_from_file(mock_db, user_id, space_id, mock_file, max_questions=100)

        call_args = mock_quiz_repo.create_quiz.call_args
        # Debería usar MAX_QUESTIONS_PER_QUIZ (30) aunque se pidieron 100
        assert len(call_args.kwargs['questions']) == 30


@patch('app.services.quiz_service.settings')
@patch('app.services.quiz_service.FileProcessor')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
@pytest.mark.asyncio
async def test_create_quiz_from_file_min_questions(mock_openai_settings, mock_quiz_repo, mock_file_processor, mock_settings):
    """create_quiz_from_file debe respetar límite mínimo de preguntas"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30

    mock_db = MagicMock()
    mock_file = Mock(spec=UploadFile)

    mock_file_processor.validate_file.return_value = ("test.pdf", "application/pdf")
    mock_file_processor.extract_text = AsyncMock(return_value="Sample text")
    mock_db.execute.return_value.scalars.return_value.all.return_value = []
    mock_quiz_repo.create_quiz.return_value = Mock(id=uuid4())

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[{"q": "1"}] * 10):
        # Test: max_questions = 2 should be clamped to MIN (5)
        await service.create_quiz_from_file(mock_db, uuid4(), uuid4(), mock_file, max_questions=2)

        call_args = mock_quiz_repo.create_quiz.call_args
        # Debería usar MIN_QUESTIONS_PER_QUIZ (5) aunque se pidieron 2
        assert len(call_args.kwargs['questions']) == 5


# ========================================
# TESTS PARA create_quiz_from_document()
# ========================================

@patch('app.repositories.document_repository.DocumentRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_document_success(mock_openai_settings, mock_quiz_repo, mock_space_repo, mock_verify_space, mock_verify, mock_doc_repo):
    """create_quiz_from_document debe crear quiz desde documento existente"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"

    mock_db = MagicMock()
    user = Mock()
    user.id = uuid4()
    document_id = uuid4()
    space_id = uuid4()

    # Mock space
    mock_space = Mock()
    mock_space.id = space_id
    mock_space.user_id = user.id
    mock_space.description = "Math study space"

    # Mock document with study space
    mock_document = Mock()
    mock_document.id = document_id
    mock_document.extracted_text = "This is extracted text from document"
    mock_document.title = "Test Document"
    mock_document.file_name = "test.pdf"
    mock_document.file_type = "application/pdf"
    mock_document.study_spaces = [mock_space]  # Document pertenece al espacio

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify_space.return_value = mock_space

    # Mock adaptive difficulty
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    mock_quiz = Mock(id=uuid4(), title="Cuestionario: Test Document")
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[
        {"question": "Q1", "options": {"correct": "A"}, "explanation": "Exp1"}
    ]) as mock_generate:
        result = service.create_quiz_from_document(mock_db, user, document_id, space_id, max_questions=None)

    assert result == mock_quiz
    mock_doc_repo.get_by_id.assert_called_once_with(mock_db, document_id)
    mock_verify.assert_called_once_with(mock_document, user)
    mock_quiz_repo.create_quiz.assert_called_once()

    # Verify space context was passed to OpenAI
    openai_call = mock_generate.call_args
    assert openai_call.kwargs['space_context'] == "Math study space"


@patch('app.repositories.document_repository.DocumentRepository')
@patch('app.core.dependencies.verify_document_ownership')
def test_create_quiz_from_document_empty_text_fails(mock_verify, mock_doc_repo):
    """create_quiz_from_document debe fallar si documento no tiene texto"""
    mock_db = MagicMock()
    user = Mock(id=uuid4())
    document_id = uuid4()
    space_id = uuid4()

    mock_document = Mock()
    mock_document.extracted_text = ""  # Empty text
    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify.return_value = mock_document

    service = QuizService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_quiz_from_document(mock_db, user, document_id, space_id, max_questions=None)

    assert exc_info.value.status_code == 400
    assert "texto extraído" in exc_info.value.detail.lower()


@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.repositories.document_repository.DocumentRepository')
@patch('app.core.dependencies.verify_document_ownership')
def test_create_quiz_from_document_not_in_space(mock_verify_doc, mock_doc_repo, mock_verify_space, mock_space_repo):
    """create_quiz_from_document debe fallar si documento no está en el espacio"""
    mock_db = MagicMock()
    user = Mock(id=uuid4())
    document_id = uuid4()
    space_id = uuid4()
    other_space_id = uuid4()

    # Mock document con texto válido pero pertenece a OTRO espacio
    mock_other_space = Mock()
    mock_other_space.id = other_space_id

    mock_document = Mock()
    mock_document.id = document_id
    mock_document.extracted_text = "Valid text content"
    mock_document.study_spaces = [mock_other_space]  # Documento en OTRO espacio

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document

    # Mock del espacio solicitado
    mock_space = Mock()
    mock_space.id = space_id
    mock_space.user_id = user.id
    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify_space.return_value = mock_space

    service = QuizService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_quiz_from_document(mock_db, user, document_id, space_id, max_questions=None)

    assert exc_info.value.status_code == 400
    assert "no está asociado al espacio" in exc_info.value.detail.lower()


@patch('app.services.quiz_service.settings')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.repositories.document_repository.DocumentRepository')
@patch('app.core.dependencies.verify_document_ownership')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_document_with_max_questions(mock_openai_settings, mock_quiz_repo, mock_verify_doc, mock_doc_repo, mock_verify_space, mock_space_repo, mock_settings):
    """create_quiz_from_document debe ajustar max_questions al rango válido"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30
    mock_settings.DEFAULT_QUIZ_QUESTIONS = 10

    mock_db = MagicMock()
    user = Mock(id=uuid4())
    document_id = uuid4()
    space_id = uuid4()

    # Mock space
    mock_space = Mock()
    mock_space.id = space_id
    mock_space.user_id = user.id
    mock_space.description = "Math space"

    # Mock document válido en el espacio
    mock_document = Mock()
    mock_document.id = document_id
    mock_document.extracted_text = "Valid document content"
    mock_document.study_spaces = [mock_space]

    mock_doc_repo.get_by_id.return_value = mock_document
    mock_verify_doc.return_value = mock_document
    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify_space.return_value = mock_space

    # Mock adaptive difficulty
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    mock_quiz = Mock(id=uuid4())
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[{"q": "1"}] * 50):
        # max_questions = 2 debería ajustarse a MIN (5)
        result = service.create_quiz_from_document(mock_db, user, document_id, space_id, max_questions=2)

        call_args = service.openai_service.generate_quiz.call_args
        # num_questions debería ser 5 (MIN_QUESTIONS_PER_QUIZ)
        assert call_args.kwargs['num_questions'] == 5


# ========================================
# TESTS PARA create_quiz_from_summary()
# ========================================

@patch('app.services.quiz_service.SummaryRepository')
@patch('app.services.quiz_service.verify_summary_ownership')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_summary_success(mock_openai_settings, mock_quiz_repo, mock_verify, mock_summary_repo):
    """create_quiz_from_summary debe crear quiz desde resumen existente"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"

    mock_db = MagicMock()
    user = Mock()
    user.id = uuid4()
    summary_id = uuid4()
    space_id = uuid4()

    # Mock summary with study space
    mock_summary = Mock()
    mock_summary.id = summary_id
    mock_summary.title = "Summary Title"
    mock_summary.content = {"summary": "This is the summary text"}
    mock_summary.expertise_level = "medio"
    mock_summary.document_id = uuid4()
    mock_summary.source_document_title = "Original Doc"
    mock_summary.document_state = "active_in_space"
    mock_summary.study_space_id = space_id
    mock_space = Mock()
    mock_space.description = "Biology study space"
    mock_summary.study_space = mock_space

    mock_summary_repo.get_by_id.return_value = mock_summary
    mock_verify.return_value = mock_summary

    # Mock adaptive difficulty
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    mock_quiz = Mock(id=uuid4())
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[
        {"question": "Q1", "options": {"correct": "A"}, "explanation": "Exp1"}
    ]):
        result = service.create_quiz_from_summary(mock_db, user, summary_id, max_questions=None)

    assert result == mock_quiz
    mock_summary_repo.get_by_id.assert_called_once_with(mock_db, summary_id)
    mock_verify.assert_called_once_with(mock_summary, user)

    # Verify source metadata was captured
    call_args = mock_quiz_repo.create_quiz.call_args
    assert call_args.kwargs['source_type'] == 'summary'
    assert call_args.kwargs['source_summary_id'] == summary_id
    assert call_args.kwargs['source_metadata']['expertise_level'] == "medio"


# ========================================
# TESTS PARA get_quiz() and get_quizzes()
# ========================================

@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.quiz_service.verify_quiz_ownership')
def test_get_quiz_success(mock_verify, mock_quiz_repo):
    """get_quiz debe retornar quiz si pertenece al usuario"""
    mock_db = MagicMock()
    user = Mock(id=uuid4())
    quiz_id = uuid4()

    mock_quiz = Mock(id=quiz_id, title="Test Quiz")
    mock_quiz_repo.get_quiz_by_id.return_value = mock_quiz
    mock_verify.return_value = mock_quiz

    service = QuizService()
    result = service.get_quiz(mock_db, quiz_id, user)

    assert result == mock_quiz
    mock_quiz_repo.get_quiz_by_id.assert_called_once_with(mock_db, quiz_id)
    mock_verify.assert_called_once_with(mock_quiz, user)


@patch('app.services.quiz_service.QuizRepository')
def test_get_quizzes_with_pagination(mock_quiz_repo):
    """get_quizzes debe retornar lista paginada de quizzes"""
    mock_db = MagicMock()
    user_id = uuid4()

    mock_quizzes = [Mock(id=uuid4()) for _ in range(5)]
    mock_quiz_repo.get_quizzes_by_user.return_value = mock_quizzes
    mock_quiz_repo.count_quizzes_by_user.return_value = 15

    service = QuizService()
    quizzes, total = service.get_quizzes(mock_db, user_id, skip=0, limit=5)

    assert quizzes == mock_quizzes
    assert total == 15
    mock_quiz_repo.get_quizzes_by_user.assert_called_once_with(mock_db, user_id, 0, 5)
    mock_quiz_repo.count_quizzes_by_user.assert_called_once_with(mock_db, user_id)


@patch('app.services.quiz_service.settings')
@patch('app.services.quiz_service.SummaryRepository')
@patch('app.services.quiz_service.verify_summary_ownership')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_summary_with_max_questions(mock_openai_settings, mock_quiz_repo, mock_verify, mock_summary_repo, mock_settings):
    """create_quiz_from_summary debe ajustar max_questions al rango válido"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30
    mock_settings.DEFAULT_QUIZ_QUESTIONS = 10

    mock_db = MagicMock()
    user = Mock(id=uuid4())
    summary_id = uuid4()

    # Mock summary con contenido válido
    mock_summary = Mock()
    mock_summary.id = summary_id
    mock_summary.content = {"summary": "Valid summary content for quiz generation"}
    mock_summary.study_space_id = None  # Sin espacio asociado
    mock_summary.study_space = None

    mock_summary_repo.get_by_id.return_value = mock_summary
    mock_verify.return_value = mock_summary

    mock_quiz = Mock(id=uuid4())
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[{"q": "1"}] * 50):
        # max_questions = 100 debería ajustarse a MAX (30)
        result = service.create_quiz_from_summary(mock_db, user, summary_id, max_questions=100)

        call_args = service.openai_service.generate_quiz.call_args
        # num_questions debería ser 30 (MAX_QUESTIONS_PER_QUIZ)
        assert call_args.kwargs['num_questions'] == 30


# ========================================
# TESTS PARA create_quiz_from_space()
# ========================================

@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_space_success(mock_openai_settings, mock_quiz_repo, mock_verify, mock_space_repo):
    """create_quiz_from_space debe combinar resúmenes del espacio"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"

    mock_db = MagicMock()
    user = Mock(id=uuid4())
    space_id = uuid4()

    # Mock space with multiple summaries
    mock_summary1 = Mock()
    mock_summary1.id = uuid4()
    mock_summary1.title = "Summary 1"
    mock_summary1.content = {"summary": "First summary content"}

    mock_summary2 = Mock()
    mock_summary2.id = uuid4()
    mock_summary2.title = "Summary 2"
    mock_summary2.content = {"summary": "Second summary content"}

    mock_space = Mock()
    mock_space.id = space_id
    mock_space.name = "Math Space"
    mock_space.description = "Mathematics study space"
    mock_space.summaries = [mock_summary1, mock_summary2]

    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify.return_value = mock_space

    # Mock adaptive difficulty
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    mock_quiz = Mock(id=uuid4())
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[
        {"question": "Q1", "options": {"correct": "A"}, "explanation": "Exp1"}
    ]) as mock_generate:
        result = service.create_quiz_from_space(mock_db, user, space_id, max_questions=None)

    assert result == mock_quiz

    # Verify combined text was passed to OpenAI
    openai_call = mock_generate.call_args
    combined_text = openai_call.kwargs['text']
    assert "First summary content" in combined_text
    assert "Second summary content" in combined_text
    assert openai_call.kwargs['space_context'] == "Mathematics study space"


@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
def test_create_quiz_from_space_no_summaries_fails(mock_verify, mock_space_repo):
    """create_quiz_from_space debe fallar si espacio no tiene resúmenes"""
    mock_db = MagicMock()
    user = Mock(id=uuid4())
    space_id = uuid4()

    mock_space = Mock()
    mock_space.summaries = []  # No summaries

    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify.return_value = mock_space

    service = QuizService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_quiz_from_space(mock_db, user, space_id, max_questions=None)

    assert exc_info.value.status_code == 400
    assert "resúmenes" in exc_info.value.detail.lower()


@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
def test_create_quiz_from_space_with_empty_content(mock_verify, mock_space_repo):
    """create_quiz_from_space debe fallar si summaries tienen contenido vacío"""
    mock_db = MagicMock()
    user = Mock(id=uuid4())
    space_id = uuid4()

    # Summaries existen pero con contenido vacío
    mock_summary1 = Mock()
    mock_summary1.content = {"summary": ""}  # Contenido vacío
    mock_summary2 = Mock()
    mock_summary2.content = {}  # Sin key "summary"
    mock_summary3 = Mock()
    mock_summary3.content = {"other": "data"}  # Sin key "summary"

    mock_space = Mock()
    mock_space.summaries = [mock_summary1, mock_summary2, mock_summary3]

    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify.return_value = mock_space

    service = QuizService()

    with pytest.raises(HTTPException) as exc_info:
        service.create_quiz_from_space(mock_db, user, space_id, max_questions=None)

    assert exc_info.value.status_code == 400
    assert "no contienen contenido válido" in exc_info.value.detail.lower()


@patch('app.services.quiz_service.settings')
@patch('app.repositories.study_space_repository.StudySpaceRepository')
@patch('app.core.dependencies.verify_space_ownership')
@patch('app.services.quiz_service.QuizRepository')
@patch('app.services.openai_service.settings')
def test_create_quiz_from_space_with_max_questions(mock_openai_settings, mock_quiz_repo, mock_verify, mock_space_repo, mock_settings):
    """create_quiz_from_space debe ajustar max_questions al rango válido"""
    mock_openai_settings.OPENAI_API_KEY = "sk-test-key"
    mock_openai_settings.OPENAI_MODEL = "gpt-4"
    mock_settings.MIN_QUESTIONS_PER_QUIZ = 5
    mock_settings.MAX_QUESTIONS_PER_QUIZ = 30
    mock_settings.DEFAULT_QUIZ_QUESTIONS = 10

    mock_db = MagicMock()
    user = Mock(id=uuid4())
    space_id = uuid4()

    # Summary con contenido válido
    mock_summary = Mock()
    mock_summary.content = {"summary": "Valid summary content for quiz generation"}

    mock_space = Mock()
    mock_space.id = space_id
    mock_space.summaries = [mock_summary]
    mock_space.description = "Test space"

    mock_space_repo.get_by_id.return_value = mock_space
    mock_verify.return_value = mock_space

    # Mock adaptive difficulty
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    mock_quiz = Mock(id=uuid4())
    mock_quiz_repo.create_quiz.return_value = mock_quiz

    service = QuizService()
    with patch.object(service.openai_service, 'generate_quiz', return_value=[{"q": "1"}] * 50):
        # max_questions = 100 debería ajustarse a MAX (30)
        result = service.create_quiz_from_space(mock_db, user, space_id, max_questions=100)

        call_args = service.openai_service.generate_quiz.call_args
        # num_questions debería ser 30 (MAX_QUESTIONS_PER_QUIZ)
        assert call_args.kwargs['num_questions'] == 30
