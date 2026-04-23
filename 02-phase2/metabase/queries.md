# Queries SQL para Metabase — Proyecto G28

Base de datos: `postgres` (contenedor `g28_postgres`), cargada por Odoo 17.

> **Nota sobre nombres traducibles**: En Odoo 17 los campos `name` de `product_template` y `product_category` se guardan como `jsonb` con las traducciones por idioma. Las queries usan `COALESCE(name->>'es_GT', name->>'en_US', name::text)` para funcionar con cualquier idioma. Si tu instalación usa otro, ajusta la clave.

Todos los estados de venta válidos para reportes: `state IN ('sale','done')` (cotizaciones en `draft`/`sent` se excluyen).

---

## 1. Ventas por mes

**Visualización**: gráfica de barras o de líneas.

```sql
SELECT
  date_trunc('month', so.date_order)::date AS mes,
  SUM(so.amount_untaxed)                   AS ventas_netas,
  SUM(so.amount_total)                     AS ventas_totales,
  COUNT(*)                                 AS ordenes
FROM sale_order so
WHERE so.state IN ('sale','done')
  [[AND so.date_order >= {{start_date}}]]
  [[AND so.date_order <  {{end_date}}]]
GROUP BY 1
ORDER BY 1;
```

## 2. Ventas por semana

```sql
SELECT
  date_trunc('week', so.date_order)::date  AS semana,
  SUM(so.amount_total)                     AS ventas_totales,
  COUNT(*)                                 AS ordenes
FROM sale_order so
WHERE so.state IN ('sale','done')
  [[AND so.date_order >= {{start_date}}]]
GROUP BY 1
ORDER BY 1;
```

## 3. Ganancias económicas (ingresos, costo y margen)

Calcula margen = `precio_venta - (cantidad × costo_estándar)`.

> En Odoo 17, `standard_price` es `company_dependent` y se guarda en `ir_property` (no como columna directa). Se obtiene vía un CTE.

```sql
WITH prod_cost AS (
  SELECT split_part(ip.res_id, ',', 2)::int AS product_id,
         ip.value_float                     AS standard_price
  FROM ir_property ip
  WHERE ip.name = 'standard_price'
    AND ip.res_id LIKE 'product.product,%'
)
SELECT
  date_trunc('month', so.date_order)::date AS mes,
  SUM(sol.price_subtotal)                                                           AS ingresos,
  SUM(sol.product_uom_qty * COALESCE(pc.standard_price, 0))                         AS costo,
  SUM(sol.price_subtotal  - sol.product_uom_qty * COALESCE(pc.standard_price, 0))   AS ganancia,
  CASE WHEN SUM(sol.price_subtotal) > 0 THEN
    ROUND(
      SUM(sol.price_subtotal - sol.product_uom_qty * COALESCE(pc.standard_price,0))::numeric
      / NULLIF(SUM(sol.price_subtotal), 0) * 100, 2
    )
  ELSE 0 END                                                                        AS margen_pct
FROM sale_order_line sol
JOIN sale_order so          ON so.id = sol.order_id AND so.state IN ('sale','done')
JOIN product_product pp     ON pp.id = sol.product_id
LEFT JOIN prod_cost pc      ON pc.product_id = pp.id
GROUP BY 1
ORDER BY 1;
```

## 4. Inventario — existencias actuales por producto

**Visualización**: gráfica de **barras** (eje X = producto, eje Y = existencias).

> Se pre-agregan solo los quants de ubicaciones **internas** en un CTE, si no los quants de `supplier`/`customer` (negativos/positivos) se cancelan y todo da 0.

```sql
WITH qty_internal AS (
  SELECT sq.product_id,
         SUM(sq.quantity) AS qty
  FROM stock_quant sq
  JOIN stock_location sl
    ON sl.id = sq.location_id AND sl.usage = 'internal'
  GROUP BY sq.product_id
)
SELECT
  pt.default_code AS codigo,
  COALESCE(pt.name->>'es_GT', pt.name->>'en_US', pt.name::text) AS producto,
  COALESCE(q.qty, 0)::numeric AS existencias
FROM product_template pt
JOIN product_product pp   ON pp.product_tmpl_id = pt.id
LEFT JOIN qty_internal q  ON q.product_id = pp.id
WHERE pt.active = true AND pt.sale_ok = true
ORDER BY existencias DESC;
```

## 5. Inventario — distribución por categoría

**Visualización**: gráfica de **pastel/dona** (dimension = categoria, metric = unidades).

> `product_category.name` en esta instalación es `varchar`, no `jsonb` — se usa `complete_name` (texto plano con jerarquía `Padre / Hijo`).

