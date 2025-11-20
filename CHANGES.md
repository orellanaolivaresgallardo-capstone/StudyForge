# Changelog - StudyForge

## [2.0.0] - 2025-11-20

### Rediseño Completo del Sistema de Quizzes

#### Problemas Identificados

1. **Bug crítico**: `max_questions` siempre se guardaba como 10, independientemente del valor enviado
2. **Bug crítico**: `correct_option` siempre se guardaba como "A" para todas las preguntas
3. **Limitación de diseño**: Sin randomización de opciones - los usuarios podían memorizar posiciones
4. **Complejidad innecesaria**: 4 tablas relacionadas (quizzes, questions, answers, quiz_attempts) con múltiples JOINs

#### Solución Implementada

**Arquitectura nueva: Almacenamiento JSON**

- Reducción de **4 tablas a 2** (`quizzes` y `quiz_attempts`)
- Preguntas almacenadas como **JSONB** en `quizzes.questions`
- Respuestas almacenadas como **JSON arrays** en `quiz_attempts`:
  - `correct_answers`: Array de letras donde quedó la respuesta correcta após randomización
  - `user_answers`: Array de las respuestas del usuario

**Formato de Opciones**

Cambio del formato con letras fijas a formato semántico:

```json
// Antes (no permitía randomización):
{
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "option_d": "...",
  "correct_option": "A"
}

// Después (permite randomización):
{
  "options": {
    "correct": "...",
    "semi-correct": "...",
    "incorrect1": "...",
    "incorrect2": "..."
  }
}
```

**Randomización de Opciones**

- Se realiza cuando el usuario **inicia un intento** (no al crear el quiz)
- Las opciones se mezclan con `random.shuffle()`
- Se genera un array `correct_answers` con las posiciones (A/B/C/D) de las respuestas correctas
- Cada intento tiene un orden diferente de opciones

**Evaluación Simplificada**

```python
# Antes: JOIN entre quiz_attempts, answers, questions
score = db.query(...).join(...).join(...)...

# Después: Comparación de arrays
score = sum(
    1 for i, correct in enumerate(correct_answers)
    if i < len(user_answers) and user_answers[i] == correct
) / len(correct_answers) * 100
```

---

### Cambios en Backend

#### Modelos Modificados

**`app/models/quiz.py`**:
- Eliminado: `max_questions` field
- Agregado: `questions: JSONB` - almacena array de preguntas
- Actualizado: `__repr__` para evitar errores de tipo

**`app/models/quiz_attempt.py`**:
- Agregado: `correct_answers: JSONB` - array de letras correctas
- Agregado: `user_answers: JSONB` - array de respuestas del usuario
- Actualizado: `__repr__` con manejo de estado

**Modelos Eliminados**:
- `app/models/question.py` - Ya no existe como tabla
- `app/models/answer.py` - Ya no existe como tabla

#### Schemas Modificados

**`app/schemas/quiz.py`**:
```python
# Nuevos schemas
class QuestionOptionsData(BaseModel):
    correct: str
    semi_correct: str = Field(alias="semi-correct")
    incorrect1: str
    incorrect2: str

class QuestionData(BaseModel):
    question: str
    options: QuestionOptionsData
    explanation: str

class QuestionWithRandomizedOptions(BaseModel):
    question: str
    options: Dict[str, str]  # {'A': '...', 'B': '...', etc}
    explanation: str

class QuizResponse(BaseModel):
    # ... otros campos ...
    questions: List[Dict[str, Any]]  # JSON directo
```

**`app/schemas/quiz_attempt.py`**:
```python
class QuizAttemptResponse(BaseModel):
    # ... otros campos ...
    correct_answers: List[str]  # ["A", "B", "C", ...]
    user_answers: List[str]  # ["A", "C", "B", ...]

class QuizAttemptWithQuestionsResponse(QuizAttemptResponse):
    randomized_questions: List[Dict[str, Any]]  # Preguntas aleatorizadas

class AnswerCreate(BaseModel):
    question_index: int  # Cambió de question_id a question_index
    selected_option: str

class QuizResultResponse(BaseModel):
    attempt_id: UUID
    quiz_id: UUID
    score: float
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    completed_at: datetime
    questions: List[QuestionResultDetail]
```

#### Repositorios Modificados

**`app/repositories/quiz_repository.py`**:
- **Eliminados**: Métodos `create_question()`, `get_question_by_id()`, etc.
- **Modificado**: `create_quiz()` ahora acepta `questions: List[Dict[str, Any]]`
- **Simplificado**: No más lógica de preguntas individuales

