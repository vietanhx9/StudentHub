/**
 * LOGIN COMPONENT - Premium Redesign
 * Split layout: Brand panel trái + Form glassmorphism phải
 * Dark theme với gradient + micro-animations
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Form, Input, message } from 'antd';
import {
  GoogleOutlined,
  MailOutlined,
  LockOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './Auth.css';

const Login = ({ onSwitchToSignup }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const handleLogin = async (values) => {
    setLoading(true);
    const { error } = await signIn(values.email, values.password);
    setLoading(false);

    if (error) {
      message.error({
        content: error.message || 'Đăng nhập thất bại! Kiểm tra lại email/mật khẩu.',
        style: { marginTop: '20px' },
      });
    } else {
      message.success({
        content: '🎉 Chào mừng trở lại! Sẵn sàng chinh phục ngày hôm nay?',
        style: { marginTop: '20px' },
      });
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      message.error('Không thể đăng nhập với Google. Thử lại nhé!');
      setGoogleLoading(false);
    }
    // Nếu thành công sẽ redirect → không cần setLoading(false)
  };

  return (
    <div className="auth-wrapper">
      {/* Floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* LEFT: Brand Panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-logo">🎯</span>
          <h1 className="auth-brand-title">
            STUDENT <span>HUB</span>
          </h1>
          <p className="auth-brand-subtitle">
            Hệ thống chống trì hoãn cho sinh viên
          </p>
        </div>

        <div className="auth-features">
          {[
            { icon: '⚡', text: 'Rule 5 giây — bắt đầu ngay, không do dự' },
            { icon: '🍅', text: 'Pomodoro Timer giúp tập trung tối đa' },
            { icon: '🌱', text: 'Vườn cây ảo lớn lên theo từng task hoàn thành' },
            { icon: '🏆', text: 'Leaderboard & bạn bè cùng tiến bộ' },
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
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <span className="auth-header-icon">👋</span>
            <h1>Chào mừng trở lại!</h1>
            <p>Đăng nhập để tiếp tục hành trình của bạn</p>
          </div>

          {/* Google Login */}
          <Button
            id="google-login-btn"
            size="large"
            block
            onClick={handleGoogleLogin}
            loading={googleLoading}
            className="google-btn"
            icon={<GoogleOutlined />}
          >
            Tiếp tục với Google
          </Button>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">hoặc dùng email</span>
            <div className="auth-divider-line" />
          </div>

          {/* Email/Password Form */}
          <Form
            name="login-form"
            onFinish={handleLogin}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input
                id="login-email"
                prefix={<MailOutlined />}
                placeholder="Email của bạn"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                id="login-password"
                prefix={<LockOutlined />}
                placeholder="Mật khẩu"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                id="login-submit-btn"
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="submit-btn"
                icon={<RocketOutlined />}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* Switch */}
          <div className="auth-footer">
            Chưa có tài khoản?{' '}
            <a id="switch-to-signup" onClick={onSwitchToSignup}>
              Đăng ký miễn phí
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
