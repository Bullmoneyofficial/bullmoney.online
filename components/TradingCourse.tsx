'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Play, Check, Lock, Download, ChevronRight, BookOpen, Video, FileText, Award, Clock, TrendingUp, X, ArrowLeft } from 'lucide-react';

interface CourseLevel {
  id: string;
  level_name: string;
  display_name: string;
  description: string;
  icon_url: string | null;
  order_index: number;
}

interface Module {
  id: string;
  level_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  order_index: number;
  is_published: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: string;
  video_url: string | null;
  video_thumbnail: string | null;
  article_content: string | null;
  image_urls: string[] | null;
  duration_minutes: number | null;
  order_index: number;
  is_free: boolean;
  is_published: boolean;
}

interface Progress {
  lesson_id: string;
  completed: boolean;
  progress_percentage: number;
  time_spent_minutes: number;
  last_watched_position: number;
}

interface Resource {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  resource_type: string;
  file_url: string;
  file_size_kb: number | null;
}

interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  order_index: number;
}

type LocalLessonProgress = {
  completed?: boolean;
  completedAt?: string;
  timeSpentSeconds?: number;
  lastViewedAt?: string;
};

type LocalQuizAttempt = {
  selectedAnswer?: number;
  isCorrect?: boolean;
  attemptedAt?: string;
};

type LocalCourseStateV1 = {
  version: 1;
  startedAt?: string;
  startedLevelId?: string;
  lastViewedLessonId?: string;
  lessons: Record<string, LocalLessonProgress>;
  quizAttempts: Record<string, LocalQuizAttempt>;
};

const LOCAL_STATE_VERSION = 1 as const;
const LOCAL_STORAGE_PREFIX = 'bullmoney_trading_course_v1';

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function mergeLessonProgress(local: LocalLessonProgress | undefined, remote: Progress | undefined): LocalLessonProgress {
  const localTime = local?.timeSpentSeconds ?? 0;
  const remoteTimeSeconds = (remote?.time_spent_minutes ?? 0) * 60;
  const timeSpentSeconds = Math.max(localTime, remoteTimeSeconds);
  const completed = Boolean(local?.completed || remote?.completed);
  return {
    completed,
    completedAt: local?.completedAt,
    lastViewedAt: local?.lastViewedAt,
    timeSpentSeconds,
  };
}

