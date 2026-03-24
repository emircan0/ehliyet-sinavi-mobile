import { Question } from '../types/database';

export interface AnalysisResult {
    weakTopics: string[];
    suggestions: string[];
}

export async function analyzeQuizPerformance(questions: Question[], userAnswers: (number | null)[]): Promise<AnalysisResult> {

    const wrongCategories = new Set<string>();

    questions.forEach((q, index) => {
        if (userAnswers[index] !== q.correct_option && userAnswers[index] !== null) {
            wrongCategories.add(q.category);
        }
    });

    const suggestions = Array.from(wrongCategories).map(category =>
        `Daha fazla "${category}" sorusu çözmelisin.`
    );

    if (suggestions.length === 0) {
        suggestions.push("Harika iş! Tüm konulara hakim görünüyorsun.");
    }

    return {
        weakTopics: Array.from(wrongCategories),
        suggestions
    };
}
