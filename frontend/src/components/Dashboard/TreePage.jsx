import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Tag, Statistic, Row, Col, Typography, message, Spin, Empty, Modal, Input } from 'antd';
import { ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const TREE_MAP = {
  cherry: { emoji: '🌸', name: 'Hoa Anh Đào', color: '#FFB7C5', gradient: 'linear-gradient(135deg, #FFB7C5, #FF6B9D)' },
  apple:  { emoji: '🍎', name: 'Cây Táo',     color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FF0040)' },
  palm:   { emoji: '🌴', name: 'Cây Dừa',     color: '#4ECDC4', gradient: 'linear-gradient(135deg, #4ECDC4, #2ECC71)' },
  bamboo: { emoji: '🎋', name: 'Tre',          color: '#95E1D3', gradient: 'linear-gradient(135deg, #95E1D3, #4ECDC4)' },
};

const STAGE_LABELS = ['', '🌰 Hạt mầm', '🌱 Mầm non', '🌿 Cây con', '🪴 Cây lớn', '🌳 Cây trưởng thành'];

function CollectionSection({ collection, cardStyle }) {
  return (
    <Card style={{ ...cardStyle, marginTop: 24, borderTop: '6px solid #f6d365' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <TrophyOutlined style={{ fontSize: 20, color: '#f6a800' }} />
        <Text strong style={{ fontSize: 16 }}>Bộ sưu tập cây đã thu hoạch</Text>
        <Tag color="gold" style={{ borderRadius: 20 }}>{collection.length} cây</Tag>
      </div>
      <Row gutter={[12, 12]}>
        {collection.map((item, i) => {
          const info = TREE_MAP[item.tree_type] || TREE_MAP.cherry;
          const date = new Date(item.harvested_at).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });
          return (
            <Col key={i} xs={12} sm={8}>
              <div style={{
                background: info.gradient, borderRadius: 16, padding: '16px 12px',
                textAlign: 'center', boxShadow: `0 4px 12px ${info.color}44`,
              }}>
                <div style={{ fontSize: 40, marginBottom: 6 }}>{info.emoji}</div>
                <Text style={{ display: 'block', color: '#fff', fontWeight: 700, fontSize: 13 }}>{item.tree_name}</Text>
                <Text style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{info.name}</Text>
                <Tag style={{ marginTop: 6, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: 12, fontSize: 10 }}>
                  🌾 {date}
                </Tag>
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}

export default function TreePage() {
  const { user, profile, updateProfile } = useAuth();
  const [tree, setTree] = useState(null);
  const [water, setWater] = useState(0);
  const [seeds, setSeeds] = useState(0);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watering, setWatering] = useState(false);
  const [harvesting, setHarvesting] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [newTreeType, setNewTreeType] = useState('cherry');
  const [newTreeName, setNewTreeName] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: treeData }, { data: invData }, { data: seedData }, { data: colData }] = await Promise.all([
      supabase.from('trees').select('*').eq('user_id', user.id).eq('is_active', true).limit(1).maybeSingle(),
      supabase.from('inventory').select('quantity').eq('user_id', user.id).eq('item_type', 'water').single(),
      supabase.from('inventory').select('quantity').eq('user_id', user.id).eq('item_type', 'seed').maybeSingle(),
      supabase.from('tree_collection').select('*').eq('user_id', user.id).order('harvested_at', { ascending: false }),
    ]);
    setTree(treeData || null);
    setWater(invData?.quantity || 0);
    setSeeds(seedData?.quantity || 0);
    setCollection(colData || []);
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
        updateProfile({ current_xp: newXp, total_xp: newTotal }),
        supabase.from('trees').update({ growth_stage: newStage }).eq('id', tree.id),
      ]);

      setWater(newWater);
      setTree(prev => ({ ...prev, growth_stage: newStage }));

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const waterKey = `water_count_${today}`;
      localStorage.setItem(waterKey, (parseInt(localStorage.getItem(waterKey) || '0', 10) + 1).toString());

      if (newStage === 5 && tree.growth_stage < 5) {
        message.success('🌳 Cây đã trưởng thành! Thu hoạch để nhận hạt giống và trồng cây mới.');
      } else {
        message.success(`+10 XP! Cây đã được tưới 💧 (Còn ${newWater} nước)`);
      }
    } catch {
      message.error('Lỗi tưới cây!');
    } finally {
      setWatering(false);
    }
  };

  const handleHarvest = () => {
    const info = TREE_MAP[tree.tree_type] || TREE_MAP.cherry;
    Modal.confirm({
      title: `Thu hoạch ${info.name}?`,
      content: `"${tree.tree_name}" sẽ được lưu vào bộ sưu tập và bạn nhận lại 1 hạt giống để trồng cây mới.`,
      okText: '🌾 Thu hoạch',
      cancelText: 'Hủy',
      okType: 'primary',
      onOk: async () => {
        setHarvesting(true);
        try {
          const newSeedQty = seeds + 1;
          await Promise.all([
            supabase.from('tree_collection').insert({
              user_id: user.id,
              tree_type: tree.tree_type,
              tree_name: tree.tree_name,
              growth_stage: tree.growth_stage,
            }),
            supabase.from('trees').update({ is_active: false }).eq('id', tree.id),
            supabase.from('inventory').update({ quantity: newSeedQty }).eq('user_id', user.id).eq('item_type', 'seed'),
          ]);
          const harvested = {
            tree_type: tree.tree_type,
            tree_name: tree.tree_name,
            growth_stage: tree.growth_stage,
            harvested_at: new Date().toISOString(),
          };
          setCollection(prev => [harvested, ...prev]);
          setTree(null);
          setSeeds(newSeedQty);
          message.success(`🌾 ${info.name} đã được thu hoạch! Nhận 1 hạt giống mới.`);
        } catch {
          message.error('Lỗi thu hoạch cây!');
        } finally {
          setHarvesting(false);
        }
      },
    });
  };

  const handlePlant = async () => {
    if (!newTreeName.trim()) return message.warning('Đặt tên cho cây mới trước nhé!');
    if (seeds <= 0) return message.warning('Không đủ hạt giống!');
    setPlanting(true);
    try {
      const newSeedQty = seeds - 1;
      const [{ data: newTree }] = await Promise.all([
        supabase.from('trees').insert({
          user_id: user.id,
          tree_type: newTreeType,
          tree_name: newTreeName.trim(),
          growth_stage: 1,
          is_active: true,
        }).select().single(),
        supabase.from('inventory').update({ quantity: newSeedQty }).eq('user_id', user.id).eq('item_type', 'seed'),
      ]);
      setTree(newTree);
      setSeeds(newSeedQty);
      setNewTreeName('');
      message.success(`🌱 Đã trồng ${TREE_MAP[newTreeType]?.name}! Hãy chăm sóc cây mới nhé.`);
    } catch {
      message.error('Lỗi trồng cây!');
    } finally {
      setPlanting(false);
    }
  };

  const cardStyle = { borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: 'none' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  // No active tree
  if (!tree) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {seeds > 0 ? (
          <Card style={{ ...cardStyle, marginBottom: 24, borderTop: '6px solid #52c41a', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🌱</div>
            <Title level={3} style={{ marginBottom: 4 }}>Trồng cây mới</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Bạn có {seeds} hạt giống. Chọn loài và đặt tên để bắt đầu!
            </Text>

            <Row gutter={12} justify="center" style={{ marginBottom: 20 }}>
              {Object.entries(TREE_MAP).map(([type, info]) => (
                <Col key={type}>
                  <div
                    onClick={() => setNewTreeType(type)}
                    style={{
                      width: 88, padding: '12px 8px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                      background: newTreeType === type ? info.gradient : 'var(--bg-secondary, #f5f5f5)',
                      border: `2px solid ${newTreeType === type ? info.color : 'transparent'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{info.emoji}</div>
                    <Text style={{ fontSize: 11, fontWeight: 600, color: newTreeType === type ? '#fff' : undefined }}>
                      {info.name}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>

            <Input
              size="large"
              placeholder="Đặt tên cho cây..."
              value={newTreeName}
              onChange={e => setNewTreeName(e.target.value)}
              onPressEnter={handlePlant}
              style={{ maxWidth: 300, marginBottom: 16, borderRadius: 12 }}
              maxLength={30}
            />
            <br />
            <Button
              type="primary" size="large" loading={planting}
              onClick={handlePlant}
              disabled={!newTreeName.trim()}
              style={{
                height: 52, padding: '0 40px', fontSize: 16, fontWeight: 700,
                borderRadius: 14, background: TREE_MAP[newTreeType]?.gradient, border: 'none',
              }}
            >
              🌱 Trồng cây
            </Button>
          </Card>
        ) : (
          <Empty description="Chưa có cây! Hãy đăng ký lại và chọn cây yêu thích 🌱" style={{ padding: 80 }} />
        )}
        {collection.length > 0 && <CollectionSection collection={collection} cardStyle={cardStyle} />}
      </div>
    );
  }

  const info = TREE_MAP[tree.tree_type] || TREE_MAP.cherry;
  const stagePercent = Math.min(100, ((tree.growth_stage - 1) / 4) * 100);
  const xpToNextStage = (tree.growth_stage * 200) - (profile?.total_xp || 0);
  const isMaxStage = tree.growth_stage >= 5;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* HERO CARD */}
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
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #4ECDC4, #44A08D)', textAlign: 'center', padding: 24 }}>
            <Statistic value={water} prefix="💧" valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Nước còn lại</Text>} />
          </div>
        </Col>
        <Col span={8}>
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', textAlign: 'center', padding: 24 }}>
            <Statistic value={profile?.current_xp || 0} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>XP hiện tại</Text>} />
          </div>
        </Col>
        <Col span={8}>
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #C13584, #833AB4)', textAlign: 'center', padding: 24 }}>
            <Statistic value={tree.growth_stage} suffix="/5" valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 900 }} title={<Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Giai đoạn</Text>} />
          </div>
        </Col>
      </Row>

      {/* TĂNG TRƯỞNG */}
      <Card style={{ ...cardStyle, marginBottom: 24, borderTop: `6px solid ${info.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text strong style={{ fontSize: 15 }}>🌱 Tăng trưởng của cây</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isMaxStage ? '🎉 Cây đã trưởng thành!' : `Cần thêm ${Math.max(0, xpToNextStage)} XP để lên giai đoạn tiếp theo`}
          </Text>
        </div>
        <Progress
          percent={stagePercent}
          strokeColor={{ '0%': info.color, '100%': '#764ba2' }}
          strokeWidth={16}
          format={() => `Giai đoạn ${tree.growth_stage}/5`}
        />
      </Card>

      {/* TƯỚI / THU HOẠCH */}
      <Card style={{ ...cardStyle, marginBottom: collection.length > 0 ? 0 : undefined }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {!isMaxStage ? (
            <>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
                Mỗi lần tưới = -1💧 nước +10⚡ XP cho cây
              </Text>
              <Button
                type="primary" size="large" loading={watering}
                disabled={water <= 0}
                onClick={handleWater}
                style={{
                  height: 60, width: 260, fontSize: 18, fontWeight: 700,
                  borderRadius: 16, border: 'none',
                  background: water > 0 ? info.gradient : undefined,
                  boxShadow: water > 0 ? `0 8px 24px ${info.color}66` : undefined,
                }}
              >
                {`Tưới cây 💧 (Còn ${water} nước)`}
              </Button>
              {water <= 0 && (
                <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
                  💡 Hoàn thành task để nhận thêm nước nhé!
                </Text>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
              <Text strong style={{ display: 'block', fontSize: 16, marginBottom: 6 }}>
                Cây đã trưởng thành hoàn toàn!
              </Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                Thu hoạch để lưu vào bộ sưu tập và nhận hạt giống trồng cây mới
              </Text>
              <Button
                size="large" loading={harvesting}
                onClick={handleHarvest}
                style={{
                  height: 56, padding: '0 40px', fontSize: 16, fontWeight: 700,
                  borderRadius: 16, border: 'none',
                  background: 'linear-gradient(135deg, #f6d365, #fda085)',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(253,160,133,0.4)',
                }}
              >
                🌾 Thu hoạch cây
              </Button>
            </>
          )}
        </div>
      </Card>

      {collection.length > 0 && <CollectionSection collection={collection} cardStyle={cardStyle} />}
    </div>
  );
}
