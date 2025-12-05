import { supabase, TABLES } from './supabase';
import { CreateUserParams, SignInParams } from '@/type';
import { User } from '@/type';

/**
 * Create a new user account
 */
export const createUser = async ({ email, password, name }: CreateUserParams) => {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user profile in users table
    const { data: profileData, error: profileError } = await supabase
      .from(TABLES.USERS)
      .insert({
        id: authData.user.id,
        email,
        name,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B35&color=fff`,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to sign in anyway
      console.warn('Profile creation failed:', profileError);
    }

    // Sign in automatically after signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    return signInData.user;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create user');
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async ({ email, password }: SignInParams) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Sign-in failed');
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message || 'Sign-out failed');
  }
};

/**
 * Get current authenticated user with profile
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) return null;

    // Fetch user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      // If profile doesn't exist, create one
      const { data: newProfile } = await supabase
        .from(TABLES.USERS)
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          avatar_url: authUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.email?.split('@')[0] || 'User')}&background=FF6B35&color=fff`,
        })
        .select()
        .single();

      if (newProfile) {
        return {
          $id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          avatar: newProfile.avatar_url,
        } as User;
      }
      return null;
    }

    return {
      $id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar_url,
    } as User;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
};

/**
 * Get current session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    return null;
  }
};

