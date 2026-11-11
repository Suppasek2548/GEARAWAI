-- Source: docs/GEARAWAI_DB_SCHEMA_DRAFT.sql (section 0012) — split verbatim, logic unchanged
-- ---------------------------------------------------------------------
-- 0012  PRICE / CATALOG VIEWS (R-12: สูตรราคาที่เดียว)
-- ---------------------------------------------------------------------
create or replace function public.calc_effective_price(
  p_price numeric, p_sale_price numeric, p_product_id uuid, p_at timestamptz default now())
returns numeric language sql stable set search_path = '' as $$
  select least(
    p_price,
    coalesce(p_sale_price, p_price),
    coalesce((
      select min(case when pr.discount_type = 'percentage'
                      then round(p_price * (1 - pr.discount_value / 100.0), 2)
                      else greatest(p_price - pr.discount_value, 0) end)
        from public.promotion_products pp
        join public.promotions pr on pr.id = pp.promotion_id
       where pp.product_id = p_product_id
         and pr.is_active and p_at >= pr.start_at and p_at < pr.end_at
    ), p_price));
$$;

create view public.v_product_catalog with (security_invoker = true) as
select p.id, p.sku, p.name, p.slug, p.short_description, p.description, p.specifications,
       p.price, p.sale_price,
       public.calc_effective_price(p.price, p.sale_price, p.id) as effective_price,
       p.stock_quantity, p.low_stock_threshold,
       (p.stock_quantity > 0) as in_stock,
       (p.stock_quantity > 0 and p.stock_quantity <= p.low_stock_threshold) as is_low_stock,
       p.sold_count, p.status, p.is_featured, p.created_at,
       b.id as brand_id, b.name as brand_name, b.slug as brand_slug,
       c.id as category_id, c.name as category_name, c.slug as category_slug,
       (select pi.image_url from public.product_images pi
         where pi.product_id = p.id and pi.is_primary limit 1) as primary_image_url
  from public.products p
  join public.brands b on b.id = p.brand_id
  join public.categories c on c.id = p.category_id;

create view public.v_active_promotions with (security_invoker = true) as
select pr.id, pr.name, pr.slug, pr.description, pr.discount_type, pr.discount_value,
       pr.start_at, pr.end_at, pr.show_on_homepage, pr.banner_desktop_url, pr.banner_mobile_url, pr.sort_order,
       (select count(*) from public.promotion_products pp where pp.promotion_id = pr.id) as product_count
  from public.promotions pr
 where pr.is_active and now() >= pr.start_at and now() < pr.end_at;
