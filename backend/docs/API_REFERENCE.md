# Ecom Backend — API Reference

Base URL (local dev): `http://localhost:5000`

All requests and responses use JSON (`Content-Type: application/json`).
Database record IDs and foreign-key IDs are numeric auto-increment values.

Start the server first:

```bash
npm run dev
# Server is running on http://localhost:5000
```

## Breaking route changes

The API is split into three scopes. The old `/api/admin/auth`, `/api/admin/products`,
`/api/admin/orders`, `/api/admin/settings`, and public `/api/store` routes no longer exist.

| Old route | Current route |
| --- | --- |
| `POST /api/admin/auth/login` | `POST /api/auth/login` |
| `POST /api/admin/auth/logout` | `POST /api/auth/logout` |
| `GET /api/admin/auth/me` | `GET /api/auth/me` |
| `PUT /api/admin/auth/profile` | `PUT /api/auth/profile` |
| `PUT /api/admin/settings/password` | `PUT /api/auth/password` |
| `/api/admin/products/**` | `/api/shop/products/**` |
| `/api/admin/orders/**` | `/api/shop/orders/**` |
| `/api/admin/settings` | `/api/shop/settings/store` (plus `storefront`, `orders`, `courier`) |
| `GET /api/store` | Removed (store settings are admin-only now) |

---

## Contents

