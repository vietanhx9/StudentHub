/**
 * AUTH CONTEXT
 * Quản lý authentication state cho toàn bộ app
 * Mọi component đều có thể access user info qua context này
 */
import React from 'react'; 
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

// Hook để dùng auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // User profile từ database
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Load user khi app khởi động
  useEffect(() => {
    // Timeout 5 giây: nếu load quá lâu thì tự thoát
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Lỗi khi lấy session:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id).finally(() => clearTimeout(safetyTimeout));
      } else {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Lỗi nghiêm trọng khi gọi getSession:', err);
      clearTimeout(safetyTimeout);
      setLoading(false);
    });

    // Lắng nghe thay đổi auth state (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Load profile từ database (có timeout 4 giây)
  const loadProfile = async (userId) => {
    try {
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 4000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Row chưa tồn tại (signup race condition) → tự tạo mặc định
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || '';
        const friendCode = Math.floor(1000 + Math.random() * 9000).toString();
        const { data: newProfile } = await supabase
          .from('users')
          .upsert([{ id: userId, email, username: 'Student', friend_code: friendCode }], { onConflict: 'id' })
          .select()
          .single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ĐĂNG KÝ với email/password
  const signUp = async (email, password, username) => {
    try {
      // 1. Tạo auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Tạo profile trong database
        const friendCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        // upsert thay vì insert: an toàn khi DB trigger đã tạo row trước
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: authData.user.id,
              email: email,
              username: username || `student_${friendCode}`,
              friend_code: friendCode,
            },
          ], { onConflict: 'id' });

        if (profileError) throw profileError;

        // 3. Tạo inventory ban đầu (10 water drops)
        await supabase.from('inventory').insert([
          { user_id: authData.user.id, item_type: 'water', quantity: 10 },
          { user_id: authData.user.id, item_type: 'golden_water', quantity: 0 },
          { user_id: authData.user.id, item_type: 'booster', quantity: 0 },
          { user_id: authData.user.id, item_type: 'seed', quantity: 1 },
        ]);

        // Reload profile sau khi tạo xong để tránh race condition với onAuthStateChange
        await loadProfile(authData.user.id);

        return { user: authData.user, error: null };
      }
    } catch (error) {
      return { user: null, error };
    }
  };

  // ĐĂNG NHẬP với email/password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  // ĐĂNG NHẬP với Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`, // Redirect về homepage sau khi login
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // ĐĂNG XUẤT
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
    return { error };
  };

  // UPDATE PROFILE
  const updateProfile = async (updates) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';

      // upsert: tạo row nếu chưa có, update nếu có rồi
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email,
          friend_code: profile?.friend_code || Math.floor(1000 + Math.random() * 9000).toString(),
          ...updates,
        }, { onConflict: 'id' });

      if (error) throw error;

      // Cập nhật state ngay lập tức
      setProfile(prev => prev ? { ...prev, ...updates } : { id: user.id, email, ...updates });
      loadProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
