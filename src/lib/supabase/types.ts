export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          subscription_status: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          subscription_status?: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          subscription_status?: 'free' | 'pro' | 'cancelled' | 'payment_failed';
          test_count?: number;
          updated_at?: string;
        };
      };
      saju_tests: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time: string | null;
          gender: 'male' | 'female';
          result: string;
          model_used: 'flash' | 'pro';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time?: string | null;
          gender: 'male' | 'female';
          result: string;
          model_used: 'flash' | 'pro';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          birth_date?: string;
          birth_time?: string | null;
          gender?: 'male' | 'female';
          result?: string;
          model_used?: 'flash' | 'pro';
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: 'active' | 'cancelled' | 'payment_failed';
          next_billing_date: string | null;
          card_number: string | null;
          card_company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'active' | 'cancelled' | 'payment_failed';
          next_billing_date?: string | null;
          card_number?: string | null;
          card_company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'active' | 'cancelled' | 'payment_failed';
          next_billing_date?: string | null;
          card_number?: string | null;
          card_company?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          amount: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_key: string | null;
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          amount: number;
          currency?: string;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_key?: string | null;
          order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_key?: string | null;
          order_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type SajuTest = Database['public']['Tables']['saju_tests']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
