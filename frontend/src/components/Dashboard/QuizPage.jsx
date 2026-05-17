import React, { useState } from 'react';
import { Card, Button, Progress, Typography, Radio, Space, message, Tag } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

// Scores are hidden — options are shuffled on mount so order doesn't reveal answers
const RAW_QUESTIONS = [
  // ── SEVERITY (4) ──
  {
    axis: 'severity',
    q: 'Khi nhận task có deadline 1 tuần, bạn thường bắt đầu khi nào?',
    options: [
      { label: 'Trong 1–2 ngày đầu', score: 0 },
      { label: 'Khoảng giữa tuần', score: 1 },
      { label: 'Gần deadline (2–3 ngày cuối)', score: 2 },
      { label: 'Sát deadline hoặc xin gia hạn', score: 3 },
    ],
  },
  {
    axis: 'severity',
    q: 'Hiện tại bạn có bao nhiêu task "đang dở dang" chưa hoàn thành?',
    options: [
      { label: '0–1 task', score: 0 },
      { label: '2–3 task', score: 1 },
      { label: '4–6 task', score: 2 },
      { label: '7+ task hoặc không nhớ nổi', score: 3 },
    ],
  },
  {
    axis: 'severity',
    q: 'Bạn có hay tự nhủ "ngày mai sẽ làm" không?',
    options: [
      { label: 'Hiếm khi', score: 0 },
      { label: 'Thỉnh thoảng', score: 1 },
      { label: 'Khá thường xuyên', score: 2 },
      { label: 'Gần như mỗi ngày', score: 3 },
    ],
  },
  {
    axis: 'severity',
    q: 'Điều gì thường xảy ra khi deadline đến mà task vẫn chưa xong?',
    options: [
      { label: 'Tình huống này hầu như không xảy ra với mình', score: 0 },
      { label: 'Làm gấp nhưng vẫn kịp', score: 1 },
      { label: 'Nộp vội, chất lượng thấp', score: 2 },
      { label: 'Xin gia hạn hoặc bỏ luôn', score: 3 },
    ],
  },
  // ── PERFECTIONISM (3) ──
  {
    axis: 'perfectionism',
    q: 'Trước khi bắt đầu một task mới, bạn thường cần điều gì?',
    options: [
      { label: 'Bắt đầu luôn dù chưa chuẩn bị kỹ', score: 0 },
      { label: 'Hiểu rõ yêu cầu là đủ', score: 1 },
      { label: 'Lên kế hoạch chi tiết, tìm thêm tài liệu', score: 2 },
      { label: 'Chờ đến khi cảm thấy "sẵn sàng" hoàn toàn', score: 3 },
    ],
  },
  {
    axis: 'perfectionism',
    q: 'Khi sản phẩm của bạn "chưa đủ tốt", bạn có xu hướng...?',
    options: [
      { label: 'Nộp luôn — hoàn thành hơn là hoàn hảo', score: 0 },
      { label: 'Sửa một chút rồi nộp', score: 1 },
      { label: 'Làm lại nhiều lần cho đến khi ưng ý', score: 2 },
      { label: 'Không nộp vì sợ bị đánh giá thấp', score: 3 },
    ],
  },
  {
    axis: 'perfectionism',
    q: 'Nếu không thể làm tốt 100%, bạn cảm thấy thế nào?',
    options: [
      { label: 'Bình thường — cứ làm hết sức là được', score: 0 },
      { label: 'Hơi khó chịu nhưng vẫn làm', score: 1 },
      { label: 'Mất hứng, không muốn tiếp tục nữa', score: 2 },
      { label: 'Cảm thấy thất bại, thà không làm còn hơn', score: 3 },
    ],
  },
  // ── LOW ENERGY (3) ──
  {
    axis: 'lowenergy',
    q: 'Sau một ngày học / làm việc, bạn cảm thấy thế nào?',
    options: [
      { label: 'Vẫn còn sức để làm thêm việc khác', score: 0 },
      { label: 'Mệt bình thường, nghỉ xíu là ổn', score: 1 },
      { label: 'Khá kiệt sức, chỉ muốn nằm ra', score: 2 },
      { label: 'Kiệt sức hoàn toàn cả thể chất lẫn tinh thần', score: 3 },
    ],
  },
  {
    axis: 'lowenergy',
    q: 'Khi phải bắt đầu một task, cơ thể bạn phản ứng thế nào?',
    options: [
      { label: 'Bình thường, không có gì đặc biệt', score: 0 },
      { label: 'Hơi nặng nề nhưng vẫn làm được', score: 1 },
      { label: 'Mệt mỏi dù vừa mới nghỉ ngơi', score: 2 },
      { label: 'Choáng ngợp, không có sức để bắt đầu', score: 3 },
    ],
  },
  {
    axis: 'lowenergy',
    q: 'Bạn có hay bị mệt mỏi, thiếu năng lượng mà không rõ lý do không?',
    options: [
      { label: 'Hiếm khi', score: 0 },
      { label: 'Thỉnh thoảng', score: 1 },
      { label: 'Khá thường xuyên', score: 2 },
      { label: 'Hầu như lúc nào cũng vậy', score: 3 },
    ],
  },
  // ── DISTRACTION (3) ──
  {
    axis: 'distraction',
    q: 'Khi đang học, điện thoại của bạn thường ở trạng thái nào?',
    options: [
      { label: 'Tắt tiếng hoặc để xa, không để ý', score: 0 },
      { label: 'Để gần nhưng hiếm khi nhìn vào', score: 1 },
      { label: 'Kiểm tra mỗi 15–20 phút', score: 2 },
      { label: 'Cứ vài phút là cầm lên một lần', score: 3 },
    ],
  },
  {
    axis: 'distraction',
    q: 'Trong một buổi học 60 phút, bạn thực sự tập trung được bao lâu?',
    options: [
      { label: '50–60 phút', score: 0 },
      { label: '35–50 phút', score: 1 },
      { label: '15–35 phút', score: 2 },
      { label: 'Dưới 15 phút', score: 3 },
    ],
  },
  {
    axis: 'distraction',
    q: 'Bạn có hay mở tab / app không liên quan khi đang học không?',
    options: [
      { label: 'Hiếm khi', score: 0 },
      { label: 'Thỉnh thoảng, xem nhanh rồi đóng', score: 1 },
      { label: 'Khá thường xuyên, dễ bị cuốn vào', score: 2 },
      { label: 'Hầu như lúc nào cũng vậy', score: 3 },
    ],
  },
  // ── AVOIDANCE (2) ──
  {
    axis: 'avoidance',
    q: 'Khi gặp một task nhàm chán hoặc không thích, bạn...?',
    options: [
      { label: 'Vẫn làm ngay — nhàm cũng phải xong', score: 0 },
      { label: 'Làm nhưng hay bị gián đoạn giữa chừng', score: 1 },
      { label: 'Làm việc khác trước, để task đó lại', score: 2 },
      { label: 'Để đó đến tận khi không thể tránh được nữa', score: 3 },
    ],
  },
  {
    axis: 'avoidance',
    q: 'Bạn có hay tìm lý do "hợp lý" để trì hoãn (dọn phòng, ăn trước, v.v.) không?',
    options: [
      { label: 'Hiếm khi — biết là trì hoãn nên không tự lừa', score: 0 },
      { label: 'Thỉnh thoảng', score: 1 },
      { label: 'Khá thường xuyên', score: 2 },
      { label: 'Đây là "nghi lễ chuẩn bị" của mình trước khi làm', score: 3 },
    ],
  },
];

