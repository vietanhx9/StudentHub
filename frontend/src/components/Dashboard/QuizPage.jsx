import React, { useState } from 'react';
import { Card, Button, Progress, Typography, Radio, Space, message, Tag } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const QUESTIONS = [
  {
    q: 'Khi nhận được task có deadline 1 tuần, bạn thường:',
    options: [
      { label: 'Bắt đầu ngay trong 1–2 ngày đầu', score: 0 },
      { label: 'Bắt đầu khi có hứng, thường giữa tuần', score: 1 },
      { label: 'Đợi đến gần deadline mới làm', score: 2 },
      { label: 'Làm sát deadline hoặc xin gia hạn', score: 3 },
    ],
  },
  {
    q: 'Khi mở 1 task lớn, phản ứng đầu tiên của bạn:',
    options: [
      { label: 'Lập tức lên kế hoạch và bắt tay làm', score: 0 },
      { label: 'Cảm thấy hứng thú, bắt đầu từ phần dễ nhất', score: 1 },
      { label: 'Đóng lại, làm việc khác trước cho dễ thở', score: 2 },
      { label: 'Cảm thấy choáng ngợp và muốn trốn tránh', score: 3 },
    ],
  },
  {
    q: 'Bạn có bao nhiêu task đang dở dang trong tuần này?',
    options: [
      { label: '0–1 task', score: 0 },
      { label: '2–3 task', score: 1 },
      { label: '4–6 task', score: 2 },
      { label: '7+ task hoặc không nhớ nổi', score: 3 },
    ],
  },
  {
    q: 'Khi đang học, bạn có dễ bị mạng xã hội/game cuốn đi không?',
    options: [
      { label: 'Hiếm khi, tôi giữ tập trung tốt', score: 0 },
      { label: 'Thỉnh thoảng, kiểm tra rồi quay lại học', score: 1 },
      { label: 'Khá thường xuyên, dễ mất 30+ phút', score: 2 },
      { label: 'Gần như lúc nào cũng vậy', score: 3 },
    ],
  },
  {
    q: 'Bạn có thường tự nói "ngày mai sẽ làm" không?',
    options: [
      { label: 'Hầu như không', score: 0 },
      { label: 'Thỉnh thoảng', score: 1 },
      { label: 'Khá thường xuyên', score: 2 },
      { label: 'Đó là câu cửa miệng của tôi', score: 3 },
    ],
  },
  {
    q: 'Khi deadline còn 24h và task vẫn chưa xong, bạn:',
    options: [
      { label: 'Đã làm xong từ lâu, không gặp tình huống này', score: 0 },
      { label: 'Làm gấp nhưng vẫn kịp deadline', score: 1 },
      { label: 'Làm vội vàng, chất lượng thấp', score: 2 },
      { label: 'Xin gia hạn hoặc bỏ qua luôn', score: 3 },
    ],
  },
  {
    q: 'Bạn cảm thấy thế nào sau khi hoàn thành 1 task đúng hạn?',
    options: [
      { label: 'Bình thường, đó là chuyện hiển nhiên', score: 0 },
      { label: 'Vui và có động lực làm task tiếp theo', score: 1 },
      { label: 'Nhẹ nhõm nhưng kiệt sức', score: 2 },
      { label: 'Hiếm khi xảy ra để có cảm xúc', score: 3 },
    ],
  },
  {
    q: 'Khi cần ôn cho 1 kỳ thi quan trọng, bạn:',
    options: [
      { label: 'Lập kế hoạch ôn từ nhiều tuần trước', score: 0 },
      { label: 'Học theo cảm hứng, ngày nhiều ngày ít', score: 1 },
      { label: 'Học chủ yếu vào tuần cuối', score: 2 },
      { label: 'Nhồi nhét 1–2 ngày trước thi', score: 3 },
    ],
  },
];

const GROUPS = {
  disciplined: {
    code: 'disciplined',
    name: 'Chiến thần kỷ luật',
    range: '0–20%',
    emoji: '⚔️',
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #52c41a, #389e0d)',
    desc: 'Bạn gần như luôn hoàn thành công việc trước deadline. Đây là điều tuyệt vời, nhưng cũng tiềm ẩn nguy cơ burnout cao.',
    advice: [
      'Đừng ép bản thân học quá nhiều — nghỉ ngơi cũng là một phần của hiệu suất',
      'Sau mỗi 3 phiên Pomodoro, hãy nghỉ ít nhất 15 phút',
      'Cân bằng giữa học tập và phục hồi năng lượng',
    ],
  },
  moody: {
    code: 'moody',
    name: 'Người làm theo cảm hứng',
    range: '21–50%',
    emoji: '🎨',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff, #096dd9)',
    desc: 'Khi có hứng, bạn làm việc rất nhanh và hiệu quả. Nhưng khi mất mood, mọi thứ dễ bị bỏ dở giữa chừng.',
    advice: [
      'Khi không có hứng, hãy thử quy tắc "chỉ 10 phút thôi"',
      'Tận dụng những lúc cảm hứng cao để xử lý task khó',
      'Đặt deadline nhỏ hàng ngày thay vì 1 deadline lớn',
    ],
  },
  waiter: {
    code: 'waiter',
    name: 'Chuyên gia đợi chờ',
    range: '51–80%',
    emoji: '⏰',
    color: '#fa8c16',
    gradient: 'linear-gradient(135deg, #fa8c16, #d4380d)',
    desc: 'Bạn thường nói "còn thời gian mà" rồi đến sát deadline mới bắt đầu. Áp lực giúp bạn làm việc, nhưng chất lượng thường không cao.',
    advice: [
      'Dùng Focus Mode + Pomodoro để biến trì hoãn thành hành động',
      'Đặt deadline giả sớm hơn deadline thật 2–3 ngày',
      'Bắt đầu với phiên 25 phút — đừng đợi đến khi "sẵn sàng"',
    ],
  },
  redalert: {
    code: 'redalert',
    name: 'Báo động đỏ',
    range: '81–100%',
    emoji: '🚨',
    color: '#f5222d',
    gradient: 'linear-gradient(135deg, #f5222d, #a8071a)',
    desc: 'Áp lực càng lớn càng dễ khiến bạn sợ hãi và bỏ cuộc. Task lớn thường khiến bạn không bắt đầu được.',
    advice: [
      'Chia mọi task thành các bước nhỏ nhất có thể (dưới 15 phút)',
      'Không đặt mục tiêu "hoàn thành" — chỉ đặt mục tiêu "bắt đầu"',
      'Mỗi lần học xong 1 phiên ngắn, hãy tự thưởng bản thân',
    ],
  },
};

