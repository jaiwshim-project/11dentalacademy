-- ============================================
-- 덴탈클리닉파인더 아카데미 Supabase 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 유료 사용자 테이블
CREATE TABLE paid_users (
    id TEXT PRIMARY KEY,
    serial_number TEXT NOT NULL,
    name TEXT NOT NULL,
    clinic TEXT DEFAULT '',
    role TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    region TEXT DEFAULT '',
    password TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 퀴즈 결과 테이블
CREATE TABLE quiz_results (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES paid_users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 등록 병원 테이블
CREATE TABLE registered_clinics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    director TEXT DEFAULT '',
    region TEXT DEFAULT '',
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 일일 목표 테이블
CREATE TABLE daily_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES paid_users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    goals JSONB DEFAULT '[]',
    UNIQUE(user_id, date)
);

-- 5. 학습 데이터 테이블
CREATE TABLE learning_data (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES paid_users(id) ON DELETE CASCADE,
    completed_lessons INTEGER DEFAULT 0,
    total_hours NUMERIC DEFAULT 0,
    in_progress INTEGER DEFAULT 2,
    quiz_average NUMERIC DEFAULT 0
);

-- ============================================
-- RLS (Row Level Security) 설정
-- anon key로 전체 접근 허용 (간단한 구조)
-- ============================================

ALTER TABLE paid_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_data ENABLE ROW LEVEL SECURITY;

-- paid_users 정책
CREATE POLICY "Allow all access to paid_users" ON paid_users
    FOR ALL USING (true) WITH CHECK (true);

-- quiz_results 정책
CREATE POLICY "Allow all access to quiz_results" ON quiz_results
    FOR ALL USING (true) WITH CHECK (true);

-- registered_clinics 정책
CREATE POLICY "Allow all access to registered_clinics" ON registered_clinics
    FOR ALL USING (true) WITH CHECK (true);

-- daily_goals 정책
CREATE POLICY "Allow all access to daily_goals" ON daily_goals
    FOR ALL USING (true) WITH CHECK (true);

-- learning_data 정책
CREATE POLICY "Allow all access to learning_data" ON learning_data
    FOR ALL USING (true) WITH CHECK (true);

-- 인덱스
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_quiz_id ON quiz_results(quiz_id);
CREATE INDEX idx_daily_goals_user_id ON daily_goals(user_id);
CREATE INDEX idx_paid_users_clinic ON paid_users(clinic);
