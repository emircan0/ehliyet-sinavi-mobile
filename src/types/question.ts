export type QuestionCategory = 'trafik' | 'ilkyardim' | 'motor' | 'trafik_adabi';

export interface Question {
    id: string;
    content: string;
    options: string[];
    correct_option: number;
    category: string;
    image_url?: string;
    explanation?: string;
}