function getGroupByScore(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct <= 20) return GROUPS.disciplined;
  if (pct <= 50) return GROUPS.moody;
  if (pct <= 80) return GROUPS.waiter;
  return GROUPS.redalert;
}

export default function QuizPage({ onBack }) {
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1 = câu hỏi, == QUESTIONS.length = kết quả
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const maxScore = QUESTIONS.length * 3;
  const totalScore = answers.reduce((s, a) => s + (a ?? 0), 0);
  const isResultStep = step === QUESTIONS.length;
  const group = isResultStep ? getGroupByScore(totalScore, maxScore) : null;
  const progressPercent = isResultStep ? 100 : Math.round((step / QUESTIONS.length) * 100);

  const handleSelect = (score) => {
    const next = [...answers];
    next[step] = score;
    setAnswers(next);
  };

  const handleNext = () => {
    if (answers[step] === null) {
      message.warning('Hãy chọn 1 đáp án trước nhé!');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ procrastination_group: group.code });
    setSaving(false);
    if (error) {
      message.error('Lỗi khi lưu kết quả!');
    } else {
      setSaved(true);
      message.success('Đã lưu kết quả của bạn! 🎉');
    }
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setSaved(false);
  };

  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  // ===== KẾT QUẢ =====
  if (isResultStep) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Card style={{ ...cardStyle, background: group.gradient, marginBottom: 24, textAlign: 'center', padding: '20px 0', color: '#fff' }}>
          <div style={{ fontSize: 80, lineHeight: 1.2, marginBottom: 8 }}>{group.emoji}</div>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>NHÓM CỦA BẠN</Text>
          <Title level={2} style={{ margin: '8px 0 12px', color: '#fff', fontWeight: 900 }}>{group.name}</Title>
          <Tag style={{ borderRadius: 20, fontWeight: 700, fontSize: 13, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', padding: '4px 14px' }}>
            Mức trì hoãn: {group.range}
          </Tag>
          <Paragraph style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, marginTop: 16, padding: '0 24px' }}>
            {group.desc}
          </Paragraph>
        </Card>

        <Card style={{ ...cardStyle, marginBottom: 24, borderTop: `6px solid ${group.color}` }}>
          <Title level={4} style={{ marginTop: 0 }}>💡 Gợi ý dành riêng cho bạn</Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {group.advice.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CheckCircleOutlined style={{ color: group.color, fontSize: 18, marginTop: 2 }} />
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{a}</Text>
              </div>
            ))}
          </Space>
        </Card>

        <Card style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              Điểm: {totalScore}/{maxScore}
            </Text>
            <Space size={12}>
              {!saved ? (
                <Button type="primary" size="large" loading={saving} onClick={handleSave}
                  style={{ borderRadius: 12, fontWeight: 700, background: group.gradient, border: 'none', minWidth: 180 }}>
                  Lưu kết quả
                </Button>
              ) : (
                <Button size="large" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ borderRadius: 12, fontWeight: 700 }}>
                  Quay lại Hồ sơ
                </Button>
              )}
              <Button size="large" icon={<ReloadOutlined />} onClick={handleRetake} style={{ borderRadius: 12 }}>
                Làm lại
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  // ===== CÂU HỎI =====
  const currentQ = QUESTIONS[step];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text strong style={{ fontSize: 14 }}>📋 Quiz kiểm tra mức độ trì hoãn</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>Câu {step + 1}/{QUESTIONS.length}</Text>
        </div>
        <Progress percent={progressPercent} strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }} showInfo={false} strokeWidth={8} />
      </Card>

      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>{currentQ.q}</Title>
        <Radio.Group
          value={answers[step]}
          onChange={(e) => handleSelect(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {currentQ.options.map((opt, i) => {
              const selected = answers[step] === opt.score;
              return (
                <Radio
                  key={i}
                  value={opt.score}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: selected ? '2px solid #667eea' : '2px solid rgba(128,128,128,0.25)',
                    background: selected ? 'rgba(102,126,234,0.15)' : 'transparent',
                    margin: 0,
                    fontWeight: selected ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 14, marginLeft: 4, color: 'inherit' }}>{opt.label}</span>
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={step === 0 ? onBack : handleBack}
          style={{ borderRadius: 12, fontWeight: 600, flex: 1, height: 48 }}
        >
          {step === 0 ? 'Hủy' : 'Câu trước'}
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={handleNext}
          style={{ borderRadius: 12, fontWeight: 700, flex: 2, height: 48, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
        >
          {step === QUESTIONS.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRightOutlined />
        </Button>
      </div>
    </div>
  );
}

export { GROUPS };