export const CAUSE_META = {
  perfectionism: {
    name: 'Người cầu toàn',
    emoji: '🎯',
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1, #531dab)',
  },
  lowenergy: {
    name: 'Người kiệt sức',
    emoji: '🔋',
    color: '#13c2c2',
    gradient: 'linear-gradient(135deg, #13c2c2, #0e8c8c)',
  },
  distraction: {
    name: 'Người mất tập trung',
    emoji: '📱',
    color: '#fa8c16',
    gradient: 'linear-gradient(135deg, #fa8c16, #d46b08)',
  },
  avoidance: {
    name: 'Người né tránh',
    emoji: '🌀',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff, #096dd9)',
  },
};

export const SEVERITY_META = {
  low:     { label: 'Thấp',         color: '#52c41a', percent: '0–25%' },
  medium:  { label: 'Vừa phải',     color: '#faad14', percent: '26–50%' },
  high:    { label: 'Cao',          color: '#fa8c16', percent: '51–75%' },
  extreme: { label: 'Nghiêm trọng', color: '#f5222d', percent: '76–100%' },
};

// Parse combined code like "perfectionism_high" or "lowenergy_extreme"
export function parseGroupCode(code) {
  if (!code) return null;
  const lastIdx = code.lastIndexOf('_');
  if (lastIdx === -1) return null;
  const cause = code.substring(0, lastIdx);
  const severity = code.substring(lastIdx + 1);
  if (!CAUSE_META[cause] || !SEVERITY_META[severity]) return null;
  return { cause, severity };
}

