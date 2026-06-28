import { defineQuery } from "next-sanity";

export const PRODUCT_COUNT_QUERY = defineQuery(`count(*[_type == "product"])`);

export const ORDER_COUNT_QUERY = defineQuery(`count(*[_type == "order"])`);

/**
 * Total revenue from orders where payment has been confirmed (paymentStatus == "paid")
 */
export const TOTAL_REVENUE_QUERY = defineQuery(`math::sum(*[
  _type == "order"
  && paymentStatus == "paid"
  && !(_id in path("drafts.**"))
].total)`);

// ============================================
// AI Insights Analytics Queries
// ============================================

export const ORDERS_LAST_7_DAYS_QUERY = defineQuery(`*[
  _type == "order"
  && createdAt >= $startDate
  && !(_id in path("drafts.**"))
] | order(createdAt desc) {
  _id,
  orderNumber,
  total,
  status,
  paymentMethod,
  paymentStatus,
  createdAt,
  "itemCount": count(items),
  items[]{
    quantity,
    priceAtPurchase,
    "productName": product->name,
    "productId": product->_id
  }
}`);

/**
 * Order status distribution — statuses match ORDER_STATUS_SANITY_LIST:
 * pending | shipped | delivered | cancelled
 */
export const ORDER_STATUS_DISTRIBUTION_QUERY = defineQuery(`{
  "pending": count(*[_type == "order" && status == "pending" && !(_id in path("drafts.**"))]),
  "shipped": count(*[_type == "order" && status == "shipped" && !(_id in path("drafts.**"))]),
  "delivered": count(*[_type == "order" && status == "delivered" && !(_id in path("drafts.**"))]),
  "cancelled": count(*[_type == "order" && status == "cancelled" && !(_id in path("drafts.**"))])
}`);

/**
 * Payment status distribution
 */
export const PAYMENT_STATUS_DISTRIBUTION_QUERY = defineQuery(`{
  "pending": count(*[_type == "order" && paymentStatus == "pending" && !(_id in path("drafts.**"))]),
  "paid": count(*[_type == "order" && paymentStatus == "paid" && !(_id in path("drafts.**"))]),
  "failed": count(*[_type == "order" && paymentStatus == "failed" && !(_id in path("drafts.**"))])
}`);

/**
 * Top selling products — only from orders where payment is confirmed
 */
export const TOP_SELLING_PRODUCTS_QUERY = defineQuery(`*[
  _type == "order"
  && paymentStatus == "paid"
  && !(_id in path("drafts.**"))
] {
  items[]{
    "productId": product->_id,
    "productName": product->name,
    "productPrice": product->price,
    quantity
  }
}.items[]`);

export const PRODUCTS_INVENTORY_QUERY = defineQuery(`*[_type == "product"] {
  _id,
  name,
  price,
  stock,
  "category": category->title
}`);

/**
 * Unfulfilled orders = placed (status == "pending") but payment confirmed
 */
export const UNFULFILLED_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
  && status == "pending"
  && paymentStatus == "paid"
  && !(_id in path("drafts.**"))
] | order(createdAt asc) {
  _id,
  orderNumber,
  total,
  createdAt,
  email,
  paymentMethod,
  "itemCount": count(items)
}`);

export const REVENUE_BY_PERIOD_QUERY = defineQuery(`{
  "currentPeriod": math::sum(*[
    _type == "order"
    && paymentStatus == "paid"
    && createdAt >= $currentStart
    && !(_id in path("drafts.**"))
  ].total),
  "previousPeriod": math::sum(*[
    _type == "order"
    && paymentStatus == "paid"
    && createdAt >= $previousStart
    && createdAt < $currentStart
    && !(_id in path("drafts.**"))
  ].total),
  "currentOrderCount": count(*[
    _type == "order"
    && createdAt >= $currentStart
    && !(_id in path("drafts.**"))
  ]),
  "previousOrderCount": count(*[
    _type == "order"
    && createdAt >= $previousStart
    && createdAt < $currentStart
    && !(_id in path("drafts.**"))
  ])
}`);
