import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from 'antd';
import { ReloadOutlined, CloseOutlined, WifiOutlined } from '@ant-design/icons';

export default function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (!r) return;
      setInterval(() => {
        if (r.installing || !navigator) return;
        if (('connection' in navigator) && !navigator.onLine) return;
        r.update();
      }, 60 * 60 * 1000);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        background: 'var(--bg-surface-2, #1f1f2e)',
        color: 'var(--text-primary, #fff)',
        padding: '14px 18px',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'pwa-slide-in 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes pwa-slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>
          {needRefresh ? <ReloadOutlined style={{ color: '#52B788' }} /> : <WifiOutlined style={{ color: '#52B788' }} />}
        </span>
        <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>
          {needRefresh ? (
            <>
              <strong>Có bản cập nhật mới!</strong>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>
                Nhấn "Cập nhật" để tải phiên bản mới nhất.
              </div>
            </>
          ) : (
            <>
              <strong>Sẵn sàng offline</strong>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>
                App giờ có thể dùng được khi không có mạng.
              </div>
            </>
          )}
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={close}
          style={{ marginTop: -4, marginRight: -8 }}
        />
      </div>
      {needRefresh && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button size="small" onClick={close}>Để sau</Button>
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => updateServiceWorker(true)}
            style={{ background: '#52B788', borderColor: '#52B788' }}
          >
            Cập nhật
          </Button>
        </div>
      )}
    </div>
  );
}
