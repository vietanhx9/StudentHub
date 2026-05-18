import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Tag, Progress, Divider, Row, Col, Input, message, Form, Upload } from 'antd';
import { UserOutlined, MailOutlined, CopyOutlined, EditOutlined, LogoutOutlined, SaveOutlined, CloseOutlined, TrophyOutlined, StarFilled, CameraOutlined, ExperimentOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import QuizPage, { CAUSE_META, SEVERITY_META, parseGroupCode } from './QuizPage';
import StreakCalendar from './StreakCalendar';

const { Title, Text } = Typography;

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

function getLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getXpToNext(xp) {
  const level = getLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return { current: xp, needed: xp, percent: 100 };
  const base = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  return {
    current: xp - base,
    needed: next - base,
    percent: Math.round(((xp - base) / (next - base)) * 100),
  };
}

const LEVEL_NAMES = ['', 'Mầm non 🌱', 'Học sinh 📚', 'Sinh viên 🎓', 'Chiến binh ⚔️',
  'Anh hùng 🦸', 'Huyền thoại 🌟', 'Bậc thầy 🔥', 'Thần đồng ⚡', 'Bất tử 👑', 'SIGMA 💎'];

export default function ProfilePage() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [form] = Form.useForm();

  if (showQuiz) {
    return <QuizPage onBack={() => setShowQuiz(false)} />;
  }

  const xp = profile?.current_xp || 0;
  const level = getLevel(xp);
  const xpInfo = getXpToNext(xp);
  const parsedGroup = parseGroupCode(profile?.procrastination_group);
  const userCause = parsedGroup ? CAUSE_META[parsedGroup.cause] : null;
  const userSeverity = parsedGroup ? SEVERITY_META[parsedGroup.severity] : null;
  const handleAvatarUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ hỗ trợ upload file hình ảnh!');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // Resize xuống tối đa 256x256, giữ tỉ lệ
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);

        const { error } = await updateProfile({ avatar_url: compressed });
        if (error) {
          message.error(`Lỗi avatar: ${error.message || JSON.stringify(error)}`);
        } else {
          message.success('Cập nhật avatar thành công! ✨');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleCopyFriendCode = () => {
    navigator.clipboard.writeText(profile?.friend_code || '');
    message.success('Đã copy Friend Code! 🎉');
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) message.error('Lỗi đăng xuất!');
  };

  const handleSave = async (values) => {
    const { error } = await updateProfile({ username: values.username });
    if (error) {
      message.error('Lỗi cập nhật!');
    } else {
      message.success('Đã lưu tên mới! ✅');
      setEditing(false);
    }
  };

  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* AVATAR + INFO CARD */}
      <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Upload showUploadList={false} beforeUpload={handleAvatarUpload} accept="image/*">
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Avatar
                size={100}
                src={profile?.avatar_url?.startsWith('data:') ? profile.avatar_url : null}
                style={{ backgroundColor: '#fff', border: '4px solid rgba(255,255,255,0.5)', flexShrink: 0 }}
              />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <CameraOutlined style={{ color: '#667eea', fontSize: 16 }} />
              </div>
            </div>
          </Upload>
          <div style={{ flex: 1 }}>
            {!editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Title level={3} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>
                  {profile?.username || 'Student'}
                </Title>
                <Button
                  size="small" icon={<EditOutlined />}
                  onClick={() => { setEditing(true); form.setFieldValue('username', profile?.username); }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8 }}
                />
              </div>
            ) : (
              <Form form={form} onFinish={handleSave} style={{ marginBottom: 8 }}>
                <Form.Item name="username" rules={[{ required: true }, { min: 3 }, { max: 20 }]} style={{ marginBottom: 8 }}>
                  <Input size="large" style={{ borderRadius: 10, fontWeight: 700, fontSize: 18 }} />
                </Form.Item>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button htmlType="submit" icon={<SaveOutlined />} type="primary" size="small" style={{ borderRadius: 8 }}>Lưu</Button>
                  <Button icon={<CloseOutlined />} size="small" onClick={() => setEditing(false)} style={{ borderRadius: 8 }}>Hủy</Button>
                </div>
              </Form>
            )}
            <Tag color="gold" style={{ borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
              <StarFilled /> Lv.{level} — {LEVEL_NAMES[level] || 'SIGMA 💎'}
            </Tag>
            <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: 13 }}>
              <MailOutlined style={{ marginRight: 6 }} />{user?.email}
            </Text>
          </div>
        </div>
      </Card>

      {/* XP CARD */}
      <Card style={{ ...cardStyle, marginBottom: 24, borderTop: '6px solid #FF6B6B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>⚡ Kinh nghiệm (XP)</Text>
          <Tag color="volcano" style={{ borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
            <TrophyOutlined /> {xp} XP tổng
          </Tag>
        </div>
        <Progress
          percent={xpInfo.percent}
          strokeColor={{ '0%': '#FF6B6B', '100%': '#C13584' }}
          strokeWidth={14}
          format={() => <Text style={{ fontSize: 12, color: '#555' }}>{xpInfo.current}/{xpInfo.needed}</Text>}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Còn {xpInfo.needed - xpInfo.current} XP nữa để lên Lv.{level + 1} ({LEVEL_NAMES[level + 1] || 'MAX'})
        </Text>
      </Card>

      {/* STREAK CALENDAR */}
      <StreakCalendar />

      {/* PHÂN TÍCH KIỂU TRÌ HOÃN */}
      {userCause ? (
        <Card style={{ ...cardStyle, marginBottom: 24, background: userCause.gradient, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 56, lineHeight: 1 }}>{userCause.emoji}</div>
            <div style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                KIỂU TRÌ HOÃN CỦA BẠN
              </Text>
              <Title level={4} style={{ margin: '4px 0', color: '#fff', fontWeight: 900 }}>
                {userCause.name}
              </Title>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Tag style={{ borderRadius: 20, fontWeight: 700, fontSize: 12, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff' }}>
                  Mức độ: {userSeverity.label}
                </Tag>
                <Tag style={{ borderRadius: 20, fontWeight: 700, fontSize: 12, background: userSeverity.color, border: 'none', color: '#fff' }}>
                  {userSeverity.percent}
                </Tag>
              </div>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setShowQuiz(true)}
              style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 10, fontWeight: 600, height: 40 }}
            >
              Làm lại
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ ...cardStyle, marginBottom: 24, borderTop: '6px solid #667eea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>🧪</div>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ margin: 0, marginBottom: 4 }}>Kiểm tra mức độ trì hoãn</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                8 câu hỏi nhanh để hiểu phong cách học tập của bạn và nhận gợi ý phù hợp
              </Text>
            </div>
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => setShowQuiz(true)}
              style={{ borderRadius: 10, fontWeight: 700, height: 44, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
            >
              Làm quiz
            </Button>
          </div>
        </Card>
      )}

      {/* FRIEND CODE + LOGOUT */}
      <Row gutter={16}>
        <Col span={14}>
          <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)', height: '100%' }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              🤝 Friend Code của bạn
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900, letterSpacing: 4 }}>
                #{profile?.friend_code || '----'}
              </Title>
              <Button
                icon={<CopyOutlined />} onClick={handleCopyFriendCode}
                style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 10 }}
              >
                Copy
              </Button>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, display: 'block' }}>
              Chia sẻ code này để kết bạn!
            </Text>
          </Card>
        </Col>
        <Col span={10}>
          <Card style={{ ...cardStyle, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Muốn nghỉ ngơi chút?</Text>
              <Button
                danger size="large" icon={<LogoutOutlined />} block onClick={handleLogout}
                style={{ borderRadius: 12, fontWeight: 700, height: 48 }}
              >
                Đăng xuất
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