```sql
WITH prod_cost AS (
  SELECT split_part(ip.res_id, ',', 2)::int AS product_id,
         ip.value_float                     AS standard_price
  FROM ir_property ip
  WHERE ip.name = 'standard_price'
    AND ip.res_id LIKE 'product.product,%'
)
SELECT
  COALESCE(pc.complete_name, pc.name, 'Sin categoría')               AS categoria,
  SUM(sq.quantity)::numeric                                          AS unidades,
  SUM(sq.quantity * COALESCE(pcost.standard_price, 0))::numeric      AS valor_inventario
FROM stock_quant sq
JOIN stock_location sl   ON sl.id = sq.location_id AND sl.usage = 'internal'
JOIN product_product pp  ON pp.id = sq.product_id
JOIN product_template pt ON pt.id = pp.product_tmpl_id
LEFT JOIN product_category pc ON pc.id = pt.categ_id
LEFT JOIN prod_cost pcost     ON pcost.product_id = pp.id
WHERE pt.active = true
GROUP BY 1
ORDER BY unidades DESC;
```

## 6. Inventario — productos con stock bajo

**Visualización**: **tabla** con formato condicional en la columna `estado`.

Umbral por defecto: 10 unidades (editable vía variable `{{umbral}}`).

```sql
WITH qty_internal AS (
  SELECT sq.product_id,
         SUM(sq.quantity) AS qty
  FROM stock_quant sq
  JOIN stock_location sl
    ON sl.id = sq.location_id AND sl.usage = 'internal'
  GROUP BY sq.product_id
),
params AS (
  SELECT ({{umbral}})::numeric AS umbral
)
SELECT
  pt.default_code AS codigo,
  COALESCE(pt.name->>'es_GT', pt.name->>'en_US', pt.name::text) AS producto,
  COALESCE(q.qty, 0)::numeric AS stock_actual,
  p.umbral                    AS stock_minimo,
  CASE
    WHEN COALESCE(q.qty, 0) = 0               THEN 'Agotado'
    WHEN COALESCE(q.qty, 0) < p.umbral * 0.5  THEN 'Crítico'
    WHEN COALESCE(q.qty, 0) < p.umbral        THEN 'Bajo'
    ELSE 'OK'
  END AS estado
FROM product_template pt
CROSS JOIN params p
JOIN product_product pp   ON pp.product_tmpl_id = pt.id
LEFT JOIN qty_internal q  ON q.product_id = pp.id
WHERE pt.active = true AND pt.sale_ok = true
  AND COALESCE(q.qty, 0) < p.umbral
ORDER BY stock_actual ASC;
```

Variable en Metabase: `umbral`, tipo **Number**, valor por defecto `10`.

## 7a. Evolución de ventas por día (línea)

```sql
SELECT
  date_trunc('day', so.date_order)::date AS dia,
  SUM(so.amount_total)                   AS ventas
FROM sale_order so
WHERE so.state IN ('sale','done')
  [[AND so.date_order >= {{start_date}}]]
GROUP BY 1
ORDER BY 1;
```

## 7b. Evolución de ventas por semana (línea)

```sql
SELECT
  date_trunc('week', so.date_order)::date AS semana,
  SUM(so.amount_total)                    AS ventas
FROM sale_order so
WHERE so.state IN ('sale','done')
GROUP BY 1
ORDER BY 1;
```

## 7c. Evolución de ventas por mes (línea)

Misma forma que la #1, pero como visualización de línea.

## 8. Top 5 productos más vendidos

**Visualización**: tabla (o gráfica de barras horizontales).

```sql
SELECT
  pt.default_code AS codigo,
  COALESCE(pt.name->>'es_GT', pt.name->>'en_US', pt.name::text) AS producto,
  SUM(sol.product_uom_qty)::numeric  AS unidades_vendidas,
  SUM(sol.price_subtotal)::numeric   AS ingresos
FROM sale_order_line sol
JOIN sale_order so       ON so.id = sol.order_id AND so.state IN ('sale','done')
JOIN product_product pp  ON pp.id = sol.product_id
JOIN product_template pt ON pt.id = pp.product_tmpl_id
WHERE 1=1
  [[AND so.date_order >= {{start_date}}]]
  [[AND so.date_order <  {{end_date}}]]
GROUP BY pt.id, pt.default_code, pt.name
ORDER BY unidades_vendidas DESC
LIMIT 5;
```

---

## Variables recomendadas a nivel de dashboard

| Variable    | Tipo        | Por defecto    | Usada en        |
| ----------- | ----------- | -------------- | --------------- |
| `start_date`| Date        | primer día del año | #1, #2, #3, #7a, #8 |
| `end_date`  | Date        | hoy            | #1, #8          |
| `umbral`    | Number      | 10             | #6              |

En Metabase: al crear cada pregunta, en el panel lateral derecho → **Variables** → añadir una con el nombre correspondiente, marcar `[[ ... ]]` como opcional.
