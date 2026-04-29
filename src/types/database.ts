export type QuestionCategory = 'trafik' | 'ilkyardim' | 'motor' | 'adap';

export interface Question {
    id: string;
    content: string;
    options: string[];
    correct_option: number; // 0-3 index
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation?: string;
    image_url?: string;
}

export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export interface QuizResult {
    id: string;
    user_id: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    created_at: string;
}
