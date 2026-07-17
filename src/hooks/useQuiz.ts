import { useState, useCallback, useRef } from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { fetchQuickPracticeQuestions, saveQuizResults } from '../api/queries';

export function useQuiz() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setQuestions, resetQuiz, questions, selectedAnswers } = useQuizStore();
    const startTime = useRef(Date.now());
    const sessionId = useRef(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));

    const startNewQuiz = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);
            resetQuiz();
            startTime.current = Date.now();
            sessionId.current = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

            const questionsData = await fetchQuickPracticeQuestions(userId);
            setQuestions(questionsData);
        } catch (err) {
            console.error(err);
            setError('Sınav başlatılamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, [resetQuiz, setQuestions]);

    const submitQuiz = useCallback(async (userId: string, category: string = 'general') => {
        // Calculate final stats
        let correct = 0;
        let wrong = 0;

        questions.forEach((q, index) => {
            const answer = selectedAnswers[index];
            if (answer && answer.isCorrect) {
                correct++;
            } else if (answer && answer.selectedOption !== undefined) {
                wrong++;
            }
        });

        const total = questions.length;
        const emptyCount = total - (correct + wrong);
        const score = total > 0 ? (correct / total) * 100 : 0;
        const durationSeconds = Math.floor((Date.now() - startTime.current) / 1000);
        const startedAt = new Date(startTime.current).toISOString();

        try {
            // Updated to match saveQuizResults signature in queries.ts
            await saveQuizResults(
                userId,
                category,
                score,
                correct,
                wrong,
                total,
                selectedAnswers,
                durationSeconds,
                emptyCount,
                startedAt,
                'quick',
                sessionId.current
            );
        } catch (err) {
            console.error(err);
            setError('Sorular yüklenirken bir hata oluştu.');
        } finally {
            return { score, correct, wrong };
        }
    }, [questions, selectedAnswers]);

    return {
        startNewQuiz,
        submitQuiz,
        loading,
        error
    };
}
