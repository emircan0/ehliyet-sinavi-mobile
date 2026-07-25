import { create } from 'zustand';
import { Question } from '../types/database';
import { AiTutorService } from '../services/aiTutor';

export interface SelectedAnswer {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
}

interface QuizState {
    questions: Question[];
    currentIndex: number;
    selectedAnswers: Array<SelectedAnswer | undefined>;
    isFinished: boolean;

    // AI Tutor State
    isAiLoading: boolean;
    aiExplanation: string | null;
    activeQuestionId: string | null; // Track which question's explanation is shown

    // Ad State
    mistakesUnlocked: boolean;

    // Actions
    setQuestions: (questions: Question[]) => void;
    nextQuestion: () => void;
    prevQuestion: () => void;
    setAnswer: (questionIndex: number, answerIndex: number, isCorrect: boolean) => void;
    finishQuiz: () => void;
    resetQuiz: () => void;
    unlockMistakes: () => void;
    restoreQuizState: (
        answers: Array<SelectedAnswer | null | undefined>,
        index: number,
        currentQuestionId?: string
    ) => void;

    // AI Actions
    fetchAiExplanation: (question: Question, wrongAnswerIndex: number) => Promise<void>;
    clearAiExplanation: () => void;

    // Computed (via function)
    calculateScore: () => {
        correctCount: number;
        wrongCount: number;
        emptyCount: number;
        score: number;
        success: boolean;
    };
}

export const useQuizStore = create<QuizState>((set, get) => ({
    questions: [],
    currentIndex: 0,
    selectedAnswers: [],
    isFinished: false,
    isAiLoading: false,
    aiExplanation: null,
    activeQuestionId: null,
    mistakesUnlocked: false,

    setQuestions: (questions) => set({
        questions,
        selectedAnswers: new Array(questions.length).fill(undefined),
        currentIndex: 0,
        isFinished: false,
        isAiLoading: false,
        aiExplanation: null,
        activeQuestionId: null,
        mistakesUnlocked: false
    }),

    nextQuestion: () => {
        const { questions, currentIndex } = get();
        if (currentIndex < questions.length - 1) {
            set({
                currentIndex: currentIndex + 1,
                aiExplanation: null, // Clear explanation on change
                activeQuestionId: null
            });
        }
    },

    prevQuestion: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
            set({
                currentIndex: currentIndex - 1,
                aiExplanation: null,
                activeQuestionId: null
            });
        }
    },

    setAnswer: (questionIndex, answerIndex, isCorrect) => set((state) => {
        const newAnswers = [...state.selectedAnswers];
        newAnswers[questionIndex] = {
            questionId: state.questions[questionIndex].id,
            selectedOption: answerIndex,
            isCorrect: isCorrect
        };
        return { selectedAnswers: newAnswers };
    }),

    finishQuiz: () => set({ isFinished: true }),

    resetQuiz: () => set({
        currentIndex: 0,
        selectedAnswers: [],
        isFinished: false,
        isAiLoading: false,
        aiExplanation: null,
        activeQuestionId: null,
        mistakesUnlocked: false
    }),

    unlockMistakes: () => set({ mistakesUnlocked: true }),

    restoreQuizState: (answers, index, currentQuestionId) => set((state) => {
        const answersByQuestionId = new Map<string, SelectedAnswer>();
        answers.forEach((answer) => {
            if (answer?.questionId) {
                answersByQuestionId.set(answer.questionId, answer);
            }
        });

        const selectedAnswers = state.questions.map((question) =>
            answersByQuestionId.get(question.id)
        );

        // Yeni kayıtlar doğrudan soru kimliğini taşır. Eski kayıtlarda mevcut
        // indeks cevaplanmışsa onun questionId değeriyle de doğru soru bulunabilir.
        const indexedAnswer = answers[index];
        const resumeQuestionId = currentQuestionId || indexedAnswer?.questionId;
        const matchedIndex = resumeQuestionId
            ? state.questions.findIndex((question) => question.id === resumeQuestionId)
            : -1;
        const fallbackIndex = Math.max(0, Math.min(index, Math.max(state.questions.length - 1, 0)));

        return {
            selectedAnswers,
            currentIndex: matchedIndex >= 0 ? matchedIndex : fallbackIndex
        };
    }),

    fetchAiExplanation: async (question, wrongAnswerIndex) => {
        set({ isAiLoading: true, activeQuestionId: question.id, aiExplanation: null });
        try {
            const explanation = await AiTutorService.getExplanation(question, wrongAnswerIndex);
            set({ aiExplanation: explanation });
        } catch (error) {
            set({ aiExplanation: "Açıklama alınamadı. Lütfen tekrar deneyin." });
        } finally {
            set({ isAiLoading: false });
        }
    },

    clearAiExplanation: () => set({ aiExplanation: null, activeQuestionId: null }),

    calculateScore: () => {
        const { questions, selectedAnswers } = get();
        const validAnswers = selectedAnswers.filter(a => a !== undefined);
        let correctCount = validAnswers.filter(a => a?.isCorrect).length;
        let wrongCount = validAnswers.length - correctCount;
        let emptyCount = questions.length - validAnswers.length;

        const score = Math.round((correctCount / questions.length) * 100) || 0;

        return {
            correctCount,
            wrongCount,
            emptyCount,
            score,
            success: score >= 70
        };
    }
}));
