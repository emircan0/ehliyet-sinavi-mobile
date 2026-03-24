import { Question } from '../types/question';

export interface AiExplanation {
    questionId: string;
    explanation: string;
}

// Mock AI service to simulate Gemini response
export const AiTutorService = {
    getExplanation: async (
        question: Question,
        wrongAnswerIndex: number
    ): Promise<string> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const wrongOption = question.options[wrongAnswerIndex];
        const correctOption = question.options[question.correctAnswer];

        // In a real app, this would call the Gemini API
        return `"${wrongOption}" seçeneğini işaretledin, ancak bu yanlış. 
    
Doğru cevap "${correctOption}" olmalıydı.

Çünkü: ${question.explanation || "Bu konuda yönetmelik gereği belirtilen kurallara uyulması trafikte güvenliği esas alır."}

Gemini Ipucu: Sorudaki anahtar kelimeye dikkat et!`;
    }
};
