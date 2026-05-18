import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Spin, Tooltip, Tag } from 'antd';
import { FireOutlined, CalendarOutlined, TrophyOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { Text } = Typography;

const WEEKS = 13;
const TOTAL_DAYS = WEEKS * 7;
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

const LEVEL_COLORS = [
  'var(--bg-surface-2)',
  '#C7E9C0',
  '#74C69D',
  '#40916C',
  '#1B4332',
];

const getVNDateStr = (d = new Date()) =>
  d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

const dateFromOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d;
};

const getActivityLevel = (log) => {
  if (!log) return 0;
  const tasks = log.tasks_done || 0;
  const deepMin = log.deep_work_minutes || 0;
  const score = tasks + (deepMin >= 60 ? 2 : deepMin >= 25 ? 1 : 0);
  if (score === 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 7) return 3;
  return 4;
};

export default function StreakCalendar() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const fromDate = getVNDateStr(dateFromOffset(TOTAL_DAYS - 1));
      const { data } = await supabase
        .from('daily_logs')
        .select('log_date, tasks_done, deep_work_minutes, xp_earned')
        .eq('user_id', user.id)
        .gte('log_date', fromDate)
        .order('log_date', { ascending: true });
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  const { grid, totalActive, bestStreak, monthMarkers } = useMemo(() => {
    const logMap = new Map((logs || []).map((l) => [l.log_date, l]));
    const today = new Date();
    const todayDay = today.getDay();
    const daysFromMonday = (todayDay + 6) % 7;

    const cells = [];
    let totalActive = 0;
    let bestStreak = 0;
    let currentRun = 0;

    const startOffset = TOTAL_DAYS - 1 + (6 - daysFromMonday);
    for (let i = startOffset; i >= -(6 - daysFromMonday); i--) {
      const d = dateFromOffset(i);
      const dateStr = getVNDateStr(d);
      const isFuture = i < 0;
      const log = logMap.get(dateStr);
      const level = isFuture ? -1 : getActivityLevel(log);
      if (level > 0) {
        totalActive++;
        currentRun++;
        if (currentRun > bestStreak) bestStreak = currentRun;
      } else if (!isFuture) {
        currentRun = 0;
      }
      cells.push({ date: dateStr, jsDate: d, level, log, isFuture, isToday: i === 0 });
    }

    const cols = [];
    for (let c = 0; c < WEEKS + 1; c++) {
      cols.push(cells.slice(c * 7, c * 7 + 7));
    }

    const markers = [];
    let lastMonth = -1;
    cols.forEach((col, ci) => {
      const firstCell = col.find((c) => !c.isFuture);
      if (!firstCell) return;
      const m = firstCell.jsDate.getMonth();
      if (m !== lastMonth) {
        markers.push({ col: ci, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    });

    return { grid: cols, totalActive, bestStreak, monthMarkers: markers };
  }, [logs]);

  const currentStreak = profile?.streak_days || 0;

  if (loading) {
    return (
      <Card style={{ borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24, textAlign: 'center', padding: 32 }}>
        <Spin />
      </Card>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        border: 'none',
        marginBottom: 24,
        borderTop: '6px solid #52B788',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>
          <CalendarOutlined style={{ marginRight: 6, color: '#52B788' }} /> Lịch hoạt động
        </Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Tag color="green" style={{ borderRadius: 20, fontWeight: 700 }}>
            <FireOutlined /> {currentStreak} ngày streak
          </Tag>
          <Tag color="orange" style={{ borderRadius: 20, fontWeight: 700 }}>
            <TrophyOutlined /> Best {bestStreak} ngày
          </Tag>
          <Tag style={{ borderRadius: 20, fontWeight: 700 }}>
            {totalActive}/{TOTAL_DAYS} ngày active
          </Tag>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'inline-block', minWidth: 'fit-content' }}>
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 4, height: 14 }}>
            {grid.map((col, ci) => {
              const marker = monthMarkers.find((m) => m.col === ci);
              return (
                <div key={ci} style={{ width: 14, marginRight: 3, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {marker ? marker.label : ''}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', marginRight: 6, gap: 3 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  style={{
                    height: 14,
                    fontSize: 9,
                    color: 'var(--text-muted)',
                    lineHeight: '14px',
                    visibility: i % 2 === 1 ? 'visible' : 'hidden',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {grid.map((col, ci) => (
                <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {col.map((cell, ri) => {
                    if (cell.isFuture) {
                      return <div key={ri} style={{ width: 14, height: 14 }} />;
                    }
                    const dateLabel = cell.jsDate.toLocaleDateString('vi-VN', {
                      day: 'numeric', month: 'numeric', year: 'numeric',
                    });
                    const tasks = cell.log?.tasks_done || 0;
                    const dw = cell.log?.deep_work_minutes || 0;
                    return (
                      <Tooltip
                        key={ri}
                        title={
                          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>{dateLabel}{cell.isToday ? ' (hôm nay)' : ''}</div>
                            <div>✅ {tasks} task</div>
                            <div>🧘 {dw} phút deep work</div>
                          </div>
                        }
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: LEVEL_COLORS[cell.level],
                            border: cell.isToday ? '1.5px solid #FF6B35' : '1px solid rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Ít</span>
        {LEVEL_COLORS.map((c, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: 3,
              background: c,
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          />
        ))}
        <span>Nhiều</span>
      </div>
    </Card>
  );
}
