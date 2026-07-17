import { supabase } from '../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

const ANALYTICS_QUEUE_KEY = '@analytics_event_queue';
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

// Pseudo UUID generator for idempotency
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export type AnalyticsEventName = 
    | 'app_opened'
    | 'app_backgrounded'
    | 'onboarding_started'
    | 'onboarding_completed'
    | 'screen_viewed'
    | 'quiz_started'
    | 'quiz_completed'
    | 'quiz_abandoned'
    | 'question_answered'
    | 'question_skipped'
    | 'answer_changed'
    | 'theme_changed'
    | 'notification_preference_changed'
    | 'premium_screen_viewed'
    | 'purchase_started'
    | 'purchase_completed'
    | 'notification_clicked'
    | 'daily_goal_changed';

interface AnalyticsEventData {
    eventName: AnalyticsEventName;
    screenName?: string;
    quizId?: string;
    questionId?: string;
    category?: string;
    durationSeconds?: number;
    metadata?: Record<string, any>;
}

// Intercepted format for DB
interface QueuedAnalyticsEvent {
    id: string;
    user_id: string | null;
    event_name: AnalyticsEventName;
    screen_name?: string;
    quiz_id?: string;
    question_id?: string;
    category?: string;
    duration_seconds?: number;
    metadata?: Record<string, any>;
    created_at: string;
}

class AnalyticsService {
    private queue: QueuedAnalyticsEvent[] = [];
    private isFlushing = false;
    private flushInterval: ReturnType<typeof setInterval> | null = null;
    private lastScreenViewed: string | null = null;

    constructor() {
        this.loadQueueFromStorage();
        
        // Start flush interval
        this.flushInterval = setInterval(() => {
            this.flushQueue();
        }, FLUSH_INTERVAL_MS);

        // Listen for app state changes to flush immediately on background
        AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background') {
                this.flushQueue();
            }
        });
    }

    private async loadQueueFromStorage() {
        try {
            const storedQueue = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
            if (storedQueue) {
                this.queue = JSON.parse(storedQueue);
            }
        } catch (e) {
            console.warn("Analytics: Error loading queue from storage", e);
        }
    }

    private async persistQueueToStorage() {
        try {
            await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(this.queue));
        } catch (e) {
            console.warn("Analytics: Error persisting queue", e);
        }
    }

    public async trackEvent(data: AnalyticsEventData) {
        try {
            // KVKK Check: If analytics are disabled, drop the event
            const { analyticsEnabled } = useSettingsStore.getState();
            if (!analyticsEnabled) return;

            // Deduplicate redundant screen views
            if (data.eventName === 'screen_viewed') {
                if (this.lastScreenViewed === data.screenName) {
                    return; // Ignore duplicate consecutive screen views
                }
                this.lastScreenViewed = data.screenName || null;
            } else if (data.eventName !== 'app_backgrounded') {
                this.lastScreenViewed = null; // Reset on other events
            }

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            
            const queuedEvent: QueuedAnalyticsEvent = {
                id: generateId(),
                user_id: userId,
                event_name: data.eventName,
                screen_name: data.screenName,
                quiz_id: data.quizId,
                question_id: data.questionId,
                category: data.category,
                duration_seconds: data.durationSeconds,
                metadata: data.metadata || {},
                created_at: new Date().toISOString()
            };

            this.queue.push(queuedEvent);
            this.persistQueueToStorage();

            // If queue gets too large, flush immediately
            if (this.queue.length >= 20) {
                this.flushQueue();
            }

        } catch (e) {
            console.warn("Analytics Track Event Error:", e);
        }
    }

    public async flushQueue() {
        if (this.isFlushing || this.queue.length === 0) return;

        try {
            this.isFlushing = true;
            
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                this.isFlushing = false;
                return;
            }

            // Take a snapshot of the current queue to flush
            const eventsToFlush = [...this.queue];
            
            const { error } = await supabase
                .from('analytics_events')
                .insert(eventsToFlush);

            if (error) {
                // Ignore 23505 (Unique violation) for some rows, but Supabase insert might fail entirely
                // A better approach would be to ignore errors or handle them gracefully,
                // but since these are analytics, we can clear the queue to prevent blocking if it's a hard error
                console.warn("Analytics Flush Error:", error);
            }

            // Remove flushed items from the active queue
            // We do it this way just in case new events were added while flushing
            const flushedIds = new Set(eventsToFlush.map(e => e.id));
            this.queue = this.queue.filter(e => !flushedIds.has(e.id));
            
            await this.persistQueueToStorage();

        } catch (e) {
            console.warn("Analytics Flush Exception:", e);
        } finally {
            this.isFlushing = false;
        }
    }

    public trackAppOpen() {
        this.trackEvent({ eventName: 'app_opened' });
    }

    public trackAppBackgrounded() {
        this.trackEvent({ eventName: 'app_backgrounded' });
    }

    public trackScreenView(screenName: string) {
        this.trackEvent({ eventName: 'screen_viewed', screenName });
    }

    public trackQuizStarted(quizId: string, questionCount: number) {
        this.trackEvent({ 
            eventName: 'quiz_started', 
            quizId, 
            metadata: { length: questionCount } 
        });
    }

    public trackQuestionAnswered(
        quizId: string, 
        questionId: string, 
        category: string, 
        isCorrect: boolean, 
        optionIndex: number, 
        durationSeconds: number, 
        answerChanged: boolean
    ) {
        this.trackEvent({
            eventName: 'question_answered',
            quizId,
            questionId,
            category,
            durationSeconds,
            metadata: { isCorrect, optionIndex, answer_changed: answerChanged }
        });
    }

    public trackQuizCompleted(quizId: string, score: number, durationSeconds: number) {
        this.trackEvent({
            eventName: 'quiz_completed',
            quizId,
            durationSeconds,
            metadata: { score }
        });
    }

    public trackQuizAbandoned(quizId: string, durationSeconds: number, answeredCount: number) {
        this.trackEvent({
            eventName: 'quiz_abandoned',
            quizId,
            durationSeconds,
            metadata: { answeredCount }
        });
    }
}

export const analytics = new AnalyticsService();
