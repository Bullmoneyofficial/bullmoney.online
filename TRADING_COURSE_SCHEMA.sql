-- Trading Course Schema for Supabase
-- This schema supports a multi-level trading course with images, videos, and progress tracking

-- Course Levels Table
CREATE TABLE IF NOT EXISTS trading_course_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name VARCHAR(50) NOT NULL UNIQUE, -- 'beginner', 'intermediate', 'advanced'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS trading_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES trading_course_levels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Lessons Table
CREATE TABLE IF NOT EXISTS trading_course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES trading_course_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'video', 'article', 'quiz', 'interactive'
  video_url TEXT, -- YouTube or Vimeo embed URL
  video_thumbnail TEXT,
  article_content TEXT,
  image_urls TEXT[], -- Array of image URLs from Supabase storage
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Resources Table (downloadable PDFs, charts, etc.)
CREATE TABLE IF NOT EXISTS trading_course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES trading_course_lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL, -- 'pdf', 'image', 'chart', 'template'
  file_url TEXT NOT NULL,
  file_size_kb INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Course Progress Table
CREATE TABLE IF NOT EXISTS trading_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES trading_course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_watched_position INTEGER DEFAULT 0, -- For video lessons
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Course Quizzes Table
CREATE TABLE IF NOT EXISTS trading_course_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES trading_course_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Quiz Attempts Table
CREATE TABLE IF NOT EXISTS trading_course_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES trading_course_quizzes(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Certificates Table
CREATE TABLE IF NOT EXISTS trading_course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level_id UUID REFERENCES trading_course_levels(id) ON DELETE CASCADE,
  certificate_url TEXT,
  completion_percentage INTEGER NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id)
);

-- Insert default levels
INSERT INTO trading_course_levels (level_name, display_name, description, order_index) VALUES
  ('beginner', 'New Trader', 'Perfect for those just starting their trading journey. Learn the fundamentals from zero to hero.', 1),
  ('intermediate', 'Intermediate Trader', 'Take your trading to the next level with advanced strategies and risk management.', 2),
  ('advanced', 'Experienced Trader', 'Master-level content for seasoned traders. Advanced psychology, systems, and institutional strategies.', 3)
ON CONFLICT (level_name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_modules_level ON trading_course_modules(level_id, order_index);
CREATE INDEX idx_lessons_module ON trading_course_lessons(module_id, order_index);
CREATE INDEX idx_progress_user ON trading_course_progress(user_id, lesson_id);
CREATE INDEX idx_resources_lesson ON trading_course_resources(lesson_id);
CREATE INDEX idx_quizzes_lesson ON trading_course_quizzes(lesson_id, order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE trading_course_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_course_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read for published content, authenticated users can track progress)
CREATE POLICY "Anyone can view published levels" ON trading_course_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can view published modules" ON trading_course_modules FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published lessons" ON trading_course_lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view resources" ON trading_course_resources FOR SELECT USING (true);
CREATE POLICY "Anyone can view quizzes" ON trading_course_quizzes FOR SELECT USING (true);

-- Users can manage their own progress
CREATE POLICY "Users can view own progress" ON trading_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON trading_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON trading_course_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON trading_course_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz attempts" ON trading_course_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own certificates" ON trading_course_certificates FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (you'll need to create an admin role or check against specific user IDs)
-- For now, allowing authenticated users to manage content - adjust based on your admin setup
CREATE POLICY "Admins can manage levels" ON trading_course_levels FOR ALL USING (true);
CREATE POLICY "Admins can manage modules" ON trading_course_modules FOR ALL USING (true);
CREATE POLICY "Admins can manage lessons" ON trading_course_lessons FOR ALL USING (true);
CREATE POLICY "Admins can manage resources" ON trading_course_resources FOR ALL USING (true);
CREATE POLICY "Admins can manage quizzes" ON trading_course_quizzes FOR ALL USING (true);

-- Create storage bucket for course images (run this in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trading-course', 'trading-course', true);

-- Storage policies for course images
-- CREATE POLICY "Public can view course images" ON storage.objects FOR SELECT USING (bucket_id = 'trading-course');
-- CREATE POLICY "Authenticated users can upload course images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trading-course' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can update course images" ON storage.objects FOR UPDATE USING (bucket_id = 'trading-course' AND auth.role() = 'authenticated');
-- CREATE POLICY "Authenticated users can delete course images" ON storage.objects FOR DELETE USING (bucket_id = 'trading-course' AND auth.role() = 'authenticated');
