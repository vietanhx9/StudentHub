# Student Hub — Hệ thống hỗ trợ học tập cho sinh viên

Ứng dụng web giúp sinh viên chống trì hoãn và duy trì thói quen học tập thông qua gamification. Người dùng quản lý nhiệm vụ hàng ngày, học tập tập trung theo Pomodoro, và nhận phần thưởng XP để nuôi cây ảo — tạo thành vòng lặp động lực liên tục.

---

## Tính năng chính

**Dashboard** — Tổng quan tiến trình trong ngày: danh sách task hôm nay, chuỗi ngày học liên tiếp (streak), điểm XP hiện tại, và 3 Daily Quest ngẫu nhiên thay mới mỗi ngày.

**Lịch học** — Quản lý task theo từng ngày trong tuần. Hỗ trợ gắn deadline với cảnh báo sắp hết hạn / quá hạn. Hoàn thành task nhận +15 XP và +1 giọt nước.

**Deep Work** — Bộ đếm Pomodoro tùy chỉnh thời gian, nhạc nền tập trung, và Focus Mode toàn màn hình ẩn toàn bộ giao diện — chỉ hiển thị đồng hồ và nhạc.

**Cây ảo** — Mỗi người dùng chọn một loài cây khi đăng ký (Hoa Anh Đào, Cây Táo, Cây Dừa, Tre). Cây lớn qua 5 giai đoạn dựa trên tổng XP tích lũy. Dùng nước kiếm được từ việc học để tưới cây mỗi ngày.

**Thành tích** — Lưu lại các cột mốc: task đầu tiên, streak nhiều ngày, hoàn thành Deep Work, v.v.

**Hồ sơ & Bạn bè** — Theo dõi cấp độ, tổng XP, thống kê học tập. Kết bạn qua mã friend code để cùng thi đua.

---

## Hệ thống Gamification

- **XP**: +15 XP / task hoàn thành, +2 XP / phút Deep Work, +10 XP / lần tưới cây
- **Streak bonus**: ×1.2 (3–6 ngày), ×1.5 (7–13 ngày), ×1.8 (14–29 ngày), ×2.0 (≥30 ngày)
- **Level**: tính theo `floor(log2(current_xp / 50 + 1)) + 1`
- **Giai đoạn cây**: `min(5, floor(total_xp / 200) + 1)` — 5 giai đoạn từ hạt mầm đến trưởng thành
- **Daily Quest**: 3 nhiệm vụ ngẫu nhiên mỗi ngày (hoàn thành task, học Deep Work, tưới cây), reset lúc nửa đêm

---

## Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 18 + Vite |
| UI | Ant Design 5 |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel |
| Styling | CSS custom variables + Ant Design themes |

---

## Cài đặt và chạy

### Yêu cầu
- Node.js 18+
- Tài khoản Supabase (tạo project và lấy API keys)

### Bước 1: Clone và cài dependencies
```bash
git clone https://github.com/vietanhx9/StudentHub.git
cd WebHoTroSvienTriHoanHocTap/frontend
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Bước 3: Chạy dev server
```bash
npm run dev
```

App chạy tại `http://localhost:5173`

---

## Cấu trúc Database (Supabase)

| Table | Mô tả |
|-------|-------|
| `users` | Profile người dùng (XP, level, streak, friend_code) |
| `tasks` | Nhiệm vụ học tập (theo ngày, có deadline) |
| `trees` | Cây ảo của người dùng (loại cây, giai đoạn) |
| `inventory` | Kho đồ (water, golden_water, booster, seed) |
| `achievements` | Thành tích đã đạt được |
| `friendships` | Quan hệ bạn bè (pending / accepted) |
| `daily_logs` | Nhật ký học tập mỗi ngày |

Tất cả các bảng đều bật Row Level Security — người dùng chỉ đọc/sửa được dữ liệu của mình.

---

## Xác thực

Hỗ trợ đăng ký / đăng nhập bằng Email + Password và Google OAuth thông qua Supabase Auth.

---

## Đóng góp

Pull request và issue đều được hoan nghênh.