const CAUSE_DESC = {
  perfectionism: 'Bạn thường không bắt đầu vì sợ kết quả không đủ tốt. Tiêu chuẩn cao là điểm mạnh — nhưng đôi khi nó khóa chặt bạn trước vạch xuất phát.',
  lowenergy: 'Bạn muốn làm nhưng cơ thể và tinh thần thường xuyên đuối sức. Vấn đề không nằm ở ý chí mà ở việc quản lý năng lượng.',
  distraction: 'Bạn bị kéo khỏi công việc bởi điện thoại, mạng xã hội, hoặc mọi thứ xung quanh. Môi trường học tập đang "cướp" sự tập trung của bạn.',
  avoidance: 'Bạn có xu hướng tránh né task bằng cách tìm việc khác "cấp bách hơn". Sự né tránh thường đến từ cảm giác khó chịu với chính task đó.',
};

const CAUSE_ADVICE = {
  perfectionism: [
    'Đặt mục tiêu "đủ tốt" thay vì "hoàn hảo" — 80% hoàn thành > 0% chờ đợi',
    'Time-box mỗi phần: làm trong 25 phút rồi dừng, dù xong hay chưa',
    'Nộp bản thảo sớm để nhận feedback — hoàn thiện sau dễ hơn tự đoán trước',
  ],
  lowenergy: [
    'Học vào đúng giờ vàng của cơ thể (thường sáng sớm hoặc sau nghỉ trưa)',
    'Ưu tiên phục hồi: ngủ đủ giấc và nghỉ ngắn giữa các phiên là năng suất thật sự',
    'Dùng phiên Pomodoro ngắn — bắt đầu khi còn ít sức dễ hơn chờ đến lúc "đủ năng lượng"',
  ],
  distraction: [
    'Để điện thoại ngoài tầm tay (không chỉ úp màn hình — để ở phòng khác)',
    'Dùng Focus Mode để chặn hoàn toàn phần còn lại của màn hình khi học',
    'Đặt "giờ kiểm tra điện thoại" cố định thay vì kiểm tra bất kỳ lúc nào',
  ],
  avoidance: [
    'Khi muốn trì hoãn, hỏi bản thân: "Mình đang né tránh cảm giác gì?"',
    'Bắt đầu bằng phần nhỏ nhất của task — chỉ 5 phút, không cần hoàn thành',
    'Đặt task khó ở đầu ngày, trước khi não kịp tìm lý do né',
  ],
};

