import React, { useState } from 'react';
import { Button, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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

export default function TreeSetupPage() {
  const { user, completeTreeSetup, updateProfile } = useAuth();
  const [selectedTree, setSelectedTree] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTree) {
      message.warning('Chọn cây yêu thích của bạn trước nhé! 🌱');
      return;
    }

    setLoading(true);
    try {
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

      // Tặng welcome achievement + XP (nếu chưa có)
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_code: 'welcome', reward_xp: 50 },
      ], { onConflict: 'user_id,achievement_code', ignoreDuplicates: true });

      await updateProfile({ current_xp: 50, total_xp: 50 });

      message.success('🎉 Chào mừng đến Student Hub! Hành trình bắt đầu!');
      completeTreeSetup();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra, thử lại nhé!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className="auth-card signup-card" style={{ maxWidth: 520, width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="auth-header">
          <span className="auth-header-icon">🌿</span>
          <h1>Chọn cây của bạn</h1>
          <p>Mỗi task hoàn thành, cây sẽ lớn lên cùng bạn!</p>
        </div>

        <div className="tree-grid">
          {TREE_TYPES.map((tree) => (
            <div
              key={tree.type}
              className={`tree-card ${selectedTree === tree.type ? 'selected' : ''}`}
              onClick={() => setSelectedTree(tree.type)}
              style={{
                borderColor: selectedTree === tree.type ? tree.color : undefined,
                background: selectedTree === tree.type ? tree.gradient : undefined,
                boxShadow: selectedTree === tree.type ? `0 12px 32px ${tree.color}33` : undefined,
              }}
            >
              {selectedTree === tree.type && (
                <div style={{ position: 'absolute', top: 8, right: 8, color: tree.color, fontSize: 16 }}>
                  <CheckCircleOutlined />
                </div>
              )}
              <span className="tree-icon">{tree.emoji}</span>
              <h4>{tree.name}</h4>
              <p>{tree.description}</p>
            </div>
          ))}
        </div>

        <Button
          type="primary"
          size="large"
          block
          className="submit-btn"
          loading={loading}
          disabled={!selectedTree}
          onClick={handleConfirm}
          style={{ marginTop: 8 }}
        >
          Bắt đầu thôi! 🚀
        </Button>
      </div>
    </div>
  );
}
