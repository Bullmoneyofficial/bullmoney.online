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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 flex items-center gap-3" style={{ textShadow: '0 0 10px #3b82f6' }}>
            <BookOpen className="text-blue-400" size={40} style={{ filter: 'drop-shadow(0 0 8px #3b82f6)' }} />
            Course Admin Panel
          </h1>
          <p className="text-gray-400 mt-2">Manage your trading course content</p>
        </div>

        {/* Level Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedLevel === level.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {level.display_name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Modules Section */}
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>Modules</h2>
              <button
                onClick={() => setEditingModule({ title: '', description: '', is_published: false, order_index: modules.length })}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-400 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Add Module
              </button>
            </div>

            {/* Module List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {modules.map((module) => (
                <div key={module.id} className="border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedModule(module.id);
                        setExpandedModule(expandedModule === module.id ? null : module.id);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-white">{module.title}</h3>
                        {module.is_published ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Published</span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Draft</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{module.description}</p>
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border-2 border-blue-500 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 pb-4 border-b border-blue-500/30">
                    <h3 className="text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>
                      {editingModule.id ? 'Edit Module' : 'New Module'}
                    </h3>
                    <button onClick={() => setEditingModule(null)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 p-6">
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
          <div className="bg-gradient-to-br from-gray-900/80 to-black border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>Lessons</h2>
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                Add Lesson
              </button>
            </div>

            {!selectedModule ? (
              <div className="text-center text-gray-400 py-12">
                Select a module to manage lessons
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white">{lesson.title}</h3>
                          {lesson.is_published ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Published</span>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Draft</span>
                          )}
                          {lesson.is_free && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Free</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{lesson.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border-2 border-blue-500 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 pb-4 border-b border-blue-500/30">
                    <h3 className="text-2xl font-bold text-blue-400" style={{ textShadow: '0 0 8px #3b82f6' }}>
                      {editingLesson.id ? 'Edit Lesson' : 'New Lesson'}
                    </h3>
                    <button onClick={() => setEditingLesson(null)} className="text-gray-400 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto flex-1 p-6">
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
