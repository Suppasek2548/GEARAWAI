export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          admin_note: string | null
          booking_date: string
          booking_number: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          is_demo: boolean
          note: string | null
          price_snapshot: number
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          booking_date: string
          booking_number: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          is_demo?: boolean
          note?: string | null
          price_snapshot: number
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          booking_date?: string
          booking_number?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          note?: string | null
          price_snapshot?: number
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_slot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_note: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read_at: string | null
          replied_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string | null
          coupon_type: Database["public"]["Enums"]["coupon_type"]
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          max_discount_amount: number | null
          min_order_amount: number
          name: string
          per_user_limit: number
          start_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_days_after_claim: number | null
        }
        Insert: {
          code?: string | null
          coupon_type?: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number
          name: string
          per_user_limit?: number
          start_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_days_after_claim?: number | null
        }
        Update: {
          code?: string | null
          coupon_type?: Database["public"]["Enums"]["coupon_type"]
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number
          name?: string
          per_user_limit?: number
          start_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_days_after_claim?: number | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          bucket: string
          category: Database["public"]["Enums"]["media_category"]
          created_at: string
          file_name: string
          height: number | null
          id: string
          is_demo: boolean
          mime_type: string
          public_url: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          category?: Database["public"]["Enums"]["media_category"]
          created_at?: string
          file_name: string
          height?: number | null
          id?: string
          is_demo?: boolean
          mime_type: string
          public_url: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          category?: Database["public"]["Enums"]["media_category"]
          created_at?: string
          file_name?: string
          height?: number | null
          id?: string
          is_demo?: boolean
          mime_type?: string
          public_url?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_coupons: {
        Row: {
          claimed_at: string
          code: string
          coupon_id: string
          cycle_year: number
          expires_at: string
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          code: string
          coupon_id: string
          cycle_year: number
          expires_at: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          code?: string
          coupon_id?: string
          cycle_year?: number
          expires_at?: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_coupons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_image_url: string | null
          product_name: string
          product_sku: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_image_url?: string | null
          product_name: string
          product_sku: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_image_url?: string | null
          product_name?: string
          product_sku?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number
          id: string
          is_demo: boolean
          note: string | null
          order_number: string
          paid_at: string | null
          recipient_name: string
          recipient_phone: string
          shipped_at: string | null
          shipping_address: string
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          is_demo?: boolean
          note?: string | null
          order_number: string
          paid_at?: string | null
          recipient_name: string
          recipient_phone: string
          shipped_at?: string | null
          shipping_address: string
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          is_demo?: boolean
          note?: string | null
          order_number?: string
          paid_at?: string | null
          recipient_name?: string
          recipient_phone?: string
          shipped_at?: string | null
          shipping_address?: string
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_demo: boolean
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          payer_note: string | null
          reject_reason: string | null
          slip_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_demo?: boolean
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          payer_note?: string | null
          reject_reason?: string | null
          slip_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          payer_note?: string | null
          reject_reason?: string | null
          slip_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          id: number
          note: string | null
          order_id: string | null
          points: number
          redemption_id: string | null
          type: Database["public"]["Enums"]["points_txn_type"]
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: never
          note?: string | null
          order_id?: string | null
          points: number
          redemption_id?: string | null
          type: Database["public"]["Enums"]["points_txn_type"]
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: never
          note?: string | null
          order_id?: string | null
          points?: number
          redemption_id?: string | null
          type?: Database["public"]["Enums"]["points_txn_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "reward_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          media_id: string | null
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          media_id?: string | null
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          media_id?: string | null
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_demo: boolean
          is_featured: boolean
          low_stock_threshold: number
          name: string
          price: number
          sale_price: number | null
          short_description: string | null
          sku: string
          slug: string
          sold_count: number
          specifications: Json
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name: string
          price: number
          sale_price?: number | null
          short_description?: string | null
          sku: string
          slug: string
          sold_count?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_demo?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string
          slug?: string
          sold_count?: number
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          birth_date_change_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_demo: boolean
          phone: string | null
          points_balance: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_date_change_count?: number
          created_at?: string
          email: string
          full_name: string
          id: string
          is_demo?: boolean
          phone?: string | null
          points_balance?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_date_change_count?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          phone?: string | null
          points_balance?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          created_at: string
          product_id: string
          promotion_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          promotion_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "v_active_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          banner_desktop_url: string | null
          banner_mobile_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          show_on_homepage: boolean
          slug: string
          sort_order: number
          start_at: string
          updated_at: string
        }
        Insert: {
          banner_desktop_url?: string | null
          banner_mobile_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          end_at: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          show_on_homepage?: boolean
          slug: string
          sort_order?: number
          start_at: string
          updated_at?: string
        }
        Update: {
          banner_desktop_url?: string | null
          banner_mobile_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          end_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          show_on_homepage?: boolean
          slug?: string
          sort_order?: number
          start_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          admin_note: string | null
          cancelled_at: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          points_used: number
          reward_id: string
          reward_name: string
          status: Database["public"]["Enums"]["redemption_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          points_used: number
          reward_id: string
          reward_name: string
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          points_used?: number
          reward_id?: string
          reward_name?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          points_required: number
          sort_order: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name: string
          points_required: number
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name?: string
          points_required?: number
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note: string | null
          order_id: string | null
          product_id: string
          quantity_after: number
          quantity_change: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          order_id?: string | null
          product_id: string
          quantity_after: number
          quantity_change: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          order_id?: string | null
          product_id?: string
          quantity_after?: number
          quantity_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          description: string | null
          full_name: string
          id: string
          image_url: string | null
          is_active: boolean
          is_demo: boolean
          position: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          full_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          position: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          full_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_demo?: boolean
          position?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_active_promotions: {
        Row: {
          banner_desktop_url: string | null
          banner_mobile_url: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          end_at: string | null
          id: string | null
          name: string | null
          product_count: number | null
          show_on_homepage: boolean | null
          slug: string | null
          sort_order: number | null
          start_at: string | null
        }
        Insert: {
          banner_desktop_url?: string | null
          banner_mobile_url?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          end_at?: string | null
          id?: string | null
          name?: string | null
          product_count?: never
          show_on_homepage?: boolean | null
          slug?: string | null
          sort_order?: number | null
          start_at?: string | null
        }
        Update: {
          banner_desktop_url?: string | null
          banner_mobile_url?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          end_at?: string | null
          id?: string | null
          name?: string | null
          product_count?: never
          show_on_homepage?: boolean | null
          slug?: string | null
          sort_order?: number | null
          start_at?: string | null
        }
        Relationships: []
      }
      v_product_catalog: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          description: string | null
          effective_price: number | null
          id: string | null
          in_stock: boolean | null
          is_featured: boolean | null
          is_low_stock: boolean | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          primary_image_url: string | null
          sale_price: number | null
          short_description: string | null
          sku: string | null
          slug: string | null
          sold_count: number | null
          specifications: Json | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_quantity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _assert_admin: { Args: never; Returns: undefined }
      _award_order_points: { Args: { p_order_id: string }; Returns: number }
      _cart_subtotal: { Args: { p_uid: string }; Returns: number }
      _evaluate_coupon: {
        Args: { p_code: string; p_subtotal: number; p_uid: string }
        Returns: {
          code: string
          coupon_id: string
          discount: number
          member_coupon_id: string
          reason: string
        }[]
      }
      admin_adjust_points: {
        Args: { p_note: string; p_points: number; p_user_id: string }
        Returns: number
      }
      admin_adjust_stock: {
        Args: {
          p_change: number
          p_note?: string
          p_product_id: string
          p_type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Returns: number
      }
      admin_dashboard_stats: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      admin_set_account_status: {
        Args: {
          p_status: Database["public"]["Enums"]["account_status"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_set_member_birth_date: {
        Args: { p_birth_date: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_booking: {
        Args: {
          p_admin_note?: string
          p_booking_id: string
          p_status?: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
      admin_update_order_status: {
        Args: {
          p_order_id: string
          p_status: Database["public"]["Enums"]["order_status"]
          p_tracking?: string
        }
        Returns: undefined
      }
      admin_update_redemption: {
        Args: {
          p_note?: string
          p_redemption_id: string
          p_status: Database["public"]["Enums"]["redemption_status"]
        }
        Returns: undefined
      }
      admin_verify_payment: {
        Args: { p_approve: boolean; p_payment_id: string; p_reason?: string }
        Returns: undefined
      }
      calc_effective_price: {
        Args: {
          p_at?: string
          p_price: number
          p_product_id: string
          p_sale_price: number
        }
        Returns: number
      }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      cancel_order: {
        Args: { p_order_id: string; p_reason: string }
        Returns: undefined
      }
      claim_birthday_coupon: { Args: never; Returns: Json }
      create_booking: {
        Args: {
          p_contact_email: string
          p_contact_name: string
          p_contact_phone: string
          p_date: string
          p_note?: string
          p_service_id: string
          p_time_slot: string
        }
        Returns: string
      }
      get_booked_slots: {
        Args: { p_date: string; p_service_id: string }
        Returns: {
          time_slot: string
        }[]
      }
      get_my_cart: {
        Args: never
        Returns: {
          cart_item_id: string
          effective_price: number
          image_url: string
          is_purchasable: boolean
          line_total: number
          name: string
          price: number
          product_id: string
          product_status: Database["public"]["Enums"]["product_status"]
          quantity: number
          sale_price: number
          sku: string
          slug: string
          stock_quantity: number
        }[]
      }
      get_my_wishlist: {
        Args: never
        Returns: {
          effective_price: number
          image_url: string
          is_purchasable: boolean
          name: string
          price: number
          product_id: string
          product_status: Database["public"]["Enums"]["product_status"]
          sale_price: number
          sku: string
          slug: string
          stock_quantity: number
          wishlist_item_id: string
        }[]
      }
      get_public_gallery: {
        Args: never
        Returns: {
          alt_text: string
          height: number
          id: string
          public_url: string
          width: number
        }[]
      }
      get_setting: { Args: { p_key: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      media_usage: {
        Args: { p_media_id: string }
        Returns: {
          ref: string
          source: string
        }[]
      }
      next_booking_number: { Args: never; Returns: string }
      next_order_number: { Args: never; Returns: string }
      place_order: {
        Args: {
          p_coupon_code?: string
          p_note?: string
          p_recipient_name: string
          p_recipient_phone: string
          p_shipping_address: string
        }
        Returns: string
      }
      redeem_reward: { Args: { p_reward_id: string }; Returns: string }
      report_best_sellers: {
        Args: {
          p_from: string
          p_include_demo?: boolean
          p_limit?: number
          p_to: string
        }
        Returns: {
          name: string
          product_id: string
          quantity: number
          sales: number
          sku: string
        }[]
      }
      report_category_sales: {
        Args: { p_from: string; p_include_demo?: boolean; p_to: string }
        Returns: {
          category_id: string
          category_name: string
          quantity: number
          sales: number
        }[]
      }
      report_customers: {
        Args: {
          p_from: string
          p_include_demo?: boolean
          p_limit?: number
          p_to: string
        }
        Returns: {
          email: string
          full_name: string
          order_count: number
          total_spent: number
          user_id: string
        }[]
      }
      report_order_status: {
        Args: { p_from: string; p_include_demo?: boolean; p_to: string }
        Returns: {
          order_count: number
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      report_sales: {
        Args: {
          p_from: string
          p_group?: string
          p_include_demo?: boolean
          p_to: string
        }
        Returns: {
          order_count: number
          period: string
          sales: number
        }[]
      }
      set_my_birth_date: { Args: { p_birth_date: string }; Returns: undefined }
      submit_contact_message: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_subject: string
        }
        Returns: string
      }
      submit_payment: {
        Args: {
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_order_id: string
          p_slip_path?: string
        }
        Returns: string
      }
      th_now: { Args: never; Returns: string }
      th_today: { Args: never; Returns: string }
      validate_coupon: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      account_status: "active" | "suspended"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      coupon_type: "general" | "birthday"
      discount_type: "percentage" | "fixed_amount"
      media_category:
        | "product"
        | "banner"
        | "promotion"
        | "category"
        | "gallery"
        | "team"
        | "service"
        | "reward"
        | "other"
      message_status: "new" | "read" | "replied" | "archived"
      order_status:
        | "pending_payment"
        | "payment_submitted"
        | "paid"
        | "shipped"
        | "completed"
        | "cancelled"
      payment_method: "promptpay_demo" | "bank_transfer_demo"
      payment_status:
        | "pending"
        | "submitted"
        | "verified"
        | "rejected"
        | "voided"
      points_txn_type: "earn" | "redeem" | "adjust" | "reverse"
      product_status: "active" | "inactive"
      redemption_status: "requested" | "fulfilled" | "cancelled"
      stock_movement_type:
        | "initial"
        | "restock"
        | "order"
        | "cancel_return"
        | "adjustment"
      user_role: "member" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "suspended"],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      coupon_type: ["general", "birthday"],
      discount_type: ["percentage", "fixed_amount"],
      media_category: [
        "product",
        "banner",
        "promotion",
        "category",
        "gallery",
        "team",
        "service",
        "reward",
        "other",
      ],
      message_status: ["new", "read", "replied", "archived"],
      order_status: [
        "pending_payment",
        "payment_submitted",
        "paid",
        "shipped",
        "completed",
        "cancelled",
      ],
      payment_method: ["promptpay_demo", "bank_transfer_demo"],
      payment_status: [
        "pending",
        "submitted",
        "verified",
        "rejected",
        "voided",
      ],
      points_txn_type: ["earn", "redeem", "adjust", "reverse"],
      product_status: ["active", "inactive"],
      redemption_status: ["requested", "fulfilled", "cancelled"],
      stock_movement_type: [
        "initial",
        "restock",
        "order",
        "cancel_return",
        "adjustment",
      ],
      user_role: ["member", "admin"],
    },
  },
} as const
