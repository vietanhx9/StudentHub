/**
 * SUPABASE CLIENT CONFIGURATION
 * File này khởi tạo connection đến Supabase backend
 */

import { createClient } from '@supabase/supabase-js';

// Lấy credentials từ environment variables (.env file)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra xem đã có credentials chưa
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials! Check your .env.local file');
}

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto refresh token khi hết hạn
    autoRefreshToken: true,
    // Persist session trong localStorage
    persistSession: true,
    // Detect session từ URL (cho OAuth redirects)
    detectSessionInUrl: true
  }
});

/**
 * HELPER FUNCTIONS - Các hàm tiện ích
 */

// Lấy thông tin user hiện tại
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Đăng xuất
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Kiểm tra session hiện tại
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
