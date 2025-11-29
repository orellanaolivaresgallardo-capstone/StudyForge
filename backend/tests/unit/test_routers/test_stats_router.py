"""
Tests para el router de estadísticas
"""
import pytest
from uuid import uuid4
from unittest.mock import Mock, patch
from datetime import datetime

from app.routers.stats import (
    get_user_performance,
    get_user_summary,
    get_progress_by_space,
)


class TestGetUserPerformance:
    """Tests para obtener historial de desempeño"""

    def test_get_user_performance_with_attempts(self, fake_user, fake_db):
        """Debe retornar historial de intentos recientes"""
        # Arrange
        fake_attempt1 = Mock()
        fake_attempt1.id = uuid4()
        fake_attempt1.quiz_id = uuid4()
        fake_attempt1.score = 85.5
        fake_attempt1.completed_at = datetime(2024, 1, 15, 10, 30)

        fake_attempt2 = Mock()
        fake_attempt2.id = uuid4()
        fake_attempt2.quiz_id = uuid4()
        fake_attempt2.score = 92.3
        fake_attempt2.completed_at = datetime(2024, 1, 16, 14, 20)

        # Mock query results: (attempt, quiz_title, difficulty_level, study_space_id)
        mock_results = [
            (fake_attempt2, "Quiz Reciente", 3, uuid4()),
            (fake_attempt1, "Quiz Anterior", 2, None),
        ]

        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = mock_results

        fake_db.query.return_value = mock_query

        # Act
        result = get_user_performance(limit=10, current_user=fake_user, db=fake_db)

        # Assert
        assert "recent_attempts" in result
        assert len(result["recent_attempts"]) == 2

        # Verificar primer intento (más reciente)
        first = result["recent_attempts"][0]
        assert first["quiz_title"] == "Quiz Reciente"
        assert first["score"] == 92.3
        assert first["difficulty_level"] == 3
        assert first["study_space_id"] is not None

        # Verificar segundo intento
        second = result["recent_attempts"][1]
        assert second["quiz_title"] == "Quiz Anterior"
        assert second["score"] == 85.5
        assert second["study_space_id"] is None

    def test_get_user_performance_empty(self, fake_user, fake_db):
        """Debe retornar lista vacía si no hay intentos"""
        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []

        fake_db.query.return_value = mock_query

        result = get_user_performance(current_user=fake_user, db=fake_db)

        assert result["recent_attempts"] == []

    def test_get_user_performance_custom_limit(self, fake_user, fake_db):
        """Debe respetar el límite personalizado"""
        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []

        fake_db.query.return_value = mock_query

        get_user_performance(limit=5, current_user=fake_user, db=fake_db)

        # Verificar que se llamó limit con el valor correcto
        mock_query.limit.assert_called_once_with(5)

    def test_get_user_performance_score_rounding(self, fake_user, fake_db):
        """Debe redondear scores a 2 decimales"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = uuid4()
        fake_attempt.score = 87.6789
        fake_attempt.completed_at = datetime.now()

        mock_results = [(fake_attempt, "Quiz Test", 2, None)]

        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = mock_results

        fake_db.query.return_value = mock_query

        result = get_user_performance(current_user=fake_user, db=fake_db)

        assert result["recent_attempts"][0]["score"] == 87.68

    def test_get_user_performance_null_score(self, fake_user, fake_db):
        """Debe manejar score None como 0"""
        fake_attempt = Mock()
        fake_attempt.id = uuid4()
        fake_attempt.quiz_id = uuid4()
        fake_attempt.score = None
        fake_attempt.completed_at = datetime.now()

        mock_results = [(fake_attempt, "Quiz Test", 2, None)]

        mock_query = Mock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = mock_results

        fake_db.query.return_value = mock_query

        result = get_user_performance(current_user=fake_user, db=fake_db)

        assert result["recent_attempts"][0]["score"] == 0


class TestGetUserSummary:
    """Tests para obtener resumen de estadísticas"""

    def test_get_user_summary_complete(self, fake_user, fake_db):
        """Debe retornar resumen completo de estadísticas"""
        # Crear mocks separados para cada tipo de query
        call_count = {'count': 0}

        def query_side_effect(model):
            call_count['count'] += 1
            call_num = call_count['count']

            mock_query = Mock()
            mock_query.filter.return_value = mock_query
            mock_query.join.return_value = mock_query

            # Calls 1-3: count queries (Summary, Quiz, QuizAttempt)
            if call_num <= 3:
                values = {1: 5, 2: 10, 3: 25}  # summaries, quizzes, attempts
                mock_query.count.return_value = values.get(call_num, 0)
            # Call 4: avg score
            elif call_num == 4:
                mock_query.scalar.return_value = 82.5
            # Call 5: max score
            elif call_num == 5:
                mock_query.scalar.return_value = 95.0
            # Call 6: unique spaces
            else:
                mock_query.scalar.return_value = 3

            return mock_query

        fake_db.query.side_effect = query_side_effect

        result = get_user_summary(current_user=fake_user, db=fake_db)

        assert result["total_summaries"] == 5
        assert result["total_quizzes"] == 10
        assert result["total_completed_attempts"] == 25
        assert result["avg_score"] == 82.5
        assert result["best_score"] == 95.0
        assert result["unique_spaces_studied"] == 3

    def test_get_user_summary_no_data(self, fake_user, fake_db):
        """Debe manejar usuario sin datos"""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 0
        mock_query.join.return_value = mock_query
        mock_query.scalar.return_value = None

        fake_db.query.return_value = mock_query

        result = get_user_summary(current_user=fake_user, db=fake_db)

        assert result["total_summaries"] == 0
        assert result["total_quizzes"] == 0
        assert result["total_completed_attempts"] == 0
        assert result["avg_score"] == 0
        assert result["best_score"] == 0
        assert result["unique_spaces_studied"] == 0

    def test_get_user_summary_score_rounding(self, fake_user, fake_db):
        """Debe redondear scores a 2 decimales"""
        mock_query = Mock()
        mock_query.filter.return_value = mock_query
        mock_query.count.return_value = 0
        mock_query.join.return_value = mock_query

        # Mock para avg y max con decimales largos
        mock_avg_query = Mock()
        mock_avg_query.filter.return_value = mock_avg_query
        mock_avg_query.scalar.return_value = 87.6789

        mock_max_query = Mock()
        mock_max_query.filter.return_value = mock_max_query
        mock_max_query.scalar.return_value = 95.4321

        mock_spaces_query = Mock()
        mock_spaces_query.join.return_value = mock_spaces_query
        mock_spaces_query.filter.return_value = mock_spaces_query
        mock_spaces_query.scalar.return_value = 0

        with patch('app.routers.stats.func') as mock_func:
            mock_func.avg.return_value = "avg"
            mock_func.max.return_value = "max"
            mock_func.count.return_value = "count"
            mock_func.distinct.return_value = "distinct"

            def query_with_func(func_call):
                if func_call == "avg":
                    return mock_avg_query
                elif func_call == "max":
                    return mock_max_query
                elif func_call == "count":
                    return mock_spaces_query
                return mock_query

            fake_db.query.side_effect = query_with_func

            result = get_user_summary(current_user=fake_user, db=fake_db)

            assert result["avg_score"] == 87.68
            assert result["best_score"] == 95.43


class TestGetProgressBySpace:
    """Tests para obtener progreso por espacio de estudio"""

    def test_get_progress_by_space_with_spaces(self, fake_user, fake_db, fake_study_space):
        """Debe retornar estadísticas por espacio"""
        # Setup fake space con documentos y resúmenes
        fake_doc1 = Mock()
        fake_doc2 = Mock()
        fake_summary1 = Mock()

        fake_study_space.documents = [fake_doc1, fake_doc2]
        fake_study_space.summaries = [fake_summary1]

        # Mock quizzes del espacio
        fake_quiz1 = Mock()
        fake_quiz1.id = uuid4()

        fake_quiz2 = Mock()
        fake_quiz2.id = uuid4()

        # Mock attempts
        fake_attempt1 = Mock()
        fake_attempt1.score = 80.0
        fake_attempt2 = Mock()
        fake_attempt2.score = 90.0

        # Mock para SQLAlchemy 2.0 API (select query para espacios)
        # NOTE: .unique() is required when using joinedload() with collections
        fake_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [fake_study_space]

        # Mock para legacy API (db.query para quizzes y attempts)
        mock_quiz_query = Mock()
        mock_quiz_query.filter.return_value = mock_quiz_query

        mock_attempt_query = Mock()
        mock_attempt_query.filter.return_value = mock_attempt_query

        def query_side_effect(model):
            if "Quiz" in str(model) and "Attempt" not in str(model):
                # Primera llamada: quizzes del espacio
                # Segunda llamada: quizzes globales
                if not hasattr(query_side_effect, 'quiz_call_count'):
                    query_side_effect.quiz_call_count = 0
                query_side_effect.quiz_call_count += 1

                if query_side_effect.quiz_call_count == 1:
                    mock_quiz_query.all.return_value = [fake_quiz1, fake_quiz2]
                else:
                    mock_quiz_query.all.return_value = []
                return mock_quiz_query
            elif "QuizAttempt" in str(model):
                mock_attempt_query.all.return_value = [fake_attempt1, fake_attempt2]
                return mock_attempt_query
            return Mock()

        fake_db.query.side_effect = query_side_effect

        # Act
        result = get_progress_by_space(current_user=fake_user, db=fake_db)

        # Assert
        assert len(result) == 1
        space_stats = result[0]
        assert space_stats.space_name == fake_study_space.name
        assert space_stats.num_documents == 2
        assert space_stats.num_summaries == 1
        assert space_stats.num_quizzes == 2
        assert space_stats.total_attempts == 2
        assert space_stats.avg_score == 85.0
        assert space_stats.best_score == 90.0

    def test_get_progress_by_space_no_spaces(self, fake_user, fake_db):
        """Debe manejar usuario sin espacios"""
        # Mock para SQLAlchemy 2.0 API (select query para espacios)
        # NOTE: .unique() is required when using joinedload() with collections
        fake_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = []

        # Mock para legacy API (db.query para quizzes globales)
        mock_quiz_query = Mock()
        mock_quiz_query.filter.return_value = mock_quiz_query
        mock_quiz_query.all.return_value = []

        def query_side_effect(model):
            if "Quiz" in str(model):
                return mock_quiz_query
            return Mock()

        fake_db.query.side_effect = query_side_effect

        result = get_progress_by_space(current_user=fake_user, db=fake_db)

        assert len(result) == 0

    def test_get_progress_by_space_with_global_quizzes(self, fake_user, fake_db):
        """Debe incluir entrada 'Global' para quizzes sin espacio"""
        # Mock para SQLAlchemy 2.0 API (select query para espacios)
        # NOTE: .unique() is required when using joinedload() with collections
        fake_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = []

        # No hay espacios, pero hay quizzes globales
        fake_global_quiz = Mock()
        fake_global_quiz.id = uuid4()

        fake_attempt = Mock()
        fake_attempt.score = 88.0

        # Mock para legacy API (db.query para quizzes y attempts)
        mock_quiz_query = Mock()
        mock_quiz_query.filter.return_value = mock_quiz_query
        mock_quiz_query.all.return_value = [fake_global_quiz]

        mock_attempt_query = Mock()
        mock_attempt_query.filter.return_value = mock_attempt_query
        mock_attempt_query.all.return_value = [fake_attempt]

        def query_side_effect(model):
            if "Quiz" in str(model) and "Attempt" not in str(model):
                return mock_quiz_query
            elif "QuizAttempt" in str(model):
                return mock_attempt_query
            return Mock()

        fake_db.query.side_effect = query_side_effect

        result = get_progress_by_space(current_user=fake_user, db=fake_db)

        assert len(result) == 1
        assert result[0].space_id == "global"
        assert result[0].space_name == "Global"
        assert result[0].num_quizzes == 1
        assert result[0].total_attempts == 1
        assert result[0].avg_score == 88.0

    def test_get_progress_by_space_no_attempts(self, fake_user, fake_db, fake_study_space):
        """Debe manejar espacios sin intentos completados"""
        fake_study_space.documents = []
        fake_study_space.summaries = []

        # Mock para SQLAlchemy 2.0 API (select query para espacios)
        # NOTE: .unique() is required when using joinedload() with collections
        fake_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [fake_study_space]

        # Mock para legacy API (db.query para quizzes)
        mock_quiz_query = Mock()
        mock_quiz_query.filter.return_value = mock_quiz_query
        mock_quiz_query.all.return_value = []

        def query_side_effect(model):
            if "Quiz" in str(model):
                return mock_quiz_query
            return Mock()

        fake_db.query.side_effect = query_side_effect

        result = get_progress_by_space(current_user=fake_user, db=fake_db)

        assert len(result) == 1
        assert result[0].total_attempts == 0
        assert result[0].avg_score == 0
        assert result[0].best_score == 0

    def test_get_progress_by_space_score_calculation(self, fake_user, fake_db, fake_study_space):
        """Debe calcular correctamente avg y best score"""
        fake_study_space.documents = []
        fake_study_space.summaries = []

        fake_quiz = Mock()
        fake_quiz.id = uuid4()

        fake_attempt1 = Mock()
        fake_attempt1.score = 70.0
        fake_attempt2 = Mock()
        fake_attempt2.score = 85.0
        fake_attempt3 = Mock()
        fake_attempt3.score = 95.0

        # Mock para SQLAlchemy 2.0 API (select query para espacios)
        # NOTE: .unique() is required when using joinedload() with collections
        fake_db.execute.return_value.unique.return_value.scalars.return_value.all.return_value = [fake_study_space]

        # Mock para legacy API (db.query para quizzes y attempts)
        mock_quiz_query = Mock()
        mock_quiz_query.filter.return_value = mock_quiz_query

        mock_attempt_query = Mock()
        mock_attempt_query.filter.return_value = mock_attempt_query

        def query_side_effect(model):
            if "Quiz" in str(model) and "Attempt" not in str(model):
                if not hasattr(query_side_effect, 'quiz_call_count'):
                    query_side_effect.quiz_call_count = 0
                query_side_effect.quiz_call_count += 1

                if query_side_effect.quiz_call_count == 1:
                    mock_quiz_query.all.return_value = [fake_quiz]
                else:
                    mock_quiz_query.all.return_value = []
                return mock_quiz_query
            elif "QuizAttempt" in str(model):
                mock_attempt_query.all.return_value = [fake_attempt1, fake_attempt2, fake_attempt3]
                return mock_attempt_query
            return Mock()

        fake_db.query.side_effect = query_side_effect

        result = get_progress_by_space(current_user=fake_user, db=fake_db)

        assert len(result) == 1
        # avg = (70 + 85 + 95) / 3 = 83.33
        assert result[0].avg_score == 83.33
        assert result[0].best_score == 95.0
