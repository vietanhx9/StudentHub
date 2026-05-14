/**
 * SIGNUP COMPONENT - Premium Redesign
 * Multi-step: Thông tin → Chọn cây
 * Dark glassmorphism theme
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Form, Input, message, Steps } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import './Auth.css';

const TREE_TYPES = [
  {
    type: 'cherry',
    emoji: '🌸',
    name: 'Hoa Anh Đào',
    description: 'Đẹp, nhẹ nhàng — cho người yêu thẩm mỹ',
    color: '#FFB7C5',
    gradient: 'linear-gradient(135deg, rgba(255,183,197,0.2), rgba(255,105,135,0.1))',
  },
  {
    type: 'apple',
    emoji: '🍎',
    name: 'Cây Táo',
    description: 'Hiệu quả, năng suất — cho người tập trung kết quả',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(255,60,60,0.1))',
  },
  {
    type: 'palm',
    emoji: '🌴',
    name: 'Cây Dừa',
    description: 'Thư giãn, bình yên — cho người cần balance',
    color: '#4ECDC4',
    gradient: 'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(30,180,170,0.1))',
  },
  {
    type: 'bamboo',
    emoji: '🎋',
    name: 'Tre',
    description: 'Kiên định, tập trung — cho người cần focus cao',
    color: '#95E1D3',
    gradient: 'linear-gradient(135deg, rgba(149,225,211,0.2), rgba(80,200,180,0.1))',
  },
];

const Signup = ({ onSwitchToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [selectedTree, setSelectedTree] = useState(null);
  const { signUp, updateProfile, completeTreeSetup } = useAuth();
  const [form] = Form.useForm();

  const handleStep1 = async (values) => {
    setFormData(values);
    setCurrentStep(1);
  };

  const handleStep2 = async () => {
    if (!selectedTree) {
      message.warning('Chọn cây yêu thích của bạn trước nhé! 🌱');
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await signUp(
        formData.email,
        formData.password,
        formData.username
      );

      if (error) throw error;

      if (user) {
        const treeInfo = TREE_TYPES.find((t) => t.type === selectedTree);

        const { error: treeError } = await supabase.from('trees').insert([
          {
            user_id: user.id,
            tree_type: selectedTree,
            tree_name: `${treeInfo.emoji} ${treeInfo.name}`,
            growth_stage: 1,
            is_active: true,
          },
        ]);

        if (treeError) throw treeError;

        await supabase.from('achievements').insert([
          {
            user_id: user.id,
            achievement_code: 'welcome',
            reward_xp: 50,
          },
        ]);

        await updateProfile({ current_xp: 50, total_xp: 50 });

        message.success('🎉 Chào mừng đến Student Hub! Hành trình bắt đầu!');
        completeTreeSetup();
      }
    } catch (error) {
      message.error(error.message || 'Đăng ký thất bại, thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* LEFT: Brand Panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-logo">🌱</span>
          <h1 className="auth-brand-title">
            BẮT ĐẦU <span>NGAY</span>
          </h1>
          <p className="auth-brand-subtitle">
            Tạo tài khoản miễn phí — chỉ mất 1 phút
          </p>
        </div>

        <div className="auth-features">
          {[
            { icon: '🎁', text: 'Nhận ngay 50 XP và 10 giọt nước khi đăng ký' },
            { icon: '🌳', text: 'Chọn cây ảo yêu thích để nuôi dưỡng' },
            { icon: '📊', text: 'Dashboard theo dõi tiến trình học tập' },
            { icon: '🤝', text: 'Kết bạn và thi đua cùng nhau' },
          ].map((f, i) => (
            <div className="auth-feature-item" key={i}>
              <span className="auth-feature-icon">{f.icon}</span>
              <span className="auth-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Form Panel */}
      <div className="auth-right">
        <div className="auth-card signup-card">
          {/* Header */}
          <div className="auth-header">
            <span className="auth-header-icon">
              {currentStep === 0 ? '✨' : '🌿'}
            </span>
            <h1>
              {currentStep === 0 ? 'Tạo tài khoản mới' : 'Chọn cây của bạn'}
            </h1>
            <p>
              {currentStep === 0
                ? 'Bắt đầu hành trình chinh phục bản thân'
                : 'Mỗi task hoàn thành, cây sẽ lớn lên cùng bạn!'}
            </p>
          </div>

          {/* Steps Indicator */}
          <Steps
            current={currentStep}
            size="small"
            style={{ marginBottom: 28 }}
            items={[
              { title: 'Thông tin' },
              { title: 'Chọn cây' },
            ]}
          />

          {/* STEP 1: Thông tin */}
          {currentStep === 0 && (
            <Form
              form={form}
              name="signup-form"
              onFinish={handleStep1}
              layout="vertical"
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="username"
                label="Tên hiển thị"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên!' },
                  { min: 3, message: 'Tên phải có ít nhất 3 ký tự!' },
                  { max: 20, message: 'Tên không quá 20 ký tự!' },
                ]}
              >
                <Input
                  id="signup-username"
                  prefix={<UserOutlined />}
                  placeholder="VD: MinhHust_2024"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input
                  id="signup-email"
                  prefix={<MailOutlined />}
                  placeholder="email@example.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                ]}
              >
                <Input.Password
                  id="signup-password"
                  prefix={<LockOutlined />}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  id="signup-confirm-password"
                  prefix={<LockOutlined />}
                  placeholder="Nhập lại mật khẩu"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  id="signup-next-btn"
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="submit-btn"
                >
                  Tiếp theo →
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* STEP 2: Chọn cây */}
          {currentStep === 1 && (
            <div>
              <div className="tree-grid">
                {TREE_TYPES.map((tree) => (
                  <div
                    key={tree.type}
                    id={`tree-card-${tree.type}`}
                    className={`tree-card ${selectedTree === tree.type ? 'selected' : ''}`}
                    onClick={() => setSelectedTree(tree.type)}
                    style={{
                      borderColor: selectedTree === tree.type ? tree.color : undefined,
                      background: selectedTree === tree.type ? tree.gradient : undefined,
                      boxShadow: selectedTree === tree.type
                        ? `0 12px 32px ${tree.color}33`
                        : undefined,
                    }}
                  >
                    {selectedTree === tree.type && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: tree.color,
                        fontSize: 16,
                      }}>
                        <CheckCircleOutlined />
                      </div>
                    )}
                    <span className="tree-icon">{tree.emoji}</span>
                    <h4>{tree.name}</h4>
                    <p>{tree.description}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  id="signup-back-btn"
                  size="large"
                  block
                  className="back-btn"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrentStep(0)}
                >
                  Quay lại
                </Button>
                <Button
                  id="signup-finish-btn"
                  type="primary"
                  size="large"
                  block
                  className="submit-btn"
                  loading={loading}
                  onClick={handleStep2}
                  disabled={!selectedTree}
                >
                  Bắt đầu thôi! 🚀
                </Button>
              </div>
            </div>
          )}

          {/* Switch to Login */}
          {currentStep === 0 && (
            <div className="auth-footer">
              Đã có tài khoản?{' '}
              <a id="switch-to-login" onClick={onSwitchToLogin}>
                Đăng nhập ngay
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
