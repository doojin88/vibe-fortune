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
          billing_key: string;
          customer_key: string;
          card_number: string | null;
          card_type: string | null;
          card_company: string | null;
          status: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date: string;
          last_billing_date: string | null;
          billing_key_deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          billing_key: string;
          customer_key: string;
          card_number?: string | null;
          card_type?: string | null;
          card_company?: string | null;
          status?: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date: string;
          last_billing_date?: string | null;
          billing_key_deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          billing_key?: string;
          customer_key?: string;
          card_number?: string | null;
          card_type?: string | null;
          card_company?: string | null;
          status?: 'active' | 'cancelled' | 'terminated' | 'payment_failed';
          next_billing_date?: string;
          last_billing_date?: string | null;
          billing_key_deleted_at?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          status: 'done' | 'cancelled' | 'failed';
          paid_at: string;
          cancelled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          payment_key: string;
          order_id: string;
          amount: number;
          status: 'done' | 'cancelled' | 'failed';
          paid_at: string;
          cancelled_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string;
          payment_key?: string;
          order_id?: string;
          amount?: number;
          status?: 'done' | 'cancelled' | 'failed';
          paid_at?: string;
          cancelled_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type SajuTest = Database['public']['Tables']['saju_tests']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
