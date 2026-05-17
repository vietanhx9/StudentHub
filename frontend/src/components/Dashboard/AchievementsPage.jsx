import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Spin, Progress } from 'antd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ACHIEVEMENT_INFO = {
  welcome:        { icon: '🎁', name: 'Chào mừng bạn!',      desc: 'Đăng ký tài khoản lần đầu',          hint: 'Bắt đầu hành trình của bạn...',         color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  first_task:     { icon: '✅', name: 'Task đầu tiên',        desc: 'Hoàn thành task đầu tiên trong đời',  hint: 'Hoàn thành điều gì đó lần đầu tiên?',   color: '#4ECDC4', gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)' },
  streak_3:       { icon: '🔥', name: 'On Fire 3 ngày',       desc: 'Học liên tục 3 ngày không nghỉ',      hint: 'Duy trì một chuỗi ngắn...',             color: '#FF6B35', gradient: 'linear-gradient(135deg, #FF6B35, #F7C59F)' },
  streak_7:       { icon: '⚡', name: 'Tuần vàng',            desc: 'Học liên tục 7 ngày không nghỉ',      hint: 'Trọn vẹn một tuần không nghỉ?',         color: '#F7C948', gradient: 'linear-gradient(135deg, #F7C948, #FF9F1C)' },
  tree_grown:     { icon: '🌳', name: 'Bàn tay xanh',         desc: 'Trồng cây đến giai đoạn trưởng thành', hint: 'Nuôi lớn một sinh vật xanh...',         color: '#52B788', gradient: 'linear-gradient(135deg, #52B788, #2D6A4F)' },
  level_5:        { icon: '🏅', name: 'Chiến binh Lv.5',      desc: 'Đạt đến level 5',                     hint: 'Tích lũy đủ kinh nghiệm để vượt mốc...', color: '#C13584', gradient: 'linear-gradient(135deg, #C13584, #833AB4)' },
  tasks_10:       { icon: '🎯', name: 'Thập toàn thập mỹ',    desc: 'Hoàn thành tổng cộng 10 tasks',       hint: 'Cột mốc hai chữ số đầu tiên...',        color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  deep_work_1h:   { icon: '🧘', name: 'Thiền sư Pomodoro',    desc: 'Học deep work tổng 1 giờ',            hint: 'Tập trung sâu trong một khoảng thời gian dài...', color: '#95E1D3', gradient: 'linear-gradient(135deg, #95E1D3, #4ECDC4)' },
};

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_INFO);

const getLevelFromXp = (xp) => Math.floor(Math.log2((xp || 0) / 50 + 1)) + 1;

const getProgress = (code, stats) => {
  switch (code) {
    case 'welcome':      return { current: 1, target: 1, unit: '' };
    case 'first_task':   return { current: Math.min(stats.tasksDone, 1), target: 1, unit: 'task' };
    case 'streak_3':     return { current: Math.min(stats.streak, 3), target: 3, unit: 'ngày' };
    case 'streak_7':     return { current: Math.min(stats.streak, 7), target: 7, unit: 'ngày' };
    case 'tree_grown':   return { current: Math.min(stats.maxTreeStage, 5), target: 5, unit: 'giai đoạn' };
    case 'level_5':      return { current: Math.min(stats.level, 5), target: 5, unit: 'level' };
    case 'tasks_10':     return { current: Math.min(stats.tasksDone, 10), target: 10, unit: 'task' };
    case 'deep_work_1h': return { current: Math.min(stats.deepMinutes, 60), target: 60, unit: 'phút' };
    default:             return null;
  }
};

export default function AchievementsPage() {
  const { user, profile } = useAuth();
  const [earned, setEarned] = useState([]);
  const [stats, setStats] = useState({ tasksDone: 0, streak: 0, maxTreeStage: 0, level: 1, deepMinutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const [achRes, taskRes, treeRes] = await Promise.all([
        supabase.from('achievements').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', true),
        supabase.from('trees').select('growth_stage').eq('user_id', user.id),
      ]);
      setEarned(achRes.data || []);
      const maxStage = (treeRes.data || []).reduce((m, t) => Math.max(m, t.growth_stage || 0), 0);
      setStats({
        tasksDone: taskRes.count || 0,
        streak: profile?.streak_days || 0,
        maxTreeStage: maxStage,
        level: getLevelFromXp(profile?.current_xp || 0),
        deepMinutes: profile?.deep_work_minutes || 0,
      });
      setLoading(false);
    };
    fetch();
  }, [user, profile]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  const earnedCodes = new Set(earned.map(a => a.achievement_code));
  const earnedCount = earned.length;
  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  return (
    <div>
      {/* HEADER */}
      <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #F7C948 0%, #FF6B35 100%)', marginBottom: 24, textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 60 }}>🏆</div>
        <Title level={3} style={{ margin: '8px 0 4px', color: '#fff', fontWeight: 900 }}>Thành tích của bạn</Title>
        <Tag style={{ background: 'rgba(0,0,0,0.25)', border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
          {earnedCount}/{ALL_ACHIEVEMENTS.length} đã mở khóa
        </Tag>
      </Card>

      {/* ACHIEVEMENT GRID */}
      <Row gutter={[16, 16]}>
        {ALL_ACHIEVEMENTS.map(code => {
          const info = ACHIEVEMENT_INFO[code];
          const isEarned = earnedCodes.has(code);
          const earnedData = earned.find(a => a.achievement_code === code);
          const prog = !isEarned ? getProgress(code, stats) : null;
          const pct = prog ? Math.round((prog.current / prog.target) * 100) : 0;
          return (
            <Col xs={24} sm={12} md={8} key={code}>
              <Card
                style={{
                  ...cardStyle,
                  background: isEarned ? info.gradient : 'var(--bg-surface-2)',
                  opacity: isEarned ? 1 : 0.85,
                  filter: isEarned ? 'none' : 'grayscale(0.4)',
                  transition: 'all 0.3s',
                  cursor: isEarned ? 'default' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!isEarned && (
                  <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 20 }}>🔒</div>
                )}
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 8, filter: isEarned ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'grayscale(1) blur(1.5px) opacity(0.65)' }}>
                    {info.icon}
                  </div>
                  <Text strong style={{ display: 'block', fontSize: 15, color: isEarned ? '#fff' : 'var(--text-muted)', fontWeight: 800, letterSpacing: isEarned ? 0 : 2 }}>
                    {isEarned ? info.name : '??? ? ???'}
                  </Text>
                  <Text style={{ display: 'block', fontSize: 12, color: isEarned ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)', marginTop: 4, fontStyle: isEarned ? 'normal' : 'italic' }}>
                    {isEarned ? info.desc : info.hint}
                  </Text>
                  {isEarned && earnedData?.reward_xp && (
                    <Tag style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700 }}>
                      +{earnedData.reward_xp} XP
                    </Tag>
                  )}
                  {!isEarned && prog && (
                    <div style={{ marginTop: 12, padding: '0 6px' }}>
                      <Progress percent={pct} size="small" showInfo={false} strokeColor={info.color} trailColor="var(--border-color)" />
                      <Text style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>
                        {prog.current}/{prog.target} {prog.unit}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