export default function TradingCourse() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<Map<string, Progress>>(new Map());
  const [resourcesByLesson, setResourcesByLesson] = useState<Record<string, Resource[]>>({});
  const [quizzesByLesson, setQuizzesByLesson] = useState<Record<string, Quiz[]>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [localState, setLocalState] = useState<LocalCourseStateV1>({
    version: LOCAL_STATE_VERSION,
    lessons: {},
    quizAttempts: {},
  });
  
  const supabase = useMemo(() => createSupabaseClient(), []);

  const localStorageKey = useMemo(() => {
    const userKey = user?.id ? String(user.id) : 'anon';
    return `${LOCAL_STORAGE_PREFIX}:${userKey}`;
  }, [user?.id]);

  const activeLessonIdRef = useRef<string | null>(null);
  const activeLessonStartMsRef = useRef<number | null>(null);

  useEffect(() => {
    loadUser();
    loadLevels();
  }, []);

  useEffect(() => {
    const parsed = safeJsonParse<LocalCourseStateV1>(localStorage.getItem(localStorageKey));
    if (parsed && parsed.version === LOCAL_STATE_VERSION && parsed.lessons && parsed.quizAttempts) {
      setLocalState(parsed);
      return;
    }
    setLocalState({ version: LOCAL_STATE_VERSION, lessons: {}, quizAttempts: {} });
  }, [localStorageKey]);

  useEffect(() => {
    // Best-effort anon -> authed migration (only if authed state is empty)
    if (!user?.id) return;
    const anonKey = `${LOCAL_STORAGE_PREFIX}:anon`;
    const anon = safeJsonParse<LocalCourseStateV1>(localStorage.getItem(anonKey));
    if (!anon || anon.version !== LOCAL_STATE_VERSION) return;
    if ((Object.keys(localState.lessons).length ?? 0) > 0) return;

    const merged: LocalCourseStateV1 = {
      version: LOCAL_STATE_VERSION,
      startedAt: anon.startedAt,
      startedLevelId: anon.startedLevelId,
      lastViewedLessonId: anon.lastViewedLessonId,
      lessons: anon.lessons ?? {},
      quizAttempts: anon.quizAttempts ?? {},
    };
    setLocalState(merged);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(merged));
      localStorage.removeItem(anonKey);
    } catch {
      // ignore
    }
  }, [user?.id, localState.lessons, localStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(localState));
    } catch {
      // ignore
    }
  }, [localState, localStorageKey]);

  useEffect(() => {
    if (selectedLevel) {
      loadModules(selectedLevel);
      if (user) {
        loadUserProgress();
      }
    }
  }, [selectedLevel, user]);

  useEffect(() => {
    if (selectedModule) {
      loadLessons(selectedModule);
    }
  }, [selectedModule]);

  useEffect(() => {
    // Track time spent per lesson.
    const currentId = selectedLesson?.id ?? null;

    const finalizePrevious = () => {
      const prevLessonId = activeLessonIdRef.current;
      const startMs = activeLessonStartMsRef.current;
      if (!prevLessonId || !startMs) return;
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - startMs) / 1000));
      activeLessonIdRef.current = null;
      activeLessonStartMsRef.current = null;
      if (elapsedSeconds < 5) return;

      setLocalState(prev => {
        const existing = prev.lessons[prevLessonId] ?? {};
        const nextTime = (existing.timeSpentSeconds ?? 0) + elapsedSeconds;
        return {
          ...prev,
          lessons: {
            ...prev.lessons,
            [prevLessonId]: {
              ...existing,
              timeSpentSeconds: nextTime,
              lastViewedAt: nowIso(),
            },
          },
        };
      });

      // Best-effort sync (only if logged in)
      if (user?.id) {
        void (async () => {
          try {
            const merged = mergeLessonProgress(localState.lessons[prevLessonId], userProgress.get(prevLessonId));
            const timeMinutes = clampInt(Math.round((merged.timeSpentSeconds ?? 0) / 60), 0, 100000);
            await supabase
              .from('trading_course_progress')
              .upsert({
                user_id: user.id,
                lesson_id: prevLessonId,
                completed: Boolean(merged.completed),
                progress_percentage: merged.completed ? 100 : 0,
                time_spent_minutes: timeMinutes,
              });
          } catch {
            // ignore
          }
        })();
      }
    };

    finalizePrevious();

    if (currentId) {
      activeLessonIdRef.current = currentId;
      activeLessonStartMsRef.current = Date.now();
      setLocalState(prev => ({
        ...prev,
        lastViewedLessonId: currentId,
        lessons: {
          ...prev.lessons,
          [currentId]: {
            ...(prev.lessons[currentId] ?? {}),
            lastViewedAt: nowIso(),
          },
        },
      }));

      void loadResourcesForLesson(currentId);
      void loadQuizzesForLesson(currentId);
    }

    return () => {
      finalizePrevious();
    };
  }, [selectedLesson?.id]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_course_levels')
        .select('*')
        .order('order_index');
      
      if (error) {
        console.error('Error loading levels:', error);
        throw error;
      }
      
      console.log('Loaded levels:', data);
      setLevels(data || []);
    } catch (error) {
      console.error('Error loading levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('trading_course_modules')
        .select('*')
        .eq('level_id', levelId)
        .eq('is_published', true)
        .order('order_index');
      
      if (error) {
        console.error('Error loading modules:', error);
        throw error;
      }
      
      console.log('Loaded modules:', data);
      setModules(data || []);
      setLessonsByModule({});
      setSelectedLesson(null);
      if (data && data.length > 0) {
        setSelectedModule(data[0].id);
      } else {
        setSelectedModule(null);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadLessons = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from('trading_course_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('order_index');
      
      if (error) {
        console.error('Error loading lessons:', error);
        throw error;
      }
      
      console.log('Loaded lessons:', data);
      const nextLessons = data || [];
      setLessonsByModule(prev => ({ ...prev, [moduleId]: nextLessons }));
      // Auto-select first lesson for better guided flow
      if (nextLessons.length > 0 && (!selectedLesson || selectedLesson.module_id !== moduleId)) {
        setSelectedLesson(nextLessons[0]);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadResourcesForLesson = async (lessonId: string) => {
    if (resourcesByLesson[lessonId]) return;
    try {
      const { data, error } = await supabase
        .from('trading_course_resources')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setResourcesByLesson(prev => ({ ...prev, [lessonId]: (data as Resource[]) || [] }));
    } catch (error) {
      console.error('Error loading resources:', error);
      setResourcesByLesson(prev => ({ ...prev, [lessonId]: [] }));
    }
  };

  const loadQuizzesForLesson = async (lessonId: string) => {
    if (quizzesByLesson[lessonId]) return;
    try {
      const { data, error } = await supabase
        .from('trading_course_quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      if (error) throw error;
      setQuizzesByLesson(prev => ({ ...prev, [lessonId]: (data as Quiz[]) || [] }));
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setQuizzesByLesson(prev => ({ ...prev, [lessonId]: [] }));
    }
  };

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trading_course_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const progressMap = new Map<string, Progress>();
      data?.forEach(p => progressMap.set(p.lesson_id, p));
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const ensureCourseStarted = useCallback((levelId?: string) => {
    setLocalState(prev => {
      if (prev.startedAt) return prev;
      return {
        ...prev,
        startedAt: nowIso(),
        startedLevelId: levelId ?? prev.startedLevelId,
      };
    });
  }, []);

  const markLessonComplete = async (lessonId: string) => {
    setLocalState(prev => {
      const existing = prev.lessons[lessonId] ?? {};
      return {
        ...prev,
        lessons: {
          ...prev.lessons,
          [lessonId]: {
            ...existing,
            completed: true,
            completedAt: existing.completedAt ?? nowIso(),
          },
        },
      };
    });

    if (!user) return;

    try {
      const merged = mergeLessonProgress(localState.lessons[lessonId], userProgress.get(lessonId));
      const timeMinutes = clampInt(Math.round((merged.timeSpentSeconds ?? 0) / 60), 0, 100000);
      const { error } = await supabase
        .from('trading_course_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          progress_percentage: 100,
          time_spent_minutes: timeMinutes,
          completed_at: nowIso(),
        });
      if (error) throw error;
      loadUserProgress();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const getLessonProgress = (lessonId: string) => userProgress.get(lessonId);

  const getEffectiveLessonProgress = (lessonId: string) => {
    const local = localState.lessons[lessonId];
    const remote = userProgress.get(lessonId);
    return mergeLessonProgress(local, remote);
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = lessonsByModule[moduleId] || [];
    if (moduleLessons.length === 0) return 0;
    
    const completed = moduleLessons.filter(l => getEffectiveLessonProgress(l.id)?.completed).length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  const getTotalLevelProgress = () => {
    const allLessons = Object.values(lessonsByModule).flat();
    if (allLessons.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = allLessons.filter(l => getEffectiveLessonProgress(l.id)?.completed).length;
    return { completed, total: allLessons.length, percent: Math.round((completed / allLessons.length) * 100) };
  };

  const getTotalTimeSpentMinutes = () => {
    const seconds = Object.values(localState.lessons).reduce((acc, lp) => acc + (lp.timeSpentSeconds ?? 0), 0);
    return clampInt(Math.round(seconds / 60), 0, 100000);
  };

  const getNextLesson = () => {
    const moduleLessonList = selectedModule ? (lessonsByModule[selectedModule] || []) : [];
    if (moduleLessonList.length === 0) return null;
    const idx = moduleLessonList.findIndex(l => l.id === selectedLesson?.id);
    for (let i = Math.max(0, idx + 1); i < moduleLessonList.length; i++) {
      const candidate = moduleLessonList[i];
      if (!getEffectiveLessonProgress(candidate.id)?.completed) return candidate;
    }
    // If rest of module is done, pick first incomplete across all loaded lessons
    const allLessons = Object.values(lessonsByModule).flat();
    return allLessons.find(l => !getEffectiveLessonProgress(l.id)?.completed) ?? null;
  };

  const submitQuizAttempt = async (quiz: Quiz, selectedAnswer: number) => {
    const isCorrect = selectedAnswer === quiz.correct_answer;

    setLocalState(prev => ({
      ...prev,
      quizAttempts: {
        ...prev.quizAttempts,
        [quiz.id]: {
          selectedAnswer,
          isCorrect,
          attemptedAt: nowIso(),
        },
      },
    }));

    if (!user) return;

    try {
      await supabase
        .from('trading_course_quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
        });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-blue-400 text-sm" style={{ textShadow: '0 0 8px #3b82f6' }}>Loading course...</div>
      </div>
    );
  }

  // Show message if no levels exist
  if (levels.length === 0) {
    return (
      <div className="h-full flex flex-col bg-black text-white overflow-hidden">
        <div className="flex-shrink-0 border-b border-blue-500/20 bg-black/80 backdrop-blur-sm px-3 py-3">
          <h1 className="text-lg sm:text-xl font-bold text-blue-400 flex items-center gap-2" style={{ textShadow: '0 0 8px #3b82f6' }}>
            <TrendingUp className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
            <span>Trading Course</span>
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <BookOpen className="mx-auto w-16 h-16 text-blue-400/50 mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }} />
            <h3 className="text-xl font-bold text-blue-400 mb-2" style={{ textShadow: '0 0 8px #3b82f6' }}>Course Coming Soon</h3>
            <p className="text-gray-400 text-sm mb-4">The trading course content is being set up. Check back soon or contact admin to add course content.</p>
            <div className="text-xs text-gray-500 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="font-semibold text-blue-400 mb-1" style={{ textShadow: '0 0 4px #3b82f6' }}>For Admins:</p>
              <p>Go to AdminHub → Trading Course to create modules and lessons</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden">
      {/* Header - Compact for mobile */}
      <div className="flex-shrink-0 border-b border-blue-500/20 bg-black/80 backdrop-blur-sm px-3 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-blue-400 flex items-center gap-2" style={{ textShadow: '0 0 8px #3b82f6' }}>
            <TrendingUp className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
            <span className="hidden sm:inline">Elite Trading Academy</span>
            <span className="sm:hidden">Trading Course</span>
          </h1>
          {selectedLevel && (
            <button
              onClick={() => {
                setSelectedLevel(null);
                setSelectedModule(null);
                setSelectedLesson(null);
              }}
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm flex items-center gap-1 transition-colors"
              style={{ textShadow: '0 0 4px #3b82f6' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>
      </div>

      {/* Level Selection */}
      {!selectedLevel ? (
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-400 mb-2" style={{ textShadow: '0 0 8px #3b82f6' }}>Choose Your Journey</h2>
            <p className="text-gray-400 text-xs sm:text-sm">Select your trading level</p>
          </div>
          
          {levels.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900/80 to-black border-2 border-blue-500/30 rounded-xl p-8 text-center">
                <BookOpen className="w-16 h-16 text-blue-400/50 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }} />
                <h3 className="text-xl font-bold text-white mb-2">No Course Levels Found</h3>
                <p className="text-gray-400 mb-4">
                  The trading course hasn&apos;t been set up yet. Please run the database schema to initialize the course structure.
                </p>
                <div className="bg-black/50 border border-blue-500/20 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-300 mb-2 font-semibold">To set up the course:</p>
                  <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to the SQL Editor</li>
                    <li>Run the TRADING_COURSE_SCHEMA.sql file</li>
                    <li>Use the Admin Panel to add modules and lessons</li>
                  </ol>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Check the browser console (F12) for any connection errors.
                </p>
              </div>
            </div>
          ) : (
          <div className="grid gap-3 sm:gap-4 max-w-3xl mx-auto">
            {levels.map((level, index) => (
              <div
                key={level.id}
                onClick={() => {
                  ensureCourseStarted(level.id);
                  setLocalState(prev => ({ ...prev, startedLevelId: level.id }));
                  setSelectedLevel(level.id);
                }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gradient-to-br from-gray-900/80 to-black border-2 border-blue-500/30 hover:border-blue-400 rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]" 
                     style={{ boxShadow: '0 0 10px rgba(59,130,246,0.1)' }}
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.3)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(59,130,246,0.1)'}>
                  {/* Level Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
                       style={{ boxShadow: '0 0 15px #3b82f6' }}>
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-gradient-to-br from-blue-500/20 to-blue-400/20 rounded-full flex items-center justify-center"
                         style={{ boxShadow: '0 0 15px rgba(59,130,246,0.2)' }}>
                      <BookOpen className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-1 truncate" style={{ textShadow: '0 0 8px #3b82f6' }}>{level.display_name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{level.description}</p>
                      
                      <div className="mt-2 inline-flex items-center gap-1 sm:gap-2 text-blue-400 text-xs sm:text-sm font-semibold group-hover:gap-2 sm:group-hover:gap-3 transition-all"
                           style={{ textShadow: '0 0 4px #3b82f6' }}>
                        Start Learning
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Back Button - Mobile optimized */}
          <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-blue-500/20 px-3 py-2 sm:hidden z-10">
            <button
              onClick={() => {
                setSelectedLevel(null);
                setSelectedModule(null);
                setSelectedLesson(null);
              }}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm transition-colors" style={{ textShadow: '0 0 4px #3b82f6' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Levels
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-3 sm:gap-4 p-3 sm:p-4">
            {/* Sidebar - Modules & Lessons - Collapsible on mobile */}
            <div className="lg:col-span-4">
              <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-lg p-3 sm:p-4 lg:sticky lg:top-4 max-h-[400px] lg:max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="text-sm sm:text-base font-bold text-blue-400 mb-3 flex items-center gap-2 sticky top-0 bg-gradient-to-br from-gray-900/95 to-black/95 pb-2 -mt-3 -mx-3 px-3 pt-3 backdrop-blur-sm"
                    style={{ textShadow: '0 0 8px #3b82f6' }}>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                  Course Modules
                </h3>

                {/* Progress Summary */}
                <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2">
                  {(() => {
                    const p = getTotalLevelProgress();
                    const minutes = getTotalTimeSpentMinutes();
                    return (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] sm:text-xs text-gray-300">
                          <span className="text-blue-400 font-semibold" style={{ textShadow: '0 0 4px #3b82f6' }}>{p.percent}%</span> complete
                          <span className="text-gray-500"> · </span>
                          <span className="text-gray-400">{p.completed}/{p.total} lessons</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {minutes}m
                        </div>
                      </div>
                    );
                  })()}
                  {!user && (
                    <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500">Progress saves locally. Log in to sync across devices.</div>
                  )}
                </div>
                
                {modules.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-blue-400/30 mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.2))' }} />
                    <p className="text-sm text-gray-400 mb-2">No modules available</p>
                    <p className="text-xs text-gray-500">This level hasn&apos;t been set up yet. Use the Admin Panel to add modules.</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div key={module.id}>
                      <button
                        onClick={() => setSelectedModule(module.id)}
                        className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-all ${
                          selectedModule === module.id
                            ? 'border-blue-400 bg-blue-500/10'
                            : 'border-blue-500/20 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 pr-2">{module.title}</h4>
                          <div className="text-[10px] sm:text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded flex-shrink-0" style={{ textShadow: '0 0 4px #3b82f6' }}>
                            {getModuleProgress(module.id)}%
                          </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{module.description}</p>
                      </button>
                      
                      {/* Lessons for this module */}
                      {selectedModule === module.id && (
                        <div className="ml-2 sm:ml-3 mt-1 space-y-1">
                          {(lessonsByModule[module.id] || []).map((lesson, idx) => {
                            const progress = getEffectiveLessonProgress(lesson.id);
                            const isCompleted = progress?.completed;
                            
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  ensureCourseStarted(selectedLevel ?? undefined);
                                  setSelectedLesson(lesson);
                                }}
                                className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 ${
                                  selectedLesson?.id === lesson.id
                                    ? 'border-blue-400 bg-blue-500/5'
                                    : 'border-blue-500/10 hover:border-blue-500/30'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-blue-500' : 'bg-blue-500/20'
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-3 h-3 text-white" />
                                  ) : lesson.is_free ? (
                                    <Play className="w-3 h-3 text-blue-400" />
                                  ) : (
                                    <Lock className="w-3 h-3 text-blue-400" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] sm:text-xs font-medium text-white truncate">
                                    {idx + 1}. {lesson.title}
                                  </div>
                                  {lesson.duration_minutes && (
                                    <div className="text-[9px] sm:text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      {lesson.duration_minutes} min
                                    </div>
                                  )}
                                </div>
                                
                                {lesson.content_type === 'video' && (
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400/60 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Main Content - Lesson Display */}
            <div className="lg:col-span-8">
              {selectedLesson ? (
                <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-lg overflow-hidden">
                  {/* Lesson Header - Compact */}
                  <div className="border-b border-blue-500/20 p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-white mb-1 line-clamp-2">{selectedLesson.title}</h2>
                        <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">{selectedLesson.description}</p>
                      </div>
                      {getEffectiveLessonProgress(selectedLesson.id)?.completed && (
                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full flex-shrink-0" style={{ textShadow: '0 0 4px #3b82f6' }}>
                          <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">Done</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedLesson.duration_minutes && (
                      <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                          {selectedLesson.duration_minutes} min
                        </div>
                        <div className="flex items-center gap-1">
                          {selectedLesson.content_type === 'video' ? (
                            <>
                              <Video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                              Video
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                              Article
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lesson Content - Scrollable with proper mobile handling */}
                  <div className="p-3 sm:p-4 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Video Content */}
                    {selectedLesson.content_type === 'video' && selectedLesson.video_url && (
                      <div className="mb-3 sm:mb-4">
                        <div className="relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden border border-blue-500/30">
                          <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={selectedLesson.video_url}
                            title={selectedLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Article Content */}
                    {selectedLesson.article_content && (
                      <div className="prose prose-invert prose-sm sm:prose-base max-w-none mb-3 sm:mb-4">
                        <div 
                          className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: selectedLesson.article_content }}
                        />
                      </div>
                    )}

                    {/* Image Gallery - Responsive grid */}
                    {selectedLesson.image_urls && selectedLesson.image_urls.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        {selectedLesson.image_urls.map((url, index) => (
                          <div key={index} className="border border-blue-500/30 rounded-lg overflow-hidden">
                            <img
                              src={url}
                              alt={`Lesson image ${index + 1}`}
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {(resourcesByLesson[selectedLesson.id] || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-500/20">
                        <h4 className="text-sm sm:text-base font-bold text-blue-400 mb-2" style={{ textShadow: '0 0 6px #3b82f6' }}>Downloads & Resources</h4>
                        <div className="space-y-2">
                          {(resourcesByLesson[selectedLesson.id] || []).map((r) => (
                            <a
                              key={r.id}
                              href={r.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">{r.title}</div>
                                  {r.description && <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>}
                                  <div className="text-[10px] text-gray-500 mt-1">{r.resource_type}{r.file_size_kb ? ` · ${r.file_size_kb} KB` : ''}</div>
                                </div>
                                <div className="flex-shrink-0 text-blue-400">
                                  <Download className="w-4 h-4" />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quizzes */}
                    {(quizzesByLesson[selectedLesson.id] || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-500/20">
                        <h4 className="text-sm sm:text-base font-bold text-blue-400 mb-2" style={{ textShadow: '0 0 6px #3b82f6' }}>Quick Check</h4>
                        <div className="space-y-3">
                          {(quizzesByLesson[selectedLesson.id] || []).map((q) => {
                            const attempt = localState.quizAttempts[q.id] || {};
                            const submitted = typeof attempt.isCorrect === 'boolean' && typeof attempt.selectedAnswer === 'number';
                            return (
                              <div key={q.id} className="rounded-lg border border-blue-500/20 bg-black/40 p-3">
                                <div className="text-sm font-semibold text-white mb-2">{q.question}</div>
                                <div className="space-y-1">
                                  {q.options.map((opt, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => submitQuizAttempt(q, idx)}
                                      className={`w-full text-left text-xs sm:text-sm rounded-lg border px-3 py-2 transition-colors ${
                                        submitted
                                          ? (idx === q.correct_answer
                                              ? 'border-blue-400/60 bg-blue-500/10 text-white'
                                              : idx === attempt.selectedAnswer
                                                ? 'border-blue-500/30 bg-blue-500/5 text-gray-200'
                                                : 'border-blue-500/10 bg-transparent text-gray-400')
                                          : 'border-blue-500/10 hover:border-blue-500/30 bg-transparent text-gray-200'
                                      }`}
                                      disabled={submitted}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>

                                {submitted && (
                                  <div className="mt-2 text-xs">
                                    <div className={`font-semibold ${attempt.isCorrect ? 'text-blue-400' : 'text-gray-300'}`} style={{ textShadow: '0 0 4px rgba(59,130,246,0.4)' }}>
                                      {attempt.isCorrect ? 'Correct' : 'Not quite'}
                                    </div>
                                    {q.explanation && <div className="text-gray-400 mt-1">{q.explanation}</div>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Next lesson guidance */}
                    {(() => {
                      const next = getNextLesson();
                      if (!next || next.id === selectedLesson.id) return null;
                      if (getEffectiveLessonProgress(selectedLesson.id)?.completed !== true) return null;
                      return (
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                          <button
                            onClick={() => setSelectedLesson(next)}
                            className="w-full bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                            style={{ boxShadow: '0 0 18px rgba(59,130,246,0.25)' }}
                          >
                            <ChevronRight className="w-4 h-4" />
                            Continue: {next.title}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Complete Lesson Button - Always accessible with proper spacing */}
                    {!getEffectiveLessonProgress(selectedLesson.id)?.completed && (
                      <div className="mt-4 pt-4 border-t border-blue-500/20">
                        <button
                          onClick={() => markLessonComplete(selectedLesson.id)}
                          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                          style={{ boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 30px rgba(59,130,246,0.6)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.4)'}>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          Mark as Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-lg p-8 sm:p-12 text-center">
                  <BookOpen className="mx-auto text-blue-400/50 mb-3 w-12 h-12 sm:w-16 sm:h-16" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }} />
                  <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-2" style={{ textShadow: '0 0 8px #3b82f6' }}>Select a Lesson</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Choose a lesson from the sidebar to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