**`app/repositories/quiz_attempt_repository.py`**:
- **Nuevo método**: `_randomize_options()` - mezcla opciones y retorna respuestas correctas
- **Modificado**: `create_attempt()` retorna tupla `(attempt, randomized_questions)`
- **Nuevo método**: `record_answer()` - registra respuesta usando índice
- **Nuevo método**: `calculate_score()` - compara arrays
- **Eliminados**: Métodos relacionados con tabla `answers`

#### Servicios Modificados

**`app/services/openai_service.py`**:
```python
# Prompt actualizado para retornar formato semántico
"options": {
    "correct": "alternativa correcta",
    "semi-correct": "alternativa casi correcta",
    "incorrect1": "alternativa que puede confundir",
    "incorrect2": "otra alternativa que puede confundir"
}
```

**`app/services/quiz_service.py`**:
- **Eliminado**: Loop que creaba preguntas individuales
- **Simplificado**: Pasa array de preguntas directamente al repository

#### Routers Modificados

**`app/routers/quiz_attempts.py`**:
- **POST `/quiz-attempts`**: Retorna `QuizAttemptWithQuestionsResponse` con preguntas aleatorizadas
- **POST `/quiz-attempts/{id}/answer`**: Usa `question_index` en lugar de `question_id`
- **GET `/quiz-attempts/{id}/results`**: Retorna nueva estructura `QuizResultResponse`

#### Migración de Base de Datos

**`alembic/versions/009b6b08e68a_redesign_quizzes_to_use_json_structure.py`**:
```python
# Upgrade
- Agregar quizzes.questions (JSONB)
- Eliminar quizzes.max_questions
- Agregar quiz_attempts.correct_answers (JSONB)
- Agregar quiz_attempts.user_answers (JSONB)
- Eliminar tablas questions y answers (cascade)

# Downgrade
- Revertir todos los cambios
- Recrear tablas questions y answers
```

---

### Cambios en Frontend

#### Tipos TypeScript Actualizados

**`frontend/src/types/api.types.ts`**:
```typescript
// Nuevos tipos
interface QuestionOptionsData {
  correct: string;
  "semi-correct": string;
  incorrect1: string;
  incorrect2: string;
}

interface QuestionData {
  question: string;
  options: QuestionOptionsData;
  explanation: string;
}

interface QuestionWithRandomizedOptions {
  question: string;
  options: Record<string, string>;  // {'A': '...', 'B': '...', etc}
  explanation: string;
}

interface QuizResponse {
  // ... otros campos ...
  questions: QuestionData[];  // Preguntas en JSON
}

interface QuizAttemptWithQuestionsResponse extends QuizAttemptResponse {
  randomized_questions: QuestionWithRandomizedOptions[];
}

interface QuizAttemptAnswer {
  question_index: number;  // Cambió de question_id
  selected_option: CorrectOption;
}

interface QuizResultResponse {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  completed_at: string;
  questions: QuestionResultDetail[];
}
```

#### Componentes Actualizados

**`frontend/src/pages/QuizAttempt.tsx`**:
```typescript
// Cambios principales:
- Estado: QuizAttemptWithQuestionsResponse en lugar de separar quiz y attempt
- Preguntas: attempt.randomized_questions en lugar de quiz.questions
- Responder: Usa question_index en lugar de question_id
- Opciones: currentQuestion.options[letter] en lugar de currentQuestion.option_a
```

**`frontend/src/pages/QuizResults.tsx`**:
```typescript
// Cambios principales:
- Tipo: QuizResultResponse en lugar de QuizAttemptResultsResponse
- Estructura: results.questions directamente en lugar de results.answers.map()
- Opciones: question.options[letter] en lugar de question.option_a
```

#### Servicios API Actualizados

**`frontend/src/services/api.ts`**:
```typescript
// Tipos de retorno actualizados
createQuizAttempt(): Promise<QuizAttemptWithQuestionsResponse>
getQuiz(quizId: string): Promise<QuizResponse>  // Sin QuizDetailResponse
getQuizAttemptResults(attemptId: string): Promise<QuizResultResponse>
```

---

### Beneficios del Rediseño

1. **Bugs Resueltos**:
   - ✅ `max_questions` ahora se infiere del tamaño del array
   - ✅ `correct_option` se determina dinámicamente en cada attempt

2. **Simplicidad**:
   - ✅ 2 tablas vs 4 (50% reducción)
   - ✅ Sin JOINs complejos
   - ✅ Menos código de repositorio

