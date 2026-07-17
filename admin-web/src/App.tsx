import React, { useState, useEffect, useRef } from 'react';
import { 
  supabase, 
  isUsingServiceRole, 
  getServiceRoleKey, 
  getCustomSupabaseUrl, 
  setCredentials, 
  clearCredentials 
} from './supabase';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Check, 
  X, 
  Database, 
  ShieldAlert, 
  Loader2, 
  ArrowLeft, 
  FileText,
  HelpCircle,
  AlertCircle,
  BarChart2,
  Upload,
  Download,
  Shuffle
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  is_active: boolean;
  category: string;
  created_at: string;
}

interface Question {
  id: string;
  content: string;
  media_type: string;
  image_url: string | null;
  options: string[];
  correct_option: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string | null;
  explanation_image_url: string | null;
  is_active: boolean;
  exam_question: boolean;
  exams?: { id: string; title: string }[];
}

interface ExamQuestionJoin {
  question_id: string;
  order_number: number;
}

interface ReportedQuestion {
  id: string;
  user_id: string;
  question_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
  } | null;
  questions: Question | null;
  exams: { id: string; title: string }[];
}

function App() {
  const [activeTab, setActiveTab] = useState<'exams' | 'pool' | 'analytics' | 'reported' | 'settings'>('exams');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examQuestionCounts, setExamQuestionCounts] = useState<Record<string, number>>({});

  // Analytics States
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [kpis, setKpis] = useState({ totalUsers: 0, totalSolved: 0, avgAccuracy: 0, activeToday: 0 });
  const [userStatsList, setUserStatsList] = useState<any[]>([]);
  const [recentSolvedFeed, setRecentSolvedFeed] = useState<any[]>([]);
  const [hardestQuestionsList, setHardestQuestionsList] = useState<any[]>([]);

  // Telemetry States
  const [telemetry, setTelemetry] = useState({
    dau: 0,
    avgDuration: 0,
    licenseStats: [] as { license: string; count: number }[],
    abandonStats: [] as { category: string; count: number }[],
    topScreens: [] as { screen: string; count: number }[]
  });
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<Question[]>([]);
  const [selectedExamJoins, setSelectedExamJoins] = useState<ExamQuestionJoin[]>([]);

  // Global Questions Pool
  const [poolQuestions, setPoolQuestions] = useState<Question[]>([]);
  const [poolSearch, setPoolSearch] = useState('');
  const [poolCategory, setPoolCategory] = useState('All');
  const [poolExamFilter, setPoolExamFilter] = useState<'all' | 'no_exam' | 'has_exam'>('all');
  
  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [targetExamIdForNewQuestion, setTargetExamIdForNewQuestion] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingExpImage, setUploadingExpImage] = useState(false);

  const [showPoolLinkModal, setShowPoolLinkModal] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  // Reported Questions States
  const [reportedQuestions, setReportedQuestions] = useState<ReportedQuestion[]>([]);
  const [reportFilterStatus, setReportFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  
  // Settings Inputs
  const [settingsUrl, setSettingsUrl] = useState(getCustomSupabaseUrl() || import.meta.env.EXPO_PUBLIC_SUPABASE_URL || '');
  const [settingsKey, setSettingsKey] = useState(getServiceRoleKey() || '');

  // Error/Success Message
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Hiç aktif olmadı';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} d. önce`;
    if (diffHours < 24) return `${diffHours} sa. önce`;
    return `${diffDays} gün önce`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadExams();
    loadPoolQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    } else if (activeTab === 'reported') {
      loadReportedQuestions();
    }
  }, [activeTab]);

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const payload = JSON.parse(content);

        if (!payload.exam || !payload.exam.title) {
          triggerAlert('error', 'Geçersiz JSON: "exam" nesnesi ve "title" alanı zorunludur.');
          return;
        }
        if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
          triggerAlert('error', 'Geçersiz JSON: "questions" dizisi boş olamaz.');
          return;
        }

        setLoading(true);
        
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .insert({
            title: payload.exam.title,
            category: payload.exam.category || 'Genel Deneme',
            is_active: payload.exam.is_active !== false
          })
          .select('id')
          .single();

        if (examError) throw examError;
        if (!examData) throw new Error('Sınav oluşturulamadı.');

        const examId = examData.id;
        const joins = [];

        for (let i = 0; i < payload.questions.length; i++) {
          const q = payload.questions[i];
          
          if (!q.content || !Array.isArray(q.options) || q.options.length < 2) {
            throw new Error(`Soru ${i + 1} eksik/hatalı (içerik ve en az 2 şık gereklidir).`);
          }

          const { data: qData, error: qError } = await supabase
            .from('questions')
            .insert({
              content: q.content,
              options: q.options,
              correct_option: Number(q.correct_option) || 0,
              category: q.category || 'trafik',
              difficulty: q.difficulty || 'medium',
              explanation: q.explanation || null,
              image_url: q.image_url || null,
              media_type: q.media_type || 'none',
              explanation_image_url: q.explanation_image_url || null,
              is_active: true,
              exam_question: true
            })
            .select('id')
            .single();

          if (qError) throw qError;
          if (!qData) throw new Error(`Soru ${i + 1} kaydedilemedi.`);

          joins.push({
            exam_id: examId,
            question_id: qData.id,
            order_number: i + 1
          });
        }

        const { error: joinError } = await supabase
          .from('exam_questions')
          .insert(joins);

        if (joinError) throw joinError;

        triggerAlert('success', `Sınav ve ${payload.questions.length} soru başarıyla içe aktarıldı.`);
        loadExams();
      } catch (err: any) {
        triggerAlert('error', `İçe aktarma hatası: ${err.message}`);
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      triggerAlert('error', 'Dosya okunurken hata oluştu.');
    };

    reader.readAsText(file);
  };

  const handleImportPoolQuestionsJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let payload = JSON.parse(content);
        
        let questionsArray = [];
        if (Array.isArray(payload)) {
          questionsArray = payload;
        } else if (payload.questions && Array.isArray(payload.questions)) {
          questionsArray = payload.questions;
        } else {
          triggerAlert('error', 'Geçersiz JSON: Geçerli bir "questions" dizisi bulunamadı.');
          return;
        }

        if (questionsArray.length === 0) {
          triggerAlert('error', 'Geçersiz JSON: "questions" dizisi boş olamaz.');
          return;
        }

        setLoading(true);
        let importedCount = 0;

        for (let i = 0; i < questionsArray.length; i++) {
          const q = questionsArray[i];
          
          if (!q.content || !Array.isArray(q.options) || q.options.length < 2) {
            console.warn(`Soru ${i + 1} eksik/hatalı atlandı.`);
            continue;
          }

          const { error: qError } = await supabase
            .from('questions')
            .insert({
              content: q.content,
              options: q.options,
              correct_option: Number(q.correct_option) || 0,
              category: q.category || 'trafik',
              difficulty: q.difficulty || 'medium',
              explanation: q.explanation || null,
              image_url: q.image_url || null,
              media_type: q.media_type || 'none',
              explanation_image_url: q.explanation_image_url || null,
              is_active: true,
              exam_question: false
            });

          if (qError) throw qError;
          importedCount++;
        }

        triggerAlert('success', `${importedCount} soru havuza başarıyla içe aktarıldı.`);
        loadPoolQuestions();
      } catch (err: any) {
        triggerAlert('error', `Soru havuzuna içe aktarma hatası: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      triggerAlert('error', 'Dosya okunurken hata oluştu.');
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleExportExam = async (exam: Exam) => {
    setLoading(true);
    try {
      // 1. Fetch joins
      const { data: joins, error: joinsError } = await supabase
        .from('exam_questions')
        .select('question_id, order_number')
        .eq('exam_id', exam.id)
        .order('order_number', { ascending: true });

      if (joinsError) throw joinsError;

      let questionsList: Question[] = [];

      if (joins && joins.length > 0) {
        const qIds = joins.map(j => j.question_id);
        const { data: qs, error: qsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', qIds);

        if (qsError) throw qsError;

        // Sort questions based on the order_number in joins
        questionsList = (qs || []).sort((a, b) => {
          const orderA = joins.find(j => j.question_id === a.id)?.order_number || 0;
          const orderB = joins.find(j => j.question_id === b.id)?.order_number || 0;
          return orderA - orderB;
        });
      }

      // Map questions to match the import payload format
      const formattedQuestions = questionsList.map(q => ({
        content: q.content,
        options: q.options,
        correct_option: q.correct_option,
        category: q.category,
        difficulty: q.difficulty,
        explanation: q.explanation,
        image_url: q.image_url,
        media_type: q.media_type,
        explanation_image_url: q.explanation_image_url
      }));

      const payload = {
        exam: {
          title: exam.title,
          category: exam.category,
          is_active: exam.is_active
        },
        questions: formattedQuestions
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeTitle = exam.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      downloadAnchor.setAttribute("download", `exam_${safeTitle}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      triggerAlert('success', `"${exam.title}" başarıyla dışa aktarıldı.`);
    } catch (err: any) {
      triggerAlert('error', `Sınav dışa aktarılırken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'explanation_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'image_url') setUploadingImage(true);
    else setUploadingExpImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `question_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Upload file to Supabase storage
      const { error } = await supabase.storage
        .from('ehliyetSorulari')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('ehliyetSorulari')
        .getPublicUrl(filePath);

      // Update state
      if (field === 'image_url') {
        setEditingQuestion(prev => prev ? { ...prev, image_url: publicUrl, media_type: 'image' } : null);
        triggerAlert('success', 'Soru görseli başarıyla yüklendi.');
      } else {
        setEditingQuestion(prev => prev ? { ...prev, explanation_image_url: publicUrl } : null);
        triggerAlert('success', 'Açıklama görseli başarıyla yüklendi.');
      }
    } catch (err: any) {
      triggerAlert('error', `Görsel yükleme hatası: ${err.message}`);
    } finally {
      if (field === 'image_url') setUploadingImage(false);
      else setUploadingExpImage(false);
      e.target.value = '';
    }
  };

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      if (pError) throw pError;
      
      const { data: answers, error: aError } = await supabase.from('user_answers').select('*');
      if (aError) throw aError;
      
      const { data: qs, error: qError } = await supabase.from('questions').select('id, content, category, difficulty');
      if (qError) throw qError;

      const profileList = profiles || [];
      const answersList = answers || [];
      const questionsList = qs || [];

      let authUsers: any[] = [];
      if (isUsingServiceRole) {
        try {
          const { data: authResult, error: authError } = await supabase.auth.admin.listUsers();
          if (!authError && authResult) {
            authUsers = authResult.users || [];
          }
        } catch (authErr) {
          console.warn('Failed to load auth users (even with service role key):', authErr);
        }
      }

      const userMap: Record<string, { id: string; name: string; email: string; created_at: string; last_sign_in_at: string | null }> = {};
      
      profileList.forEach(p => {
        userMap[p.id] = {
          id: p.id,
          name: p.full_name || 'İsimsiz Sürücü',
          email: 'Bilinmiyor',
          created_at: p.created_at || '',
          last_sign_in_at: null
        };
      });

      authUsers.forEach(u => {
        if (userMap[u.id]) {
          userMap[u.id].email = u.email || 'Bilinmiyor';
          userMap[u.id].last_sign_in_at = u.last_sign_in_at || null;
          if (u.created_at) userMap[u.id].created_at = u.created_at;
          if (u.user_metadata?.full_name) userMap[u.id].name = u.user_metadata.full_name;
        } else {
          userMap[u.id] = {
            id: u.id,
            name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'İsimsiz Sürücü',
            email: u.email || 'Bilinmiyor',
            created_at: u.created_at || '',
            last_sign_in_at: u.last_sign_in_at || null
          };
        }
      });

      const stats = Object.values(userMap).map(user => {
        const userAnswers = answersList.filter(a => a.user_id === user.id);
        const solvedCount = userAnswers.length;
        const correctCount = userAnswers.filter(a => a.is_correct).length;
        const wrongCount = solvedCount - correctCount;
        const accuracy = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;

        let lastActivity: string | null = user.last_sign_in_at;
        if (userAnswers.length > 0) {
          const solvedDates = userAnswers.map(a => new Date(a.solved_at).getTime());
          const maxSolvedTime = Math.max(...solvedDates);
          const solvedDateStr = new Date(maxSolvedTime).toISOString();
          
          if (!lastActivity || new Date(solvedDateStr).getTime() > new Date(lastActivity).getTime()) {
            lastActivity = solvedDateStr;
          }
        }

        const isOnline = lastActivity 
          ? (new Date().getTime() - new Date(lastActivity).getTime()) < (5 * 60 * 1000)
          : false;

        return {
          ...user,
          solvedCount,
          correctCount,
          wrongCount,
          accuracy,
          lastActivity,
          isOnline
        };
      });

      stats.sort((a, b) => {
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });

      setUserStatsList(stats);

      const totalUsers = Object.keys(userMap).length;
      const totalSolved = answersList.length;
      const correctAnswers = answersList.filter(a => a.is_correct).length;
      const avgAccuracy = totalSolved > 0 ? Math.round((correctAnswers / totalSolved) * 100) : 0;

      const activeTodayCount = stats.filter(u => {
        if (!u.lastActivity) return false;
        return (new Date().getTime() - new Date(u.lastActivity).getTime()) < (24 * 60 * 60 * 1000);
      }).length;

      setKpis({
        totalUsers,
        totalSolved,
        avgAccuracy,
        activeToday: activeTodayCount
      });

      const recentAttempts = [...answersList]
        .sort((a, b) => new Date(b.solved_at).getTime() - new Date(a.solved_at).getTime())
        .slice(0, 15)
        .map(attempt => {
          const user = userMap[attempt.user_id];
          const q = questionsList.find(q => q.id === attempt.question_id);
          return {
            id: `${attempt.user_id}-${attempt.question_id}-${attempt.solved_at}`,
            userName: user ? user.name : 'Bilinmeyen Kullanıcı',
            questionContent: q ? q.content : 'Silinmiş Soru',
            category: q ? q.category : 'Genel',
            isCorrect: attempt.is_correct,
            solvedAt: attempt.solved_at
          };
        });
      setRecentSolvedFeed(recentAttempts);

      const questionAttempts: Record<string, { correct: number; incorrect: number }> = {};
      answersList.forEach(a => {
        if (!questionAttempts[a.question_id]) {
          questionAttempts[a.question_id] = { correct: 0, incorrect: 0 };
        }
        if (a.is_correct) {
          questionAttempts[a.question_id].correct++;
        } else {
          questionAttempts[a.question_id].incorrect++;
        }
      });

      const hardest = Object.entries(questionAttempts)
        .map(([qId, counts]) => {
          const q = questionsList.find(q => q.id === qId);
          const total = counts.correct + counts.incorrect;
          const errorRate = total > 0 ? Math.round((counts.incorrect / total) * 100) : 0;
          return {
            id: qId,
            content: q ? q.content : 'Silinmiş Soru',
            category: q ? q.category : 'Bilinmeyen',
            difficulty: q ? q.difficulty : 'medium',
            totalAttempts: total,
            incorrectCount: counts.incorrect,
            errorRate
          };
        })
        .filter(item => item.totalAttempts >= 1)
        .sort((a, b) => b.errorRate - a.errorRate || b.totalAttempts - a.totalAttempts)
        .slice(0, 8);

      setHardestQuestionsList(hardest);

      // --- FETCH TELEMETRY DATA ---
      const { data: events, error: eError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // last 30 days

      if (!eError && events) {
        // DAU: Unique users with 'app_opened' in last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const dauUsers = new Set(
          events
            .filter(e => e.event_name === 'app_opened' && e.created_at >= oneDayAgo && e.user_id)
            .map(e => e.user_id)
        );
        
        // Merge with legacy active today count to prevent visual inconsistency
        let combinedDau = activeTodayCount;
        if (dauUsers.size > activeTodayCount) {
          combinedDau = dauUsers.size;
        }

        // Avg Quiz Duration
        const completedQuizzes = events.filter(e => e.event_name === 'quiz_completed' && e.duration_seconds != null);
        const avgDuration = completedQuizzes.length > 0 
          ? Math.round(completedQuizzes.reduce((acc, e) => acc + (e.duration_seconds || 0), 0) / completedQuizzes.length)
          : 0;

        // Abandoned Quizzes by Category
        const abandons = events.filter(e => e.event_name === 'quiz_abandoned' && e.category);
        const abandonMap: Record<string, number> = {};
        abandons.forEach(e => {
          if (e.category) {
            abandonMap[e.category] = (abandonMap[e.category] || 0) + 1;
          }
        });
        const abandonStats = Object.entries(abandonMap)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        // Top Screens
        const screens = events.filter(e => e.event_name === 'screen_viewed' && e.screen_name);
        const screenMap: Record<string, number> = {};
        screens.forEach(e => {
          if (e.screen_name) {
            screenMap[e.screen_name] = (screenMap[e.screen_name] || 0) + 1;
          }
        });
        const topScreens = Object.entries(screenMap)
          .map(([screen, count]) => ({ screen, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // License Types from Profiles
        const licenseMap: Record<string, number> = {};
        profileList.forEach(p => {
          if (p.license_type) {
            licenseMap[p.license_type] = (licenseMap[p.license_type] || 0) + 1;
          }
        });
        const licenseStats = Object.entries(licenseMap)
          .map(([license, count]) => ({ license, count }))
          .sort((a, b) => b.count - a.count);

        setTelemetry({
          dau: combinedDau,
          avgDuration,
          licenseStats,
          abandonStats,
          topScreens
        });
      }

    } catch (err: any) {
      triggerAlert('error', `Analiz verileri yüklenirken hata: ${err.message}`);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch all exams
  const loadExams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);

      // Load counts
      const { data: counts, error: countsError } = await supabase
        .from('exam_questions')
        .select('exam_id');

      if (!countsError && counts) {
        const countMap: Record<string, number> = {};
        counts.forEach((item: any) => {
          countMap[item.exam_id] = (countMap[item.exam_id] || 0) + 1;
        });
        setExamQuestionCounts(countMap);
      }
    } catch (err: any) {
      triggerAlert('error', `Sınavlar yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all questions for global pool
  const loadPoolQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const questionsList = data || [];

      // Fetch exam associations in memory to avoid schema cache relationship error
      const examJoinsMap: Record<string, { id: string; title: string }[]> = {};
      
      // Fetch all exam joins to avoid HTTP 414 URI Too Long error on large pools
      const { data: joinsData, error: joinsError } = await supabase
        .from('exam_questions')
        .select('question_id, exam_id');

      if (!joinsError && joinsData) {
        const examIds = Array.from(new Set(joinsData.map((j: any) => j.exam_id).filter(Boolean)));
        const examsMap: Record<string, { id: string; title: string }> = {};

        if (examIds.length > 0) {
          const { data: examsData, error: examsError } = await supabase
            .from('exams')
            .select('id, title')
            .in('id', examIds);

          if (!examsError && examsData) {
            examsData.forEach((e: any) => {
              examsMap[e.id] = e;
            });
          }
        }

        joinsData.forEach((join: any) => {
          if (!join.question_id || !join.exam_id) return;
          const examObj = examsMap[join.exam_id];
          if (examObj) {
            if (!examJoinsMap[join.question_id]) {
              examJoinsMap[join.question_id] = [];
            }
            if (!examJoinsMap[join.question_id].some(e => e.id === examObj.id)) {
              examJoinsMap[join.question_id].push(examObj);
            }
          }
        });
      }

      // Map to questions
      const enrichedQuestions = questionsList.map(q => ({
        ...q,
        exams: examJoinsMap[q.id] || []
      }));

      setPoolQuestions(enrichedQuestions);
    } catch (err: any) {
      triggerAlert('error', `Soru havuzu yüklenirken hata: ${err.message}`);
    }
  };

  // Fetch all reported questions
  const loadReportedQuestions = async () => {
    setLoading(true);
    try {
      // 1. Fetch reported questions and questions relation
      const { data, error } = await supabase
        .from('reported_questions')
        .select(`
          id,
          user_id,
          question_id,
          reason,
          status,
          created_at,
          questions (
            id,
            content,
            options,
            correct_option,
            image_url,
            media_type,
            category,
            difficulty,
            explanation,
            explanation_image_url,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportsList = data || [];

      // 2. Fetch profiles in memory to avoid schema cache relationship error
      const userIds = Array.from(new Set(reportsList.map((r: any) => r.user_id).filter(Boolean)));
      const profilesMap: Record<string, { id: string; full_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (!profilesError && profilesData) {
          profilesData.forEach((p: any) => {
            profilesMap[p.id] = p;
          });
        }
      }

      // 3. Fetch exam associations for reported questions in memory
      const questionIds = Array.from(new Set(reportsList.map((r: any) => r.question_id).filter(Boolean)));
      const examJoinsMap: Record<string, { id: string; title: string }[]> = {};

      if (questionIds.length > 0) {
        const { data: joinsData, error: joinsError } = await supabase
          .from('exam_questions')
          .select('question_id, exam_id')
          .in('question_id', questionIds);

        if (!joinsError && joinsData) {
          const examIds = Array.from(new Set(joinsData.map((j: any) => j.exam_id).filter(Boolean)));
          const examsMap: Record<string, { id: string; title: string }> = {};

          if (examIds.length > 0) {
            const { data: examsData, error: examsError } = await supabase
              .from('exams')
              .select('id, title')
              .in('id', examIds);

            if (!examsError && examsData) {
              examsData.forEach((e: any) => {
                examsMap[e.id] = e;
              });
            }
          }

          joinsData.forEach((join: any) => {
            if (!join.question_id || !join.exam_id) return;
            const examObj = examsMap[join.exam_id];
            if (examObj) {
              if (!examJoinsMap[join.question_id]) {
                examJoinsMap[join.question_id] = [];
              }
              if (!examJoinsMap[join.question_id].some(e => e.id === examObj.id)) {
                examJoinsMap[join.question_id].push(examObj);
              }
            }
          });
        }
      }

      // 4. Map everything together
      const mappedData: ReportedQuestion[] = reportsList.map((item: any) => {
        const profileObj = profilesMap[item.user_id] || null;
        let questionObj = null;
        if (item.questions) {
          questionObj = Array.isArray(item.questions) ? item.questions[0] : item.questions;
        }
        const questionExams = examJoinsMap[item.question_id] || [];
        return {
          id: item.id,
          user_id: item.user_id,
          question_id: item.question_id,
          reason: item.reason,
          status: item.status,
          created_at: item.created_at,
          profiles: profileObj,
          questions: questionObj,
          exams: questionExams
        };
      });

      setReportedQuestions(mappedData);
    } catch (err: any) {
      triggerAlert('error', `Raporlar yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Update status of reported question
  const handleUpdateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reported_questions')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      triggerAlert('success', `Rapor durumu güncellendi.`);
      loadReportedQuestions();
    } catch (err: any) {
      triggerAlert('error', `Durum güncellenirken hata: ${err.message}`);
    }
  };

  // Delete reported question record
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz? Soru veritabanından silinmeyecektir.')) return;
    try {
      const { error } = await supabase
        .from('reported_questions')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      triggerAlert('success', `Rapor silindi.`);
      loadReportedQuestions();
    } catch (err: any) {
      triggerAlert('error', `Rapor silinirken hata: ${err.message}`);
    }
  };

  // Fetch questions for a selected exam
  const loadExamQuestions = async (exam: Exam) => {
    setLoading(true);
    try {
      // 1. Fetch joins
      const { data: joins, error: joinsError } = await supabase
        .from('exam_questions')
        .select('question_id, order_number')
        .eq('exam_id', exam.id)
        .order('order_number', { ascending: true });

      if (joinsError) throw joinsError;
      setSelectedExamJoins(joins || []);

      if (!joins || joins.length === 0) {
        setSelectedExamQuestions([]);
        return;
      }

      // 2. Fetch question details
      const qIds = joins.map(j => j.question_id);
      const { data: qs, error: qsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', qIds);

      if (qsError) throw qsError;

      // Sort questions based on the order_number in joins
      const sortedQs = (qs || []).sort((a, b) => {
        const orderA = joins.find(j => j.question_id === a.id)?.order_number || 0;
        const orderB = joins.find(j => j.question_id === b.id)?.order_number || 0;
        return orderA - orderB;
      });

      setSelectedExamQuestions(sortedQs);
    } catch (err: any) {
      triggerAlert('error', `Sınav soruları yüklenirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select/Deselect an exam
  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    loadExamQuestions(exam);
  };

  const handleBackToExams = () => {
    setSelectedExam(null);
    setSelectedExamQuestions([]);
    setSelectedExamJoins([]);
    loadExams();
  };

  // Save/Edit Exam
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam?.title) return;

    setLoading(true);
    try {
      if (editingExam.id) {
        // Update
        const { error } = await supabase
          .from('exams')
          .update({
            title: editingExam.title,
            category: editingExam.category || 'Genel Deneme',
            is_active: editingExam.is_active !== false
          })
          .eq('id', editingExam.id);

        if (error) throw error;
        triggerAlert('success', 'Sınav başarıyla güncellendi.');
      } else {
        // Create
        const { error } = await supabase
          .from('exams')
          .insert({
            title: editingExam.title,
            category: editingExam.category || 'Genel Deneme',
            is_active: editingExam.is_active !== false
          });

        if (error) throw error;
        triggerAlert('success', 'Sınav başarıyla oluşturuldu.');
      }
      setShowExamModal(false);
      setEditingExam(null);
      loadExams();
    } catch (err: any) {
      triggerAlert('error', `Sınav kaydedilirken hata: ${err.message}. RLS kurallarını kontrol edin.`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz? Sınava bağlı (ve başka bir sınavda kullanılmayan) tüm sorular da tamamen silinecektir.')) return;
    
    setLoading(true);
    try {
      // Get all linked questions before deleting joints
      const { data: linkedQuestions } = await supabase
        .from('exam_questions')
        .select('question_id')
        .eq('exam_id', examId);

      // First delete connections
      const { error: joinError } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', examId);
      
      if (joinError) throw joinError;

      // Delete orphaned questions from the database
      if (linkedQuestions && linkedQuestions.length > 0) {
        const qIds = linkedQuestions.map((q: any) => q.question_id).filter(Boolean);
        const questionsToDelete = [];
        
        for (const qId of qIds) {
          const { data: otherLinks } = await supabase
            .from('exam_questions')
            .select('exam_id')
            .eq('question_id', qId)
            .limit(1);
            
          const isStillLinked = (otherLinks && otherLinks.length > 0);
          if (!isStillLinked) {
            questionsToDelete.push(qId);
          } else {
            // Update exam_question to true just in case, though it should already be true
            await supabase
              .from('questions')
              .update({ exam_question: true })
              .eq('id', qId);
          }
        }
        
        // Delete the questions that are no longer linked to any exam
        if (questionsToDelete.length > 0) {
          // Process deletion in chunks if there are many, but usually it's ~50
          const batchSize = 100;
          for (let i = 0; i < questionsToDelete.length; i += batchSize) {
            const batch = questionsToDelete.slice(i, i + batchSize);
            await supabase
              .from('questions')
              .delete()
              .in('id', batch);
          }
        }
      }

      // Delete exam
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      triggerAlert('success', 'Sınav ve bağlı soruları başarıyla silindi.');
      loadExams();
    } catch (err: any) {
      triggerAlert('error', `Sınav silinirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create or Edit Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.content || !editingQuestion.options || editingQuestion.options.length < 2) {
      triggerAlert('error', 'Soru içeriği ve en az iki şık zorunludur.');
      return;
    }

    setLoading(true);
    try {
      let savedQuestionId = editingQuestion.id;

      if (editingQuestion.id) {
        // Update global question
        const { error } = await supabase
          .from('questions')
          .update({
            content: editingQuestion.content,
            options: editingQuestion.options,
            correct_option: editingQuestion.correct_option,
            category: editingQuestion.category || 'trafik',
            difficulty: editingQuestion.difficulty || 'medium',
            explanation: editingQuestion.explanation || null,
            image_url: editingQuestion.image_url || null,
            media_type: editingQuestion.media_type || 'none',
            explanation_image_url: editingQuestion.explanation_image_url || null,
            is_active: editingQuestion.is_active !== false,
            exam_question: editingQuestion.exam_question === true
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        triggerAlert('success', 'Soru başarıyla güncellendi.');
      } else {
        // Insert new global question
        const { data, error } = await supabase
          .from('questions')
          .insert({
            content: editingQuestion.content,
            options: editingQuestion.options,
            correct_option: editingQuestion.correct_option,
            category: editingQuestion.category || 'trafik',
            difficulty: editingQuestion.difficulty || 'medium',
            explanation: editingQuestion.explanation || null,
            image_url: editingQuestion.image_url || null,
            media_type: editingQuestion.media_type || 'none',
            explanation_image_url: editingQuestion.explanation_image_url || null,
            is_active: editingQuestion.is_active !== false,
            exam_question: !!targetExamIdForNewQuestion
          })
          .select('id')
          .single();

        if (error) throw error;
        savedQuestionId = data.id;
        triggerAlert('success', 'Yeni soru oluşturuldu.');
      }

      // If we are adding it directly to a specific exam
      if (targetExamIdForNewQuestion && savedQuestionId) {
        // Find next order number
        const nextOrder = selectedExamJoins.length > 0 
          ? Math.max(...selectedExamJoins.map(j => j.order_number)) + 1 
          : 1;

        const { error: joinError } = await supabase
          .from('exam_questions')
          .insert({
            exam_id: targetExamIdForNewQuestion,
            question_id: savedQuestionId,
            order_number: nextOrder
          });

        if (joinError) throw joinError;
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      setTargetExamIdForNewQuestion(null);

      // Refresh data
      if (selectedExam) {
        loadExamQuestions(selectedExam);
      }
      loadPoolQuestions();
      loadReportedQuestions();
    } catch (err: any) {
      triggerAlert('error', `Soru kaydedilirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Question Globally
  const handleDeleteQuestionGlobally = async (qId: string) => {
    if (!confirm('Bu soruyu veritabanından tamamen silmek istediğinize emin misiniz? Bu soruya ait tüm sınav bağlantıları da silinecektir!')) return;

    setLoading(true);
    try {
      // Delete joins first
      await supabase.from('exam_questions').delete().eq('question_id', qId);
      // Delete question
      const { error } = await supabase.from('questions').delete().eq('id', qId);
      if (error) throw error;

      triggerAlert('success', 'Soru veritabanından kalıcı olarak silindi.');
      if (selectedExam) loadExamQuestions(selectedExam);
      loadPoolQuestions();
    } catch (err: any) {
      triggerAlert('error', `Soru silinirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove question from exam (but keep in pool)
  const handleRemoveQuestionFromExam = async (qId: string) => {
    if (!selectedExam) return;
    if (!confirm('Bu sorunun bu sınavla olan bağlantısını kaldırmak istediğinize emin misiniz? Soru veritabanından silinmeyecektir.')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('exam_id', selectedExam.id)
        .eq('question_id', qId);

      if (error) throw error;

      // Update exam_question status on questions table
      const { data: otherLinks } = await supabase
        .from('exam_questions')
        .select('exam_id')
        .eq('question_id', qId);
      const isStillLinked = (otherLinks && otherLinks.length > 0);
      await supabase
        .from('questions')
        .update({ exam_question: isStillLinked })
        .eq('id', qId);

      triggerAlert('success', 'Soru sınavdan çıkarıldı.');
      loadExamQuestions(selectedExam);
      loadPoolQuestions();
    } catch (err: any) {
      triggerAlert('error', `Bağlantı kesilirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Link question from pool to exam
  const handleLinkQuestionToExam = async (qId: string) => {
    if (!selectedExam) return;
    
    // Check if already linked
    if (selectedExamQuestions.some(q => q.id === qId)) {
      triggerAlert('error', 'Bu soru zaten bu sınavda mevcut.');
      return;
    }

    try {
      const nextOrder = selectedExamJoins.length > 0 
        ? Math.max(...selectedExamJoins.map(j => j.order_number)) + 1 
        : 1;

      const { error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: selectedExam.id,
          question_id: qId,
          order_number: nextOrder
        });

      if (error) throw error;

      // Update exam_question status on questions table to true
      await supabase
        .from('questions')
        .update({ exam_question: true })
        .eq('id', qId);

      triggerAlert('success', 'Soru sınava eklendi.');
      loadExamQuestions(selectedExam);
      loadPoolQuestions();
    } catch (err: any) {
      triggerAlert('error', `Soru eklenirken hata: ${err.message}`);
    }
  };

  // Reorder questions (Move Up / Down)
  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (!selectedExam) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedExamQuestions.length) return;

    setLoading(true);
    try {
      const currentQ = selectedExamQuestions[index];
      const otherQ = selectedExamQuestions[targetIndex];

      const currentJoin = selectedExamJoins.find(j => j.question_id === currentQ.id);
      const otherJoin = selectedExamJoins.find(j => j.question_id === otherQ.id);

      if (!currentJoin || !otherJoin) throw new Error('Order data mismatch');

      const tempOrder = currentJoin.order_number;

      // Swap database orders
      const { error: err1 } = await supabase
        .from('exam_questions')
        .update({ order_number: otherJoin.order_number })
        .eq('exam_id', selectedExam.id)
        .eq('question_id', currentQ.id);

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from('exam_questions')
        .update({ order_number: tempOrder })
        .eq('exam_id', selectedExam.id)
        .eq('question_id', otherQ.id);

      if (err2) throw err2;

      // Reload
      await loadExamQuestions(selectedExam);
      triggerAlert('success', 'Soru sırası güncellendi.');
    } catch (err: any) {
      triggerAlert('error', `Sıralama değiştirilirken hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Shuffle all questions options in the selected exam
  const handleShuffleAllOptions = async () => {
    if (!selectedExam || selectedExamQuestions.length === 0) return;
    
    if (!confirm('Bu sınavdaki tüm soruların şıklarının sırasını karıştırmak istediğinize emin misiniz? Doğru şık eşleşmeleri korunacaktır.')) return;

    setLoading(true);
    try {
      const updatePromises = selectedExamQuestions.map(async (question) => {
        if (!question.options || question.options.length < 2) return;
        const correctOptionValue = question.options[question.correct_option];
        if (correctOptionValue === undefined) return;

        // Shuffle options using Fisher-Yates
        const shuffled = [...question.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = shuffled[i];
          shuffled[i] = shuffled[j];
          shuffled[j] = temp;
        }

        const newCorrectOption = shuffled.indexOf(correctOptionValue);

        const { error } = await supabase
          .from('questions')
          .update({
            options: shuffled,
            correct_option: newCorrectOption >= 0 ? newCorrectOption : 0
          })
          .eq('id', question.id);

        if (error) throw error;
      });

      await Promise.all(updatePromises);
      await loadExamQuestions(selectedExam);
      triggerAlert('success', 'Sınavdaki tüm soruların şıkları başarıyla karıştırıldı.');
    } catch (err: any) {
      triggerAlert('error', `Şıklar karıştırılırken hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials(settingsUrl, settingsKey);
  };

  // Filtered pool questions
  const filteredPoolQuestions = poolQuestions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(poolSearch.toLowerCase()) || 
                          (q.explanation && q.explanation.toLowerCase().includes(poolSearch.toLowerCase()));
    const matchesCategory = poolCategory === 'All' || q.category === poolCategory;
    
    let matchesExamFilter = true;
    if (poolExamFilter === 'no_exam') {
      matchesExamFilter = !q.exams || q.exams.length === 0;
    } else if (poolExamFilter === 'has_exam') {
      matchesExamFilter = !!q.exams && q.exams.length > 0;
    }

    return matchesSearch && matchesCategory && matchesExamFilter;
  });

  const filteredLinkQuestions = poolQuestions.filter(q => {
    // Exclude already added ones
    const isAlreadyInExam = selectedExamQuestions.some(eq => eq.id === q.id);
    const matchesSearch = q.content.toLowerCase().includes(linkSearch.toLowerCase());
    return !isAlreadyInExam && matchesSearch;
  });

  // Filtered reported questions
  const filteredReports = reportedQuestions.filter(r => {
    if (reportFilterStatus === 'all') return true;
    return r.status === reportFilterStatus;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', borderRight: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--color-primary-gradient)', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0 }}>Ehliyet Hocam</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Yönetici Paneli</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            onClick={() => { setActiveTab('exams'); handleBackToExams(); }}
            className={`btn ${activeTab === 'exams' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Database size={18} /> Sınavlar
          </button>
          <button 
            onClick={() => setActiveTab('pool')}
            className={`btn ${activeTab === 'pool' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <HelpCircle size={18} /> Soru Havuzu
          </button>
          <button 
            onClick={() => setActiveTab('reported')}
            className={`btn ${activeTab === 'reported' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <AlertCircle size={18} /> Raporlananlar
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <BarChart2 size={18} /> Analizler
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Settings size={18} /> Ayarlar
          </button>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isUsingServiceRole ? (
              <span className="badge badge-success" style={{ textTransform: 'none', width: '100%', justifyContent: 'center' }}>Admin Yetkisi Açık</span>
            ) : (
              <span className="badge badge-warning" style={{ textTransform: 'none', width: '100%', justifyContent: 'center', gap: '4px' }}>
                <ShieldAlert size={12} /> Sadece Okuma (Anon)
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Banner alerts */}
        {alert && (
          <div 
            style={{ 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              zIndex: 9999, 
              padding: '1rem 1.5rem', 
              borderRadius: 'var(--radius-md)', 
              color: 'white', 
              background: alert.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', 
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <AlertCircle size={20} />
            <span>{alert.message}</span>
          </div>
        )}

        {/* Tab content renderer */}
        {activeTab === 'exams' && (
          <>
            {!selectedExam ? (
              // Exams List View
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sınav Denemeleri</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Veritabanındaki e-Sınav denemelerini yönetin ve başlıklarını düzenleyin.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImportJson} 
                      accept=".json" 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Upload size={18} /> JSON İçe Aktar
                    </button>
                    <button 
                      onClick={() => { setEditingExam({}); setShowExamModal(true); }}
                      className="btn btn-primary"
                    >
                      <Plus size={18} /> Yeni Sınav Ekle
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spinner" /></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {exams.map((exam) => {
                      const count = examQuestionCounts[exam.id] || 0;
                      return (
                        <div key={exam.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span className="badge badge-violet">{exam.category}</span>
                              <span className={`badge ${exam.is_active ? 'badge-success' : 'badge-danger'}`}>
                                {exam.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{exam.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{count} Soru var</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-primary)', paddingTop: '0.75rem' }}>
                            <button 
                              onClick={() => handleSelectExam(exam)}
                              className="btn btn-secondary" 
                              style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              Soruları Yönet
                            </button>
                            <button 
                              onClick={() => handleExportExam(exam)}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem', color: 'var(--color-primary-light)' }}
                              title="JSON Dışa Aktar"
                            >
                              <Download size={14} />
                            </button>
                            <button 
                              onClick={() => { setEditingExam(exam); setShowExamModal(true); }}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem' }}
                              title="Düzenle"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteExam(exam.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem', color: 'var(--color-danger)' }}
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Selected Exam Details (Questions List)
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button onClick={handleBackToExams} className="btn btn-secondary" style={{ padding: '0.5rem' }}><ArrowLeft size={16} /></button>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedExam.title}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Sınavdaki soruların sırasını düzenleyin, yeni soru ekleyin veya silin.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Left Column: List of Questions */}
                  <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Sınav Soruları ({selectedExamQuestions.length} soru)</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={handleShuffleAllOptions}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          title="Tüm Soruların Şıklarını Karıştır"
                        >
                          <Shuffle size={16} /> Şıkları Karıştır
                        </button>
                        <button 
                          onClick={() => handleExportExam(selectedExam)}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Download size={16} /> JSON Dışa Aktar
                        </button>
                        <button 
                          onClick={() => { setShowPoolLinkModal(true); setLinkSearch(''); }}
                          className="btn btn-secondary"
                        >
                          Havuzdan Soru Ekle
                        </button>
                        <button 
                          onClick={() => { 
                            setTargetExamIdForNewQuestion(selectedExam.id); 
                            setEditingQuestion({ 
                              options: ['', '', '', ''], 
                              correct_option: 0, 
                              difficulty: 'medium', 
                              category: 'trafik',
                              media_type: 'none',
                              explanation_image_url: null
                            }); 
                            setShowQuestionModal(true); 
                          }}
                          className="btn btn-primary"
                        >
                          <Plus size={16} /> Yeni Soru Yarat
                        </button>
                      </div>
                    </div>

                    {loading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spinner" /></div>
                    ) : selectedExamQuestions.length === 0 ? (
                      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <HelpCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                        Bu sınavda henüz hiç soru yok. Sağ üstten ekleyebilirsiniz.
                      </div>
                    ) : (
                      selectedExamQuestions.map((question, index) => (
                        <div key={question.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                          {/* Order buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid var(--border-primary)', paddingRight: '1rem' }}>
                            <button 
                              disabled={index === 0} 
                              onClick={() => handleMoveQuestion(index, 'up')}
                              style={{ opacity: index === 0 ? 0.3 : 1, padding: '0.2rem' }}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary-light)' }}>{index + 1}</span>
                            <button 
                              disabled={index === selectedExamQuestions.length - 1} 
                              onClick={() => handleMoveQuestion(index, 'down')}
                              style={{ opacity: index === selectedExamQuestions.length - 1 ? 0.3 : 1, padding: '0.2rem' }}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>

                          {/* Question body */}
                          <div style={{ flex: 1, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 3, minWidth: '300px' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-cyan">{question.category}</span>
                                <span className={`badge ${
                                  question.difficulty === 'easy' ? 'badge-success' : 
                                  question.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                  {question.difficulty === 'easy' ? 'Kolay' : question.difficulty === 'medium' ? 'Orta' : 'Zor'}
                                </span>
                                <span className="badge badge-violet">Medya: {question.media_type || 'none'}</span>
                              </div>
                              <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.75rem' }}>{question.content}</p>
                              
                              {/* Options grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {question.options.map((opt, optIdx) => {
                                  const isCorrect = optIdx === question.correct_option;
                                  return (
                                    <div 
                                      key={optIdx} 
                                      style={{ 
                                        padding: '0.5rem 0.75rem', 
                                        background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.1)', 
                                        border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--border-primary)'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <span style={{ fontWeight: 700, color: isCorrect ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                                        {['A', 'B', 'C', 'D'][optIdx]}:
                                      </span>
                                      <span>{opt}</span>
                                      {isCorrect && <Check size={14} color="var(--color-success)" style={{ marginLeft: 'auto' }} />}
                                    </div>
                                  );
                                })}
                              </div>

                              {question.explanation && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '4px' }}>
                                  <strong>Açıklama:</strong> {question.explanation}
                                </p>
                              )}
                            </div>

                            {/* Image previews */}
                            {(question.image_url || question.explanation_image_url) && (
                              <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border-primary)', paddingLeft: '1.25rem' }}>
                                {question.image_url && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Soru Görseli:</span>
                                    <img src={question.image_url} alt="Soru Görseli" style={{ maxWidth: '100%', maxHeight: '110px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', background: '#0a0a0a', padding: '4px', border: '1px solid var(--border-primary)' }} />
                                  </div>
                                )}
                                {question.explanation_image_url && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Açıklama Görseli:</span>
                                    <img src={question.explanation_image_url} alt="Açıklama Görseli" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', background: '#0a0a0a', padding: '4px', border: '1px solid var(--border-primary)' }} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => { setEditingQuestion(question); setShowQuestionModal(true); }}
                              className="btn btn-secondary" 
                              style={{ padding: '0.5rem' }}
                              title="Soruyu Düzenle"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveQuestionFromExam(question.id)}
                              className="btn btn-secondary" 
                              style={{ padding: '0.5rem', color: 'var(--color-warning)' }}
                              title="Sınavdan Çıkar"
                            >
                              <X size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestionGlobally(question.id)}
                              className="btn btn-secondary" 
                              style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                              title="Veritabanından Kalıcı Olarak Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'pool' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Soru Havuzu</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Uygulamadaki tüm soruları görün, düzenleyin veya yeni küresel sorular ekleyin.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Upload size={18} /> JSON İle Çoklu Ekle
                  <input 
                    type="file" 
                    accept=".json" 
                    style={{ display: 'none' }} 
                    onChange={handleImportPoolQuestionsJson} 
                  />
                </label>
                <button 
                  onClick={() => { 
                    setTargetExamIdForNewQuestion(null); 

                    setEditingQuestion({ 
                      options: ['', '', '', ''], 
                      correct_option: 0, 
                      difficulty: 'medium', 
                      category: 'trafik',
                      media_type: 'none',
                      explanation_image_url: null
                    }); 
                    setShowQuestionModal(true); 
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={18} /> Yeni Soru Yarat
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={poolSearch} 
                  onChange={(e) => setPoolSearch(e.target.value)} 
                  placeholder="Soru metninde veya açıklamasında ara..." 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                />
              </div>
              <select 
                value={poolCategory} 
                onChange={(e) => setPoolCategory(e.target.value)} 
                className="form-select"
                style={{ width: '200px' }}
              >
                <option value="All">Tüm Kategoriler</option>
                <option value="trafik">Trafik ve Çevre</option>
                <option value="ilkyardim">İlk Yardım</option>
                <option value="motor">Araç Tekniği (Motor)</option>
                <option value="adap">Trafik Adabı</option>
              </select>
              <select 
                value={poolExamFilter} 
                onChange={(e) => setPoolExamFilter(e.target.value as any)} 
                className="form-select"
                style={{ width: '220px' }}
              >
                <option value="all">Tüm Sorular (Havuz)</option>
                <option value="no_exam">Sınavda Olmayanlar</option>
                <option value="has_exam">Sınavda Olanlar</option>
              </select>
            </div>

            {/* Questions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredPoolQuestions.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Arama kriterlerinize uygun soru bulunamadı.
                </div>
              ) : (
                filteredPoolQuestions.map((question) => (
                  <div key={question.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 3, minWidth: '300px' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="badge badge-cyan">{question.category}</span>
                          <span className={`badge ${
                            question.difficulty === 'easy' ? 'badge-success' : 
                            question.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="badge badge-violet">Medya: {question.media_type || 'none'}</span>
                          
                          {/* Exam associations list */}
                          {question.exams && question.exams.length > 0 ? (
                            question.exams.map((e) => (
                              <span key={e.id} className="badge badge-violet" style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', textTransform: 'none', color: 'var(--color-primary-light)' }}>
                                Sınav: {e.title}
                              </span>
                            ))
                          ) : (
                            <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', textTransform: 'none' }}>
                              Sınavda Değil
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.75rem' }}>{question.content}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          {question.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === question.correct_option;
                            return (
                              <div 
                                key={optIdx} 
                                style={{ 
                                  padding: '0.4rem 0.6rem', 
                                  background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.1)', 
                                  border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--border-primary)'}`,
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem'
                                }}
                              >
                                <span style={{ fontWeight: 700, color: isCorrect ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                                  {['A', 'B', 'C', 'D'][optIdx]}:
                                </span>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Image previews */}
                      {(question.image_url || question.explanation_image_url) && (
                        <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '1px solid var(--border-primary)', paddingLeft: '1.25rem' }}>
                          {question.image_url && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Soru Görseli:</span>
                              <img src={question.image_url} alt="Soru Görseli" style={{ maxWidth: '100%', maxHeight: '100px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', background: '#0a0a0a', padding: '4px', border: '1px solid var(--border-primary)' }} />
                            </div>
                          )}
                          {question.explanation_image_url && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Açıklama Görseli:</span>
                              <img src={question.explanation_image_url} alt="Açıklama Görseli" style={{ maxWidth: '100%', maxHeight: '70px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', background: '#0a0a0a', padding: '4px', border: '1px solid var(--border-primary)' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => { setEditingQuestion(question); setShowQuestionModal(true); }}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestionGlobally(question.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Detaylı Kullanıcı ve Soru Analizleri</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Uygulama kullanım istatistiklerini, çözülen soru analizlerini ve aktif kullanıcı durumlarını takip edin.</p>
              </div>
              <button 
                onClick={loadAnalyticsData}
                disabled={analyticsLoading}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {analyticsLoading ? <Loader2 className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Verileri Yenile'}
              </button>
            </div>

            {/* Warning if no service role key */}
            {!isUsingServiceRole && (
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--color-warning)', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.05)' }}>
                <ShieldAlert size={20} color="var(--color-warning)" />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Kısıtlı Görünüm (Anon Key):</strong> Son Giriş zamanı (last login) ve kullanıcı e-postaları gibi gizli bilgileri görebilmek için 
                  <strong> Ayarlar</strong> sekmesinden <strong>Service Role Key</strong> tanımlamanız gerekmektedir. Şu anki veriler profil kayıtlarından çekilmektedir.
                </p>
              </div>
            )}

            {analyticsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
                <Loader2 className="spinner" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Toplam Kullanıcı</p>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{kpis.totalUsers}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>DAU (Günlük Aktif)</p>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{telemetry.dau}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Çözülen Soru</p>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{kpis.totalSolved}</p>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ort. Sınav Süresi</p>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--color-warning)' }}>{telemetry.avgDuration} sn</p>
                  </div>
                </div>

                {/* Telemetry Extra Metrics Grid */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  
                  {/* License Target Distribution */}
                  <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem' }}>Ehliyet Hedefi Dağılımı</h3>
                    {telemetry.licenseStats.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {telemetry.licenseStats.map((l, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sınıf {l.license}</span>
                            <span className="badge badge-primary">{l.count} Kullanıcı</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Veri bulunmuyor</p>
                    )}
                  </div>

                  {/* Abandoned Categories */}
                  <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem', color: 'var(--color-danger)' }}>En Çok Terk Edilen Sınavlar</h3>
                    {telemetry.abandonStats.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {telemetry.abandonStats.map((a, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.category}</span>
                            <span className="badge badge-danger">{a.count} Terk</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Terk edilen sınav yok</p>
                    )}
                  </div>

                  {/* Top Screens */}
                  <div className="glass-panel" style={{ flex: 1, minWidth: '300px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem' }}>En Çok Ziyaret Edilen Ekranlar</h3>
                    {telemetry.topScreens.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {telemetry.topScreens.map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.screen}</span>
                            <span className="badge badge-secondary">{s.count} Görüntülenme</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ekran verisi bulunmuyor</p>
                    )}
                  </div>
                </div>

                {/* Split Dashboard */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Left: User list directory */}
                  <div className="glass-panel" style={{ flex: 2, minWidth: '350px', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem' }}>Kullanıcı Durumları</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Kullanıcı</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Durum</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Son Aktivite</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Çözülen</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Başarı</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userStatsList.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <div style={{ fontWeight: 600 }}>{u.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {u.isOnline ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px var(--color-success)' }}></span>
                                    Çevrimiçi
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Çevrimdışı</span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                                {getTimeAgo(u.lastActivity)}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>{u.solvedCount}</td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                <span className={`badge ${u.accuracy >= 70 ? 'badge-success' : u.accuracy >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                                  %{u.accuracy}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Hard questions & feed */}
                  <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Hard Questions Card */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem', color: 'var(--color-danger)' }}>
                        En Çok Yanlış Yapılan Sorular
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {hardestQuestionsList.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Yeterli veri yok.</p>
                        ) : (
                          hardestQuestionsList.map(q => (
                            <div key={q.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0.75rem', border: '1px solid var(--border-primary)', borderRadius: '6px', background: 'rgba(0,0,0,0.1)' }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.4rem' }}>{q.content}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                                <span className="badge badge-cyan" style={{ padding: '0.1rem 0.3rem' }}>{q.category}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Hata Oranı: <strong style={{ color: 'var(--color-danger)' }}>%{q.errorRate}</strong> ({q.totalAttempts} çözüm)
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* RecentSolved Feed */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.5rem' }}>
                        Son Çözülen Sorular
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                        {recentSolvedFeed.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Henüz aktivite yok.</p>
                        ) : (
                          recentSolvedFeed.map(feed => (
                            <div key={feed.id} style={{ fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                                <strong style={{ color: 'var(--color-primary-light)' }}>{feed.userName}</strong>
                                <span className={`badge ${feed.isCorrect ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>
                                  {feed.isCorrect ? 'Doğru' : 'Yanlış'}
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{feed.questionContent}</p>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getTimeAgo(feed.solvedAt)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reported' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Raporlanan Sorular</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Kullanıcılar tarafından bildirilen sorunlu soruları inceleyin ve düzenleyin.</p>
              </div>
              <div>
                <select 
                  value={reportFilterStatus} 
                  onChange={(e) => setReportFilterStatus(e.target.value as any)}
                  className="form-select"
                  style={{ minWidth: '180px' }}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Bekleyen Raporlar</option>
                  <option value="resolved">Çözülen Raporlar</option>
                  <option value="dismissed">Yoksayılan Raporlar</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spinner" /></div>
            ) : filteredReports.length === 0 ? (
              <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Check size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--color-success)' }} />
                Raporlanmış soru bulunamadı.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredReports.map((report) => (
                  <div key={report.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Raporlayan: <strong style={{ color: 'var(--text-primary)' }}>{report.profiles?.full_name || 'Bilinmeyen Kullanıcı'}</strong> (ID: {report.user_id})
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Raporlanma Tarihi: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(report.created_at)}</strong> ({getTimeAgo(report.created_at)})
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bulunduğu Sınav(lar):</span>
                          {report.exams && report.exams.length > 0 ? (
                            report.exams.map((e) => (
                              <span key={e.id} className="badge badge-violet" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', textTransform: 'none' }}>
                                {e.title}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Sınav bağlantısı yok (Sadece Soru Havuzunda)</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${
                          report.status === 'pending' ? 'badge-warning' : 
                          report.status === 'resolved' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {report.status === 'pending' ? 'Bekliyor' : 
                           report.status === 'resolved' ? 'Çözüldü' : 'Yoksayıldı'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rapor Gerekçesi</span>
                          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '3px solid var(--color-secondary)' }}>
                            "{report.reason}"
                          </p>
                        </div>

                        {(() => {
                          const question = report.questions;
                          if (!question) {
                            return (
                              <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                İlişkili soru veritabanından silinmiş.
                              </div>
                            );
                          }
                          return (
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Soru Detayı</span>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <span className="badge badge-violet">{question.category}</span>
                                <span className="badge badge-secondary" style={{ textTransform: 'uppercase' }}>{question.difficulty}</span>
                                <span className={`badge ${question.is_active ? 'badge-success' : 'badge-danger'}`}>
                                  {question.is_active ? 'Soru Aktif' : 'Soru Pasif'}
                                </span>
                              </div>
                              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: '1.4' }}>{question.content}</h4>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                {question.options.map((opt, optIdx) => {
                                  const isCorrect = optIdx === question.correct_option;
                                  return (
                                    <div 
                                      key={optIdx} 
                                      style={{ 
                                        padding: '0.75rem', 
                                        borderRadius: '8px', 
                                        background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.1)', 
                                        border: `1px solid ${isCorrect ? 'var(--color-success)' : 'var(--border-primary)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.85rem'
                                      }}
                                    >
                                      <span style={{ fontWeight: 700, color: isCorrect ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                                        {['A', 'B', 'C', 'D', 'E'][optIdx] || optIdx + 1}:
                                      </span>
                                      <span style={{ color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{opt}</span>
                                      {isCorrect && <Check size={14} color="var(--color-success)" style={{ marginLeft: 'auto' }} />}
                                    </div>
                                  );
                                })}
                              </div>

                              {question.explanation && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px dashed var(--border-primary)' }}>
                                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Açıklama:</strong>
                                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{question.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {report.questions && report.questions.image_url && (
                        <div style={{ width: '200px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Soru Görseli</span>
                          <img 
                            src={report.questions.image_url} 
                            alt="Soru" 
                            style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border-primary)' }} 
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', justifyContent: 'flex-end' }}>
                      {report.questions && (
                        <button 
                          onClick={() => {
                            setEditingQuestion(report.questions);
                            setShowQuestionModal(true);
                          }}
                          className="btn btn-secondary"
                        >
                          <Edit2 size={14} /> Soruyu Düzenle
                        </button>
                      )}
                      
                      {report.status !== 'resolved' && (
                        <button 
                          onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          className="btn btn-secondary"
                          style={{ color: 'var(--color-success)' }}
                        >
                          <Check size={14} /> Çözüldü
                        </button>
                      )}

                      {report.status !== 'dismissed' && (
                        <button 
                          onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                          className="btn btn-secondary"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <X size={14} /> Yoksay
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="btn btn-secondary"
                        style={{ color: 'var(--color-danger)' }}
                        title="Raporu Sil"
                      >
                        <Trash2 size={14} /> Raporu Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Veritabanı Ayarları</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Düzenleme, ekleme ve silme işlemlerini gerçekleştirebilmek için Supabase **Service Role Key** kullanmanız gerekir.
              Burada yapacağınız ayarlar yalnızca bu tarayıcının yerel depolama alanında (`localStorage`) saklanır ve kesinlikle dışarı aktarılmaz.
            </p>

            <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label">Supabase Project URL</label>
                <input 
                  type="text" 
                  value={settingsUrl} 
                  onChange={(e) => setSettingsUrl(e.target.value)} 
                  placeholder="https://your-project.supabase.co" 
                  className="form-input" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supabase Service Role Key (Bypass RLS)</label>
                <input 
                  type="password" 
                  value={settingsKey} 
                  onChange={(e) => setSettingsKey(e.target.value)} 
                  placeholder="eyJhbGciOi..." 
                  className="form-input"
                  required
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Bu anahtar veritabanı üzerindeki tüm güvenlik politikalarını (RLS) devre dışı bırakır. Sadece siz erişin!
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Kaydet ve Yeniden Başlat
                </button>
                {(getServiceRoleKey() || getCustomSupabaseUrl()) && (
                  <button 
                    type="button" 
                    onClick={clearCredentials}
                    className="btn btn-secondary"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Varsayılana Dön (Temizle)
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Exam Create/Edit Modal */}
      {showExamModal && editingExam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{editingExam.id ? 'Sınavı Düzenle' : 'Yeni Sınav Oluştur'}</h3>
              <button onClick={() => setShowExamModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveExam}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Sınav Başlığı</label>
                  <input 
                    type="text" 
                    value={editingExam.title || ''} 
                    onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })} 
                    placeholder="Örn: Birebir Sınav Simülasyonu 1" 
                    className="form-input" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <input 
                    type="text" 
                    value={editingExam.category || 'Genel Deneme'} 
                    onChange={(e) => setEditingExam({ ...editingExam, category: e.target.value })} 
                    className="form-input" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="is_active_exam" 
                    checked={editingExam.is_active !== false} 
                    onChange={(e) => setEditingExam({ ...editingExam, is_active: e.target.checked })} 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor="is_active_exam" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Sınav Aktif Olsun (Uygulamada Görünsün)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowExamModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Create/Edit Modal */}
      {showQuestionModal && editingQuestion && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{editingQuestion.id ? 'Soruyu Düzenle' : 'Yeni Soru Oluştur'}</h3>
              <button onClick={() => setShowQuestionModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveQuestion}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Form Column */}
                <div>
                  <div className="form-group">
                    <label className="form-label">Soru Metni</label>
                    <textarea 
                      value={editingQuestion.content || ''} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })} 
                      placeholder="Soru metnini yazın..." 
                      className="form-textarea" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Görsel URL (İsteğe Bağlı)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={editingQuestion.image_url || ''} 
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, image_url: e.target.value || null })} 
                        placeholder="https://site.com/image.png" 
                        className="form-input" 
                        style={{ flex: 1 }}
                      />
                      <label 
                        className="btn btn-secondary" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          padding: '0 1rem', 
                          fontSize: '0.85rem', 
                          cursor: uploadingImage ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {uploadingImage ? <Loader2 className="spinner" size={16} /> : 'Görsel Yükle'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={uploadingImage}
                          onChange={(e) => handleUploadImage(e, 'image_url')} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medya Tipi</label>
                    <select 
                      value={editingQuestion.media_type || 'none'} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, media_type: e.target.value })} 
                      className="form-select"
                    >
                      <option value="none">Yok (Sadece Metin)</option>
                      <option value="image">Görsel (Resim)</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Açıklama Görseli URL (İsteğe Bağlı)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={editingQuestion.explanation_image_url || ''} 
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation_image_url: e.target.value || null })} 
                        placeholder="https://site.com/explanation_image.png" 
                        className="form-input" 
                        style={{ flex: 1 }}
                      />
                      <label 
                        className="btn btn-secondary" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          padding: '0 1rem', 
                          fontSize: '0.85rem', 
                          cursor: uploadingExpImage ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {uploadingExpImage ? <Loader2 className="spinner" size={16} /> : 'Görsel Yükle'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={uploadingExpImage}
                          onChange={(e) => handleUploadImage(e, 'explanation_image_url')} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kategori</label>
                    <select 
                      value={editingQuestion.category || 'trafik'} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })} 
                      className="form-select"
                    >
                      <option value="trafik">Trafik ve Çevre</option>
                      <option value="ilkyardim">İlk Yardım</option>
                      <option value="motor">Araç Tekniği (Motor)</option>
                      <option value="adap">Trafik Adabı</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Zorluk Derecesi</label>
                    <select 
                      value={editingQuestion.difficulty || 'medium'} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })} 
                      className="form-select"
                    >
                      <option value="easy">Kolay</option>
                      <option value="medium">Orta</option>
                      <option value="hard">Zor</option>
                    </select>
                  </div>
                </div>

                {/* Right Form Column: Options & Explanation */}
                <div>
                  <div className="form-group">
                    <label className="form-label">Seçenekler</label>
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, width: '20px' }}>{letter}</span>
                        <input 
                          type="text" 
                          value={editingQuestion.options?.[idx] || ''} 
                          onChange={(e) => {
                            const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                            newOpts[idx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }} 
                          placeholder={`${letter} Şıkkı`} 
                          className="form-input" 
                          style={{ flex: 1 }}
                          required 
                        />
                        <input 
                          type="radio" 
                          name="correct_choice" 
                          checked={editingQuestion.correct_option === idx} 
                          onChange={() => setEditingQuestion({ ...editingQuestion, correct_option: idx })}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--color-success)' }}
                          title="Doğru Şık Yap"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Soru Açıklaması / Çözümü (İsteğe Bağlı)</label>
                    <textarea 
                      value={editingQuestion.explanation || ''} 
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value || null })} 
                      placeholder="Sorunun çözümünü veya kural açıklamasını yazın..." 
                      className="form-textarea" 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn btn-secondary">İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pool Link Selection Modal */}
      {showPoolLinkModal && selectedExam && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large" style={{ display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Soru Havuzundan Sınava Soru Ekle</h3>
              <button onClick={() => setShowPoolLinkModal(false)}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={linkSearch} 
                  onChange={(e) => setLinkSearch(e.target.value)} 
                  placeholder="Havuzda ara..." 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '2.5rem' }} 
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredLinkQuestions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Soru bulunamadı.</div>
              ) : (
                filteredLinkQuestions.map(q => (
                  <div key={q.id} style={{ display: 'flex', padding: '0.75rem', border: '1px solid var(--border-primary)', borderRadius: '8px', background: 'var(--bg-primary)', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', fontSize: '0.7rem' }}>
                        <span className="badge badge-cyan" style={{ padding: '0.1rem 0.4rem' }}>{q.category}</span>
                        <span className="badge badge-warning" style={{ padding: '0.1rem 0.4rem' }}>{q.difficulty}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{q.content}</p>
                    </div>
                    <button 
                      onClick={() => handleLinkQuestionToExam(q.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Sınava Ekle
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setShowPoolLinkModal(false)} className="btn btn-secondary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
