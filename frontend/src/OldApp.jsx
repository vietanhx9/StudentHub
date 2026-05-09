import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { Layout, Menu, Card, Typography, Input, Button, List, Tag, Statistic, Row, Col, Progress, message, Space, Avatar, Badge, Select, Timeline, Segmented, Checkbox, Modal } from 'antd';
import { HomeOutlined, DeleteOutlined, CalendarOutlined, CoffeeOutlined, RocketOutlined, ThunderboltOutlined, UserOutlined, StarFilled, TrophyOutlined } from '@ant-design/icons';
import { useTheme } from './contexts/ThemeContext';
import TreePage from './components/Dashboard/TreePage';
import AchievementsPage from './components/Dashboard/AchievementsPage';
import ProfilePage from './components/Dashboard/ProfilePage';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const getTodayVN = () => {
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[new Date().getDay()];
};

// Helper: ngày theo múi giờ Việt Nam (YYYY-MM-DD)
const getVNDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const getVNYesterdayStr = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
};

export default function App() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState({ name: '', day: getTodayVN(), note: '', priority: 'Medium' });
  const [quickInput, setQuickInput] = useState('');
  const [activeKey, setActiveKey] = useState('1');
  const [loading, setLoading] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);

  // ─── HELPER: Cấp achievement nếu chưa có ───────────────────────────────────
  const grantAchievement = async (code, xpBonus = 50) => {
    if (!user) return;
    // Kiểm tra đã có chưa
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_code', code)
      .maybeSingle();
    if (existing) return; // Đã có rồi, bỏ qua

    const { error } = await supabase.from('achievements').insert([{
      user_id: user.id,
      achievement_code: code,
      reward_xp: xpBonus,
    }]);
    if (!error) {
      message.success(`🏆 Mở khóa thành tích mới! +${xpBonus} XP bonus!`);
      await updateProfile({
        current_xp: (profile?.current_xp || 0) + xpBonus,
        total_xp: (profile?.total_xp || 0) + xpBonus,
      });
    }
  };

  // ─── HELPER: Kiểm tra toàn bộ achievement sau sự kiện ─────────────────────
  const checkAchievements = async ({ completedCount, newXp, newStreak, newDeepWorkMinutes }) => {
    // first_task: hoàn thành task đầu tiên
    if (completedCount >= 1) await grantAchievement('first_task', 30);
    // tasks_10: hoàn thành tổng 10 task
    if (completedCount >= 10) await grantAchievement('tasks_10', 100);
    // level_5: XP đủ level 5 (level = floor(log2(xp/50+1))+1 >= 5 => xp >= 750)
    if (newXp >= 750) await grantAchievement('level_5', 150);
    // streak_3
    if (newStreak >= 3) await grantAchievement('streak_3', 50);
    // streak_7
    if (newStreak >= 7) await grantAchievement('streak_7', 100);
    // deep_work_1h
    if (newDeepWorkMinutes !== undefined && newDeepWorkMinutes >= 60) await grantAchievement('deep_work_1h', 80);
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      message.success('Đã đăng xuất!');
    }
  };

  // --- STATE POMODORO & RULE 5S ---
  const [pomoMode, setPomoMode] = useState(25);
  const [timeLeft, setTimeLeft] = useState(1500); 
  const [isCounting, setIsCounting] = useState(false);
  const [showRule5s, setShowRule5s] = useState(false);
  const [countdown5s, setCountdown5s] = useState(5);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('id', { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchTasks(); }, [user]);

  // --- LOGIC RULE 5 GIÂY ---
  const startRule5s = () => {
    setShowRule5s(true);
    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown5s(count);
      if (count === 0) {
        clearInterval(timer);
        setShowRule5s(false);
        setIsCounting(true);
        message.info("Hết đường lui! CHIẾN THÔI! 🔥");
        setCountdown5s(5);
      }
    }, 1000);
  };

  const handleAddTask = async (name, day, note, priority, isQuick = false) => {
    if (!name.trim()) return message.warning('Nhập task vào đi bro!');
    const { error } = await supabase.from('tasks').insert([
      { Task_Name: name, day_of_week: day, description: note, priority: priority, is_completed: false, user_id: user.id }
    ]);

    if (error) {
      console.error('Lỗi thêm task:', error);
      message.error(`Thêm task thất bại: ${error.message}`);
    } else {
      message.success('Chốt đơn thành công! 🚀');
      if (isQuick) setQuickInput('');
      else setInput({ ...input, name: '', note: '' });
      fetchTasks();
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('tasks').update({ is_completed: newStatus }).eq('id', id);
    if (error) return;

    // 🎁 Thưởng khi hoàn thành task (không phạt khi bỏ tick)
    if (newStatus === true) {
      try {
        const xpReward = 15;
        const newXp = (profile?.current_xp || 0) + xpReward;
        const newTotal = (profile?.total_xp || 0) + xpReward;

        // Tính streak theo múi giờ Việt Nam
        const today = getVNDateStr();
        const lastActive = profile?.last_active_date;
        let newStreak = profile?.streak_days || 0;

        if (lastActive !== today) {
          const yesterday = getVNYesterdayStr();
          newStreak = (lastActive === yesterday) ? newStreak + 1 : 1;
        }

        // Cập nhật XP + streak
        await updateProfile({
          current_xp: newXp,
          total_xp: newTotal,
          streak_days: newStreak,
          last_active_date: today,
        });

        // +1 nước tưới cây
        const { data: inv } = await supabase
          .from('inventory').select('quantity')
          .eq('user_id', user.id).eq('item_type', 'water').single();

        if (inv) {
          await supabase.from('inventory')
            .update({ quantity: inv.quantity + 1 })
            .eq('user_id', user.id).eq('item_type', 'water');
        }

        message.success(`🎉 +${xpReward} XP ⚡ +1 💧 nước tưới cây!`);

        // Đếm tổng task đã hoàn thành
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true);

        // ✅ Kiểm tra và cấp achievements
        await checkAchievements({
          completedCount: (count || 0),
          newXp,
          newStreak,
        });
      } catch (e) {
        console.error('Lỗi thưởng task:', e);
      }
    }

    fetchTasks();
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
    if (!error) {
      message.success('Đã bay màu! 🗑️');
      fetchTasks();
    }
  };

  useEffect(() => {
    let interval = null;
    if (isCounting && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isCounting === false && pomoMode > 0) {
      // Phiên vừa kết thúc tự nhiên (timeLeft chạy về 0)
    } else if (timeLeft === 0) {
      setIsCounting(false);
      const minutesDone = pomoMode;
      const xpEarned = Math.round(minutesDone * 2); // 2 XP / phút
      const newSessions = pomoSessions + 1;
      setPomoSessions(newSessions);

      // Lưu vào DB: tăng deep_work_minutes và pomo_sessions
      (async () => {
        try {
          const prevMinutes = profile?.deep_work_minutes || 0;
          const newMinutes = prevMinutes + minutesDone;
          const newXp = (profile?.current_xp || 0) + xpEarned;
          await updateProfile({
            current_xp: newXp,
            total_xp: (profile?.total_xp || 0) + xpEarned,
            deep_work_minutes: newMinutes,
            pomo_sessions: (profile?.pomo_sessions || 0) + 1,
          });
          message.success(`🎉 Xong phiên ${minutesDone} phút! +${xpEarned} XP ⚡`);

          // Kiểm tra achievement deep_work_1h
          await checkAchievements({ newDeepWorkMinutes: newMinutes, newXp, completedCount: 0, newStreak: profile?.streak_days || 0 });
        } catch (e) {
          console.error('Lỗi lưu pomodoro:', e);
          message.success('Xong phiên Deep Work! 🎉');
        }
      })();
    }
    return () => clearInterval(interval);
  }, [isCounting, timeLeft]);

  const changePomoMode = (val) => {
    setPomoMode(val);
    setTimeLeft(val * 60);
    setIsCounting(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const completedCount = tasks.filter(t => t.is_completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const cardStyle = { borderRadius: 20, boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)' };

  const renderContent = () => {
    switch (activeKey) {
      case '1':
        return (
          <div className="animate-fade-in">
            {/* STATS RỰC RỠ NHƯ BẢN ĐẦU */}
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' }}>
                  <Statistic title={<Text style={{color: 'rgba(255,255,255,0.9)', fontWeight: 600}}>Tổng Task</Text>} value={tasks.length} valueStyle={{color: '#fff', fontSize: 40, fontWeight: '900'}} prefix={<StarFilled />} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #4ECDC4 0%, #556270 100%)' }}>
                  <Statistic title={<Text style={{color: 'rgba(255,255,255,0.9)', fontWeight: 600}}>Tiến độ hoàn thành</Text>} value={progressPercent} valueStyle={{color: '#fff', fontSize: 40, fontWeight: '900'}} suffix="%" />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #C13584 0%, #833AB4 100%)' }}>
                  <Statistic title={<Text style={{color: 'rgba(255,255,255,0.9)', fontWeight: 600}}>Chuỗi On Fire 🔥</Text>} value={profile?.streak_days || 0} valueStyle={{color: '#fff', fontSize: 40, fontWeight: '900'}} suffix="ngày" />
                </Card>
              </Col>
            </Row>

            <Card title={<Title level={4} style={{margin: 0, color: 'var(--text-primary)'}}>📈 Trạng thái chạy Deadline</Title>} style={{...cardStyle, marginTop: 24, borderTop: '6px solid #4ECDC4'}}>
                <Progress percent={progressPercent} status="active" strokeColor={{ '0%': '#FF6B6B', '100%': '#4ECDC4' }} strokeWidth={18} />
            </Card>

            {/* LIST TASK CẢI TIẾN */}
            <Card title={<Title level={4} style={{margin: 0, color: '#FF6B6B'}}>🎯 Nhiệm vụ hôm nay ({getTodayVN()})</Title>} style={{ ...cardStyle, marginTop: 24, borderLeft: '8px solid #FF6B6B' }}>
              <Space.Compact style={{ width: '100%', marginBottom: 25 }}>
                <Input size="large" placeholder="Sực nhớ ra việc gì? Điền liền tay..." value={quickInput} onChange={e => setQuickInput(e.target.value)} onPressEnter={() => handleAddTask(quickInput, getTodayVN(), 'Quick Add', 'Medium', true)} style={{borderRadius: '12px 0 0 12px', background: 'var(--input-bg)'}} />
                <Button size="large" type="primary" style={{background: '#FF6B6B', border: 'none', borderRadius: '0 12px 12px 0'}} onClick={() => handleAddTask(quickInput, getTodayVN(), 'Quick Add', 'Medium', true)}>🚀 Triển</Button>
              </Space.Compact>
              
              <List
                loading={loading}
                dataSource={tasks.filter(t => t.day_of_week === getTodayVN())}
                renderItem={item => (
                  <List.Item 
                    actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTask(item.id)} />]} 
                    style={{ background: 'var(--bg-surface-2)', marginBottom: 12, borderRadius: 16, padding: '16px 20px', border: '2px solid var(--border-color)' }}
                  >
                    <Checkbox checked={item.is_completed} onChange={() => toggleComplete(item.id, item.is_completed)}>
                      <Text delete={item.is_completed} strong style={{fontSize: 16, color: item.is_completed ? 'var(--text-muted)' : 'var(--text-primary)'}}>{item.Task_Name}</Text>
                      <div style={{color: 'var(--text-secondary)', fontSize: 12}}>{item.description}</div>
                    </Checkbox>
                    <Tag color={item.priority === 'High' ? 'red' : 'blue'} style={{borderRadius: 20, fontWeight: 'bold'}}>{item.priority}</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        );
      case '2':
        return (
          <Card style={cardStyle} title={<Title level={4} style={{margin: 0}}>🗓️ Master Schedule</Title>}>
            <div style={{ background: 'var(--bg-surface-3)', padding: 24, borderRadius: 20, marginBottom: 30 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}><Input size="large" placeholder="Tên nhiệm vụ..." value={input.name} onChange={e => setInput({...input, name: e.target.value})} /></Col>
                <Col span={6}>
                  <Select size="large" style={{width: '100%'}} value={input.day} onChange={v => setInput({...input, day: v})}>
                    {['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'].map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                </Col>
                <Col span={6}>
                  <Select size="large" style={{width: '100%'}} value={input.priority} onChange={v => setInput({...input, priority: v})}>
                    <Option value="High">Gấp (High)</Option>
                    <Option value="Medium">Vừa (Medium)</Option>
                    <Option value="Low">Thấp (Low)</Option>
                  </Select>
                </Col>
                <Col span={18}><Input size="large" placeholder="Ghi chú thêm..." value={input.note} onChange={e => setInput({...input, note: e.target.value})} /></Col>
                <Col span={6}><Button type="primary" size="large" block style={{background: '#4ECDC4', border: 'none', borderRadius: 12}} onClick={() => handleAddTask(input.name, input.day, input.note, input.priority)}>+ Thêm Lịch</Button></Col>
              </Row>
            </div>
            <Timeline mode="left" items={['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'].map(day => ({
              label: <Text strong>{day}</Text>,
              color: day === getTodayVN() ? '#FF6B6B' : 'blue',
              children: (
                <div style={{minHeight: 20}}>
                  {tasks.filter(t => t.day_of_week === day).map(t => (
                    <div key={t.id} style={{background: 'var(--bg-surface-2)', padding: '10px', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 8, display: 'flex', justifyContent: 'space-between'}}>
                      <Text delete={t.is_completed}>{t.Task_Name}</Text>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTask(t.id)} />
                    </div>
                  ))}
                </div>
              )
            }))} />
          </Card>
        );
      case '3':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <Card style={{ ...cardStyle, width: 500, textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface-2)' }}>
                <Title level={2} style={{color: 'var(--text-primary)', fontWeight: 800}}>FLOW STATE 🌌</Title>
                <Segmented size="large" block options={[5, 15, 25, 50]} value={pomoMode} onChange={changePomoMode} style={{ marginBottom: 40, borderRadius: 16 }} />
                <Progress type="circle" percent={(timeLeft / (pomoMode * 60)) * 100} width={260} strokeColor={{ '0%': '#FF6B6B', '100%': '#C13584' }} format={() => <Text style={{fontSize: 56, fontWeight: '900'}}>{formatTime(timeLeft)}</Text>} />
                <div style={{ marginTop: 50 }}>
                  {!isCounting ? (
                    <Button size="large" type="primary" shape="round" icon={<RocketOutlined />} style={{height: 60, width: 220, fontSize: 18, background: '#FF6B6B', border: 'none'}} onClick={startRule5s}>DIỆT TRÌ HOÃN (5S)</Button>
                  ) : (
                    <Button size="large" shape="round" style={{height: 60, width: 220}} onClick={() => setIsCounting(false)}>TẠM DỪNG</Button>
                  )}
                </div>
              </Card>

              <Modal open={showRule5s} footer={null} closable={false} centered>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Title level={2}>HÀNH ĐỘNG NGAY!</Title>
                  <div style={{ fontSize: 120, color: '#ff4d4f', fontWeight: 900 }}>{countdown5s}</div>
                  <Text type="secondary">Đừng để bộ não kịp nghĩ lý do để lười!</Text>
                </div>
              </Modal>
            </div>

            {/* STATS POMODORO */}
            <Row gutter={[16, 16]} style={{ marginTop: 24, maxWidth: 800, margin: '24px auto 0' }}>
              <Col xs={24} sm={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{pomoSessions + (profile?.pomo_sessions || 0)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4 }}>🍅 Phiên hôm nay</div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #95E1D3 0%, #4ECDC4 100%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{profile?.deep_work_minutes || 0}</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4 }}>⏱️ Tổng phút deep work</div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #F7C948 0%, #FF9F1C 100%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{Math.round((profile?.deep_work_minutes || 0) * 2)}</div>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4 }}>⚡ XP từ Focus</div>
                </Card>
              </Col>
            </Row>
          </div>
        );

      case '4': return <TreePage />;
      case '5': return <AchievementsPage />;
      case '6': return <ProfilePage />;
      default: return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', fontFamily: "'Inter', 'Nunito', sans-serif" }}>
      <Sider theme={theme} width={260} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)', borderRadius: 16, padding: '12px 20px', display: 'flex', alignItems: 'center', width: '100%', boxShadow: '0 4px 20px rgba(255,107,107,0.3)' }}>
                <RocketOutlined style={{ color: '#fff', fontSize: 24, marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>STUDENT HUB</Text>
            </div>
        </div>
        <Menu mode="inline" selectedKeys={[activeKey]} onClick={e => setActiveKey(e.key)} style={{ background: 'transparent', borderRight: 'none', padding: '10px 16px', fontWeight: 600 }} items={[
          { key: '1', icon: <HomeOutlined />, label: 'Dashboard' },
          { key: '2', icon: <CalendarOutlined />, label: 'Lịch chạy show' },
          { key: '3', icon: <CoffeeOutlined />, label: 'Góc Deep Work' },
          { type: 'divider' },
          { key: '4', icon: <span>🌳</span>, label: 'Cây của tôi' },
          { key: '5', icon: <TrophyOutlined />, label: 'Thành tích' },
          { key: '6', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
        ]} />
      </Sider>
      <Layout style={{ background: 'var(--bg-primary)' }}>
        <Header style={{ background: 'var(--bg-surface)', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', height: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)', boxShadow: '0 0 12px rgba(255,107,107,0.2)' }}>
                <ThunderboltOutlined /> {profile?.current_xp || 0} XP
              </Tag>
              <Tag style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, background: 'rgba(193,53,132,0.15)', color: '#C13584', border: '1px solid rgba(193,53,132,0.3)', boxShadow: '0 0 12px rgba(193,53,132,0.2)' }}>
                <StarFilled /> Lv.{Math.max(1, Math.floor(Math.log2((profile?.current_xp || 0) / 50 + 1)) + 1)}
              </Tag>
            </div>
            <Space size="middle">
                <Button type="text" shape="circle" onClick={toggleTheme} style={{fontSize: 20}}>
                  {theme === 'dark' ? '☀️' : '🌙'}
                </Button>
                <Tag style={{borderRadius: 20, padding: '4px 12px', fontWeight: 600, background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)'}}>
                  👤 {profile?.username || user?.email?.split('@')[0] || 'Student'}
                </Tag>
                <Badge dot color="#52c41a" onClick={() => setActiveKey('6')} style={{ cursor: 'pointer' }}>
                    <Avatar size="large" src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile?.username || 'student'}`} style={{ cursor: 'pointer', border: '2px solid rgba(255,255,255,0.15)' }} />
                </Badge>
            </Space>
        </Header>
        <Content style={{ padding: '32px 40px', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>
  );
}