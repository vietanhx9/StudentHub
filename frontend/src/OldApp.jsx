import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { Layout, Menu, Card, Typography, Input, InputNumber, Button, List, Tag, Statistic, Row, Col, Progress, message, Space, Avatar, Badge, Select, Timeline, Segmented, Checkbox, Modal, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { HomeOutlined, DeleteOutlined, CalendarOutlined, CoffeeOutlined, RocketOutlined, ThunderboltOutlined, UserOutlined, StarFilled, TrophyOutlined, TeamOutlined, CrownFilled, BarChartOutlined, SoundOutlined, StopOutlined, CloseOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { useTheme } from './contexts/ThemeContext';
import TreePage from './components/Dashboard/TreePage';
import AchievementsPage from './components/Dashboard/AchievementsPage';
import ProfilePage from './components/Dashboard/ProfilePage';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.8;
  if (streak >= 7)  return 1.5;
  if (streak >= 3)  return 1.2;
  return 1.0;
};

const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const today = new Date(getVNDateStr());
  const dl = new Date(deadline);
  const diffDays = Math.round((dl - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Quá hạn ${-diffDays} ngày`, color: '#ff4d4f' };
  if (diffDays === 0) return { label: 'Hôm nay!', color: '#fa8c16' };
  if (diffDays <= 2) return { label: `Còn ${diffDays} ngày`, color: '#faad14' };
  return { label: `Còn ${diffDays} ngày`, color: '#52c41a' };
};

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

const QUEST_POOL = [
  { id: 'tasks_1',     label: 'Hoàn thành 1 task hôm nay',  type: 'tasks',    target: 1,  xp: 15,  icon: '✅' },
  { id: 'tasks_3',     label: 'Hoàn thành 3 task hôm nay',  type: 'tasks',    target: 3,  xp: 30,  icon: '✅' },
  { id: 'tasks_5',     label: 'Hoàn thành 5 task hôm nay',  type: 'tasks',    target: 5,  xp: 50,  icon: '✅' },
  { id: 'deepwork_15', label: 'Deep Work 15 phút hôm nay',  type: 'deepwork', target: 15, xp: 20,  icon: '⏱️' },
  { id: 'deepwork_30', label: 'Deep Work 30 phút hôm nay',  type: 'deepwork', target: 30, xp: 40,  icon: '⏱️' },
  { id: 'deepwork_60', label: 'Deep Work 60 phút hôm nay',  type: 'deepwork', target: 60, xp: 80,  icon: '⏱️' },
  { id: 'streak_3',    label: 'Duy trì streak 3 ngày',       type: 'streak',   target: 3,  xp: 25,  icon: '🔥' },
  { id: 'streak_7',    label: 'Duy trì streak 7 ngày',       type: 'streak',   target: 7,  xp: 50,  icon: '🔥' },
];

const generateDailyQuests = (dateStr) => {
  let seed = parseInt(dateStr.replace(/-/g, ''), 10);
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 2147483648; return seed / 2147483648; };
  const pool = [...QUEST_POOL];
  const picked = [];
  while (picked.length < 3 && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.map(q => ({ ...q, claimed: false }));
};

export default function App() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState({ name: '', day: getTodayVN(), note: '', priority: 'Medium', deadline: null });
  const [quickInput, setQuickInput] = useState('');
  const [quickDeadline, setQuickDeadline] = useState(null);
  const [activeKey, setActiveKey] = useState('1');
  const [loading, setLoading] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [levelUpAnim, setLevelUpAnim] = useState(null);
  const [xpFlash, setXpFlash] = useState(false);
  const [floatingXps, setFloatingXps] = useState([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState(new Set());

  // ─── ANIMATION HELPERS ────────────────────────────────────────────────────
  const calcLevel = (xp) => Math.max(1, Math.floor(Math.log2(xp / 50 + 1)) + 1);

  const launchConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#FF6B6B','#4ECDC4','#F7C948','#C13584','#52c41a','#667eea','#fff'];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      w: Math.random() * 10 + 5, h: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 4 + 2,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 10,
    }));
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame / 200);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (frame < 220) requestAnimationFrame(animate);
      else document.body.removeChild(canvas);
    };
    animate();
  };

  const showFloatingXp = (amount) => {
    const id = Date.now() + Math.random();
    const x = window.innerWidth / 2 - 60 + (Math.random() - 0.5) * 120;
    const y = window.innerHeight / 2;
    setFloatingXps(prev => [...prev, { id, amount, x, y }]);
    setTimeout(() => setFloatingXps(prev => prev.filter(f => f.id !== id)), 1500);
  };

  const triggerXpEffects = (amount, oldXp, newXp) => {
    showFloatingXp(amount);
    setXpFlash(true);
    setTimeout(() => setXpFlash(false), 600);
    const oldLv = calcLevel(oldXp);
    const newLv = calcLevel(newXp);
    if (newLv > oldLv) {
      setTimeout(() => { setLevelUpAnim(newLv); launchConfetti(); }, 400);
    }
  };

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
  const [customMinutes, setCustomMinutes] = useState(null);
  const [countdown5s, setCountdown5s] = useState(5);
  const [currentSound, setCurrentSound] = useState(null);
  const audioCtxRef = useRef(null);
  const audioSourceRef = useRef(null);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('id', { ascending: false });
    if (!error) {
      setTasks(data || []);
      checkDeadlineNotifications(data || []);
    }
    setLoading(false);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const checkDeadlineNotifications = (taskList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const today = getVNDateStr();
    const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); })();
    const shownKey = `notified_${today}`;
    const alreadyShown = JSON.parse(localStorage.getItem(shownKey) || '[]');

    const toNotify = taskList.filter(t =>
      !t.is_completed &&
      t.deadline &&
      (t.deadline === today || t.deadline === tomorrow) &&
      !alreadyShown.includes(t.id)
    );

    toNotify.forEach(t => {
      const isToday = t.deadline === today;
      new Notification(`📅 ${isToday ? 'Deadline HÔM NAY!' : 'Deadline ngày mai'}`, {
        body: `Task: ${t.Task_Name}`,
        icon: '/vite.svg',
      });
    });

    if (toNotify.length > 0) {
      const newShown = [...alreadyShown, ...toNotify.map(t => t.id)];
      localStorage.setItem(shownKey, JSON.stringify(newShown));
    }
  };

  const fetchTodayLog = async () => {
    if (!user) return;
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', getVNDateStr()).maybeSingle();
    setTodayLog(data || null);
  };

  const loadDailyQuests = () => {
    const today = getVNDateStr();
    const key = `daily_quests_${today}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setDailyQuests(JSON.parse(stored));
    } else {
      Object.keys(localStorage).filter(k => k.startsWith('daily_quests_') && k !== key).forEach(k => localStorage.removeItem(k));
      const quests = generateDailyQuests(today);
      localStorage.setItem(key, JSON.stringify(quests));
      setDailyQuests(quests);
    }
  };

  const getQuestProgress = (quest, currentTasks, currentTodayLog, currentProfile) => {
    switch (quest.type) {
      case 'tasks':    return Math.min(quest.target, currentTasks.filter(t => t.is_completed && t.day_of_week === getTodayVN()).length);
      case 'deepwork': return Math.min(quest.target, currentTodayLog?.deep_work_minutes || 0);
      case 'streak':   return Math.min(quest.target, currentProfile?.streak_days || 0);
      default: return 0;
    }
  };

  const claimQuest = async (questId, xpReward) => {
    const today = getVNDateStr();
    const key = `daily_quests_${today}`;
    const updated = dailyQuests.map(q => q.id === questId ? { ...q, claimed: true } : q);
    localStorage.setItem(key, JSON.stringify(updated));
    setDailyQuests(updated);
    const newXp = (profile?.current_xp || 0) + xpReward;
    const newTotalXp = (profile?.total_xp || 0) + xpReward;
    await updateProfile({ current_xp: newXp, total_xp: newTotalXp });
    await upsertDailyLog(xpReward, 0, 0);
    showFloatingXp(xpReward);
    setXpFlash(true); setTimeout(() => setXpFlash(false), 600);
    message.success(`🎯 Quest hoàn thành! +${xpReward} XP bonus!`);
  };

  useEffect(() => { if (user) { requestNotificationPermission(); fetchTasks(); fetchTodayLog(); loadDailyQuests(); } }, [user]);

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

  const handleAddTask = async (name, day, note, priority, isQuick = false, deadline = null) => {
    if (!name.trim()) return message.warning('Nhập task vào đi bro!');
    const { error } = await supabase.from('tasks').insert([
      { Task_Name: name, day_of_week: day, description: note, priority: priority, is_completed: false, user_id: user.id, deadline: deadline || null }
    ]);

    if (error) {
      console.error('Lỗi thêm task:', error);
      message.error(`Thêm task thất bại: ${error.message}`);
    } else {
      message.success('Chốt đơn thành công! 🚀');
      if (isQuick) { setQuickInput(''); setQuickDeadline(null); }
      else setInput({ ...input, name: '', note: '', deadline: null });
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
        // Tính streak trước để biết multiplier
        const today = getVNDateStr();
        const lastActive = profile?.last_active_date;
        let newStreak = profile?.streak_days || 0;

        if (lastActive !== today) {
          const yesterday = getVNYesterdayStr();
          newStreak = (lastActive === yesterday) ? newStreak + 1 : 1;
        }

        const multiplier = getStreakMultiplier(newStreak);
        const xpReward = Math.round(15 * multiplier);
        const newXp = (profile?.current_xp || 0) + xpReward;
        const newTotal = (profile?.total_xp || 0) + xpReward;

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

        triggerXpEffects(xpReward, profile?.current_xp || 0, newXp);
        setRecentlyCompleted(prev => { const s = new Set(prev); s.add(id); return s; });
        setTimeout(() => setRecentlyCompleted(prev => { const s = new Set(prev); s.delete(id); return s; }), 900);

        const bonusLabel = multiplier > 1 ? ` (x${multiplier} streak bonus 🔥)` : '';
        message.success(`🎉 +${xpReward} XP ⚡${bonusLabel} +1 💧 nước tưới cây!`);

        await upsertDailyLog(xpReward, 0, 1);

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

  const fetchFriends = async () => {
    if (!user) return;
    setFriendsLoading(true);
    try {
      const { data: friendships } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id);
      const friendIds = (friendships || []).map(f => f.friend_id);

      let friendProfiles = [];
      if (friendIds.length > 0) {
        const { data } = await supabase.from('users').select('id, username, current_xp, streak_days, avatar_url, friend_code').in('id', friendIds);
        friendProfiles = data || [];
      }

      const allIds = [user.id, ...friendIds];
      const { data: taskRows } = await supabase.from('tasks').select('user_id').in('user_id', allIds).eq('is_completed', true);
      const countMap = {};
      (taskRows || []).forEach(t => { countMap[t.user_id] = (countMap[t.user_id] || 0) + 1; });

      const entries = [
        { id: user.id, username: profile?.username || 'Bạn', current_xp: profile?.current_xp || 0, streak_days: profile?.streak_days || 0, avatar_url: profile?.avatar_url, friend_code: profile?.friend_code, tasksDone: countMap[user.id] || 0, isSelf: true },
        ...friendProfiles.map(f => ({ ...f, tasksDone: countMap[f.id] || 0, isSelf: false }))
      ].sort((a, b) => b.current_xp - a.current_xp);

      setLeaderboard(entries);
    } catch (e) {
      console.error('Lỗi fetch friends:', e);
    }
    setFriendsLoading(false);
  };

  const addFriend = async () => {
    if (!friendCodeInput.trim()) return message.warning('Nhập friend code đi!');
    const { data: found } = await supabase.from('users').select('id, username').eq('friend_code', friendCodeInput.trim()).neq('id', user.id).limit(1);
    if (!found || found.length === 0) return message.error('Không tìm thấy người dùng với code này!');
    const friend = found[0];
    const { data: existing } = await supabase.from('friendships').select('id').eq('user_id', user.id).eq('friend_id', friend.id).maybeSingle();
    if (existing) return message.warning('Đã là bạn bè rồi!');
    const { error } = await supabase.from('friendships').insert([{ user_id: user.id, friend_id: friend.id }]);
    if (error) return message.error('Thêm bạn thất bại!');
    message.success(`Đã thêm ${friend.username} vào danh sách! 🎉`);
    setFriendCodeInput('');
    fetchFriends();
  };

  useEffect(() => { if (activeKey === '7') fetchFriends(); }, [activeKey]);

  const upsertDailyLog = async (xpDelta = 0, deepWorkDelta = 0, tasksDelta = 0) => {
    if (!user) return;
    const today = getVNDateStr();
    const { data: existing } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle();
    if (existing) {
      const updated = { xp_earned: existing.xp_earned + xpDelta, deep_work_minutes: existing.deep_work_minutes + deepWorkDelta, tasks_done: existing.tasks_done + tasksDelta };
      await supabase.from('daily_logs').update(updated).eq('id', existing.id);
      setTodayLog({ ...existing, ...updated });
    } else {
      const newLog = { user_id: user.id, log_date: today, xp_earned: xpDelta, deep_work_minutes: deepWorkDelta, tasks_done: tasksDelta };
      await supabase.from('daily_logs').insert([newLog]);
      setTodayLog(newLog);
    }
  };

  const fetchChartData = async () => {
    if (!user) return;
    setChartLoading(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fromDate = sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', fromDate).order('log_date', { ascending: true });

    // Điền đủ 7 ngày, ngày nào không có log thì = 0
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const label = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
      const log = (data || []).find(r => r.log_date === dateStr);
      result.push({ date: label, xp: log?.xp_earned || 0, deep_work: log?.deep_work_minutes || 0, tasks: log?.tasks_done || 0 });
    }
    setChartData(result);
    setChartLoading(false);
  };

  useEffect(() => { if (activeKey === '8') fetchChartData(); }, [activeKey]);

  useEffect(() => {
    let interval = null;
    if (isCounting && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isCounting === false && pomoMode > 0) {
      // Phiên vừa kết thúc tự nhiên (timeLeft chạy về 0)
    } else if (timeLeft === 0) {
      setIsCounting(false);
      playAlarmSound();
      const minutesDone = pomoMode;
      const calcXp = (mins) => {
        if (mins >= 90) return mins * 6 + 100;
        if (mins >= 60) return mins * 5 + 50;
        if (mins >= 30) return mins * 4 + 20;
        if (mins >= 15) return mins * 3;
        return mins * 2;
      };
      const multiplier = getStreakMultiplier(profile?.streak_days || 0);
      const xpEarned = Math.round(calcXp(minutesDone) * multiplier);
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
          triggerXpEffects(xpEarned, profile?.current_xp || 0, newXp);
          const label = minutesDone >= 90 ? '🏆 Huyền thoại tập trung!' : minutesDone >= 60 ? '🔥 Chiến binh tập trung!' : minutesDone >= 30 ? '💪 Xuất sắc!' : '🎉 Xong phiên!';
          message.success(`${label} +${xpEarned} XP ⚡ (${minutesDone} phút)`);

          await upsertDailyLog(xpEarned, minutesDone, 0);

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

  const playAlarmSound = () => {
    const ctx = new AudioContext();
    const beep = (start, dur, freq = 880) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    beep(ctx.currentTime, 0.3);
    beep(ctx.currentTime + 0.4, 0.3);
    beep(ctx.currentTime + 0.8, 0.6, 1100);
  };

  const changePomoMode = (val) => {
    setPomoMode(val);
    setTimeLeft(val * 60);
    setIsCounting(false);
    setCustomMinutes(null);
  };

  const stopSound = () => {
    try { audioSourceRef.current?.stop(); } catch (_) {}
    try { audioCtxRef.current?.close(); } catch (_) {}
    audioSourceRef.current = null;
    audioCtxRef.current = null;
    setCurrentSound(null);
  };

  const playNoise = (type) => {
    if (currentSound === type) { stopSound(); return; }
    stopSound();
    const ctx = new AudioContext();
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = type === 'white' ? 0.25 : 0.35;

    if (type === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(ctx.destination);
    source.start();

    audioCtxRef.current = ctx;
    audioSourceRef.current = source;
    setCurrentSound(type);
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

            {(() => {
              const streak = profile?.streak_days || 0;
              const mult = getStreakMultiplier(streak);
              const multColor = mult >= 2.0 ? '#C13584' : mult >= 1.8 ? '#FF6B6B' : mult >= 1.5 ? '#fa8c16' : mult >= 1.2 ? '#faad14' : 'var(--text-muted)';
              const multBg = mult >= 2.0 ? 'rgba(193,53,132,0.12)' : mult >= 1.8 ? 'rgba(255,107,107,0.12)' : mult >= 1.5 ? 'rgba(250,140,22,0.12)' : mult >= 1.2 ? 'rgba(250,173,20,0.12)' : 'var(--bg-surface-2)';
              return (
                <div style={{ marginTop: 16, padding: '10px 20px', borderRadius: 14, background: multBg, border: `1px solid ${multColor}40`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                  <Text style={{ fontWeight: 700, color: multColor, fontSize: 15 }}>Streak bonus: x{mult.toFixed(1)}</Text>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>— mọi XP nhận được đang được nhân {mult.toFixed(1)}x (streak {streak} ngày)</Text>
                </div>
              );
            })()}

            <Card
              title={<Title level={4} style={{ margin: 0, color: '#F7C948' }}>🎯 Daily Quest</Title>}
              extra={<Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>Reset mỗi ngày · {getVNDateStr()}</Text>}
              style={{ ...cardStyle, marginTop: 24, borderTop: '6px solid #F7C948' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dailyQuests.map(quest => {
                  const prog = getQuestProgress(quest, tasks, todayLog, profile);
                  const done = prog >= quest.target;
                  const pct = Math.round((prog / quest.target) * 100);
                  const unit = quest.type === 'tasks' ? 'task' : quest.type === 'deepwork' ? 'phút' : 'ngày';
                  return (
                    <div key={quest.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, background: quest.claimed ? 'rgba(82,196,26,0.07)' : 'var(--bg-surface-2)', border: `1px solid ${quest.claimed ? '#52c41a30' : done ? '#F7C94840' : 'var(--border-color)'}`, transition: 'all 0.3s' }}>
                      <div style={{ fontSize: 26 }}>{quest.icon}</div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ color: quest.claimed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: quest.claimed ? 'line-through' : 'none', fontSize: 14 }}>
                          {quest.label}
                        </Text>
                        <Progress percent={pct} size="small" showInfo={false} strokeColor={quest.claimed ? '#52c41a' : done ? '#F7C948' : '#4ECDC4'} trailColor="var(--border-color)" style={{ margin: '6px 0 2px' }} />
                        <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{prog} / {quest.target} {unit}</Text>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <div style={{ fontWeight: 800, color: '#F7C948', fontSize: 14, marginBottom: 6 }}>+{quest.xp} XP</div>
                        <Button
                          size="small"
                          shape="round"
                          disabled={!done || quest.claimed}
                          onClick={() => claimQuest(quest.id, quest.xp)}
                          style={done && !quest.claimed ? { background: '#F7C948', border: 'none', color: '#000', fontWeight: 700 } : {}}
                        >
                          {quest.claimed ? '✓ Đã nhận' : done ? 'Nhận thưởng' : 'Chưa xong'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title={<Title level={4} style={{margin: 0, color: 'var(--text-primary)'}}>📈 Trạng thái chạy Deadline</Title>} style={{...cardStyle, marginTop: 24, borderTop: '6px solid #4ECDC4'}}>
                <Progress percent={progressPercent} status="active" strokeColor={{ '0%': '#FF6B6B', '100%': '#4ECDC4' }} strokeWidth={18} />
            </Card>

            {/* LIST TASK CẢI TIẾN */}
            <Card title={<Title level={4} style={{margin: 0, color: '#FF6B6B'}}>🎯 Nhiệm vụ hôm nay ({getTodayVN()})</Title>} style={{ ...cardStyle, marginTop: 24, borderLeft: '8px solid #FF6B6B' }}>
              <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
                <Input size="large" placeholder="Sực nhớ ra việc gì? Điền liền tay..." value={quickInput} onChange={e => setQuickInput(e.target.value)} onPressEnter={() => handleAddTask(quickInput, getTodayVN(), 'Quick Add', 'Medium', true, quickDeadline ? quickDeadline.format('YYYY-MM-DD') : null)} style={{borderRadius: '12px 0 0 12px', background: 'var(--input-bg)'}} />
                <Button size="large" type="primary" style={{background: '#FF6B6B', border: 'none', borderRadius: '0 12px 12px 0'}} onClick={() => handleAddTask(quickInput, getTodayVN(), 'Quick Add', 'Medium', true, quickDeadline ? quickDeadline.format('YYYY-MM-DD') : null)}>🚀 Triển</Button>
              </Space.Compact>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>📅 Deadline (tùy chọn):</Text>
                <DatePicker size="small" value={quickDeadline} onChange={setQuickDeadline} placeholder="Chọn ngày hết hạn" style={{ borderRadius: 10 }} />
              </div>
              
              <List
                loading={loading}
                dataSource={tasks.filter(t => t.day_of_week === getTodayVN())}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTask(item.id)} />]}
                    className={recentlyCompleted.has(item.id) ? 'task-complete-anim' : ''}
                    style={{ background: 'var(--bg-surface-2)', marginBottom: 12, borderRadius: 16, padding: '16px 20px', border: '2px solid var(--border-color)', transition: 'all 0.3s' }}
                  >
                    <Checkbox checked={item.is_completed} onChange={() => toggleComplete(item.id, item.is_completed)}>
                      <Text delete={item.is_completed} strong style={{fontSize: 16, color: item.is_completed ? 'var(--text-muted)' : 'var(--text-primary)'}}>{item.Task_Name}</Text>
                      <div style={{color: 'var(--text-secondary)', fontSize: 12}}>{item.description}</div>
                    </Checkbox>
                    <Space size={6}>
                      {(() => { const info = getDeadlineInfo(item.deadline); return info ? <Tag style={{ borderRadius: 12, fontWeight: 600, fontSize: 11, color: info.color, borderColor: info.color, background: `${info.color}18` }}>📅 {info.label}</Tag> : null; })()}
                      <Tag color={item.priority === 'High' ? 'red' : 'blue'} style={{borderRadius: 20, fontWeight: 'bold'}}>{item.priority}</Tag>
                    </Space>
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
                <Col span={12}><Input size="large" placeholder="Ghi chú thêm..." value={input.note} onChange={e => setInput({...input, note: e.target.value})} /></Col>
                <Col span={6}><DatePicker size="large" style={{ width: '100%' }} placeholder="Deadline (tùy chọn)" value={input.deadline} onChange={v => setInput({...input, deadline: v})} /></Col>
                <Col span={6}><Button type="primary" size="large" block style={{background: '#4ECDC4', border: 'none', borderRadius: 12}} onClick={() => handleAddTask(input.name, input.day, input.note, input.priority, false, input.deadline ? input.deadline.format('YYYY-MM-DD') : null)}>+ Thêm Lịch</Button></Col>
              </Row>
            </div>
            <Timeline mode="left" items={['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'].map(day => ({
              label: <Text strong>{day}</Text>,
              color: day === getTodayVN() ? '#FF6B6B' : 'blue',
              children: (
                <div style={{minHeight: 20}}>
                  {tasks.filter(t => t.day_of_week === day).map(t => {
                    const dlInfo = getDeadlineInfo(t.deadline);
                    return (
                      <div key={t.id} style={{background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: 12, border: `1px solid ${dlInfo && !t.is_completed ? dlInfo.color + '60' : 'var(--border-color)'}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <Checkbox checked={t.is_completed} onChange={() => toggleComplete(t.id, t.is_completed)}>
                          <Text delete={t.is_completed} style={{ color: t.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{t.Task_Name}</Text>
                          {dlInfo && !t.is_completed && <div style={{ fontSize: 11, color: dlInfo.color, fontWeight: 600, marginTop: 2 }}>📅 {dlInfo.label}</div>}
                        </Checkbox>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTask(t.id)} />
                      </div>
                    );
                  })}
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
                <Segmented size="large" block options={[5, 15, 30, 60]} value={[5,15,30,60].includes(pomoMode) ? pomoMode : null} onChange={changePomoMode} style={{ marginBottom: 16, borderRadius: 16 }} />
                <Space style={{ marginBottom: 32 }}>
                  <InputNumber min={1} max={300} value={customMinutes} onChange={setCustomMinutes} placeholder="Phút tùy chỉnh" style={{ width: 150 }} addonAfter="phút" />
                  <Button shape="round" onClick={() => { if (customMinutes > 0) { setPomoMode(customMinutes); setTimeLeft(customMinutes * 60); setIsCounting(false); } }}>⏰ Đặt giờ</Button>
                </Space>
                <Progress type="circle" percent={(timeLeft / (pomoMode * 60)) * 100} width={260} strokeColor={{ '0%': '#FF6B6B', '100%': '#C13584' }} format={() => <Text style={{fontSize: 56, fontWeight: '900'}}>{formatTime(timeLeft)}</Text>} />
                <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  {!isCounting ? (
                    <Button size="large" type="primary" shape="round" icon={<RocketOutlined />} style={{height: 60, width: 220, fontSize: 18, background: '#FF6B6B', border: 'none'}} onClick={startRule5s}>DIỆT TRÌ HOÃN (5S)</Button>
                  ) : (
                    <Button size="large" shape="round" style={{height: 60, width: 220}} onClick={() => setIsCounting(false)}>TẠM DỪNG</Button>
                  )}
                  <Button shape="round" onClick={() => setFocusMode(true)} style={{ background: 'rgba(193,53,132,0.1)', color: '#C13584', border: '1px solid rgba(193,53,132,0.3)', fontWeight: 700 }}>
                    🎯 Vào Focus Mode
                  </Button>
                </div>
                <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', textAlign: 'left' }}>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>⚡ PHẦN THƯỞNG KHI HOÀN THÀNH</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { label: '< 15 phút', xp: '2 XP/phút' },
                      { label: '15 – 29 phút', xp: '3 XP/phút' },
                      { label: '30 – 59 phút', xp: '4 XP/phút + 20 bonus' },
                      { label: '60 – 89 phút', xp: '5 XP/phút + 50 bonus 🔥' },
                      { label: '≥ 90 phút', xp: '6 XP/phút + 100 bonus 🏆' },
                    ].map(({ label, xp }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</Text>
                        <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: 600 }}>{xp}</Text>
                      </div>
                    ))}
                  </div>
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

            {/* MUSIC PLAYER */}
            <div style={{ maxWidth: 600, margin: '24px auto 0' }}>
              <Card style={{ ...cardStyle, textAlign: 'center' }}>
                <Text style={{ fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 16 }}><SoundOutlined /> Nhạc nền tập trung</Text>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: currentSound === 'lofi' ? 16 : 0 }}>
                  {[
                    { key: 'rain',  label: '🌧 Mưa',        color: '#4ECDC4' },
                    { key: 'white', label: '⬜ White Noise', color: '#aaa' },
                    { key: 'brown', label: '🌊 Brown Noise', color: '#8B6914' },
                    { key: 'lofi',  label: '🎵 Lo-fi',       color: '#C13584' },
                  ].map(({ key, label, color }) => (
                    <Button
                      key={key}
                      shape="round"
                      onClick={() => {
                        if (key === 'lofi') {
                          if (currentSound === 'lofi') { stopSound(); }
                          else { stopSound(); setCurrentSound('lofi'); }
                        } else {
                          playNoise(key);
                        }
                      }}
                      style={{
                        fontWeight: 700,
                        background: currentSound === key ? color : 'var(--bg-surface-2)',
                        color: currentSound === key ? '#fff' : 'var(--text-primary)',
                        border: `2px solid ${currentSound === key ? color : 'var(--border-color)'}`,
                        boxShadow: currentSound === key ? `0 0 16px ${color}60` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >{label}</Button>
                  ))}
                  {currentSound && (
                    <Button shape="round" danger icon={<StopOutlined />} onClick={stopSound}>Dừng</Button>
                  )}
                </div>
                {currentSound === 'lofi' && (
                  <iframe
                    style={{ display: 'none' }}
                    src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1"
                    allow="autoplay"
                    title="lofi"
                  />
                )}
                {currentSound && currentSound !== 'lofi' && (
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, display: 'block' }}>
                    Đang phát — nhấn lại nút hoặc "Dừng" để tắt
                  </Text>
                )}
              </Card>
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
      case '8': {
        const bestDay = chartData.length ? chartData.reduce((a, b) => a.xp >= b.xp ? a : b) : null;
        return (
          <div className="animate-fade-in">
            <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 24 }}>📊 Thống kê 7 ngày qua</Title>

            {bestDay && bestDay.xp > 0 && (
              <div style={{ marginBottom: 24, padding: '14px 20px', borderRadius: 14, background: 'rgba(247,201,72,0.12)', border: '1px solid #F7C94850', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CrownFilled style={{ color: '#F7C948', fontSize: 22 }} />
                <Text style={{ fontWeight: 700, fontSize: 15 }}>Ngày productive nhất: <span style={{ color: '#F7C948' }}>{bestDay.date}</span></Text>
                <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>— {bestDay.xp} XP · {bestDay.deep_work} phút deep work · {bestDay.tasks} tasks</Text>
              </div>
            )}

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card style={cardStyle} title={<Text strong>⚡ XP kiếm được mỗi ngày</Text>}>
                  {chartLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Đang tải...</Text></div> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                        <Bar dataKey="xp" name="XP" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card style={cardStyle} title={<Text strong>⏱️ Phút Deep Work mỗi ngày</Text>}>
                  {chartLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Đang tải...</Text></div> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                        <Bar dataKey="deep_work" name="Phút" fill="#4ECDC4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </Col>
              <Col xs={24}>
                <Card style={cardStyle} title={<Text strong>✅ Tasks hoàn thành mỗi ngày</Text>}>
                  {chartLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Đang tải...</Text></div> : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10 }} />
                        <Line type="monotone" dataKey="tasks" name="Tasks" stroke="#C13584" strokeWidth={2.5} dot={{ r: 5, fill: '#C13584' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );
      }
      case '7':
        return (
          <div className="animate-fade-in">
            <Card style={{ ...cardStyle, marginBottom: 24 }} title={<Title level={4} style={{ margin: 0 }}>👥 Bạn bè & Leaderboard</Title>}>
              <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 14, background: 'var(--bg-surface-2)', border: '1px solid var(--border-color)' }}>
                <Text style={{ fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 12 }}>➕ Thêm bạn bằng Friend Code</Text>
                <Space.Compact style={{ width: '100%', maxWidth: 420 }}>
                  <Input size="large" placeholder="Nhập friend code (4 chữ số)..." value={friendCodeInput} onChange={e => setFriendCodeInput(e.target.value)} onPressEnter={addFriend} style={{ borderRadius: '12px 0 0 12px' }} maxLength={4} />
                  <Button size="large" type="primary" style={{ background: '#4ECDC4', border: 'none', borderRadius: '0 12px 12px 0' }} onClick={addFriend}>Thêm bạn</Button>
                </Space.Compact>
                <div style={{ marginTop: 10 }}>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Friend code của bạn: </Text>
                  <Tag style={{ borderRadius: 8, fontWeight: 700, fontSize: 14, letterSpacing: 2, background: 'rgba(78,205,196,0.15)', color: '#4ECDC4', border: '1px solid #4ECDC4' }}>{profile?.friend_code || '----'}</Tag>
                </div>
              </div>

              <Title level={5} style={{ marginBottom: 16 }}>🏆 Bảng xếp hạng</Title>
              {friendsLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Đang tải...</Text></div>
              ) : leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">Chưa có bạn bè nào. Thêm bạn bằng friend code nhé!</Text></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leaderboard.map((entry, idx) => {
                    const rankColor = idx === 0 ? '#F7C948' : idx === 1 ? '#aaa' : idx === 2 ? '#cd7f32' : 'var(--text-muted)';
                    const rankBg = idx === 0 ? 'rgba(247,201,72,0.12)' : idx === 1 ? 'rgba(170,170,170,0.08)' : 'var(--bg-surface-2)';
                    return (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderRadius: 16, background: entry.isSelf ? 'rgba(78,205,196,0.1)' : rankBg, border: `2px solid ${entry.isSelf ? '#4ECDC4' : idx === 0 ? '#F7C94840' : 'var(--border-color)'}` }}>
                        <div style={{ width: 36, textAlign: 'center', fontWeight: 900, fontSize: 20, color: rankColor }}>
                          {idx === 0 ? <CrownFilled /> : `#${idx + 1}`}
                        </div>
                        <Avatar size={44} src={entry.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${entry.username}`} style={{ border: `2px solid ${entry.isSelf ? '#4ECDC4' : 'var(--border-color)'}` }} />
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{entry.username}{entry.isSelf && <Tag style={{ marginLeft: 8, borderRadius: 10, fontSize: 11, background: 'rgba(78,205,196,0.2)', color: '#4ECDC4', border: 'none' }}>Bạn</Tag>}</Text>
                        </div>
                        <Space size={20}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: 18, color: '#FF6B6B' }}>{entry.current_xp}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: 18, color: '#fa8c16' }}>{entry.streak_days}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔥 Streak</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 900, fontSize: 18, color: '#52c41a' }}>{entry.tasksDone}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>✅ Tasks</div>
                          </div>
                        </Space>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        );
      default: return null;
    }
  };

  if (focusMode) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a24 50%, #0a1a2a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <Button
          shape="round"
          icon={<CloseOutlined />}
          onClick={() => setFocusMode(false)}
          style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          Thoát
        </Button>

        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase', marginBottom: 40 }}>
          {pomoMode} PHÚT · DEEP WORK 🌌
        </Text>

        <div className={isCounting ? 'timer-glow' : ''} style={{ fontSize: 160, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'monospace', marginBottom: 48 }}>
          {formatTime(timeLeft)}
        </div>

        <Progress percent={Math.round((timeLeft / (pomoMode * 60)) * 100)} showInfo={false} strokeColor={{ '0%': '#FF6B6B', '100%': '#C13584' }} strokeWidth={6} style={{ width: 400, marginBottom: 56 }} trailColor="rgba(255,255,255,0.08)" />

        <div style={{ marginBottom: 48 }}>
          {!isCounting ? (
            <Button size="large" type="primary" shape="round" icon={<RocketOutlined />} style={{ height: 64, width: 240, fontSize: 18, background: 'linear-gradient(135deg, #FF6B6B, #C13584)', border: 'none', boxShadow: '0 0 40px rgba(255,107,107,0.4)' }} onClick={startRule5s}>
              BẮT ĐẦU
            </Button>
          ) : (
            <Button size="large" shape="round" style={{ height: 64, width: 240, fontSize: 18, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }} onClick={() => setIsCounting(false)}>
              TẠM DỪNG
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { key: 'rain',  label: '🌧 Mưa',  color: '#4ECDC4' },
            { key: 'white', label: '⬜ White', color: '#aaa' },
            { key: 'brown', label: '🌊 Brown', color: '#8B6914' },
            { key: 'lofi',  label: '🎵 Lo-fi', color: '#C13584' },
          ].map(({ key, label, color }) => (
            <Button key={key} shape="round" size="small"
              onClick={() => { if (key === 'lofi') { if (currentSound === 'lofi') stopSound(); else { stopSound(); setCurrentSound('lofi'); } } else { playNoise(key); } }}
              style={{ fontWeight: 700, background: currentSound === key ? color : 'rgba(255,255,255,0.06)', color: currentSound === key ? '#fff' : 'rgba(255,255,255,0.55)', border: `1px solid ${currentSound === key ? color : 'rgba(255,255,255,0.15)'}` }}
            >{label}</Button>
          ))}
          {currentSound && <Button shape="round" size="small" danger icon={<StopOutlined />} onClick={stopSound}>Dừng</Button>}
        </div>

        {currentSound === 'lofi' && <iframe style={{ display: 'none' }} src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" allow="autoplay" title="lofi" />}

        <Modal open={showRule5s} footer={null} closable={false} centered>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={2}>HÀNH ĐỘNG NGAY!</Title>
            <div style={{ fontSize: 120, color: '#ff4d4f', fontWeight: 900 }}>{countdown5s}</div>
            <Text type="secondary">Đừng để bộ não kịp nghĩ lý do để lười!</Text>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <>
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
          { key: '7', icon: <TeamOutlined />, label: 'Bạn bè' },
          { key: '8', icon: <BarChartOutlined />, label: 'Thống kê' },
        ]} />
      </Sider>
      <Layout style={{ background: 'var(--bg-primary)' }}>
        <Header style={{ background: 'var(--bg-surface)', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', height: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag className={xpFlash ? 'xp-flash' : ''} style={{ borderRadius: 20, padding: '4px 14px', fontWeight: 700, background: 'rgba(255,107,107,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)', boxShadow: '0 0 12px rgba(255,107,107,0.2)' }}>
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
                    <Avatar size="large" src={profile?.avatar_url?.startsWith('data:') ? profile.avatar_url : null} style={{ cursor: 'pointer', border: '2px solid rgba(255,255,255,0.15)', backgroundColor: '#fff' }} />
                </Badge>
            </Space>
        </Header>
        <Content style={{ padding: '32px 40px', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>

    {/* ── Floating XP text ── */}
    {floatingXps.map(f => (
      <div key={f.id} className="float-xp" style={{ left: f.x, top: f.y }}>
        +{f.amount} XP ⚡
      </div>
    ))}

    {/* ── Level Up Modal ── */}
    <Modal
      open={!!levelUpAnim}
      footer={null}
      closable={false}
      centered
      width={480}
      onCancel={() => setLevelUpAnim(null)}
      afterOpenChange={(open) => { if (open) setTimeout(() => setLevelUpAnim(null), 4000); }}
      styles={{ mask: { backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }, content: { background: 'linear-gradient(135deg,#1a0a24 0%,#0a1a2a 100%)', border: '1px solid rgba(247,201,72,0.3)', borderRadius: 28, padding: 0, overflow: 'hidden' } }}
    >
      <div style={{ textAlign: 'center', padding: '52px 40px 44px', animation: 'levelUpEntrance 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ fontSize: 72, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 6, color: '#F7C948', textTransform: 'uppercase', marginBottom: 16, opacity: 0.8 }}>Level Up!</div>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg,#F7C948,#FF6B6B,#C13584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 20 }}>
          Lv.{levelUpAnim}
        </div>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Siêu phẩm! Mày đang ngày càng xịn hơn 🔥</Text>
        <div style={{ marginTop: 32 }}>
          <Button shape="round" onClick={() => setLevelUpAnim(null)} style={{ background: 'linear-gradient(135deg,#F7C948,#FF9F1C)', border: 'none', color: '#000', fontWeight: 800, height: 44, padding: '0 32px', fontSize: 15 }}>
            Tiếp tục cày! 💪
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}