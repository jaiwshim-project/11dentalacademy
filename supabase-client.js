// ============================================
// Supabase 클라이언트 설정
// ============================================

const SUPABASE_URL = 'https://haxcktfnuudlqciyljtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheGNrdGZudXVkbHFjaXlsanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDUwNDAsImV4cCI6MjA4NDg4MTA0MH0.suN7BeaHx3MjaNlMDQa0940P-rMl2XPyk4ksoQEU3YM';

// Supabase 클라이언트 초기화
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// 유료 사용자 관련 함수
// ============================================

// 모든 유료 사용자 조회
async function fetchAllUsers() {
    const { data, error } = await _sb
        .from('paid_users')
        .select('*')
        .order('registered_at', { ascending: true });
    if (error) { console.error('사용자 조회 오류:', error); return []; }
    // DB 컬럼명을 기존 코드 형식으로 변환
    return (data || []).map(u => ({
        id: u.id,
        serialNumber: u.serial_number,
        name: u.name,
        clinic: u.clinic,
        role: u.role,
        phone: u.phone,
        region: u.region,
        password: u.password,
        registeredAt: u.registered_at
    }));
}

// 사용자 등록
async function insertUser(user) {
    const { data, error } = await _sb
        .from('paid_users')
        .insert({
            id: user.id,
            serial_number: user.serialNumber,
            name: user.name,
            clinic: user.clinic || '',
            role: user.role || '',
            phone: user.phone || '',
            region: user.region || '',
            password: user.password,
            registered_at: user.registeredAt
        })
        .select()
        .single();
    if (error) { console.error('사용자 등록 오류:', error); throw error; }
    return data;
}

// 사용자 삭제
async function deleteUserFromDB(userId) {
    const { error } = await _sb
        .from('paid_users')
        .delete()
        .eq('id', userId);
    if (error) { console.error('사용자 삭제 오류:', error); throw error; }
}

// 모든 사용자 삭제
async function deleteAllUsersFromDB() {
    const { error: qError } = await _sb.from('quiz_results').delete().neq('id', 0);
    const { error: dError } = await _sb.from('daily_goals').delete().neq('id', 0);
    const { error: lError } = await _sb.from('learning_data').delete().neq('id', 0);
    const { error: cError } = await _sb.from('registered_clinics').delete().neq('id', 0);
    const { error: uError } = await _sb.from('paid_users').delete().neq('id', 'impossible_id');
    if (uError) { console.error('전체 삭제 오류:', uError); throw uError; }
}

// ============================================
// 퀴즈 결과 관련 함수
// ============================================

// 퀴즈 결과 저장
async function insertQuizResult(userId, quizId, score) {
    const { error } = await _sb
        .from('quiz_results')
        .insert({
            user_id: userId,
            quiz_id: quizId,
            score: score,
            date: new Date().toISOString()
        });
    if (error) { console.error('퀴즈 결과 저장 오류:', error); throw error; }
}

// 특정 사용자의 퀴즈 결과 조회
async function fetchQuizResults(userId) {
    const { data, error } = await _sb
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    if (error) { console.error('퀴즈 결과 조회 오류:', error); return []; }
    return (data || []).map(r => ({
        quizId: r.quiz_id,
        score: r.score,
        date: r.date
    }));
}

// 모든 퀴즈 결과 조회
async function fetchAllQuizResults() {
    const { data, error } = await _sb
        .from('quiz_results')
        .select('*, paid_users(name, serial_number)')
        .order('date', { ascending: false });
    if (error) { console.error('전체 퀴즈 결과 조회 오류:', error); return []; }
    return (data || []).map(r => ({
        quizId: r.quiz_id,
        score: r.score,
        date: r.date,
        user_id: r.user_id,
        user_name: r.paid_users?.name || '',
        user_serial: r.paid_users?.serial_number || ''
    }));
}

// ============================================
// 등록 병원 관련 함수
// ============================================

// 모든 등록 병원 조회
async function fetchRegisteredClinics() {
    const { data, error } = await _sb
        .from('registered_clinics')
        .select('*')
        .order('registered_at', { ascending: true });
    if (error) { console.error('병원 조회 오류:', error); return []; }
    return (data || []).map(c => ({
        name: c.name,
        director: c.director,
        region: c.region,
        registeredAt: c.registered_at
    }));
}

// 병원 등록/업데이트
async function upsertClinic(clinicName, directorName, regionName) {
    if (!clinicName) return;
    // 기존 병원 확인
    const { data: existing } = await _sb
        .from('registered_clinics')
        .select('id')
        .eq('name', clinicName)
        .maybeSingle();

    if (existing) {
        await _sb
            .from('registered_clinics')
            .update({ region: regionName || '' })
            .eq('id', existing.id);
    } else {
        await _sb
            .from('registered_clinics')
            .insert({
                name: clinicName,
                director: directorName || '',
                region: regionName || '',
                registered_at: new Date().toISOString()
            });
    }
}

// ============================================
// 일일 목표 관련 함수
// ============================================

// 목표 저장 (upsert)
async function saveGoalsToDB(userId, dateStr, goals) {
    const { error } = await _sb
        .from('daily_goals')
        .upsert({
            user_id: userId,
            date: dateStr,
            goals: goals
        }, { onConflict: 'user_id,date' });
    if (error) console.error('목표 저장 오류:', error);
}

// 목표 조회
async function fetchGoals(userId, dateStr) {
    const { data, error } = await _sb
        .from('daily_goals')
        .select('goals')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .maybeSingle();
    if (error) { console.error('목표 조회 오류:', error); return null; }
    return data ? data.goals : null;
}

// ============================================
// 학습 데이터 관련 함수
// ============================================

// 학습 데이터 조회
async function fetchLearningData(userId) {
    const { data, error } = await _sb
        .from('learning_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) { console.error('학습 데이터 조회 오류:', error); return {}; }
    if (!data) return {};
    return {
        completedLessons: data.completed_lessons,
        totalHours: data.total_hours,
        inProgress: data.in_progress,
        quizAverage: data.quiz_average
    };
}

// ============================================
// 현재 사용자 관리 (세션 스토리지)
// ============================================

function setCurrentUser(user) {
    localStorage.setItem('currentPaidUser', JSON.stringify(user));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentPaidUser'));
    } catch (e) {
        return null;
    }
}
