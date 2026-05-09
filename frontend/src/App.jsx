/**
 * MAIN APP COMPONENT
 * Quản lý routing, authentication state và theme
 */
import React from 'react'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AuthPage from './components/Auth/AuthPage';
import Dashboard from './OldApp'; // Tạm import App cũ làm Dashboard
import { Spin, ConfigProvider, theme as antdTheme } from 'antd';

// Component kiểm tra auth và render UI phù hợp
function AppContent() {
  const { user, loading } = useAuth();

  // Hiển thị loading spinner khi đang check auth
  if (loading) {
    return (
      <div className="loading-screen">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Nếu chưa login → Hiện AuthPage
  // Nếu đã login → Hiện Dashboard
  return user ? <Dashboard /> : <AuthPage />;
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
      </AuthProvider>
    </ThemeProvider>
  );
}