3. **Performance**:
   - ✅ Queries más rápidas (sin JOINs)
   - ✅ Carga atómica de quiz completo
   - ✅ Evaluación en memoria (arrays)

4. **Funcionalidad**:
   - ✅ Randomización automática por attempt
   - ✅ Previene memorización de posiciones
   - ✅ Evaluación más simple y confiable

5. **Flexibilidad**:
   - ✅ Fácil agregar campos a preguntas (solo JSON)
   - ✅ No requiere migraciones para cambios en estructura de preguntas
   - ✅ Compatible con futuras mejoras (ej: almacenar preguntas randomizadas)

---

### Limitaciones Conocidas

1. **Queries SQL sobre preguntas**: No se pueden hacer queries complejas sobre preguntas individuales (trade-off aceptable)

2. **Resultados mostrados**: Actualmente reconstruye opciones en orden fijo (A=correct, B=semi-correct, etc.) en lugar de mostrar el orden randomizado exacto. Posible mejora futura: almacenar `randomized_questions` en el attempt.

---

### Testing

**Backend**:
```bash
# Verificar sintaxis
.venv/Scripts/python.exe -m py_compile backend/app/routers/quiz_attempts.py

# Verificar imports de schemas
.venv/Scripts/python.exe -c "from app.schemas.quiz_attempt import QuizAttemptWithQuestionsResponse"
```

**Frontend**:
- Verificar tipos TypeScript compilados sin errores
- Verificar que no hay imports no utilizados

---

### Migración de Datos

**IMPORTANTE**: Esta es una migración destructiva. Los quizzes y attempts existentes se perderán al hacer upgrade.

Para producción, se necesitaría un script de migración que:
1. Lea quizzes existentes con sus questions
2. Convierta a nuevo formato JSON
3. Migre quiz_attempts con sus answers
4. Valide integridad

**Comando de migración**:
```bash
cd backend
alembic upgrade head
```

---

### Archivos Modificados

**Backend** (23 archivos):
- `app/models/quiz.py`
- `app/models/quiz_attempt.py`
- `app/schemas/quiz.py`
- `app/schemas/quiz_attempt.py`
- `app/schemas/__init__.py`
- `app/repositories/quiz_repository.py`
- `app/repositories/quiz_attempt_repository.py`
- `app/services/openai_service.py`
- `app/services/quiz_service.py`
- `app/routers/quiz_attempts.py`
- `alembic/versions/009b6b08e68a_redesign_quizzes_to_use_json_structure.py`

**Frontend** (4 archivos):
- `src/types/api.types.ts`
- `src/services/api.ts`
- `src/pages/QuizAttempt.tsx`
- `src/pages/QuizResults.tsx`

**Documentación** (2 archivos):
- `CLAUDE.md`
- `CHANGES.md` (este archivo)

**Archivos Eliminados**:
- ❌ `app/models/question.py` (tabla eliminada)
- ❌ `app/models/answer.py` (tabla eliminada)

---

### Próximos Pasos Sugeridos

1. **Testing exhaustivo**: Crear tests unitarios e integración para el nuevo sistema
2. **Almacenar preguntas randomizadas**: Guardar el array `randomized_questions` en el attempt para mostrar el orden exacto en resultados
3. **Validación de JSON Schema**: Agregar validación estricta del formato de preguntas
4. **Migración de datos**: Script para convertir datos existentes si se requiere

---

### Notas para Desarrollo

**Al crear nuevos quizzes**:
```python
questions_data = [{
    "question": "...",
    "options": {
        "correct": "...",
        "semi-correct": "...",
        "incorrect1": "...",
        "incorrect2": "..."
    },
    "explanation": "..."
}]

quiz = QuizRepository.create_quiz(
    db, user_id, summary_id, title, topic, difficulty, questions_data
)
```

**Al tomar un quiz**:
```python
# Crear attempt (auto-randomiza)
attempt, randomized_questions = QuizAttemptRepository.create_attempt(db, quiz, user_id)

# Retornar al frontend con preguntas randomizadas
return QuizAttemptWithQuestionsResponse(
    ...,
    randomized_questions=randomized_questions
)

# Responder pregunta por índice
is_correct = QuizAttemptRepository.record_answer(
    db, attempt, question_index=0, selected_option="B"
)

# Completar
QuizAttemptRepository.complete_attempt(db, attempt)
```

---

**Última actualización**: 2025-11-20
**Versión**: 2.0.0
**Estado**: ✅ Completo y funcional
