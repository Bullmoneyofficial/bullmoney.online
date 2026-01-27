'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { Plus, Edit, Trash2, Save, X, Upload, Link as LinkIcon, Image as ImageIcon, Video, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface CourseLevel {
  id: string;
  level_name: string;
  display_name: string;
  description: string;
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

export default function CourseAdminPanel() {
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [uploading, setUploading] = useState(false);

  const [lessonResources, setLessonResources] = useState<Resource[]>([]);
  const [lessonQuizzes, setLessonQuizzes] = useState<Quiz[]>([]);
  const [editingResource, setEditingResource] = useState<Partial<Resource> | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);
  const [quizOptionsText, setQuizOptionsText] = useState('');
  
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    loadLevels();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      loadModules(selectedLevel);
    }
  }, [selectedLevel]);

  useEffect(() => {
    if (selectedModule) {
      loadLessons(selectedModule);
    }
  }, [selectedModule]);

  useEffect(() => {
    // When opening a lesson for edit, also load its resources/quizzes.
    if (!editingLesson?.id) {
      setLessonResources([]);
      setLessonQuizzes([]);
      setEditingResource(null);
      setEditingQuiz(null);
      setQuizOptionsText('');
      return;
    }
    void loadLessonExtras(editingLesson.id);
  }, [editingLesson?.id]);

  const loadLevels = async () => {
    const { data, error } = await supabase
      .from('trading_course_levels')
      .select('*')
      .order('order_index');
    
    if (!error && data) {
      setLevels(data);
      if (data.length > 0 && !selectedLevel) {
        setSelectedLevel(data[0].id);
      }
    }
  };

  const loadModules = async (levelId: string) => {
    const { data, error } = await supabase
      .from('trading_course_modules')
      .select('*')
      .eq('level_id', levelId)
      .order('order_index');
    
    if (!error && data) {
      setModules(data);
    }
  };

  const loadLessons = async (moduleId: string) => {
    const { data, error } = await supabase
      .from('trading_course_lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');
    
    if (!error && data) {
      setLessons(data);
    }
  };

  const saveModule = async () => {
    if (!editingModule || !selectedLevel) return;
    
    const moduleData = {
      ...editingModule,
      level_id: selectedLevel,
      order_index: editingModule.order_index || modules.length,
    };

    if (editingModule.id) {
      await supabase
        .from('trading_course_modules')
        .update(moduleData)
        .eq('id', editingModule.id);
    } else {
      await supabase
        .from('trading_course_modules')
        .insert([moduleData]);
    }
    
    setEditingModule(null);
    loadModules(selectedLevel);
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    
    await supabase
      .from('trading_course_modules')
      .delete()
      .eq('id', id);
    
    loadModules(selectedLevel!);
  };

  const saveLesson = async () => {
    if (!editingLesson || !selectedModule) return;
    
    const lessonData = {
      ...editingLesson,
      module_id: selectedModule,
      order_index: editingLesson.order_index || lessons.length,
    };

    if (editingLesson.id) {
      await supabase
        .from('trading_course_lessons')
        .update(lessonData)
        .eq('id', editingLesson.id);
    } else {
      await supabase
        .from('trading_course_lessons')
        .insert([lessonData]);
    }
    
    setEditingLesson(null);
    loadLessons(selectedModule);
  };

  const loadLessonExtras = async (lessonId: string) => {
    try {
      const [{ data: resources, error: resourcesError }, { data: quizzes, error: quizzesError }] = await Promise.all([
        supabase
          .from('trading_course_resources')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: true }),
        supabase
          .from('trading_course_quizzes')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('order_index'),
      ]);

      if (resourcesError) throw resourcesError;
      if (quizzesError) throw quizzesError;

      setLessonResources((resources as Resource[]) || []);
      const normalized = ((quizzes as any[]) || []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
      })) as Quiz[];
      setLessonQuizzes(normalized);
    } catch (error) {
      console.error('Error loading lesson extras:', error);
      setLessonResources([]);
      setLessonQuizzes([]);
    }
  };

  const saveResource = async () => {
    if (!editingLesson?.id || !editingResource) return;
    const payload = {
      lesson_id: editingLesson.id,
      title: editingResource.title || '',
      description: editingResource.description || null,
      resource_type: editingResource.resource_type || 'pdf',
      file_url: editingResource.file_url || '',
      file_size_kb: editingResource.file_size_kb ?? null,
    };
    if (!payload.title || !payload.file_url) {
      alert('Resource title and file URL are required.');
      return;
    }

    try {
      if (editingResource.id) {
        await supabase.from('trading_course_resources').update(payload).eq('id', editingResource.id);
      } else {
        await supabase.from('trading_course_resources').insert([payload]);
      }
      setEditingResource(null);
      await loadLessonExtras(editingLesson.id);
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Failed to save resource. Check console for details.');
    }
  };

  const deleteResource = async (id: string) => {
    if (!editingLesson?.id) return;
    if (!confirm('Delete this resource?')) return;
    try {
      await supabase.from('trading_course_resources').delete().eq('id', id);
      await loadLessonExtras(editingLesson.id);
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource.');
    }
  };

  const saveQuiz = async () => {
    if (!editingLesson?.id || !editingQuiz) return;
    const options = quizOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const correct = Number(editingQuiz.correct_answer ?? 0);
    const payload = {
      lesson_id: editingLesson.id,
      question: editingQuiz.question || '',
      options,
      correct_answer: correct,
      explanation: editingQuiz.explanation || null,
      order_index: editingQuiz.order_index ?? lessonQuizzes.length + 1,
    };

    if (!payload.question || options.length < 2) {
      alert('Quiz needs a question and at least 2 options (one per line).');
      return;
    }
    if (correct < 0 || correct >= options.length) {
      alert('Correct answer index must match an option (0-based).');
      return;
    }

    try {
      if (editingQuiz.id) {
        await supabase.from('trading_course_quizzes').update(payload).eq('id', editingQuiz.id);
      } else {
        await supabase.from('trading_course_quizzes').insert([payload]);
      }
      setEditingQuiz(null);
      setQuizOptionsText('');
      await loadLessonExtras(editingLesson.id);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Check console for details.');
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!editingLesson?.id) return;
    if (!confirm('Delete this quiz question?')) return;
    try {
      await supabase.from('trading_course_quizzes').delete().eq('id', id);
      await loadLessonExtras(editingLesson.id);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz.');
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    
    await supabase
      .from('trading_course_lessons')
      .delete()
      .eq('id', id);
    
    loadLessons(selectedModule!);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `course-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trading-course')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trading-course')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Make sure the trading-course bucket exists in Supabase Storage.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url && editingLesson) {
      const currentUrls = editingLesson.image_urls || [];
      setEditingLesson({
        ...editingLesson,
        image_urls: [...currentUrls, url]
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-3 sm:p-6 space-y-3 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/60 [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-3xl font-bold text-blue-400 flex items-center gap-2" style={{ textShadow: '0 0 10px #3b82f6' }}>
            <BookOpen className="text-blue-400" size={24} style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
            Course Admin Panel
          </h1>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Manage your trading course content</p>
        </div>

        {/* Level Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedLevel === level.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {level.display_name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Modules Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>Modules</h2>
              <button
                onClick={() => setEditingModule({ title: '', description: '', is_published: false, order_index: modules.length })}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-400 transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                Add Module
              </button>
            </div>

            {/* Module List */}
            <div className="space-y-3 max-h-[50vh] sm:max-h-[600px] overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="border border-blue-500/30 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedModule(module.id);
                        setExpandedModule(expandedModule === module.id ? null : module.id);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-white text-sm sm:text-base">{module.title}</h3>
                        {module.is_published ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Published</span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Draft</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400">{module.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModule(module);
                        }}
                        className="text-blue-400 hover:text-white p-2"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteModule(module.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedModule(expandedModule === module.id ? null : module.id);
                        }}
                        className="text-gray-400 hover:text-white p-2"
                      >
                        {expandedModule === module.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Show lesson count */}
                  {expandedModule === module.id && (
                    <div className="mt-3 pt-3 border-t border-blue-500/20 text-sm text-gray-400">
                      {lessons.filter(l => l.module_id === module.id).length} lessons
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Module Edit Form */}
            {editingModule && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                <div className="bg-gray-900 border-2 border-blue-500 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-blue-500/30">
                    <h3 className="text-lg sm:text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>
                      {editingModule.id ? 'Edit Module' : 'New Module'}
                    </h3>
                    <button onClick={() => setEditingModule(null)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 p-4 sm:p-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Title</label>
                      <input
                        type="text"
                        value={editingModule.title || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                        placeholder="Module title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Description</label>
                      <textarea
                        value={editingModule.description || ''}
                        onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none h-24"
                        placeholder="Module description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Order Index</label>
                      <input
                        type="number"
                        value={editingModule.order_index || 0}
                        onChange={(e) => setEditingModule({ ...editingModule, order_index: parseInt(e.target.value) })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editingModule.is_published || false}
                        onChange={(e) => setEditingModule({ ...editingModule, is_published: e.target.checked })}
                        className="w-5 h-5 accent-blue-500"
                      />
                      <label className="text-white font-semibold">Published</label>
                    </div>

                  </div>
                  
                  <div className="border-t border-blue-500/30 p-4 bg-gray-900">
                    <div className="flex gap-3">
                      <button
                        onClick={saveModule}
                        className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        Save Module
                      </button>
                      <button
                        onClick={() => setEditingModule(null)}
                        className="px-6 py-3 border border-blue-500/30 rounded-lg text-white hover:border-blue-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lessons Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-xl p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>Lessons</h2>
              <button
                onClick={() => selectedModule && setEditingLesson({ 
                  title: '', 
                  description: '', 
                  content_type: 'video',
                  is_published: false, 
                  is_free: false,
                  order_index: lessons.length 
                })}
                disabled={!selectedModule}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Add Lesson
              </button>
            </div>

            {!selectedModule ? (
              <div className="text-center text-gray-400 py-12">
                Select a module to manage lessons
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] sm:max-h-[600px] overflow-y-auto">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="border border-blue-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">{lesson.title}</h3>
                          {lesson.is_published ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Published</span>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Draft</span>
                          )}
                          {lesson.is_free && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Free</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 mb-2">{lesson.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            {lesson.content_type === 'video' ? <Video size={14} /> : <BookOpen size={14} />}
                            {lesson.content_type}
                          </span>
                          {lesson.duration_minutes && <span>{lesson.duration_minutes} min</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingLesson(lesson)}
                          className="text-blue-400 hover:text-white p-2"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lesson Edit Form */}
            {editingLesson && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                <div className="bg-gray-900 border-2 border-blue-500 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-blue-500/30">
                    <h3 className="text-lg sm:text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>
                      {editingLesson.id ? 'Edit Lesson' : 'New Lesson'}
                    </h3>
                    <button onClick={() => setEditingLesson(null)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 p-4 sm:p-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Title</label>
                      <input
                        type="text"
                        value={editingLesson.title || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                        placeholder="Lesson title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Description</label>
                      <textarea
                        value={editingLesson.description || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none h-20"
                        placeholder="Lesson description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-400 mb-2">Content Type</label>
                        <select
                          value={editingLesson.content_type || 'video'}
                          onChange={(e) => setEditingLesson({ ...editingLesson, content_type: e.target.value })}
                          className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="video">Video</option>
                          <option value="article">Article</option>
                          <option value="quiz">Quiz</option>
                          <option value="interactive">Interactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-blue-400 mb-2">Duration (minutes)</label>
                        <input
                          type="number"
                          value={editingLesson.duration_minutes || ''}
                          onChange={(e) => setEditingLesson({ ...editingLesson, duration_minutes: parseInt(e.target.value) || null })}
                          className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                          placeholder="30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <LinkIcon size={16} />
                        Video URL (YouTube/Vimeo embed)
                      </label>
                      <input
                        type="text"
                        value={editingLesson.video_url || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                        placeholder="https://www.youtube.com/embed/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2">Article Content</label>
                      <textarea
                        value={editingLesson.article_content || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, article_content: e.target.value })}
                        className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none h-32 font-mono text-sm"
                        placeholder="Lesson content (supports HTML)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <ImageIcon size={16} />
                        Images
                      </label>
                      <div className="space-y-2">
                        {editingLesson.image_urls?.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 bg-black border border-blue-500/30 rounded-lg p-2">
                            <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                            <span className="flex-1 text-sm text-gray-400 truncate">{url}</span>
                            <button
                              onClick={() => {
                                const newUrls = [...(editingLesson.image_urls || [])];
                                newUrls.splice(index, 1);
                                setEditingLesson({ ...editingLesson, image_urls: newUrls });
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <label className="flex items-center justify-center gap-2 bg-black border-2 border-dashed border-blue-500/30 hover:border-blue-400 rounded-lg p-4 cursor-pointer transition-all">
                          <Upload size={20} className="text-blue-400" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }} />
                          <span className="text-blue-400 font-semibold" style={{ textShadow: '0 0 4px #3b82f6' }}>
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-400 mb-2">Order Index</label>
                        <input
                          type="number"
                          value={editingLesson.order_index || 0}
                          onChange={(e) => setEditingLesson({ ...editingLesson, order_index: parseInt(e.target.value) })}
                          className="w-full bg-black border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editingLesson.is_published || false}
                          onChange={(e) => setEditingLesson({ ...editingLesson, is_published: e.target.checked })}
                          className="w-5 h-5 accent-blue-500"
                        />
                        <label className="text-white font-semibold">Published</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editingLesson.is_free || false}
                          onChange={(e) => setEditingLesson({ ...editingLesson, is_free: e.target.checked })}
                          className="w-5 h-5 accent-blue-500"
                        />
                        <label className="text-white font-semibold">Free Preview</label>
                      </div>
                    </div>

                    {/* Resources + Quizzes */}
                    {editingLesson.id ? (
                      <div className="pt-2">
                        <div className="border-t border-blue-500/20 pt-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-lg font-bold text-blue-400" style={{ textShadow: '0 0 6px #3b82f6' }}>Lesson Resources</h4>
                            <button
                              onClick={() => setEditingResource({ title: '', description: '', resource_type: 'pdf', file_url: '', file_size_kb: null })}
                              className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2"
                            >
                              <Plus size={18} />
                              Add Resource
                            </button>
                          </div>

                          {lessonResources.length === 0 ? (
                            <div className="text-sm text-gray-400 bg-black/40 border border-blue-500/20 rounded-lg p-3">
                              No resources yet for this lesson.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lessonResources.map((r) => (
                                <div key={r.id} className="flex items-start gap-3 bg-black border border-blue-500/20 rounded-lg p-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold truncate">{r.title}</div>
                                    {r.description && <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>}
                                    <div className="text-[11px] text-gray-500 mt-1 truncate">{r.resource_type} · {r.file_url}</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingResource(r)}
                                      className="text-blue-400 hover:text-white p-2"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => deleteResource(r.id)}
                                      className="text-red-400 hover:text-red-300 p-2"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {editingResource && (
                            <div className="mt-3 bg-black/60 border border-blue-500/30 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-white font-bold">{editingResource.id ? 'Edit Resource' : 'New Resource'}</div>
                                <button onClick={() => setEditingResource(null)} className="text-gray-400 hover:text-white">
                                  <X size={18} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={editingResource.title || ''}
                                    onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Type</label>
                                  <select
                                    value={editingResource.resource_type || 'pdf'}
                                    onChange={(e) => setEditingResource({ ...editingResource, resource_type: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                  >
                                    <option value="pdf">PDF</option>
                                    <option value="template">Template</option>
                                    <option value="spreadsheet">Spreadsheet</option>
                                    <option value="chart">Chart</option>
                                    <option value="image">Image</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">File URL</label>
                                  <input
                                    type="text"
                                    value={editingResource.file_url || ''}
                                    onChange={(e) => setEditingResource({ ...editingResource, file_url: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                    placeholder="https://..."
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Description</label>
                                  <textarea
                                    value={editingResource.description || ''}
                                    onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none h-20"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">File Size (KB)</label>
                                  <input
                                    type="number"
                                    value={editingResource.file_size_kb ?? ''}
                                    onChange={(e) => setEditingResource({ ...editingResource, file_size_kb: parseInt(e.target.value) || null })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={saveResource}
                                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-400 transition-all"
                                >
                                  Save Resource
                                </button>
                                <button
                                  onClick={() => setEditingResource(null)}
                                  className="px-4 py-2 border border-blue-500/30 rounded-lg text-white hover:border-blue-400 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-blue-500/20 pt-4 mt-5">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h4 className="text-lg font-bold text-blue-400" style={{ textShadow: '0 0 6px #3b82f6' }}>Lesson Quizzes</h4>
                            <button
                              onClick={() => {
                                setEditingQuiz({ question: '', explanation: '', correct_answer: 0, order_index: lessonQuizzes.length + 1 });
                                setQuizOptionsText('');
                              }}
                              className="bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2"
                            >
                              <Plus size={18} />
                              Add Quiz
                            </button>
                          </div>

                          {lessonQuizzes.length === 0 ? (
                            <div className="text-sm text-gray-400 bg-black/40 border border-blue-500/20 rounded-lg p-3">
                              No quizzes yet for this lesson.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {lessonQuizzes.map((q) => (
                                <div key={q.id} className="flex items-start gap-3 bg-black border border-blue-500/20 rounded-lg p-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold">{q.order_index}. {q.question}</div>
                                    <div className="text-xs text-gray-400 mt-1">Options: {q.options?.length ?? 0} · Correct: {q.correct_answer}</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingQuiz(q);
                                        setQuizOptionsText((q.options || []).join('\n'));
                                      }}
                                      className="text-blue-400 hover:text-white p-2"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => deleteQuiz(q.id)}
                                      className="text-red-400 hover:text-red-300 p-2"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {editingQuiz && (
                            <div className="mt-3 bg-black/60 border border-blue-500/30 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-white font-bold">{editingQuiz.id ? 'Edit Quiz' : 'New Quiz'}</div>
                                <button onClick={() => setEditingQuiz(null)} className="text-gray-400 hover:text-white">
                                  <X size={18} />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Question</label>
                                  <textarea
                                    value={editingQuiz.question || ''}
                                    onChange={(e) => setEditingQuiz({ ...editingQuiz, question: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none h-20"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Options (one per line)</label>
                                  <textarea
                                    value={quizOptionsText}
                                    onChange={(e) => setQuizOptionsText(e.target.value)}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none h-24 font-mono text-sm"
                                    placeholder="Option 1\nOption 2\nOption 3"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-semibold text-blue-400 mb-1">Correct Answer Index (0-based)</label>
                                    <input
                                      type="number"
                                      value={editingQuiz.correct_answer ?? 0}
                                      onChange={(e) => setEditingQuiz({ ...editingQuiz, correct_answer: parseInt(e.target.value) || 0 })}
                                      className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-blue-400 mb-1">Order Index</label>
                                    <input
                                      type="number"
                                      value={editingQuiz.order_index ?? 1}
                                      onChange={(e) => setEditingQuiz({ ...editingQuiz, order_index: parseInt(e.target.value) || 1 })}
                                      className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-blue-400 mb-1">Explanation</label>
                                  <textarea
                                    value={editingQuiz.explanation || ''}
                                    onChange={(e) => setEditingQuiz({ ...editingQuiz, explanation: e.target.value })}
                                    className="w-full bg-black border border-blue-500/30 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none h-20"
                                  />
                                </div>

                                <div className="flex gap-3 pt-1">
                                  <button
                                    onClick={saveQuiz}
                                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-400 transition-all"
                                  >
                                    Save Quiz
                                  </button>
                                  <button
                                    onClick={() => setEditingQuiz(null)}
                                    className="px-4 py-2 border border-blue-500/30 rounded-lg text-white hover:border-blue-400 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-blue-500/20 pt-4">
                        <div className="text-sm text-gray-400 bg-black/40 border border-blue-500/20 rounded-lg p-3">
                          Save the lesson first to add resources and quiz questions.
                        </div>
                      </div>
                    )}

                  </div>
                  
                  <div className="border-t border-blue-500/30 p-4 bg-gray-900">
                    <div className="flex gap-3">
                      <button
                        onClick={saveLesson}
                        className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        Save Lesson
                      </button>
                      <button
                        onClick={() => setEditingLesson(null)}
                        className="px-6 py-3 border border-blue-500/30 rounded-lg text-white hover:border-blue-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