const AXIS_LABELS = {
  severity:      '📊 Mức độ trì hoãn',
  perfectionism: '🎯 Phong cách làm việc',
  lowenergy:     '🔋 Năng lượng',
  distraction:   '📱 Tập trung',
  avoidance:     '🌀 Né tránh',
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeResult(answers, questions) {
  const sevQuestions = questions.filter(q => q.axis === 'severity');
  const sevScore = sevQuestions.reduce((s, q) => s + (answers[questions.indexOf(q)] ?? 0), 0);
  const sevPct = sevScore / (sevQuestions.length * 3);
  const severity =
    sevPct <= 0.25 ? 'low' :
    sevPct <= 0.5  ? 'medium' :
    sevPct <= 0.75 ? 'high' : 'extreme';

  const causes = ['perfectionism', 'lowenergy', 'distraction', 'avoidance'];
  const causeScores = {};
  for (const cause of causes) {
    const cq = questions.filter(q => q.axis === cause);
    const total = cq.reduce((s, q) => s + (answers[questions.indexOf(q)] ?? 0), 0);
    causeScores[cause] = cq.length > 0 ? total / (cq.length * 3) : 0;
  }
  const cause = causes.reduce((a, b) => causeScores[a] >= causeScores[b] ? a : b);

  return { severity, cause, code: `${cause}_${severity}` };
}

export default function QuizPage({ onBack }) {
  const { updateProfile } = useAuth();

  const [questions] = useState(() =>
    RAW_QUESTIONS.map(q => ({ ...q, options: shuffleArray(q.options) }))
  );
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(RAW_QUESTIONS.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isResultStep = step === questions.length;
  const result = isResultStep ? computeResult(answers, questions) : null;
  const causeMeta = result ? CAUSE_META[result.cause] : null;
  const severityMeta = result ? SEVERITY_META[result.severity] : null;
  const progressPercent = isResultStep ? 100 : Math.round((step / questions.length) * 100);

  const handleSelect = (score) => {
    const next = [...answers];
    next[step] = score;
    setAnswers(next);
  };

  const handleNext = () => {
    if (answers[step] === null) { message.warning('Hãy chọn 1 đáp án trước nhé!'); return; }
    setStep(step + 1);
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ procrastination_group: result.code });
    setSaving(false);
    if (error) { message.error('Lỗi khi lưu kết quả!'); }
    else { setSaved(true); message.success('Đã lưu kết quả! 🎉'); }
  };

  const handleRetake = () => {
    setStep(0);
    setAnswers(Array(RAW_QUESTIONS.length).fill(null));
    setSaved(false);
  };

  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  // ===== KẾT QUẢ =====
  if (isResultStep && result) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Card style={{ ...cardStyle, background: causeMeta.gradient, marginBottom: 24, textAlign: 'center', padding: '20px 0', color: '#fff' }}>
          <div style={{ fontSize: 80, lineHeight: 1.2, marginBottom: 8 }}>{causeMeta.emoji}</div>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>NGUYÊN NHÂN TRÌ HOÃN CHÍNH CỦA BẠN</Text>
          <Title level={2} style={{ margin: '8px 0 12px', color: '#fff', fontWeight: 900 }}>{causeMeta.name}</Title>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <Tag style={{ borderRadius: 20, fontWeight: 700, fontSize: 13, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', padding: '4px 14px' }}>
              Mức độ: {severityMeta.label}
            </Tag>
            <Tag style={{ borderRadius: 20, fontWeight: 700, fontSize: 13, background: severityMeta.color, border: 'none', color: '#fff', padding: '4px 14px' }}>
              {severityMeta.percent}
            </Tag>
          </div>
          <Paragraph style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, padding: '0 24px', marginBottom: 0 }}>
            {CAUSE_DESC[result.cause]}
          </Paragraph>
        </Card>

        <Card style={{ ...cardStyle, marginBottom: 24, borderTop: `6px solid ${causeMeta.color}` }}>
          <Title level={4} style={{ marginTop: 0 }}>💡 Gợi ý dành riêng cho bạn</Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {CAUSE_ADVICE[result.cause].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <CheckCircleOutlined style={{ color: causeMeta.color, fontSize: 18, marginTop: 2 }} />
                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{a}</Text>
              </div>
            ))}
          </Space>
        </Card>

        <Card style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <Space size={12}>
              {!saved ? (
                <Button type="primary" size="large" loading={saving} onClick={handleSave}
                  style={{ borderRadius: 12, fontWeight: 700, background: causeMeta.gradient, border: 'none', minWidth: 180 }}>
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
  const currentQ = questions[step];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text strong style={{ fontSize: 14 }}>🧪 Quiz phân tích kiểu trì hoãn</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>Câu {step + 1}/{questions.length}</Text>
        </div>
        <Progress percent={progressPercent} strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }} showInfo={false} strokeWidth={8} />
        <div style={{ marginTop: 8 }}>
          <Tag style={{ fontSize: 11, borderRadius: 8 }}>{AXIS_LABELS[currentQ.axis]}</Tag>
        </div>
      </Card>

      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>{currentQ.q}</Title>
        <Radio.Group value={answers[step]} onChange={(e) => handleSelect(e.target.value)} style={{ width: '100%' }}>
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
                  <span style={{ fontSize: 14, marginLeft: 4 }}>{opt.label}</span>
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button size="large" icon={<ArrowLeftOutlined />} onClick={step === 0 ? onBack : handleBack}
          style={{ borderRadius: 12, fontWeight: 600, flex: 1, height: 48 }}>
          {step === 0 ? 'Hủy' : 'Câu trước'}
        </Button>
        <Button type="primary" size="large" onClick={handleNext}
          style={{ borderRadius: 12, fontWeight: 700, flex: 2, height: 48, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}>
          {step === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'} <ArrowRightOutlined />
        </Button>
      </div>
    </div>
  );
}
