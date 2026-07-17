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
    license_type?: string;
    exam_date?: string; // Date string (YYYY-MM-DD)
    daily_goal_minutes?: number;
    daily_question_goal?: number;
    notification_time?: string;
    notification_enabled?: boolean;
    timezone?: string;
    app_theme?: string;
    last_active_at?: string;
    onboarding_completed?: boolean;
    premium_status?: string;
    total_quizzes_taken?: number;
    total_questions_answered?: number;
}

export interface QuizResult {
    id: string;
    user_id: string;
    score: number;
    correct_count: number;
    wrong_count: number;
    empty_count: number;
    total_questions: number;
    category: string;
    quiz_type?: string;
    duration_seconds?: number;
    started_at?: string;
    completed_at?: string;
}

export interface AnalyticsEvent {
    id: string;
    user_id?: string;
    event_name: string;
    screen_name?: string;
    quiz_id?: string;
    question_id?: string;
    category?: string;
    duration_seconds?: number;
    metadata?: Record<string, any>;
    created_at: string;
}
