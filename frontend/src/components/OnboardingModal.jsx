import React, { useState } from 'react';
import { Modal, Button, Typography } from 'antd';

const { Title, Text } = Typography;

const STEPS = [
  {
    emoji: '👋',
    title: 'Chào mừng đến với Student Hub!',
    body: 'Đây là không gian giúp bạn học tập đều đặn — bằng cách biến mỗi nhiệm vụ thành XP, mỗi giờ Deep Work thành thành quả, và nuôi một cây ảo qua từng ngày.',
  },
  {
    emoji: '📝',
    title: 'Bước 1 — Tạo task đầu tiên',
    body: 'Vào tab "Dashboard" và gõ một việc nhỏ cần làm hôm nay (ví dụ: "Đọc 10 trang sách"). Mỗi task hoàn thành = +15 XP + 1 giọt nước.',
  },
  {
    emoji: '⏱️',
    title: 'Bước 2 — Thử Deep Work',
    body: 'Tab "Deep Work" có Pomodoro timer + nhạc nền tập trung. Bấm "Vào Focus Mode" để chế độ toàn màn hình, ẩn mọi xao lãng.',
  },
  {
    emoji: '🌱',
    title: 'Bước 3 — Tưới cây',
    body: 'Tab "Cây của tôi" — dùng nước kiếm được để tưới cây ảo. Cây lớn theo XP của bạn qua 5 giai đoạn, đến giai đoạn cuối sẽ ra quả với hiệu ứng đặc biệt.',
  },
  {
    emoji: '🔥',
    title: 'Mẹo cuối — Giữ streak',
    body: 'Hoàn thành ít nhất 1 task mỗi ngày để duy trì chuỗi. Streak càng dài, XP nhân càng cao (lên đến x2.0). Daily Quest reset mỗi ngày giúp bạn luôn có mục tiêu nhỏ để bắt đầu.',
  },
];

export default function OnboardingModal({ open, onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) onClose();
    else setStep(step + 1);
  };

  const handleSkip = () => onClose();

  return (
    <Modal
      open={open}
      onCancel={handleSkip}
      footer={null}
      width={520}
      centered
      maskClosable={false}
      closable={false}
      styles={{ body: { padding: '40px 32px 28px', textAlign: 'center' } }}
    >
      <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>{current.emoji}</div>
      <Title level={3} style={{ margin: '0 0 12px', color: 'var(--text-primary)' }}>
        {current.title}
      </Title>
      <Text style={{ display: 'block', fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 28 }}>
        {current.body}
      </Text>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? '#FF6B6B' : 'var(--border-color)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Button shape="round" onClick={handleSkip} style={{ minWidth: 100 }}>
          Bỏ qua
        </Button>
        <Button
          type="primary"
          shape="round"
          onClick={handleNext}
          style={{ minWidth: 140, background: '#FF6B6B', border: 'none', fontWeight: 700 }}
        >
          {isLast ? '🚀 Bắt đầu thôi!' : `Tiếp tục (${step + 1}/${STEPS.length})`}
        </Button>
      </div>
    </Modal>
  );
}
