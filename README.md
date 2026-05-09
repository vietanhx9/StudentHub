# 🎯 STUDENT HUB - Hệ thống chống trì hoãn cho sinh viên

## 🚀 CÀI ĐẶT VÀ CHẠY PROJECT

### Bước 1: Clone project (nếu chưa có)
```bash
# Nếu mày đã có folder rồi thì skip bước này
git clone <repository-url>
cd WebHoTroSvienTriHoanHocTap
```

### Bước 2: Cài dependencies
```bash
cd frontend
npm install
```

### Bước 3: Setup môi trường
File `.env.local` đã được tạo sẵn với Supabase credentials.
**LƯU Ý**: File này không được push lên GitHub (đã có trong .gitignore)

### Bước 4: Chạy development server
```bash
npm run dev
```

App sẽ chạy tại: `http://localhost:5173`

---

## 📦 TECH STACK

- **Frontend**: React 18 + Vite
- **UI Library**: Ant Design 5
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Styling**: CSS custom + Ant Design themes

---

## 🎮 TÍNH NĂNG ĐÃ CÓ

### V1 (MVP Cũ):
- ✅ Quản lý task theo ngày
- ✅ Pomodoro Timer (5/15/25/50 phút)
- ✅ Rule 5 giây chống trì hoãn
- ✅ Dashboard stats cơ bản

### V2 (Mới - Authentication):
- ✅ Đăng ký / Đăng nhập (Email/Password + Google)
- ✅ Bảo mật với Row Level Security
- ✅ Profile system với username + friend code
- ✅ Chọn cây đầu tiên khi đăng ký

---

## 🔜 ROADMAP

### Tuần 1 (Đang làm):
- ✅ Authentication & Security
- 🔄 Database migration
- 🔄 Protected routes

### Tuần 2:
- Gamification (XP, Level, Achievements)
- Tree growth system
- Inventory management

### Tuần 3:
- Friends system (Add by username#code + invite link)
- Leaderboard
- Analytics dashboard

---

## 🗄️ DATABASE SCHEMA

### Tables:
1. **users** - Thông tin người dùng
2. **tasks** - Nhiệm vụ (có XP reward)
3. **trees** - Vườn cây ảo
4. **inventory** - Kho đồ (water, seeds, boosters)
5. **achievements** - Thành tựu
6. **friendships** - Quan hệ bạn bè
7. **friend_invites** - Link mời
8. **xp_logs** - Lịch sử XP

Chi tiết xem file: `supabase_setup.sql`

---

## 🔐 BẢO MẬT

- Environment variables được lưu trong `.env.local` (không commit lên Git)
- Row Level Security (RLS) enabled cho tất cả tables
- User chỉ có thể đọc/sửa data của mình
- Supabase Auth handles JWT tokens tự động

---

## 🐛 GỠ LỖI THƯỜNG GẶP

### Lỗi: "Missing Supabase credentials"
→ Kiểm tra file `.env.local` có tồn tại không
→ Restart dev server: `npm run dev`

### Lỗi: "Failed to fetch"
→ Kiểm tra internet connection
→ Kiểm tra Supabase project có đang chạy không

### Lỗi khi login với Google
→ Vào Supabase Dashboard → Authentication → Providers
→ Enable Google provider

---

## 📞 CONTACT

Nếu gặp vấn đề, liên hệ team dev.

Happy coding! 🚀