- [Response format](#response-format)
- [Authentication and authorization](#authentication-and-authorization)
- [Endpoint summary](#endpoint-summary)
- [Public endpoints](#public-endpoints)
  - [Products](#public-products)
  - [Place an order](#place-an-order)
- [Auth endpoints](#auth-endpoints)
  - [Register a shop](#post-apiauthregister)
- [Shop endpoints](#shop-endpoints)
  - [Products](#shop-products)
  - [Orders](#shop-orders)
  - [Settings](#shop-settings)
  - [Dashboard](#shop-dashboard)
  - [Sidebar stats](#shop-sidebar-stats)
- [Super admin endpoints](#super-admin-endpoints)
  - [Dashboard](#super-admin-dashboard)
  - [Sidebar stats](#super-admin-sidebar-stats)
  - [Users](#super-admin-users)
  - [Roles](#super-admin-roles)
  - [Shops](#super-admin-shops)
  - [Audit log](#super-admin-audit-log)
- [Enums and rules](#enums-and-rules)
- [Error codes](#error-codes)
- [Postman files](#postman-files)

---

## Response format

Every endpoint returns a consistent envelope:

```json
{
  "success": true,
  "data": {},
  "message": "optional human-readable message"
}
```

Validation errors add an `errors` object keyed by field name:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "slug": "Use lowercase letters, numbers, and single hyphens only."
  }
}
```

---

## Authentication and authorization

Authentication is a JWT stored in an **HttpOnly cookie** named `admin_token`.

| Detail | Value |
| --- | --- |
| Login endpoint | `POST /api/auth/login` |
| Cookie name | `admin_token` |
| Token algorithm | HS256 |
| Token lifetime | 8 hours |
| Cookie max age | 30 days (the JWT inside still expires after 8 hours) |
| Cookie flags | `HttpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/` |
| Auth middleware | `requireAuth` |
| Super admin guard | `requireSuperAdmin` |

**How it works:**

1. `POST /api/auth/login` with email + password.
2. The response sets the `admin_token` cookie.
3. Postman/browsers store and re-send the cookie automatically.
4. If cookies are disabled, copy the cookie value and send it manually as:
   `Cookie: admin_token=<token>`

**Authorization scopes:**

| Scope | Prefix | Requirement |
| --- | --- | --- |
| Public | `/api/products`, `/api/orders`, `/api/auth/login`, `/api/auth/logout` | None |
| Authenticated | `/api/auth/*` (except login/logout), `/api/shop/**` | Valid `admin_token` |
| Super admin | `/api/admin/super/**` | Valid `admin_token` + role `super_admin` |

Additional checks performed by `requireAuth` on every authenticated request:

- Missing/invalid/expired token → `401 Unauthorized`.
- User `status !== "active"` → `403 Your account is inactive...`.
- User belongs to a shop and the shop `status !== "active"` → `403 This shop is inactive...`.
- Non-super-admin calling `/api/admin/super/**` → `403 Super admin access required`.

> **Note:** The authenticated user's role permissions are returned by `GET /api/auth/me`
> and used by the frontend for UI gating. Shop routes currently enforce authentication
> only — they do not reject requests per module permission.

**Login rate limit:** 5 failed attempts per IP per 15 minutes → `429 Too Many
Attempts`. Successful logins are not counted.

**Current tenancy:** `Product`, `Order`, and the settings singletons do not have a
`shopId` column, so the `/api/shop/**` endpoints operate on the single global
dataset rather than per-shop data. `Shop`/`User` relationships are enforced by the
super admin endpoints.

---

## Endpoint summary

| # | Method | Path | Auth | Description |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/products` | Public | List active products |
| 2 | GET | `/api/products/:slug` | Public | Get one active product + reviews |
| 3 | POST | `/api/orders` | Public | Place an order |
| 4 | POST | `/api/auth/login` | Public | Login (sets cookie) |
| 5 | POST | `/api/auth/logout` | Public | Clear cookie |
| 6 | GET | `/api/auth/me` | Auth | Get current user + role/shop |
| 7 | PUT | `/api/auth/profile` | Auth | Update own email |
| 8 | PUT | `/api/auth/password` | Auth | Change own password |
| 9 | GET | `/api/shop/products` | Auth | List all products |
| 10 | GET | `/api/shop/products/:id` | Auth | Get product by ID |
| 11 | POST | `/api/shop/products` | Auth | Create product |
| 12 | PUT | `/api/shop/products/:id` | Auth | Update product (full body) |
| 13 | DELETE | `/api/shop/products/:id` | Auth | Delete product |
| 14 | GET | `/api/shop/orders` | Auth | List / filter orders |
| 15 | GET | `/api/shop/orders/:id` | Auth | Get order details |
| 16 | PATCH | `/api/shop/orders/:id/status` | Auth | Update order / payment status |
| 17 | GET | `/api/shop/settings/store` | Auth | Get store settings |
| 18 | PUT | `/api/shop/settings/store` | Auth | Update store settings |
| 19 | GET | `/api/shop/settings/storefront` | Auth | Get announcement, banners, colors |
| 20 | PUT | `/api/shop/settings/storefront` | Auth | Save storefront settings |
| 21 | GET | `/api/shop/settings/orders` | Auth | Get order settings |
| 22 | PUT | `/api/shop/settings/orders` | Auth | Update order settings |
| 23 | GET | `/api/shop/settings/courier` | Auth | Get courier settings |
| 24 | PUT | `/api/shop/settings/courier` | Auth | Update courier settings |
| 25 | GET | `/api/shop/dashboard` | Auth | Shop dashboard metrics |
| 26 | GET | `/api/shop/sidebar-stats` | Auth | Sidebar badge counts |
| 27 | GET | `/api/admin/super/dashboard` | Super admin | Platform dashboard |
| 28 | GET | `/api/admin/super/sidebar-stats` | Super admin | Platform badge counts |
| 29 | GET | `/api/admin/super/users` | Super admin | List users |
| 30 | POST | `/api/admin/super/users` | Super admin | Create user |
| 31 | PATCH | `/api/admin/super/users/:id` | Super admin | Update user |
| 32 | PATCH | `/api/admin/super/users/:id/password` | Super admin | Reset user password |
| 33 | DELETE | `/api/admin/super/users/:id` | Super admin | Deactivate user (soft delete) |
| 34 | GET | `/api/admin/super/roles` | Super admin | List roles |
| 35 | POST | `/api/admin/super/roles` | Super admin | Create role |
| 36 | PATCH | `/api/admin/super/roles/:id` | Super admin | Update role |
| 37 | DELETE | `/api/admin/super/roles/:id` | Super admin | Delete role |
| 38 | GET | `/api/admin/super/shops` | Super admin | List shops |
| 39 | POST | `/api/admin/super/shops` | Super admin | Create shop |
| 40 | PATCH | `/api/admin/super/shops/:id` | Super admin | Update shop |
| 41 | GET | `/api/admin/super/audit` | Super admin | List audit logs |

---

## Public endpoints

### Public products

#### GET `/api/products`

Returns all products where `isActive = true`, newest first.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "ultrahot",
      "name": "Ultra Hot Capsules",
      "brandName": "ULTRAHOT",
      "category": "Herbal Supplement",
      "currentPrice": 1600,
      "regularPrice": 2990,
      "discountPercent": 47,
      "inStock": true,
      "isActive": true,
      "stockQuantity": 100,
      "images": ["/images/products/ultrahot/1.webp"],
      "orderFormConfig": null,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T12:00:00.000Z"
    }
  ]
}
```

#### GET `/api/products/:slug`

Returns a single active product and its `reviews`.

- `404` if the product does not exist or `isActive` is `false`.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "ultrahot",
    "name": "Ultra Hot Capsules",
    "images": ["/images/products/ultrahot/1.webp"],
    "reviews": [
      {
        "id": 1,
        "productId": 1,
        "name": "Rahim",
        "location": "Dhaka",
        "rating": 5,
        "comment": "Great product",
        "status": "approved",
        "createdAt": "2026-10-27T12:00:00.000Z"
      }
    ]
  }
}
```

---

### Place an order

#### POST `/api/orders`

**Body:**

```json
{
  "customerName": "Md. Rakib Hasan",
  "customerPhone": "01711223344",
  "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
  "notes": "Please call before delivery.",
  "deliveryArea": "Inside Dhaka",
  "deliveryCharge": 60,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 1600
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `customerName` | Yes | Non-empty string |
| `customerPhone` | Yes | Non-empty string |
| `customerAddress` | Yes | Non-empty string |
| `items` | Yes | At least one item |
| `items[].productId` | Yes | Positive numeric product ID |
| `items[].quantity` | Yes | Whole number |
| `items[].unitPrice` | Yes | Whole number |
| `notes` | No | String |
| `deliveryArea` | No | Defaults to `"Inside Dhaka"` |
| `deliveryCharge` | No | Whole number, defaults to `0` |

**Server-side behaviour:**

- `subtotal` = sum of `unitPrice * quantity`
- `total` = `subtotal + deliveryCharge`
- `orderNumber` is generated automatically (e.g. `PZ-123456`)
- `paymentMethod` is always `"cod"`
- `paymentStatus` starts as `"unpaid"`
- `status` starts as `"pending"`
- The client-supplied `unitPrice` is stored as-is; the server does **not** look up
  the product's current price or check stock.

**Response `201`:**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": 42,
    "orderNumber": "PZ-123456",
    "customerName": "Md. Rakib Hasan",
    "customerPhone": "01711223344",
    "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
    "notes": "Please call before delivery.",
    "deliveryArea": "Inside Dhaka",
    "deliveryCharge": 60,
    "subtotal": 3200,
    "total": 3260,
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "status": "pending",
    "createdAt": "2026-11-04T10:00:00.000Z",
    "items": [
      {
        "id": 1,
        "orderId": 42,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 1600,
        "lineTotal": 3200
      }
    ]
  }
}
```

**Errors:**

- `400` — required fields missing, a price/quantity is fractional, or a
  `productId` is not a positive integer.
- `500` — product ID does not exist (foreign-key failure) or DB error.

---

## Auth endpoints

### POST `/api/auth/register`

Publicly registers a shop and its initial shop-admin account. Shop creation and
account creation are atomic. On success, the endpoint sets the `admin_token`
cookie and returns the authenticated user shape.

**Body:**

```json
{
  "shopName": "Herbal Vitality BD",
  "name": "Shop Owner",
  "email": "owner@example.com",
  "mobile": "01712345678",
  "address": "Dhaka, Bangladesh",
  "password": "use-a-long-password"
}
```

`mobile` and `address` are optional. Passwords must be at least 12 characters.
Successful registrations create an active shop and sign the owner in.

**Errors:**

- `409` — email or shop URL is already in use
- `422` — invalid registration fields
- `429` — too many registration attempts (3 per hour per IP)

### POST `/api/auth/login`

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

**Response `200`:** sets the `admin_token` cookie and returns the current user:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Super Admin",
    "role": "super_admin",
    "roleDisplayName": "Super Admin",
    "permissions": {},
    "shopId": null,
    "shop": null,
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T12:00:00.000Z"
  }
}
```

A shop user has `shopId` set and `shop` populated:

```json
{
  "shopId": 2,
  "shop": {
    "id": 2,
    "name": "Power Zenox",
    "slug": "power-zenox",
    "status": "active"
  }
}
```

**Errors:**

- `401` — invalid email or password
- `403` — user account is inactive, or the user's shop is inactive
- `429` — too many failed attempts

### POST `/api/auth/logout`

Clears the `admin_token` cookie. Works even if the token is already invalid/expired.

```json
{ "success": true }
```

### GET `/api/auth/me`

Returns the currently authenticated user. Requires the `admin_token` cookie.

Response `data` is the same user shape returned by login.

**Errors:** `401` missing/invalid cookie, `403` inactive account or shop.

### PUT `/api/auth/profile`

Updates the authenticated user's email address.

**Body:**

```json
{ "email": "new-admin@example.com" }
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "new-admin@example.com",
    "name": "Super Admin",
    "role": "super_admin",
    "roleDisplayName": "Super Admin",
    "permissions": {},
    "shopId": null,
    "shop": null,
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-11-04T10:00:00.000Z"
  }
}
```

**Errors:** `400` invalid email or email already used by another user.

### PUT `/api/auth/password`

Changes the authenticated user's password.

**Body:**

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-min-8"
}
```

**Response `200`:**

```json
{ "success": true, "message": "Password updated successfully" }
```

**Errors:**

- `400` — current password incorrect, or new password shorter than 8 characters.
  Includes `errors` keyed by `currentPassword` / `newPassword`.

---

## Shop endpoints

> All routes in this section require a valid `admin_token` cookie.
> See [Authentication and authorization](#authentication-and-authorization).

### Shop products

#### GET `/api/shop/products`

Returns **all** products (active and inactive), newest first.

```json
{ "success": true, "data": [ /* product objects */ ] }
```

#### GET `/api/shop/products/:id`

Get a product by its numeric ID. `404` if not found or the ID is invalid.

#### POST `/api/shop/products`

**Body (all required unless marked optional):**

```json
{
  "name": "Ultra Hot Capsules",
  "brandName": "ULTRAHOT",
  "category": "Herbal Supplement",
  "slug": "ultrahot-capsules",
  "regularPrice": 2990,
  "currentPrice": 1600,
  "stockQuantity": 100,
  "images": [
    "https://example.com/image.webp",
    "/images/products/ultrahot/1.webp"
  ],
  "isActive": true
}
```

**Validation rules:**

| Field | Rule |
| --- | --- |
| `name` | 1–200 chars |
| `brandName` | 1–100 chars |
| `category` | 1–100 chars |
| `slug` | 1–100 chars, lowercase letters/numbers/single hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), unique |
| `regularPrice` | Integer 1–10,000,000 |
| `currentPrice` | Integer 1–10,000,000, ≤ `regularPrice` |
| `stockQuantity` | Integer 0–1,000,000 |
| `images` | 1–10 items; each starts with `/` (not `//`) or `https://`; max 500 chars |
| `isActive` | Optional boolean, defaults to `true` |

**Auto-calculated fields:** `discountPercent` and `inStock` are derived from price/stock, not accepted from the client.

**Response `201`:** `{ "success": true, "data": { /* product */ } }`

**Errors:** `422` validation failed; `409` duplicate slug; `500` DB error.

#### PUT `/api/shop/products/:id`

Updates a product. The body is the **same full schema as create** — all fields are required (`isActive` optional). It is not a partial update.

**Response `200`:** `{ "success": true, "data": { /* product */ } }`

**Errors:** `422` validation failed; `404` product not found; `409` duplicate slug.

#### DELETE `/api/shop/products/:id`

Deletes a product.

**Response `200`:**

```json
{ "success": true }
```

**Errors:** `404` not found; `409` if the product is referenced by an order
(`This product has orders and cannot be deleted. Deactivate it instead.`).

---

### Shop orders

#### GET `/api/shop/orders`

**Query parameters:**

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `20` | 1–100 |
| `status` | enum | — | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| `paymentStatus` | enum | — | `unpaid`, `paid` |
| `area` | string | — | Exact `deliveryArea` match, max 100 chars |
| `dateFrom` | `YYYY-MM-DD` | — | Dhaka-time day start (UTC+6) |
| `dateTo` | `YYYY-MM-DD` | — | Inclusive end date (Dhaka time) |
| `q` | string | — | Search order number, customer name, or phone, max 100 chars |

Example: `GET /api/shop/orders?page=1&limit=20&status=pending&q=rahim`

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "orderNumber": "PZ-123456",
        "customerName": "Md. Rakib Hasan",
        "customerPhone": "01711223344",
        "deliveryArea": "Inside Dhaka",
        "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
        "total": 3260,
        "orderStatus": "pending",
        "status": "pending",
        "paymentStatus": "unpaid",
        "paymentMethod": "cod",
        "createdAt": "2026-11-04T10:00:00.000Z",
        "itemCount": 1
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1,
    "areas": ["Inside Dhaka", "Outside Dhaka"],
    "counts": {
      "all": { "count": 1, "totalPrice": 3260 },
      "pending": { "count": 1, "totalPrice": 3260 },
      "confirmed": { "count": 0, "totalPrice": 0 },
      "shipped": { "count": 0, "totalPrice": 0 },
      "delivered": { "count": 0, "totalPrice": 0 },
      "cancelled": { "count": 0, "totalPrice": 0 }
    }
  }
}
```

- `counts` and `areas` are computed across **all** orders, not just the current
  filter/page.
- `dateFrom`/`dateTo` are validated as ISO dates.

**Errors:** `422` invalid query values.

#### GET `/api/shop/orders/:id`

Returns full order details including product info per line item.

```json
{
  "success": true,
  "data": {
    "id": 42,
    "orderNumber": "PZ-123456",
    "customerName": "Md. Rakib Hasan",
    "customerPhone": "01711223344",
    "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
    "notes": "Please call before delivery.",
    "deliveryArea": "Inside Dhaka",
    "deliveryCharge": 60,
    "subtotal": 3200,
    "total": 3260,
    "paymentMethod": "cod",
    "paymentStatus": "unpaid",
    "status": "pending",
    "orderStatus": "pending",
    "createdAt": "2026-11-04T10:00:00.000Z",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 1600,
        "lineTotal": 3200,
        "product": {
          "name": "Ultra Hot Capsules",
          "slug": "ultrahot",
          "image": "/images/products/ultrahot/1.webp"
        }
      }
    ]
  }
}
```

**Errors:** `404` order not found.

#### PATCH `/api/shop/orders/:id/status`

**Body** (at least one field required):

```json
{
  "orderStatus": "confirmed",
  "paymentStatus": "paid"
}
```

**Allowed status transitions:**

| From | To |
| --- | --- |
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `shipped`, `cancelled` |
| `shipped` | `delivered`, `cancelled` |
| `delivered` | — (final) |
| `cancelled` | — (final) |

**Rules:**

- Changing `paymentStatus` on a cancelled order is rejected (`409`).
- Invalid status transition returns `409`.
- Updates are applied conditionally on the current status to avoid concurrent
  transition races.

**Response `200`:** the full updated order (same shape as `GET /api/shop/orders/:id`).

**Errors:** `404` order not found, `409` invalid transition, `422` validation failed.

---

### Shop settings

The settings endpoints manage four singleton records (`id = 1`). Each `GET`
returns the saved state, and each `PUT` replaces the full object (not a partial
update) unless noted otherwise.

#### GET/PUT `/api/shop/settings/store`

**GET response `200`:**

```json
{
  "success": true,
  "data": {
    "name": "Power Zenox",
    "tagline": "Explore our premium products",
    "description": "Natural herbal health and wellness products.",
    "logo": null,
    "contact": {
      "phone": "01780212230",
      "phone_2": "",
      "whatsapp": "01780212230",
      "whatsapp_2": "",
      "email": "support@powerzenox.com",
      "address": "Dhaka, Bangladesh",
      "google_maps_url": ""
    },
    "social": {
      "facebook": "",
      "instagram": "",
      "youtube": "",
      "tiktok": ""
    }
  }
}
```

**PUT body:** same shape as the `data` object above.

**Validation rules:**

| Field | Rule |
| --- | --- |
| `name` | 1–120 chars |
| `tagline` | 1–200 chars |
| `description` | ≤ 300 chars (may be empty) |
| `logo` | String or `null`, optional |
| `contact.phone` | Required, Bangladeshi mobile: `^01[3-9]\d{8}$` |
| `contact.phone_2` | Empty string or Bangladeshi mobile |
| `contact.whatsapp` | Required, Bangladeshi mobile |
| `contact.whatsapp_2` | Empty string or Bangladeshi mobile |
| `contact.email` | Valid email |
| `contact.address` | 1–500 chars |
| `contact.google_maps_url` | Empty, or starts with `http://` / `https://` |
| `social.facebook` | Empty, or starts with `http://` / `https://` |
| `social.instagram` | Empty, or starts with `http://` / `https://` |
| `social.youtube` | Empty, or starts with `http://` / `https://` |
| `social.tiktok` | Empty, or starts with `http://` / `https://` |

**Responses:** `GET` returns `200` with the store object, or `404` if the store
row is not initialized. `PUT` returns `200` with the saved object, or `422` on
validation failure.

#### GET/PUT `/api/shop/settings/storefront`

**GET response `200`:**

```json
{
  "success": true,
  "data": {
    "announcement": {
      "enabled": true,
      "marquee_text": "Free delivery on orders over 2000 BDT",
      "order_note": "We will call you before delivery."
    },
    "banners": [
      {
        "id": 1,
        "image_url": "/images/banner/1.webp",
        "alt_text": "Summer Sale",
        "link_url": "https://example.com/sale",
        "is_active": true
      }
    ],
    "brand_colors": {
      "primary": "#0D9488",
      "background": "#FAF8FF"
    }
  }
}
```

**PUT body:** same shape.

**Validation rules:**

| Field | Rule |
| --- | --- |
| `announcement.enabled` | Boolean |
| `announcement.marquee_text` | ≤ 200 chars (may be empty) |
| `announcement.order_note` | ≤ 160 chars (may be empty) |
| `banners` | Array, max 10 items |
| `banners[].id` | Optional positive number, or a temporary string for a new banner |
| `banners[].image_url` | ≤ 500 chars, defaults to `""` |
| `banners[].alt_text` | ≤ 200 chars, optional |
| `banners[].link_url` | Optional; empty or starts with `http://` / `https://` |
| `banners[].is_active` | Required boolean |
| `brand_colors.primary` | Hex color `#RRGGBB` |
| `brand_colors.background` | Hex color `#RRGGBB` |

**Banner reconciliation:** the whole array is saved transactionally. Banners with
an existing numeric `id` are updated, banners without one are created, and any
saved banner not present in the payload is deleted. Banner position follows array
index.

**Responses:** `GET` returns `200` with the storefront object, or `404` if not
initialized. `PUT` returns `200` with the saved object, or `422` on validation
failure.

#### GET/PUT `/api/shop/settings/orders`

**GET response `200`:**

```json
{
  "success": true,
  "data": {
    "duplicate_block": { "enabled": true, "minutes": 15 },
    "location_fields": { "enabled": true },
    "delivery_charges": {
      "inside_dhaka": 70,
      "outside_dhaka": 120,
      "free_delivery_above": 2000
    },
    "mobile_verification": { "enabled": false },
    "sms_confirmation": { "enabled": false },
    "vpn_protection": { "enabled": false },
    "courier_protection": { "enabled": false, "min_success_ratio": 65 }
  }
}
```

**PUT body:** same shape. The last four sections are optional for backward
compatibility; omitted beta flags keep their stored values.

**Validation rules:**

| Field | Rule |
| --- | --- |
| `duplicate_block.enabled` | Boolean |
| `duplicate_block.minutes` | Integer 1–1440 |
| `location_fields.enabled` | Boolean |
| `delivery_charges.inside_dhaka` | Integer 0–100,000 |
| `delivery_charges.outside_dhaka` | Integer 0–100,000 |
| `delivery_charges.free_delivery_above` | Integer 0–1,000,000 |
| `mobile_verification.enabled` | Boolean, optional |
| `sms_confirmation.enabled` | Boolean, optional |
| `vpn_protection.enabled` | Boolean, optional |
| `courier_protection.enabled` | Boolean, optional |
| `courier_protection.min_success_ratio` | Integer 0–100, optional |

> These settings are stored for future order-flow enforcement. The public
> `POST /api/orders` endpoint currently does not apply duplicate blocking,
> delivery-charge calculation, or location validation.

**Responses:** `GET` returns `200` with the settings object, or `404` if not
initialized. `PUT` returns `200` with the saved object, or `422` on validation
failure.

#### GET/PUT `/api/shop/settings/courier`

**GET response `200`** (auto-creates defaults on first read):

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "flat_fee_enabled": true,
    "inside_dhaka_fee": 60,
    "sub_dhaka_fee": 100,
    "outside_dhaka_fee": 130,
    "free_delivery_above": 2000
  }
}
```

**PUT body:** same shape, all fields required.

| Field | Rule |
| --- | --- |
| `enabled` | Boolean |
| `flat_fee_enabled` | Boolean |
| `inside_dhaka_fee` | Integer 0–100,000 |
| `sub_dhaka_fee` | Integer 0–100,000 |
| `outside_dhaka_fee` | Integer 0–100,000 |
| `free_delivery_above` | Integer 0–1,000,000 |

**Responses:** `200` with the saved object; `422` validation failed.

---

### Shop dashboard

#### GET `/api/shop/dashboard`

Returns dashboard metrics computed from the global orders/products tables.

```json
{
  "success": true,
  "data": {
    "metrics": {
      "newOrdersToday": {
        "count": 12,
        "change": "+3 vs yesterday",
        "cod": 10,
        "bkash": 2
      },
      "waitingConfirmation": {
        "count": 4,
        "oldestTime": "2h 15m ago"
      },
      "deliveredRevenueMonth": {
        "amount": 84500,
        "parcelCount": 31,
        "avgPerOrder": 2726
      },
      "lowStockProducts": {
        "count": 2,
        "alertText": "Ultra Hot Capsules (4 left)"
      }
    },
    "pendingVerificationOrders": [
      {
        "id": 42,
        "orderNumber": "PZ-123456",
        "placedTime": "35m ago",
        "customerName": "Md. Rakib Hasan",
        "customerPhone": "01711223344",
        "deliveryArea": "Inside Dhaka",
        "itemSummary": "Ultra Hot Capsules × 2"
      }
    ],
    "weeklyChart": {
      "days": [
        { "day": "Sun", "count": 3, "active": false },
        { "day": "Mon", "count": 5, "active": false }
      ],
      "totalOrders": 21,
      "totalValue": 61200,
      "dailyAverage": 3,
      "dateRange": "8 Nov – 14 Nov"
    },
    "courierSummary": {
      "readyForPickup": 6,
      "insideDhaka": 4,
      "outsideDhaka": 2,
      "totalCod": 18600
    }
  }
}
```

- `weeklyChart.days` contains 7 entries ending at today.
- `pendingVerificationOrders` lists up to 5 oldest `pending` orders.
- `lowStockProducts` counts active products with `stockQuantity < 5`.

**Errors:** `500` DB error.

### Shop sidebar stats

#### GET `/api/shop/sidebar-stats`

Lightweight badge counts for the shop sidebar.

```json
{
  "success": true,
  "data": {
    "pendingOrders": 4,
    "totalProducts": 12
  }
}
```

- `pendingOrders` counts all orders with status `pending`.
- `totalProducts` counts active products.

---

## Super admin endpoints

> All routes in this section require a valid `admin_token` cookie **and** a user
> whose role is `super_admin`. Non-super-admins receive `403`.

### Super admin dashboard

#### GET `/api/admin/super/dashboard`

Platform-wide metrics across every shop and user.

```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalShops": 8,
      "activeShops": 6,
      "totalUsers": 24,
      "activeUsers": 21
    },
    "shopsByStatus": [
      { "status": "active", "count": 6 },
      { "status": "trial", "count": 1 },
      { "status": "inactive", "count": 1 }
    ],
    "usersByRole": [
      {
        "roleId": 1,
        "roleName": "super_admin",
        "roleDisplayName": "Super Admin",
        "count": 2
      }
    ],
    "recentAudits": [
      {
        "id": 91,
        "action": "user.create",
        "entityType": "user",
        "entityId": "24",
        "createdAt": "2026-11-14T09:30:00.000Z",
        "user": { "id": 1, "name": "Super Admin", "email": "admin@example.com" },
        "shop": null
      }
    ],
    "trialExpiringSoon": [
      {
        "id": 7,
        "name": "Demo Shop",
        "slug": "demo-shop",
        "trialEndsAt": "2026-11-18T00:00:00.000Z"
      }
    ]
  }
}
```

- `recentAudits` returns the latest 10 entries.
- `trialExpiringSoon` returns up to 10 `trial` shops whose `trialEndsAt` is
  non-null and on or before 7 days from now (already-expired trials are included).

### Super admin sidebar stats

#### GET `/api/admin/super/sidebar-stats`

```json
{
  "success": true,
  "data": {
    "totalUsers": 24,
    "totalShops": 8,
    "totalRoles": 5
  }
}
```

---

### Super admin users

#### GET `/api/admin/super/users`

**Query parameters:**

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `50` | 1–100 |
| `q` | string | — | Contains match on email, name, or mobile |
| `roleId` | integer | — | Filter by role; invalid ID → `422` |
| `shopId` | integer or `"null"` | — | Filter by shop; literal `null` = platform users |
| `status` | string | — | `active` or `inactive` |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "email": "admin@example.com",
        "name": "Super Admin",
        "mobile": "",
        "roleId": 1,
        "role": "super_admin",
        "roleDisplayName": "Super Admin",
        "shopId": null,
        "shop": null,
        "status": "active",
        "lastLoginAt": "2026-11-14T08:00:00.000Z",
        "createdAt": "2026-10-27T12:00:00.000Z",
        "updatedAt": "2026-11-14T08:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

#### POST `/api/admin/super/users`

**Body:**

```json
{
  "email": "manager@example.com",
  "name": "Shop Manager",
  "mobile": "01712345678",
  "password": "at-least-12-chars",
  "roleId": 3,
  "shopId": 2,
  "status": "active"
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `email` | Yes | Valid email, lowercased |
| `name` | Yes | 1–120 chars |
| `mobile` | No | Bangladeshi mobile `^01[3-9]\d{8}$` |
| `password` | Yes | Minimum 12 characters |
| `roleId` | Yes | Positive integer, role must exist |
| `shopId` | Yes | Positive integer or `null` |
| `status` | No | `active` (default) or `inactive` |

**Role/shop scope rules:**

- A `shop`-scoped role requires a `shopId`.
- A `platform`-scoped role must have `shopId: null`.

**Responses:**

- `201` with the created user object.
- `409` email already registered.
- `422` validation failed (including missing/invalid role or scope mismatch).

#### PATCH `/api/admin/super/users/:id`

Partial update. All fields optional:

```json
{
  "name": "New Name",
  "mobile": "01712345678",
  "roleId": 4,
  "shopId": 3,
  "status": "inactive"
}
```

**Rules:**

- When `roleId` is changed, the new role's scope is checked against the final
  `shopId` (shop role requires a shop; platform role requires `shopId: null`).
- A user cannot change their own role (`403`).
- A user cannot deactivate their own account (`403`).
- The last active `super_admin` cannot be deactivated or moved to another role (`403`).

**Responses:** `200` with the updated user; `404` not found; `403` protected
operation; `422` validation failed.

#### PATCH `/api/admin/super/users/:id/password`

**Body:**

```json
{ "password": "at-least-12-chars" }
```

**Responses:** `200` with the updated user; `404` not found; `422` password
shorter than 12 characters.

#### DELETE `/api/admin/super/users/:id`

Soft-deletes a user by setting `status` to `"inactive"` (hard deletes are blocked
to preserve audit-log references).

**Rules:**

- You cannot delete your own account (`403`).
- The last active `super_admin` cannot be deleted (`403`).

**Response `200`:** the updated user object.

**Errors:** `404` not found; `403` protected operation.

---

### Super admin roles

#### GET `/api/admin/super/roles`

Returns all roles, system roles first.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "super_admin",
      "displayName": "Super Admin",
      "scope": "platform",
      "permissions": {},
      "isSystem": true,
      "description": "",
      "userCount": 2,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-10-27T12:00:00.000Z"
    }
  ]
}
```

#### POST `/api/admin/super/roles`

**Body:**

```json
{
  "displayName": "Shop Manager",
  "scope": "shop",
  "permissions": {
    "products": ["read", "create", "update"],
    "orders": ["read", "update"],
    "settings": ["read"]
  },
  "description": "Manages day-to-day shop operations."
}
```

| Field | Rule |
| --- | --- |
| `displayName` | 1–80 printable ASCII characters |
| `scope` | `platform` or `shop` |
| `permissions` | Object keyed by module; unknown modules rejected |
| `description` | Optional, ≤ 500 chars |

**Permission modules:** `products`, `orders`, `settings`, `coupons`, `pages`,
`marketing`, `courier`, `users`, `roles`, `shops`, `audit`.

**Permission actions:** `read`, `create`, `update`, `delete`, `*`.

The internal role `name` is generated from `displayName` (lowercase, non-alphanumerics
become `_`) and must be 3–50 characters.

**Responses:** `201` with the created role; `409` duplicate internal name;
`422` validation failed.

#### PATCH `/api/admin/super/roles/:id`

Partial update. Optional fields:

```json
{
  "displayName": "Senior Shop Manager",
  "permissions": {
    "products": ["*"],
    "orders": ["read", "update"]
  },
  "description": "Updated description."
}
```

**Rules:**

- `scope` cannot be changed.
- `super_admin` permissions cannot be modified (`403`).

**Responses:** `200` with the updated role; `404` not found; `403` protected;
`422` validation failed.

#### DELETE `/api/admin/super/roles/:id`

**Rules:**

- System roles (`isSystem: true`) cannot be deleted (`403`).
- A role assigned to one or more users cannot be deleted (`409`).

**Response `200`:**

```json
{ "success": true }
```

**Errors:** `404` not found; `403` system role; `409` role in use.

---

### Super admin shops

#### GET `/api/admin/super/shops`

Returns all shops, newest first.

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Power Zenox",
      "slug": "power-zenox",
      "status": "active",
      "mobile": "01712345678",
      "address": "Dhaka, Bangladesh",
      "trialEndsAt": null,
      "expiryDate": null,
      "userCount": 3,
      "createdAt": "2026-10-27T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  ]
}
```

#### POST `/api/admin/super/shops`

**Body:**

```json
{
  "name": "Power Zenox",
  "slug": "power-zenox",
  "mobile": "01712345678",
  "address": "Dhaka, Bangladesh",
  "status": "active"
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `name` | Yes | 1–150 chars |
| `slug` | Yes | 2–80 chars, lowercase letters/numbers/hyphens (`^[a-z0-9-]+$`), unique |
| `mobile` | No | Bangladeshi mobile `^01[3-9]\d{8}$` |
| `address` | No | ≤ 500 chars |
| `status` | No | `active` (default), `inactive`, or `trial` |

**Responses:** `201` with the created shop; `409` slug already in use; `422`
validation failed.

#### PATCH `/api/admin/super/shops/:id`

Partial update. Optional fields: `name`, `mobile`, `address`, `status`.
`slug` cannot be changed.

```json
{
  "name": "Power Zenox Ltd.",
  "status": "inactive"
}
```

**Responses:** `200` with the updated shop; `404` not found; `422` validation
failed.

---

### Super admin audit log

#### GET `/api/admin/super/audit`

**Query parameters:**

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | integer | `1` | ≥ 1 |
| `limit` | integer | `50` | 1–200 |
| `q` | string | — | Search action, entity type/ID, IP, user name/email, shop name/slug |
| `userId` | integer | — | Filter by actor; invalid ID → `422` |
| `shopId` | integer | — | Filter by shop; invalid ID → `422` |
| `action` | string | — | Exact action match (e.g. `user.create`) |
| `dateFrom` | ISO string | — | `createdAt >= dateFrom` |
| `dateTo` | ISO string | — | `createdAt <= dateTo` |

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 91,
        "action": "user.create",
        "entityType": "user",
        "entityId": "24",
        "metadata": {
          "email": "manager@example.com",
          "role": "shop_manager",
          "shopId": 2
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "PostmanRuntime/7.43.0",
        "createdAt": "2026-11-14T09:30:00.000Z",
        "user": {
          "id": 1,
          "name": "Super Admin",
          "email": "admin@example.com"
        },
        "shop": {
          "id": 2,
          "name": "Power Zenox",
          "slug": "power-zenox"
        }
      }
    ],
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

**Recorded actions:** `login`, `logout`, `user.create`, `user.update`,
`user.deactivate`, `user.activate`, `user.delete`, `user.reset_password`,
`role.create`, `role.update`, `role.delete`, `shop.create`, `shop.update`,
`shop.activate`, `shop.deactivate`.

Audit writes are fire-and-forget: a logging failure never fails the main request.

---

## Enums and rules

**Order status:** `pending` → `confirmed` → `shipped` → `delivered`, plus
`cancelled`. Transitions are enforced as described in
[PATCH /api/shop/orders/:id/status](#patch-apishopordersidstatus).

**Payment status:** `unpaid`, `paid`.

**Payment method:** currently always `cod`.

**User status:** `active`, `inactive`.

**Shop status:** `active`, `inactive`, `trial`.

**Role scope:** `platform`, `shop`.

**Role permission actions:** `read`, `create`, `update`, `delete`, `*`.

**Money:** all amounts are whole integers (no decimals).

**Dates:** timestamps are ISO 8601 UTC strings. Query date filters
(`dateFrom` / `dateTo`) on orders are `YYYY-MM-DD` and interpreted as Dhaka
calendar days (UTC+6).

**Product derived fields:** `discountPercent` and `inStock` are computed
server-side; `orderFormConfig` is stored as-is and returned to clients.

---

## Error codes

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Bad request / business rule violation (order create, profile, password) |
| `401` | Missing/invalid auth, or invalid login |
| `403` | Authenticated but not allowed (inactive account/shop, non-super-admin, protected operation) |
| `404` | Resource not found |
| `409` | Conflict (invalid status transition, duplicate slug/email, role in use, product referenced by orders) |
| `422` | Validation failed (Zod-based endpoints) |
| `429` | Login rate limit exceeded |
| `500` | Internal server error |

---

## Postman files

- `docs/postman/Ecom-Backend.postman_collection.json` — import into Postman
- `docs/postman/Ecom-Local.postman_environment.json` — local environment variables

**Import steps:**

1. Open Postman → **Import** → drop both JSON files.
2. Select the **Ecom Local** environment (top-right).
3. Run **Login** first (`POST /api/auth/login`). Postman stores the `admin_token`
   cookie automatically.
4. Run any shop or super admin request.
5. Set `adminEmail` / `adminPassword` in the environment to match a user in your
   database.

> **Note:** The checked-in Postman collection predates the route split and still
> uses the legacy `/api/admin/**` paths. Use the endpoint tables above as the
> source of truth until the collection is regenerated.

**Creating the first super admin:** the `super_admin` role must exist (seeded by
migration). Then run:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='a-strong-password-min-12' \
ADMIN_NAME='Super Admin' \
npx tsx scripts/createSuperAdmin.ts
```
