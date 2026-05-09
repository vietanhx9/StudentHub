import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Spin, Empty } from 'antd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ACHIEVEMENT_INFO = {
  welcome:        { icon: '🎁', name: 'Chào mừng bạn!',      desc: 'Đăng ký tài khoản lần đầu',          color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  first_task:     { icon: '✅', name: 'Task đầu tiên',        desc: 'Hoàn thành task đầu tiên trong đời',  color: '#4ECDC4', gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)' },
  streak_3:       { icon: '🔥', name: 'On Fire 3 ngày',       desc: 'Học liên tục 3 ngày không nghỉ',      color: '#FF6B35', gradient: 'linear-gradient(135deg, #FF6B35, #F7C59F)' },
  streak_7:       { icon: '⚡', name: 'Tuần vàng',            desc: 'Học liên tục 7 ngày không nghỉ',      color: '#F7C948', gradient: 'linear-gradient(135deg, #F7C948, #FF9F1C)' },
  tree_grown:     { icon: '🌳', name: 'Bàn tay xanh',         desc: 'Trồng cây đến giai đoạn trưởng thành', color: '#52B788', gradient: 'linear-gradient(135deg, #52B788, #2D6A4F)' },
  level_5:        { icon: '🏅', name: 'Chiến binh Lv.5',      desc: 'Đạt đến level 5',                     color: '#C13584', gradient: 'linear-gradient(135deg, #C13584, #833AB4)' },
  tasks_10:       { icon: '🎯', name: 'Thập toàn thập mỹ',    desc: 'Hoàn thành tổng cộng 10 tasks',       color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  deep_work_1h:   { icon: '🧘', name: 'Thiền sư Pomodoro',    desc: 'Học deep work tổng 1 giờ',            color: '#95E1D3', gradient: 'linear-gradient(135deg, #95E1D3, #4ECDC4)' },
};

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_INFO);

export default function AchievementsPage() {
  const { user } = useAuth();
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data } = await supabase.from('achievements').select('*').eq('user_id', user.id);
      setEarned(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

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
        <Tag style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
          {earnedCount}/{ALL_ACHIEVEMENTS.length} đã mở khóa
        </Tag>
      </Card>

      {/* ACHIEVEMENT GRID */}
      <Row gutter={[16, 16]}>
        {ALL_ACHIEVEMENTS.map(code => {
          const info = ACHIEVEMENT_INFO[code];
          const isEarned = earnedCodes.has(code);
          const earnedData = earned.find(a => a.achievement_code === code);
          return (
            <Col xs={24} sm={12} md={8} key={code}>
              <Card
                style={{
                  ...cardStyle,
                  background: isEarned ? info.gradient : 'var(--bg-surface-2)',
                  opacity: isEarned ? 1 : 0.55,
                  filter: isEarned ? 'none' : 'grayscale(0.7)',
                  transition: 'all 0.3s',
                  cursor: isEarned ? 'default' : 'not-allowed',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {!isEarned && (
                  <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 20 }}>🔒</div>
                )}
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 8, filter: isEarned ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none' }}>
                    {info.icon}
                  </div>
                  <Text strong style={{ display: 'block', fontSize: 15, color: isEarned ? '#fff' : 'var(--text-secondary)', fontWeight: 800 }}>
                    {info.name}
                  </Text>
                  <Text style={{ display: 'block', fontSize: 12, color: isEarned ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: 4 }}>
                    {info.desc}
                  </Text>
                  {isEarned && earnedData?.reward_xp && (
                    <Tag style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 20, fontWeight: 700 }}>
                      +{earnedData.reward_xp} XP
                    </Tag>
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
