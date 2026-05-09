import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Tag, Statistic, Row, Col, Typography, message, Spin, Empty } from 'antd';
import { ThunderboltOutlined, StarFilled } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const TREE_MAP = {
  cherry:  { emoji: '🌸', name: 'Hoa Anh Đào', color: '#FFB7C5', gradient: 'linear-gradient(135deg, #FFB7C5, #FF6B9D)' },
  apple:   { emoji: '🍎', name: 'Cây Táo',     color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF0040)' },
  palm:    { emoji: '🌴', name: 'Cây Dừa',     color: '#4ECDC4', gradient: 'linear-gradient(135deg, #4ECDC4, #2ECC71)' },
  bamboo:  { emoji: '🎋', name: 'Tre',          color: '#95E1D3', gradient: 'linear-gradient(135deg, #95E1D3, #4ECDC4)' },
};

const STAGE_LABELS = ['', '🌰 Hạt mầm', '🌱 Mầm non', '🌿 Cây con', '🪴 Cây lớn', '🌳 Cây trưởng thành'];

export default function TreePage() {
  const { user, profile } = useAuth();
  const [tree, setTree] = useState(null);
  const [water, setWater] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watering, setWatering] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: treeData }, { data: invData }] = await Promise.all([
      supabase.from('trees').select('*').eq('user_id', user.id).eq('is_active', true).single(),
      supabase.from('inventory').select('quantity').eq('user_id', user.id).eq('item_type', 'water').single(),
    ]);
    setTree(treeData || null);
    setWater(invData?.quantity || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleWater = async () => {
    if (water <= 0) return message.warning('Hết nước rồi! Hãy hoàn thành task để kiếm thêm 💧');
    if (!tree) return;
    setWatering(true);
    try {
      const newXp = (profile?.current_xp || 0) + 10;
      const newTotal = (profile?.total_xp || 0) + 10;
      const newWater = water - 1;
      const newStage = Math.min(5, Math.floor(newTotal / 200) + 1);

      await Promise.all([
        supabase.from('inventory').update({ quantity: newWater }).eq('user_id', user.id).eq('item_type', 'water'),
        supabase.from('users').update({ current_xp: newXp, total_xp: newTotal }).eq('id', user.id),
        supabase.from('trees').update({ growth_stage: newStage }).eq('id', tree.id),
      ]);

      setWater(newWater);
      setTree(prev => ({ ...prev, growth_stage: newStage }));
      message.success(`+10 XP! Cây đã được tưới 💧 (Còn ${newWater} nước)`);
    } catch (e) {
      message.error('Lỗi tưới cây!');
    } finally {
      setWatering(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!tree) return <Empty description="Chưa có cây! Hãy đăng ký lại và chọn cây yêu thích 🌱" style={{ padding: 80 }} />;

  const info = TREE_MAP[tree.tree_type] || TREE_MAP.cherry;
  const stagePercent = Math.min(100, ((tree.growth_stage - 1) / 4) * 100);
  const xpToNextStage = ((tree.growth_stage) * 200) - (profile?.total_xp || 0);
  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* CÂY HERO CARD */}
      <Card style={{ ...cardStyle, background: info.gradient, marginBottom: 24, textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 120, lineHeight: 1.2, marginBottom: 16, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>
          {info.emoji}
        </div>
        <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 900 }}>{tree.tree_name}</Title>
        <Tag style={{ marginTop: 8, borderRadius: 20, fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff' }}>
          {STAGE_LABELS[tree.growth_stage] || '🌳 Trưởng thành'}
        </Tag>
        <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 13 }}>
          Giai đoạn {tree.growth_stage}/5
        </Text>
      </Card>

      {/* STATS */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #4ECDC4, #44A08D)', textAlign: 'center' }}>
            <Statistic value={water} prefix="💧" valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Nước còn lại</Text>} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', textAlign: 'center' }}>
            <Statistic value={profile?.current_xp || 0} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>XP hiện tại</Text>} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, background: 'linear-gradient(135deg, #C13584, #833AB4)', textAlign: 'center' }}>
            <Statistic value={tree.growth_stage} suffix="/5" valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Giai đoạn</Text>} />
          </Card>
        </Col>
      </Row>

      {/* TĂNG TRƯỞNG */}
      <Card style={{ ...cardStyle, marginBottom: 24, borderTop: `6px solid ${info.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text strong style={{ fontSize: 15 }}>🌱 Tăng trưởng của cây</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {tree.growth_stage < 5 ? `Cần thêm ${Math.max(0, xpToNextStage)} XP để lên giai đoạn tiếp theo` : '🎉 Cây đã trưởng thành!'}
          </Text>
        </div>
        <Progress percent={stagePercent} strokeColor={{ '0%': info.color, '100%': '#764ba2' }} strokeWidth={16} format={() => `Giai đoạn ${tree.growth_stage}/5`} />
      </Card>

      {/* NÚT TƯỚI */}
      <Card style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
            Mỗi lần tưới = -1💧 nước +10⚡ XP cho cây
          </Text>
          <Button
            type="primary" size="large" loading={watering}
            disabled={water <= 0 || tree.growth_stage >= 5}
            onClick={handleWater}
            style={{
              height: 60, width: 260, fontSize: 18, fontWeight: 700,
              borderRadius: 16, border: 'none',
              background: water > 0 ? info.gradient : undefined,
              boxShadow: water > 0 ? `0 8px 24px ${info.color}66` : undefined,
            }}
          >
            {tree.growth_stage >= 5 ? '🌳 Cây đã trưởng thành!' : `Tưới cây 💧 (Còn ${water} nước)`}
          </Button>
          {water <= 0 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
              💡 Hoàn thành task để nhận thêm nước nhé!
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}
