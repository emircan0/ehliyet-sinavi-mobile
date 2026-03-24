import { useState, useCallback } from 'react';
import { useQuizStore } from '../store/useQuizStore';
import { fetchQuestions, saveQuizResult } from '../api/queries';

export function useQuiz() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setQuestions, resetQuiz, questions, userAnswers } = useQuizStore();

    const startNewQuiz = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            resetQuiz();

            const questionsData = await fetchQuestions(10); // Fetch 10 questions
            console.log('Fetched questions:', questionsData);
            setQuestions(questionsData);
        } catch (err) {
            console.error(err);
            setError('Sınav başlatılamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, [resetQuiz, setQuestions]);

    const submitQuiz = useCallback(async (userId: string) => {
        // Calculate final stats
        let correct = 0;
        let wrong = 0;

        questions.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            if (userAnswer === q.correct_option) {
                correct++;
            } else if (userAnswer !== undefined && userAnswer !== null) {
                wrong++;
            }
        });

        const total = questions.length;
        const score = total > 0 ? (correct / total) * 100 : 0;

        try {
            await saveQuizResult(userId, score, total, correct, wrong);
        } catch (err) {
            console.error("Error saving result", err);
            // Even if saving fails, return the calculated score so the user sees it
        }

        return { score, correct, wrong };

    }, [questions, userAnswers]);

    return {
        startNewQuiz,
        submitQuiz,
        loading,
        error
    };
}
