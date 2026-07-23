import { supabase } from './supabase';
import { globalHandleError } from '../utils/errorHandler';

/**
 * Merkezi API Hata Yönetimi - Olası ağ koptu vb. durumlarda kullanılır
 */
export const handleApiError = <T,>(context: string, error: unknown, fallbackValue: T): T => {
    globalHandleError(context, error);
    return fallbackValue;
};

export const ensureUserProfile = async (userId: string, fullName?: string) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (profile) {
        return profile;
    }

    const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: userId, full_name: fullName || null }]);

    if (insertError) {
        throw insertError;
    }

    return { id: userId };
};

export const fetchHomeDashboardData = async () => {
    try {
        const { data, error: userError } = await supabase.auth.getUser();
        const user = data?.user;

        let fullName = 'Misafir Sürücü';
        
        if (user) {
            // İlk olarak metadata'daki ismi alalım (Hızlı fallback)
            if (user.user_metadata?.full_name) {
                fullName = user.user_metadata.full_name;
            }

            // Sonra güncel profil tablosuna bakalım
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();

            if (!profileError && profile?.full_name) {
                fullName = profile.full_name;
            }
        }

        const categories = ['trafik', 'ilkyardim', 'motor', 'adap'];
        const counts = { trafik: 0, ilkyardim: 0, motor: 0, adap: 0 };

        await Promise.all(
            categories.map(async (cat) => {
                const { count, error } = await supabase
                    .from('questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('category', cat)
                    .eq('is_active', true);

                if (!error && count !== null) {
                    counts[cat as keyof typeof counts] = count;
                }
            })
        );

        return { fullName, counts };
    } catch (error) {
        return handleApiError('fetchHomeDashboardData', error, {
            fullName: 'Misafir',
            counts: { trafik: 0, ilkyardim: 0, motor: 0, adap: 0 }
        });
    }
};

// 🌟 YENİ GÜÇLÜ SORGULAR 🌟

// 1. Kategoriden veya Genel Denemeden Soru Çekme
export const fetchQuestionsByCategory = async (category: string, userId?: string) => {
    try {
        if (category === 'general') {
            const { data, error } = await supabase.rpc('get_random_questions', { limit_count: 50 });
            if (error) throw error;
            return data || [];
        }

        let query = supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .eq('is_active', true);

        // Eğer kullanıcı ID'si varsa, daha önce çözülmüş soruları ele
        if (userId) {
            const { data: solvedData } = await supabase
                .from('user_answers')
                .select('question_id')
                .eq('user_id', userId);

            const solvedIds = solvedData?.map(s => s.question_id) || [];
            
            // Eğer çözülmüş soru varsa listeden çıkar
            if (solvedIds.length > 0) {
                // Postgrest URL limitlerine takılmamak için virgülle ayrılmış ID listesi
                query = query.not('id', 'in', `(${solvedIds.join(',')})`);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Konu testleri için her seferinde farklı bir sırayla gelmesi daha iyi olur (karıştır)
        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        return shuffled;
    } catch (error) {
        return handleApiError('fetchQuestionsByCategory', error, []);
    }
};

export const fetchQuickPracticeQuestions = async (userId: string) => {
    try {
        // Kullanıcının daha önce doğru cevapladığı soru ID'lerini bul
        const { data: correctAnswers } = await supabase
            .from('user_answers')
            .select('question_id')
            .eq('user_id', userId)
            .eq('is_correct', true);

        const correctIds = correctAnswers?.map(a => a.question_id) || [];

        let query = supabase
            .from('questions')
            .select('*')
            .eq('is_active', true)
            .limit(50);

        if (correctIds.length > 0) {
            query = query.not('id', 'in', `(${correctIds.join(',')})`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
    } catch (error) {
        return handleApiError('fetchQuickPracticeQuestions', error, []);
    }
};

// 3. SINAV SONUÇLARINI KAYDET
export const saveQuizResults = async (
    userId: string,
    category: string,
    score: number,
    correctCount: number,
    wrongCount: number,
    totalQuestions: number,
    answers: { questionId: string; selectedOption: number; isCorrect: boolean }[],
    durationSeconds: number = 0,
    emptyCount: number = 0,
    startedAt?: string,
    quizType: string = 'practice',
    sessionId?: string
): Promise<boolean> => {
    try {
        await ensureUserProfile(userId);

        // completed_at her halükarda şu anki zamandır
        const completedAt = new Date().toISOString();

        // 1. Detaylı cevapları önce kaydet. Böylece özet kaydı başarılı olup
        // cevapların eksik kalması ve istemcinin ilerlemeyi silmesi engellenir.
        const answersToInsert = answers
            .filter(ans => ans != null)
            .map(ans => ({
                user_id: userId,
                question_id: ans.questionId,
                selected_option: ans.selectedOption,
                is_correct: ans.isCorrect,
                solved_at: completedAt
            }));

        if (answersToInsert.length > 0) {
            // NOT: Bunun çalışması için Supabase'de `user_answers` tablosunda
            // (user_id, question_id) ikilisinin UNIQUE olması gerekir.
            const { error: answersError } = await supabase
                .from('user_answers')
                .upsert(answersToInsert, { onConflict: 'user_id,question_id' });

            if (answersError) throw answersError;
        }

        // 2. Cevaplar kaydedildikten sonra özet sonucu kaydet.
        const { error: resultError } = await supabase
            .from('exam_results')
            .insert([{
                user_id: userId,
                category,
                score,
                correct_count: correctCount,
                wrong_count: wrongCount,
                empty_count: emptyCount,
                total_questions: totalQuestions,
                duration_seconds: durationSeconds,
                started_at: startedAt || completedAt,
                completed_at: completedAt,
                quiz_type: quizType,
                session_id: sessionId
            }]);

        if (resultError) {
            // 23505: unique_violation (Aynı oturum daha önce kaydedilmiş)
            if (resultError.code === '23505' && sessionId) {
                console.log("Idempotency: Bu sınav sonucu zaten kaydedilmiş (session_id çakışması). İşlem atlanıyor.");
                return true;
            }
            throw resultError;
        }

        // 3. Telemetri: Ana kayıt başarılı olduktan sonra istatistikleri güncelle.
        try {
            const { error: statsError } = await supabase.rpc('increment_user_stats', {
                p_user_id: userId,
                p_quizzes_to_add: 1,
                p_questions_to_add: answers.length
            });

            if (statsError) throw statsError;
        } catch (e) {
            console.warn("Telemetri güncellenemedi (RPC eksik olabilir):", e);
        }

        return true;
    } catch (error) {
        return handleApiError('saveQuizResults', error, false);
    }
};

// 4. HATA TELAFİSİ (Sadece yanlış çözdüğü soruları getirir)
export const fetchMistakenQuestions = async (userId: string) => {
    try {
        // Kullanıcının şu anda "yanlış" (is_correct: false) olarak kayıtlı olduğu soruların ID'leri
        const { data: wrongAnswers, error } = await supabase
            .from('user_answers')
            .select('question_id')
            .eq('user_id', userId)
            .eq('is_correct', false);

        if (error) throw error;
        if (!wrongAnswers || wrongAnswers.length === 0) return [];

        const wrongIds = wrongAnswers.map(a => a.question_id);

        // Bu ID'lere sahip soruların detaylarını getir
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('*')
            .in('id', wrongIds)
            .limit(20); // Tek seferde en fazla 20 hata telafisi

        if (qError) throw qError;
        return questions;
    } catch (error) {
        return handleApiError('fetchMistakenQuestions', error, []);
    }
};

// 5. SORU RAPORLAMA (Yeni Özellik)
export const reportQuestion = async (userId: string, questionId: string, reason: string) => {
    try {
        const { error } = await supabase
            .from('reported_questions')
            .insert([{
                user_id: userId,
                question_id: questionId,
                reason: reason,
                status: 'pending' // Admin paneli için bekliyor statüsü
            }]);

        if (error) throw error;
        return true;
    } catch (error) {
        return handleApiError('reportQuestion', error, false);
    }
};


// --- DİĞER STANDART SORGULAR ---

export const fetchUserStats = async (userId: string) => {
    try {
        const { data: results, error: resultsError } = await supabase
            .from('exam_results')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (resultsError) throw resultsError;

        const { data: answers, error: answersError } = await supabase
            .from('user_answers')
            .select(`is_correct, question_id, questions (category)`)
            .eq('user_id', userId);

        if (answersError) throw answersError;

        return { results: results || [], answers: answers || [] };
    } catch (error) {
        return handleApiError('fetchUserStats', error, { results: [], answers: [] });
    }
};

export const fetchExams = async () => {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        const examsList = data || [];
        return examsList.map((exam, index) => ({
            ...exam,
            title: `Genel Deneme ${examsList.length - index}`
        }));
    } catch (error) {
        return handleApiError('fetchExams', error, []);
    }
};

/**
 * Kişi bazlı sınav takibi için gelişmiş sorgu.
 * Her sınav için toplam soru sayısını ve kullanıcının cevapladığı soru sayısını getirir.
 */
export const fetchExamsWithProgress = async (userId: string) => {
    try {
        // 1. Tüm aktif sınavları getir
        const { data: exams, error: examsError } = await supabase
            .from('exams')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (examsError) throw examsError;

        // 2. Sınavlara ait soru sayılarını (toplam) getir
        const { data: qCounts, error: qError } = await supabase
            .from('exam_questions')
            .select('exam_id');

        if (qError) throw qError;

        // Her sınav için toplam soru sayısını bir haritada sakla
        const examTotalMap: Record<string, number> = {};
        (qCounts || []).forEach((q: any) => {
            examTotalMap[q.exam_id] = (examTotalMap[q.exam_id] || 0) + 1;
        });

        // 3. Kullanıcının bu sınavlara ait cevaplarını getir (Join mantığı)
        // Kullanıcının cevaplarını çekiyoruz
        const { data: userAnswers, error: uaError } = await supabase
            .from('user_answers')
            .select('question_id')
            .eq('user_id', userId);

        if (uaError) throw uaError;

        // Kullanıcının hangi soruları çözdüğünü bir set'e atalım
        const solvedQuestionIds = new Set((userAnswers || []).map((ua: any) => ua.question_id));

        // Şimdi her sınavın sorularını çekip kullanıcının kaçını çözdüğünü bulmalıyız
        // (Performans için toplu çekiyoruz)
        const { data: allExamQuestions, error: aeqError } = await supabase
            .from('exam_questions')
            .select('exam_id, question_id');

        if (aeqError) throw aeqError;

        const examSolvedMap: Record<string, number> = {};
        (allExamQuestions || []).forEach((eq: any) => {
            if (solvedQuestionIds.has(eq.question_id)) {
                examSolvedMap[eq.exam_id] = (examSolvedMap[eq.exam_id] || 0) + 1;
            }
        });

        // 4. Verileri birleştir
        const formattedExams = exams.map((exam, index) => {
            const total = examTotalMap[exam.id] || 0;
            const solved = examSolvedMap[exam.id] || 0;
            const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

            return {
                ...exam,
                title: exam.title || `Deneme Sınavı ${index + 1}`,
                total_questions: total,
                solved_questions: solved,
                progress_percentage: percentage,
                status: percentage === 100 ? 'completed' : (percentage > 0 ? 'in_progress' : 'new')
            };
        });

        return formattedExams;
    } catch (error) {
        return handleApiError('fetchExamsWithProgress', error, []);
    }
};

export const fetchQuestionsByExamId = async (examId: string) => {
    try {
        const { data, error } = await supabase
            .from('exam_questions')
            .select(`
                question_id, 
                questions (*)
            `)
            .eq('exam_id', examId)
            .order('order_number', { ascending: true });

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        // Veriyi güvenli bir şekilde ayıklıyoruz
        const formattedData = data.map(item => {
            // Supabase bazen ilişkili tabloyu dizi olarak döndürebilir, onu objeye çeviriyoruz
            const questionData = Array.isArray(item.questions) ? item.questions[0] : item.questions;
            return questionData;
        }).filter(q => q !== null && q !== undefined); // Eğer silinmiş bir soru varsa listeden çıkar

        return formattedData;

    } catch (error) {
        return handleApiError('fetchQuestionsByExamId', error, []);
    }
};

export const fetchSmartTestCounts = async (userId: string) => {
    try {
        // Yanlış sayısı (user_answers tablosundan)
        const { count: wrongCount, error: err1 } = await supabase
            .from('user_answers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_correct', false);
        if (err1) throw err1;

        // Favori sayısı (saved_questions tablosundan)
        const { count: favoriteCount, error: err2 } = await supabase
            .from('saved_questions')
            .select('question_id', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (err2) throw err2;

        return {
            wrongCount: wrongCount || 0,
            favoriteCount: favoriteCount || 0
        };
    } catch (error) {
        return handleApiError('fetchSmartTestCounts', error, { wrongCount: 0, favoriteCount: 0 });
    }
};

// Favori ekleme/çıkarma (Toggled Star)
export const toggleFavorite = async (userId: string, questionId: string) => {
    try {
        // Önce favorilerde var mı bakıyoruz
        const { data: existing, error: fetchError } = await supabase
            .from('saved_questions')
            .select('*')
            .eq('user_id', userId)
            .eq('question_id', questionId)
            .maybeSingle();

        if (existing) {
            // Varsa sil
            const { error: deleteError } = await supabase
                .from('saved_questions')
                .delete()
                .eq('user_id', userId)
                .eq('question_id', questionId);
            if (deleteError) throw deleteError;
            return { action: 'removed', success: true };
        } else {
            // Yoksa ekle
            await ensureUserProfile(userId);
            const { error: insertError } = await supabase
                .from('saved_questions')
                .insert([{ user_id: userId, question_id: questionId }]);
            if (insertError) throw insertError;
            return { action: 'added', success: true };
        }
    } catch (error) {
        return handleApiError('toggleFavorite', error, { action: 'error', success: false });
    }
};

// Belirli soruların favori olup olmadığını hızlıca çekmek için (Quiz ekranı için)
export const fetchFavoriteIds = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('saved_questions')
            .select('question_id')
            .eq('user_id', userId);
        
        if (error) throw error;
        return data.map(f => f.question_id);
    } catch (error) {
        return handleApiError('fetchFavoriteIds', error, []);
    }
};

// 6. YAPAY ZEKA ANALİZİ (Zayıf Konuları Çekme)
export const fetchWeakTopics = async (userId: string) => {
    try {
        // Kullanıcının yanlış yaptığı cevapları ve bu soruların kategorilerini (ilişkisel olarak) çekiyoruz
        const { data, error } = await supabase
            .from('user_answers')
            .select(`
                is_correct,
                questions!inner(category)
            `)
            .eq('user_id', userId)
            .eq('is_correct', false);

        if (error) throw error;
        if (!data || data.length === 0) return [];

        // Hangi kategoride kaç yanlış yapıldığını hesaplıyoruz
        const counts: Record<string, number> = {};

        data.forEach((item: any) => {
            // Supabase ilişkisel sorgularında veri obje veya dizi içinde gelebilir
            const category = Array.isArray(item.questions)
                ? item.questions[0]?.category
                : item.questions?.category;

            if (category) {
                counts[category] = (counts[category] || 0) + 1;
            }
        });

        // Arayüzün (AITutorScreen) beklediği [{ name, count }] formatına çevirip,
        // en çok hata yapılan konuyu en başa alıyoruz (büyükten küçüğe sıralama)
        return Object.keys(counts)
            .map(name => ({
                name,
                count: counts[name]
            }))
            .sort((a, b) => b.count - a.count);

    } catch (error) {
        return handleApiError('fetchWeakTopics', error, []);
    }
};

/**
 * --- PROFESYONEL ANALİZ SORGUSU ---
 * Kullanıcının konu bazlı uzmanlık verilerini, başarı oranlarını ve gelişim trendlerini döner.
 */
export const fetchAdvancedMasteryData = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_answers')
            .select(`
                is_correct,
                solved_at,
                questions!inner(category)
            `)
            .eq('user_id', userId)
            .order('solved_at', { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        const masteryMap: Record<string, {
            correct: number;
            total: number;
            lastSolved: string;
            recentCorrect: number; // Son 5 sorudaki başarısı (trend analizi için)
            recentTotal: number;
        }> = {};

        data.forEach((item: any) => {
            const category = Array.isArray(item.questions) ? item.questions[0]?.category : item.questions?.category;
            if (!category) return;

            if (!masteryMap[category]) {
                masteryMap[category] = { correct: 0, total: 0, lastSolved: item.solved_at, recentCorrect: 0, recentTotal: 0 };
            }

            if (item.is_correct) masteryMap[category].correct += 1;
            masteryMap[category].total += 1;

            // Trend analizi: Kategorideki son 5 soruyu incele
            if (masteryMap[category].recentTotal < 5) {
                if (item.is_correct) masteryMap[category].recentCorrect += 1;
                masteryMap[category].recentTotal += 1;
            }
        });

        // Veriyi AI Hoca'nın anlayacağı profesyonel formata çevir
        return Object.keys(masteryMap).map(category => {
            const stats = masteryMap[category];
            const score = Math.round((stats.correct / stats.total) * 100);
            const recentScore = Math.round((stats.recentCorrect / stats.recentTotal) * 100);

            return {
                name: category,
                totalAttempts: stats.total,
                masteryScore: score,
                recentScore: recentScore,
                lastSolved: stats.lastSolved,
                trend: recentScore >= score ? 'improving' : 'declining',
                status: score >= 85 && stats.total >= 10 ? 'expert' : (score >= 60 ? 'learning' : 'critical')
            };
        }).sort((a, b) => a.masteryScore - b.masteryScore); // En zayıf konular en üstte

    } catch (error) {
        return handleApiError('fetchAdvancedMasteryData', error, []);
    }
};

// Yanlış yapılan soruları çeker
export const fetchMistakeQuestions = async (userId: string, filterIds?: string[]) => {
    try {
        let questionIds = filterIds;

        if (!questionIds || questionIds.length === 0) {
            const { data: wrongAnswers, error: wrongError } = await supabase
                .from('user_answers')
                .select('question_id')
                .eq('user_id', userId)
                .eq('is_correct', false);

            if (wrongError || !wrongAnswers.length) return [];
            questionIds = wrongAnswers.map(a => a.question_id);
        }

        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);

        if (qError) throw qError;
        return questions || [];
    } catch (error) {
        return handleApiError('fetchMistakeQuestions', error, []);
    }
};

// Favoriye alınan soruları çeker
export const fetchFavoriteQuestions = async (userId: string) => {
    try {
        const { data: saved, error: savedError } = await supabase
            .from('saved_questions')
            .select('question_id')
            .eq('user_id', userId);

        if (savedError || !saved || saved.length === 0) return [];

        const questionIds = saved.map(s => s.question_id);

        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);

        if (qError) throw qError;
        return questions || [];
    } catch (error) {
        return handleApiError('fetchFavoriteQuestions', error, []);
    }
};
