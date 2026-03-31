import { supabase } from './supabase';

/**
 * Merkezi API Hata Yönetimi - Olası ağ koptu vb. durumlarda kullanılır
 */
export const handleApiError = (context: string, error: any, fallbackValue: any) => {
    console.error(`🔴 [API ERROR] ${context}:`, error?.message || error);
    // TODO: İlerde burası Sentry, LogRocket veya Toast Messages entegrasyonu için harika bir merkezdir.
    return fallbackValue;
};

export const fetchHomeDashboardData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        let fullName = 'Misafir Sürücü';
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (profile?.full_name) fullName = profile.full_name;
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
export const fetchQuestionsByCategory = async (category: string) => {
    try {
        if (category === 'general') {
            const { data, error } = await supabase.rpc('get_random_questions', { limit_count: 50 });
            if (error) throw error;
            return data || [];
        }

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('category', category)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
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
    answers: { questionId: string; selectedOption: number; isCorrect: boolean }[]
) => {
    try {
        // 1. Özet sonuçları kaydet (exam_results)
        const { error: resultError } = await supabase
            .from('exam_results')
            .insert([{
                user_id: userId,
                category,
                score,
                correct_count: correctCount,
                wrong_count: wrongCount
                // total_questions: totalQuestions satırını sildik çünkü veritabanında yok!
            }]);

        if (resultError) throw resultError;

        // 2. Detaylı cevapları kaydet (UPSERT KULLANIYORUZ!)
        // Upsert: Eğer bu soruyu daha önce çözdüyse üzerine yazar, çözmediyse yeni ekler.
        const answersToInsert = answers
            .filter(ans => ans != null) // SAVUNMACI: null gelenleri ayıkla
            .map(ans => ({
                user_id: userId,
                question_id: ans.questionId,
                selected_option: ans.selectedOption,
                is_correct: ans.isCorrect,
                solved_at: new Date().toISOString()
            }));

        // NOT: Bunun çalışması için Supabase'de `user_answers` tablosunda (user_id, question_id) 
        // ikilisinin UNIQUE (Benzersiz) anahtar olarak ayarlanmış olması gerekir.
        const { error: answersError } = await supabase
            .from('user_answers')
            .upsert(answersToInsert, { onConflict: 'user_id,question_id' });

        if (answersError) throw answersError;

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
        return data || [];
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
            .order('created_at', { ascending: false });

        if (examsError) throw examsError;

        // 2. Sınavlara ait soru sayılarını (toplam) getir
        const { data: qCounts, error: qError } = await supabase
            .from('exam_questions')
            .select('exam_id');

        if (qError) throw qError;

        // Her sınav için toplam soru sayısını bir haritada sakla
        const examTotalMap: Record<string, number> = {};
        qCounts.forEach(q => {
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
        const solvedQuestionIds = new Set(userAnswers.map(ua => ua.question_id));

        // Şimdi her sınavın sorularını çekip kullanıcının kaçını çözdüğünü bulmalıyız
        // (Performans için toplu çekiyoruz)
        const { data: allExamQuestions, error: aeqError } = await supabase
            .from('exam_questions')
            .select('exam_id, question_id');

        if (aeqError) throw aeqError;

        const examSolvedMap: Record<string, number> = {};
        allExamQuestions.forEach(eq => {
            if (solvedQuestionIds.has(eq.question_id)) {
                examSolvedMap[eq.exam_id] = (examSolvedMap[eq.exam_id] || 0) + 1;
            }
        });

        // 4. Verileri birleştir
        const formattedExams = exams.map(exam => {
            const total = examTotalMap[exam.id] || 0;
            const solved = examSolvedMap[exam.id] || 0;
            const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

            return {
                ...exam,
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
        console.log(`[DEBUG] ${examId} ID'li sınavın soruları aranıyor...`);

        const { data, error } = await supabase
            .from('exam_questions')
            .select(`
                question_id, 
                questions (*)
            `)
            .eq('exam_id', examId)
            .order('order_number', { ascending: true });

        if (error) {
            console.error('[DEBUG] Supabase Çekme Hatası:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.log('[DEBUG] Bu sınava ait exam_questions tablosunda hiçbir kayıt bulunamadı!');
            return [];
        }

        // Veriyi güvenli bir şekilde ayıklıyoruz
        const formattedData = data.map(item => {
            // Supabase bazen ilişkili tabloyu dizi olarak döndürebilir, onu objeye çeviriyoruz
            const questionData = Array.isArray(item.questions) ? item.questions[0] : item.questions;
            return questionData;
        }).filter(q => q !== null && q !== undefined); // Eğer silinmiş bir soru varsa listeden çıkar

        console.log(`[DEBUG] Başarıyla ${formattedData.length} adet soru formatlandı ve ekrana gönderiliyor.`);
        return formattedData;

    } catch (error) {
        return handleApiError('fetchQuestionsByExamId', error, []);
    }
};

export const fetchSmartTestCounts = async (userId: string) => {
    try {
        const { count: wrongCount, error: err1 } = await supabase
            .from('user_answers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_correct', false);
        if (err1) throw err1;

        const { count: favoriteCount, error: err2 } = await supabase
            .from('saved_questions')
            .select('*', { count: 'exact', head: true })
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

// Yanlış yapılan soruları çeker
export const fetchMistakeQuestions = async (userId: string) => {
    try {
        const { data: wrongAnswers, error: wrongError } = await supabase
            .from('user_answers')
            .select('question_id')
            .eq('user_id', userId)
            .eq('is_correct', false);

        if (wrongError || !wrongAnswers.length) return [];

        const questionIds = wrongAnswers.map(a => a.question_id);

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
        const { data, error } = await supabase.rpc('get_user_favorites', { p_user_id: userId });
        if (error) throw error;
        return data || [];
    } catch (error) {
        return handleApiError('fetchFavoriteQuestions', error, []);
    }
};