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

// Helper to extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const COURSE_CAROUSEL_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=60',
    alt: 'Trading charts on a screen',
  },
  {
    src: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1400&q=60',
    alt: 'Candlestick chart close-up',
  },
  {
    src: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=60',
    alt: 'Financial analysis workspace',
  },
  {
    src: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1400&q=60',
    alt: 'Crypto market data visuals',
  },
  {
    src: 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?auto=format&fit=crop&w=1400&q=60',
    alt: 'Stocks and finance concept',
  },
] as const;

export default function TradingCourse({ appearance = 'hub' }: { appearance?: 'hub' | 'drawer' }) {
  const isDrawer = appearance === 'drawer';
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonStarted, setLessonStarted] = useState(false);
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

  // Reset lesson started when changing lessons
  useEffect(() => {
    setLessonStarted(false);
  }, [selectedLesson?.id]);

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
    if (isDrawer) {
      return (
        <div className="flex items-center justify-center py-12 bg-white">
          <div className="text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>Loading course…</div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-sm" style={{ textShadow: '0 0 8px #ffffff' }}>Loading course...</div>
      </div>
    );
  }

  // Show message if no levels exist
  if (levels.length === 0) {
    if (isDrawer) {
      return (
        <div className="w-full">
          <div className="rounded-2xl border border-black/10 bg-white p-6 md:p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center">
              <BookOpen className="w-6 h-6" style={{ color: 'rgba(0,0,0,0.35)' }} />
            </div>
            <h3 className="text-lg md:text-xl font-light text-black">Course coming soon</h3>
            <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
              The trading course content hasn’t been published yet.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col bg-black text-white overflow-hidden">
        <div className="flex-shrink-0 border-b border-white/20 bg-black/80 backdrop-blur-sm px-3 py-3">
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2" style={{ textShadow: '0 0 8px #ffffff' }}>
            <TrendingUp className="text-white w-5 h-5 sm:w-6 sm:h-6" style={{ filter: 'drop-shadow(0 0 8px #ffffff)' }} />
            <span>Trading Course</span>
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <BookOpen className="mx-auto w-16 h-16 text-white/50 mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255,0.3))' }} />
            <h3 className="text-xl font-bold text-white mb-2" style={{ textShadow: '0 0 8px #ffffff' }}>Course Coming Soon</h3>
            <p className="text-gray-400 text-sm mb-4">The trading course content is being set up. Check back soon or contact admin to add course content.</p>
            <div className="text-xs text-gray-500 bg-white/5 border border-white/20 rounded-lg p-3">
              <p className="font-semibold text-white mb-1" style={{ textShadow: '0 0 4px #ffffff' }}>For Admins:</p>
              <p>Go to AdminHub → Trading Course to create modules and lessons</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // DRAWER APPEARANCE (StoreHeader CourseDrawer)
  // Matches ProductsModal / CartDrawer typography, sizing, rounded corners.
  // ========================================================================
  if (isDrawer) {
    return (
      <div className="w-full bg-white">
        {!selectedLevel ? (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-light text-black">Choose your journey</h2>
              <p className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>Select your trading level to begin.</p>
            </div>

            {/* Image carousel (Unsplash) */}
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <div
                className="flex gap-3 overflow-x-auto overscroll-contain touch-pan-x p-3 scrollbar-none snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {COURSE_CAROUSEL_IMAGES.map((img) => (
                  <div key={img.src} className="relative h-36 md:h-40 w-[78%] md:w-[70%] shrink-0 rounded-2xl overflow-hidden bg-black/5 snap-start border border-black/10">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {levels.map((level, index) => (
                <button
                  key={level.id}
                  onClick={() => {
                    ensureCourseStarted(level.id);
                    setLocalState(prev => ({ ...prev, startedLevelId: level.id }));
                    setSelectedLevel(level.id);
                    setSelectedModule(null);
                    setSelectedLesson(null);
                  }}
                  className="w-full text-left rounded-2xl border border-black/10 bg-white p-4 md:p-5 hover:bg-black/5 active:scale-[0.99] transition-all"
                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base md:text-lg font-medium text-black truncate">{level.display_name}</div>
                      <div className="mt-1 text-sm line-clamp-2" style={{ color: 'rgba(0,0,0,0.55)' }}>{level.description}</div>
                    </div>
                    <div className="shrink-0 text-xs px-2 py-1 rounded-xl bg-black/5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                      Level {index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image carousel (Unsplash) */}
            <div className="rounded-2xl border border-black/10 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <div
                className="flex gap-3 overflow-x-auto overscroll-contain touch-pan-x p-3 scrollbar-none snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {COURSE_CAROUSEL_IMAGES.map((img) => (
                  <div key={img.src} className="relative h-32 md:h-36 w-[78%] md:w-[70%] shrink-0 rounded-2xl overflow-hidden bg-black/5 snap-start border border-black/10">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedLevel(null);
                  setSelectedModule(null);
                  setSelectedLesson(null);
                }}
                className="h-10 px-4 rounded-xl bg-black/5 hover:bg-black/10 active:scale-95 transition-all text-sm font-medium flex items-center gap-2"
                style={{ color: '#1d1d1f' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to levels
              </button>

              {(() => {
                const p = getTotalLevelProgress();
                const minutes = getTotalTimeSpentMinutes();
                return (
                  <div className="text-xs md:text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                    <span className="font-medium text-black">{p.percent}%</span> complete · {p.completed}/{p.total} lessons · {minutes}m
                  </div>
                );
              })()}
            </div>

            <div className="grid md:grid-cols-12 gap-4 md:gap-6">
              {/* Modules */}
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-black/10 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                  <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
                    <div className="text-sm font-medium text-black flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Modules
                    </div>
                    {!user && (
                      <div className="text-xs" style={{ color: 'rgba(0,0,0,0.45)' }}>Local progress (login to sync)</div>
                    )}
                  </div>

                  <div className="p-2">
                    {modules.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center">
                          <BookOpen className="w-6 h-6" style={{ color: 'rgba(0,0,0,0.35)' }} />
                        </div>
                        <div className="text-sm font-medium text-black">No modules available</div>
                        <div className="mt-1 text-xs" style={{ color: 'rgba(0,0,0,0.55)' }}>This level hasn’t been set up yet.</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {modules.map((module) => (
                          <div key={module.id} className="rounded-2xl border border-black/10 overflow-hidden">
                            <button
                              onClick={() => setSelectedModule(module.id)}
                              className="w-full text-left px-3 py-3 hover:bg-black/5 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-black line-clamp-1">{module.title}</div>
                                  <div className="mt-0.5 text-xs line-clamp-1" style={{ color: 'rgba(0,0,0,0.55)' }}>{module.description}</div>
                                </div>
                                <div className="shrink-0 text-xs px-2 py-1 rounded-xl bg-black/5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                                  {getModuleProgress(module.id)}%
                                </div>
                              </div>
                            </button>

                            {selectedModule === module.id && (
                              <div className="border-t border-black/10 p-2 bg-white">
                                <div className="space-y-1">
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
                                        className={
                                          'w-full text-left rounded-xl border px-3 py-2 transition-colors flex items-center gap-2 ' +
                                          (selectedLesson?.id === lesson.id
                                            ? 'border-black/20 bg-black/5'
                                            : 'border-black/10 hover:bg-black/5')
                                        }
                                      >
                                        <div className="h-8 w-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                                          {isCompleted ? (
                                            <Check className="w-4 h-4" />
                                          ) : lesson.is_free ? (
                                            <Play className="w-4 h-4" />
                                          ) : (
                                            <Lock className="w-4 h-4" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-sm font-medium text-black truncate">{idx + 1}. {lesson.title}</div>
                                          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'rgba(0,0,0,0.55)' }}>
                                            {lesson.duration_minutes ? (
                                              <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {lesson.duration_minutes}m
                                              </span>
                                            ) : null}
                                            <span className="inline-flex items-center gap-1">
                                              {lesson.content_type === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                              {lesson.content_type === 'video' ? 'Video' : 'Article'}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lesson */}
              <div className="md:col-span-7">
                {!selectedLesson ? (
                  <div className="rounded-2xl border border-black/10 bg-white p-8 text-center" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                    <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center">
                      <Play className="w-6 h-6" style={{ color: 'rgba(0,0,0,0.35)' }} />
                    </div>
                    <div className="text-base font-medium text-black">Select a lesson</div>
                    <div className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>Pick a module and choose a lesson to start.</div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-black/10 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
                    <div className="p-4 border-b border-black/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base md:text-lg font-medium text-black line-clamp-2">{selectedLesson.title}</div>
                          <div className="mt-1 text-sm line-clamp-2" style={{ color: 'rgba(0,0,0,0.55)' }}>{selectedLesson.description}</div>
                          <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'rgba(0,0,0,0.55)' }}>
                            {selectedLesson.duration_minutes ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedLesson.duration_minutes}m
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              {selectedLesson.content_type === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              {selectedLesson.content_type === 'video' ? 'Video' : 'Article'}
                            </span>
                            {!selectedLesson.is_free ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
                                <Lock className="w-3 h-3" />
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5">
                                Free
                              </span>
                            )}
                          </div>
                        </div>

                        {getEffectiveLessonProgress(selectedLesson.id)?.completed && (
                          <div className="shrink-0 text-xs px-2 py-1 rounded-xl bg-black/5 text-black inline-flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Done
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {!lessonStarted ? (
                        <div className="py-8 text-center">
                          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-black/5 flex items-center justify-center">
                            {selectedLesson.content_type === 'video' ? (
                              <Video className="w-7 h-7" style={{ color: 'rgba(0,0,0,0.45)' }} />
                            ) : (
                              <FileText className="w-7 h-7" style={{ color: 'rgba(0,0,0,0.45)' }} />
                            )}
                          </div>
                          <div className="text-base font-medium text-black">Ready to learn?</div>
                          <div className="mt-1 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
                            {selectedLesson.content_type === 'video'
                              ? 'Watch this lesson and expand your trading knowledge.'
                              : 'Read through this lesson to master the concepts.'}
                          </div>
                          <button
                            onClick={() => setLessonStarted(true)}
                            className="mt-5 px-6 py-3 rounded-xl text-sm font-medium active:scale-95 transition-all inline-flex items-center gap-2"
                            style={{ background: '#111111', color: '#ffffff' }}
                          >
                            <Play className="w-4 h-4" />
                            Start Lesson
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Video */}
                          {selectedLesson.content_type === 'video' && selectedLesson.video_url && (() => {
                            const youtubeId = extractYouTubeId(selectedLesson.video_url);
                            const embedUrl = youtubeId
                              ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&showinfo=0`
                              : selectedLesson.video_url;
                            return (
                              <div className="rounded-2xl overflow-hidden border border-black/10 bg-black/5">
                                <div className="relative w-full pt-[56.25%]">
                                  <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={embedUrl}
                                    title={selectedLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    style={{ border: 'none' }}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {/* Article */}
                          {selectedLesson.content_type !== 'video' && selectedLesson.article_content && (
                            <div
                              className="rounded-2xl border border-black/10 bg-white p-4 prose prose-sm max-w-none"
                              style={{ color: '#1d1d1f' }}
                              dangerouslySetInnerHTML={{ __html: selectedLesson.article_content }}
                            />
                          )}

                          {/* Resources */}
                          {(selectedLesson && (resourcesByLesson[selectedLesson.id] || []).length > 0) && (
                            <div className="rounded-2xl border border-black/10 bg-white p-4">
                              <div className="text-sm font-medium text-black mb-2">Downloads</div>
                              <div className="space-y-2">
                                {(resourcesByLesson[selectedLesson.id] || []).map((r) => (
                                  <a
                                    key={r.id}
                                    href={r.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-xl border border-black/10 bg-white hover:bg-black/5 transition-colors p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium text-black truncate">{r.title}</div>
                                        {r.description ? (
                                          <div className="mt-0.5 text-xs" style={{ color: 'rgba(0,0,0,0.55)' }}>{r.description}</div>
                                        ) : null}
                                      </div>
                                      <div className="shrink-0 text-xs px-2 py-1 rounded-xl bg-black/5" style={{ color: 'rgba(0,0,0,0.55)' }}>
                                        <Download className="w-3 h-3 inline-block mr-1" />
                                        {r.resource_type?.toUpperCase?.() || 'FILE'}
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quizzes */}
                          {(selectedLesson && (quizzesByLesson[selectedLesson.id] || []).length > 0) && (
                            <div className="rounded-2xl border border-black/10 bg-white p-4">
                              <div className="text-sm font-medium text-black mb-2">Quiz</div>
                              <div className="space-y-3">
                                {(quizzesByLesson[selectedLesson.id] || []).map((q) => {
                                  const attempt = localState.quizAttempts[q.id];
                                  return (
                                    <div key={q.id} className="rounded-xl border border-black/10 bg-white p-3">
                                      <div className="text-sm font-medium text-black">{q.question}</div>
                                      <div className="mt-2 grid gap-2">
                                        {q.options.map((opt, idx) => {
                                          const selected = attempt?.selectedAnswer === idx;
                                          return (
                                            <button
                                              key={idx}
                                              onClick={() => void saveQuizAttempt(q, idx)}
                                              className={
                                                'text-left px-3 py-2 rounded-xl border transition-colors ' +
                                                (selected ? 'border-black/20 bg-black/5' : 'border-black/10 hover:bg-black/5')
                                              }
                                            >
                                              <div className="text-sm" style={{ color: '#1d1d1f' }}>{opt}</div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {typeof attempt?.isCorrect === 'boolean' && (
                                        <div className="mt-2 text-xs" style={{ color: attempt.isCorrect ? 'rgba(0,0,0,0.70)' : 'rgba(0,0,0,0.55)' }}>
                                          {attempt.isCorrect ? 'Correct ✅' : 'Not quite — try again.'}
                                        </div>
                                      )}
                                      {q.explanation && attempt?.isCorrect && (
                                        <div className="mt-2 text-xs" style={{ color: 'rgba(0,0,0,0.55)' }}>{q.explanation}</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden">
      {/* Header - Ultra-Compact for mobile like UltimateHub */}
      <div className="flex-shrink-0 border-b border-white/20 bg-black/80 backdrop-blur-sm px-2 py-2 sm:px-3 sm:py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2" style={{ textShadow: '0 0 8px #ffffff' }}>
            <TrendingUp className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ filter: 'drop-shadow(0 0 8px #ffffff)' }} />
            <span className="hidden md:inline">Elite Trading Academy</span>
            <span className="md:hidden">Course</span>
          </h1>
          {selectedLevel && (
            <button
              onClick={() => {
                setSelectedLevel(null);
                setSelectedModule(null);
                setSelectedLesson(null);
              }}
              className="text-white hover:text-white text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 transition-colors px-1.5 py-1 sm:px-2 sm:py-1"
              style={{ textShadow: '0 0 4px #ffffff' }}
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>
      </div>

      {/* Level Selection */}
      {!selectedLevel ? (
        <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-4">
          <div className="text-center mb-2 sm:mb-4">
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 8px #ffffff' }}>Choose Your Journey</h2>
            <p className="text-gray-400 text-[10px] sm:text-xs">Select your trading level</p>
          </div>
          
          {levels.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-linear-to-br from-gray-900/80 to-black border-2 border-white/30 rounded-xl p-8 text-center">
                <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255,0.3))' }} />
                <h3 className="text-xl font-bold text-white mb-2">No Course Levels Found</h3>
                <p className="text-gray-400 mb-4">
                  The trading course hasn't been set up yet. Please run the database schema to initialize the course structure.
                </p>
                <div className="bg-black/50 border border-white/20 rounded-lg p-4 text-left">
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
          <div className="grid gap-2 sm:gap-3 max-w-3xl mx-auto">
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
                <div className="relative bg-linear-to-br from-gray-900/80 to-black border border-white/30 hover:border-white rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02]" 
                     style={{ boxShadow: '0 0 8px rgba(255, 255, 255,0.1)' }}
                     onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255,0.3)'}
                     onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255,0.1)'}>
                  {/* Level Number Badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center text-black font-bold text-xs sm:text-sm md:text-base"
                       style={{ boxShadow: '0 0 12px #ffffff' }}>
                    {index + 1}
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 bg-linear-to-br from-white/20 to-white/20 rounded-full flex items-center justify-center"
                         style={{ boxShadow: '0 0 12px rgba(255, 255, 255,0.2)' }}>
                      <BookOpen className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1 truncate" style={{ textShadow: '0 0 8px #ffffff' }}>{level.display_name}</h3>
                      <p className="text-gray-400 text-[10px] sm:text-xs line-clamp-2">{level.description}</p>
                      
                      <div className="mt-1 sm:mt-2 inline-flex items-center gap-0.5 sm:gap-1 text-white text-[10px] sm:text-xs font-semibold group-hover:gap-1 sm:group-hover:gap-2 transition-all"
                           style={{ textShadow: '0 0 4px #ffffff' }}>
                        Start Learning
                        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
          {/* Back Button - Mobile optimized - Ultra compact */}
          <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-white/20 px-2 py-1.5 sm:hidden z-10">
            <button
              onClick={() => {
                setSelectedLevel(null);
                setSelectedModule(null);
                setSelectedLesson(null);
              }}
              className="text-white hover:text-white flex items-center gap-1 text-xs transition-colors px-1 py-0.5" style={{ textShadow: '0 0 4px #ffffff' }}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Levels
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4">
            {/* Sidebar - Modules & Lessons - Compact on mobile */}
            <div className="lg:col-span-4">
              <div className="bg-linear-to-br from-gray-900/80 to-black border border-white/30 rounded-lg p-2 sm:p-3 lg:sticky lg:top-4 max-h-[300px] sm:max-h-[400px] lg:max-h-[calc(100vh-120px)] overflow-y-auto">
                <h3 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5 sticky top-0 bg-linear-to-br from-gray-900/95 to-black/95 pb-1.5 -mt-2 -mx-2 px-2 pt-2 backdrop-blur-sm"
                    style={{ textShadow: '0 0 8px #ffffff' }}>
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }} />
                  <span className="hidden sm:inline">Course Modules</span>
                  <span className="sm:hidden">Modules</span>
                </h3>

                {/* Progress Summary */}
                <div className="mb-2 rounded-lg border border-white/20 bg-white/5 p-1.5 sm:p-2">
                  {(() => {
                    const p = getTotalLevelProgress();
                    const minutes = getTotalTimeSpentMinutes();
                    return (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] sm:text-xs text-gray-300">
                          <span className="text-white font-semibold" style={{ textShadow: '0 0 4px #ffffff' }}>{p.percent}%</span> complete
                          <span className="text-gray-500"> · </span>
                          <span className="text-gray-400">{p.completed}/{p.total} lessons</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white" />
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
                    <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-3" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255,0.2))' }} />
                    <p className="text-sm text-gray-400 mb-2">No modules available</p>
                    <p className="text-xs text-gray-500">This level hasn't been set up yet. Use the Admin Panel to add modules.</p>
                  </div>
                ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {modules.map((module) => (
                    <div key={module.id}>
                      <button
                        onClick={() => setSelectedModule(module.id)}
                        className={`w-full text-left p-1.5 sm:p-2 md:p-3 rounded-lg border transition-all ${
                          selectedModule === module.id
                            ? 'border-white bg-white/10'
                            : 'border-white/20 hover:border-white/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-0.5 sm:mb-1">
                          <h4 className="font-semibold text-white text-[10px] sm:text-xs line-clamp-2 pr-1.5">{module.title}</h4>
                          <div className="text-[9px] sm:text-[10px] text-white bg-white/20 px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0" style={{ textShadow: '0 0 4px #ffffff' }}>
                            {getModuleProgress(module.id)}%
                          </div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-400 line-clamp-1">{module.description}</p>
                      </button>
                      
                      {/* Lessons for this module */}
                      {selectedModule === module.id && (
                        <div className="ml-1.5 sm:ml-2 mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
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
                                className={`w-full text-left p-1.5 sm:p-2 rounded-md sm:rounded-lg border transition-all flex items-center gap-1.5 sm:gap-2 ${
                                  selectedLesson?.id === lesson.id
                                    ? 'border-white bg-white/5'
                                    : 'border-white/10 hover:border-white/30'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-white' : 'bg-white/20'
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                  ) : lesson.is_free ? (
                                    <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                  ) : (
                                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] sm:text-[10px] font-medium text-white truncate">
                                    {idx + 1}. {lesson.title}
                                  </div>
                                  {lesson.duration_minutes && (
                                    <div className="text-[8px] sm:text-[9px] text-gray-400 flex items-center gap-0.5 sm:gap-1 mt-0.5">
                                      <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                      {lesson.duration_minutes}m
                                    </div>
                                  )}
                                </div>
                                
                                {lesson.content_type === 'video' && (
                                  <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/60 flex-shrink-0" />
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
                <div className="bg-linear-to-br from-gray-900/80 to-black border border-white/30 rounded-lg overflow-hidden">
                  {/* Lesson Header - Ultra Compact for Mobile */}
                  <div className="border-b border-white/20 p-2 sm:p-3 md:p-4">
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-white mb-0.5 sm:mb-1 line-clamp-2">{selectedLesson.title}</h2>
                        <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">{selectedLesson.description}</p>
                      </div>
                      {getEffectiveLessonProgress(selectedLesson.id)?.completed && (
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-white/20 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0" style={{ textShadow: '0 0 4px #ffffff' }}>
                          <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-[9px] sm:text-[10px] font-semibold hidden sm:inline">Done</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedLesson.duration_minutes && (
                      <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-gray-400">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          {selectedLesson.duration_minutes}m
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {selectedLesson.content_type === 'video' ? (
                            <>
                              <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              <span className="hidden sm:inline">Video</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              <span className="hidden sm:inline">Article</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lesson Content - Inline layout with start button */}
                  <div className="p-2 sm:p-3 md:p-4 max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-260px)] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
                    {!lessonStarted ? (
                      /* Start Lesson Screen */
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                        <div className="mb-4 sm:mb-6">
                          {selectedLesson.content_type === 'video' ? (
                            <div className="relative">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/20 to-white/20 rounded-full flex items-center justify-center"
                                   style={{ boxShadow: '0 0 30px rgba(255, 255, 255,0.4)' }}>
                                <Video className="w-8 h-8 sm:w-10 sm:h-10 text-white" style={{ filter: 'drop-shadow(0 0 8px #ffffff)' }} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-white/20 to-white/20 rounded-full flex items-center justify-center"
                                 style={{ boxShadow: '0 0 30px rgba(255, 255, 255,0.4)' }}>
                              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" style={{ filter: 'drop-shadow(0 0 8px #ffffff)' }} />
                            </div>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2">Ready to Learn?</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 mb-6 max-w-sm">
                          {selectedLesson.content_type === 'video' 
                            ? 'Watch this video lesson and expand your trading knowledge'
                            : 'Read through this lesson to master the concepts'}
                        </p>
                        <button
                          onClick={() => setLessonStarted(true)}
                          className="bg-white hover:bg-white text-black font-bold py-3 px-8 sm:py-4 sm:px-12 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm sm:text-base group"
                          style={{ boxShadow: '0 0 25px rgba(255, 255, 255,0.5)' }}
                          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 35px rgba(255, 255, 255,0.7)'}
                          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 255, 255,0.5)'}
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                          Start Lesson
                        </button>
                      </div>
                    ) : (
                      /* Inline Lesson Content */
                      <div className="space-y-3 sm:space-y-4">
                        {/* Video Content - Inline with better YouTube player */}
                        {selectedLesson.content_type === 'video' && selectedLesson.video_url && (() => {
                          const youtubeId = extractYouTubeId(selectedLesson.video_url);
                          const embedUrl = youtubeId 
                            ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&showinfo=0`
                            : selectedLesson.video_url;
                          
                          return (
                            <div className="bg-black rounded-lg overflow-hidden border border-white/30" style={{ boxShadow: '0 0 15px rgba(255, 255, 255,0.2)' }}>
                              <div className="relative w-full pt-[56.25%]">
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full"
                                  src={embedUrl}
                                  title={selectedLesson.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  style={{ border: 'none' }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Article Content - Inline */}
                        {selectedLesson.article_content && (
                          <div className="bg-linear-to-br from-white/5 to-transparent border border-white/20 rounded-lg p-3 sm:p-4">
                            <div className="prose prose-invert prose-sm max-w-none">
                              <div 
                                className="text-gray-300 text-[10px] sm:text-xs leading-relaxed whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: selectedLesson.article_content }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Image Gallery - Inline grid */}
                        {selectedLesson.image_urls && selectedLesson.image_urls.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white" style={{ textShadow: '0 0 6px #ffffff' }}>Visual References</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                              {selectedLesson.image_urls.map((url, index) => (
                                <div key={index} className="border border-white/30 rounded-lg overflow-hidden bg-black/40" style={{ boxShadow: '0 0 10px rgba(255, 255, 255,0.15)' }}>
                                  <img
                                    src={url}
                                    alt={`Lesson visual ${index + 1}`}
                                    className="w-full h-auto"
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resources - Inline */}
                        {(resourcesByLesson[selectedLesson.id] || []).length > 0 && (
                          <div className="pt-2 sm:pt-3 border-t border-white/20">
                            <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5 sm:mb-2" style={{ textShadow: '0 0 6px #ffffff' }}>📚 Resources</h4>
                            <div className="space-y-1.5 sm:space-y-2">
                              {(resourcesByLesson[selectedLesson.id] || []).map((r) => (
                                <a
                                  key={r.id}
                                  href={r.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors p-2 sm:p-3"
                                >
                                  <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                                    <div className="min-w-0">
                                      <div className="text-[10px] sm:text-xs font-semibold text-white truncate">{r.title}</div>
                                      {r.description && <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{r.description}</div>}
                                      <div className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5 sm:mt-1">{r.resource_type}{r.file_size_kb ? ` · ${r.file_size_kb} KB` : ''}</div>
                                    </div>
                                    <div className="flex-shrink-0 text-white">
                                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quizzes - Inline */}
                        {(quizzesByLesson[selectedLesson.id] || []).length > 0 && (
                          <div className="pt-2 sm:pt-3 border-t border-white/20">
                            <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5 sm:mb-2" style={{ textShadow: '0 0 6px #ffffff' }}>🎯 Quick Quiz</h4>
                            <div className="space-y-2 sm:space-y-3">
                              {(quizzesByLesson[selectedLesson.id] || []).map((q) => {
                                const attempt = localState.quizAttempts[q.id] || {};
                                const submitted = typeof attempt.isCorrect === 'boolean' && typeof attempt.selectedAnswer === 'number';
                                return (
                                  <div key={q.id} className="rounded-lg border border-white/20 bg-black/40 p-2 sm:p-3">
                                    <div className="text-[10px] sm:text-xs font-semibold text-white mb-1.5 sm:mb-2">{q.question}</div>
                                    <div className="space-y-1">
                                      {q.options.map((opt, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => submitQuizAttempt(q, idx)}
                                          className={`w-full text-left text-[9px] sm:text-[10px] rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 transition-colors ${
                                        submitted
                                          ? (idx === q.correct_answer
                                              ? 'border-white/60 bg-white/10 text-white'
                                              : idx === attempt.selectedAnswer
                                                ? 'border-white/30 bg-white/5 text-gray-200'
                                                : 'border-white/10 bg-transparent text-gray-400')
                                          : 'border-white/10 hover:border-white/30 bg-transparent text-gray-200'
                                      }`}
                                      disabled={submitted}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>

                                    {submitted && (
                                      <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px]">
                                        <div className={`font-semibold ${attempt.isCorrect ? 'text-white' : 'text-gray-300'}`} style={{ textShadow: '0 0 4px rgba(255, 255, 255,0.4)' }}>
                                          {attempt.isCorrect ? '✅ Correct!' : '❌ Not quite'}
                                        </div>
                                        {q.explanation && <div className="text-gray-400 mt-0.5 sm:mt-1">{q.explanation}</div>}
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
                            <div className="pt-2 sm:pt-3 border-t border-white/20">
                              <button
                                onClick={() => setSelectedLesson(next)}
                                className="w-full bg-white/10 hover:bg-white/15 border border-white/30 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs"
                                style={{ boxShadow: '0 0 18px rgba(255, 255, 255,0.25)' }}
                              >
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="truncate">Next: {next.title}</span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* Complete Lesson Button */}
                        {!getEffectiveLessonProgress(selectedLesson.id)?.completed && (
                          <div className="pt-2 sm:pt-3 border-t border-white/20">
                            <button
                              onClick={() => markLessonComplete(selectedLesson.id)}
                              className="w-full bg-white hover:bg-white text-black font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs"
                              style={{ boxShadow: '0 0 15px rgba(255, 255, 255,0.4)' }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 255, 255,0.6)'}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255,0.4)'}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              ✓ Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-linear-to-br from-gray-900/80 to-black border border-white/30 rounded-lg p-4 sm:p-8 text-center">
                  <BookOpen className="mx-auto text-white/50 mb-2 sm:mb-3 w-8 h-8 sm:w-12 sm:h-12" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255,0.3))' }} />
                  <h3 className="text-sm sm:text-lg font-bold text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 8px #ffffff' }}>Select a Lesson</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500">Choose a lesson from the sidebar to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
