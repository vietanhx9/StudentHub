/**
 * MAIN APP COMPONENT
 * Quản lý routing, authentication state và theme
 */
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AuthPage from './components/Auth/AuthPage';
import TreeSetupPage from './components/Auth/TreeSetupPage';
import Dashboard from './OldApp'; // Tạm import App cũ làm Dashboard
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import { Spin, ConfigProvider, theme as antdTheme } from 'antd';

// Component kiểm tra auth và render UI phù hợp
function AppContent() {
  const { user, loading, hasTree } = useAuth();

  // Hiển thị loading spinner khi đang check auth hoặc chưa biết có cây chưa
  if (loading || (user && hasTree === null)) {
    return (
      <div className="loading-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  // Đã đăng nhập nhưng chưa chọn cây → hiện màn chọn cây
  if (hasTree === false) return <TreeSetupPage />;

  return <Dashboard />;
}

// Wrapper để consume theme context và truyền cho antd
function ThemeWrapper() {
  const { theme } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AppContent />
    </ConfigProvider>
  );
}

// Main App
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeWrapper />
        <PWAUpdatePrompt />
      </AuthProvider>
    </ThemeProvider>
  );
}
