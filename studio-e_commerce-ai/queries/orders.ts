import { defineQuery } from "next-sanity";

/**
 * Get orders by Clerk user ID
 * Used on orders list page
 */
export const ORDERS_BY_USER_QUERY = defineQuery(`*[
  _type == "order"
  && clerkUserId == $clerkUserId
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
  "itemNames": items[].product->name,
  "itemImages": items[].product->images[0].asset->url
}`);

/**
 * Get single order by ID with full details
 * Used on order detail page
 */
export const ORDER_BY_ID_QUERY = defineQuery(`*[
  _type == "order"
  && _id == $id
  && !(_id in path("drafts.**"))
][0] {
  _id,
  orderNumber,
  clerkUserId,
  email,
  paymentMethod,
  paymentStatus,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{
      _id,
      name,
      "slug": slug.current,
      "image": images[0]{
        asset->{
          _id,
          url
        }
      }
    }
  },
  total,
  status,
  address{
    name,
    line1,
    line2,
    city,
    postcode,
    country
  },
  createdAt
}`);

/**
 * Get recent orders (for admin dashboard)
 */
export const RECENT_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
  && !(_id in path("drafts.**"))
] | order(createdAt desc) [0...$limit] {
  _id,
  orderNumber,
  email,
  total,
  status,
  paymentMethod,
  paymentStatus,
  createdAt
}`);

/**
 * Check if order exists by order number
 * Used for idempotency check
 */
export const ORDER_BY_ORDER_NUMBER_QUERY = defineQuery(`*[
  _type == "order"
  && orderNumber == $orderNumber
  && !(_id in path("drafts.**"))
][0]{ _id }`);