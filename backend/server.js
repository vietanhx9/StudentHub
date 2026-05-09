const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Dán Key cậu vừa copy vào giữa hai dấu nháy ở dòng dưới
const supabaseUrl = 'https://hhgdymrxgcrnctzjxbet.supabase.co';
const supabaseKey = 'sb_publishable_z_aeTEE9eygsx1Wq1pxgAQ_85mkc8cz';
const supabase = createClient(supabaseUrl, supabaseKey);

// Lấy danh sách nhiệm vụ
// Tìm đến đoạn này và sửa lại chữ T viết hoa
app.post('/tasks', async (req, res) => {
    const { taskName } = req.body;
    // Sửa chữ taskName thành TaskName ở dòng dưới đây
    const { data, error } = await supabase.from('Tasks').insert([{ TaskName: taskName }]).select();
    if (error) return res.status(500).json(error);
    res.json(data[0]);
});

// Và cả đoạn GET để nó lấy dữ liệu ra đúng cột:
app.get('/tasks', async (req, res) => {
    const { data, error } = await supabase.from('Tasks').select('*').order('id', { ascending: false });
    if (error) return res.status(500).json(error);
    res.json(data);
});

// Xóa nhiệm vụ
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('Tasks').delete().eq('id', id);
    if (error) return res.status(500).json(error);
    res.json({ message: 'Đã xóa thành công' });
});

app.listen(5000, () => console.log('🚀 Server mây Supabase đang chạy tại port 5000'));