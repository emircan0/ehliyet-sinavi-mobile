import { useState, useCallback } from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { fetchQuickPracticeQuestions, saveQuizResults } from '../api/queries';

export function useQuiz() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setQuestions, resetQuiz, questions, selectedAnswers } = useQuizStore();

    const startNewQuiz = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            setError(null);
            resetQuiz();

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
        const score = total > 0 ? (correct / total) * 100 : 0;

        try {
            // Updated to match saveQuizResults signature in queries.ts
            await saveQuizResults(
                userId,
                category,
                score,
                correct,
                wrong,
                total,
                selectedAnswers
            );
        } catch (err) {
            console.error(err);
            setError('Sorular yüklenirken bir hata oluştu.');
        } finally {
            return false;
        }

        return { score, correct, wrong };

    }, [questions, selectedAnswers]);

    return {
        startNewQuiz,
        submitQuiz,
        loading,
        error
    };
}
