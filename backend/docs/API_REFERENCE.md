# Ecom Backend — API Reference

Base URL (local dev): `http://localhost:5000`

All requests and responses use JSON (`Content-Type: application/json`).

Start the server first:

```bash
npm run dev
# Server is running on http://localhost:5000
```

---

## Contents

- [Response format](#response-format)
- [Authentication](#authentication)
- [Endpoint summary](#endpoint-summary)
- [Public endpoints](#public-endpoints)
  - [Products](#products)
  - [Store settings](#store-settings)
  - [Place an order](#place-an-order)
- [Admin: auth](#admin-auth)
- [Admin: products](#admin-products)
- [Admin: orders](#admin-orders)
- [Admin: settings](#admin-settings)
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

## Authentication

Admin routes are protected by a JWT stored in an **HttpOnly cookie** named `admin_token`.

| Detail | Value |
| --- | --- |
| Login endpoint | `POST /api/admin/auth/login` |
| Cookie name | `admin_token` |
| Token algorithm | HS256 |
| Token lifetime | 8 hours |
| Protected prefix | `/api/admin/**` (except `/api/admin/auth/login` and `/logout`) |

**How it works:**

1. `POST /api/admin/auth/login` with email + password.
2. The response sets the `admin_token` cookie.
3. Postman automatically stores and re-sends the cookie on later requests.
4. If cookies are disabled, copy the cookie value and send it manually as:
   `Cookie: admin_token=<token>`

**Login rate limit:** 5 failed attempts per IP per 15 minutes → `429 Too Many Attempts`.

---

## Endpoint summary

| # | Method | Path | Auth | Description |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/products` | Public | List active products |
| 2 | GET | `/api/products/:slug` | Public | Get one active product + reviews |
| 3 | GET | `/api/store` | Public | Get store settings |
| 4 | POST | `/api/orders` | Public | Place an order |
| 5 | POST | `/api/admin/auth/login` | Public | Admin login (sets cookie) |
| 6 | POST | `/api/admin/auth/logout` | Public | Clear admin cookie |
| 7 | GET | `/api/admin/auth/me` | Admin | Get current admin |
| 8 | PUT | `/api/admin/auth/profile` | Admin | Update admin email |
| 9 | GET | `/api/admin/products` | Admin | List all products |
| 10 | GET | `/api/admin/products/:id` | Admin | Get product by ID |
| 11 | POST | `/api/admin/products` | Admin | Create product |
| 12 | PUT | `/api/admin/products/:id` | Admin | Update product (full body) |
| 13 | DELETE | `/api/admin/products/:id` | Admin | Delete product |
| 14 | GET | `/api/admin/orders` | Admin | List / filter orders |
| 15 | GET | `/api/admin/orders/:id` | Admin | Get order details |
| 16 | PATCH | `/api/admin/orders/:id/status` | Admin | Update order / payment status |
| 17 | GET | `/api/admin/settings` | Admin | Get store settings |
| 18 | PUT | `/api/admin/settings` | Admin | Update store settings |
| 19 | PUT | `/api/admin/settings/password` | Admin | Change admin password |

---

# Public endpoints

## Products

### GET `/api/products`

Returns all products where `isActive = true`, newest first.

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "0b1c2d3e-...",
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

### GET `/api/products/:slug`

Returns a single active product and its `reviews`.

- `404` if the product does not exist or `isActive` is `false`.

```json
{
  "success": true,
  "data": {
    "id": "0b1c2d3e-...",
    "slug": "ultrahot",
    "name": "Ultra Hot Capsules",
    "images": ["/images/products/ultrahot/1.webp"],
    "reviews": [
      {
        "id": "r-1",
        "productId": "0b1c2d3e-...",
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

## Store settings

### GET `/api/store`

Returns the contents of `src/data/store.json`.

```json
{
  "success": true,
  "data": {
    "name": "Power Zenox",
    "url": "https://powerzenox.com/",
    "tagline": "Explore our premium products",
    "currency": "BDT",
    "currency_symbol": "৳",
    "language": "bn",
    "contact": {
      "phone": "01780212230",
      "whatsapp": "01780212230"
    },
    "delivery": {
      "method": "Cash on Delivery",
      "note": "সারা বাংলাদেশ ক্যাশ অন ডেলিভারি",
      "free_delivery": true,
      "delivery_charge": 0
    }
  }
}
```

---

## Place an order

### POST `/api/orders`

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
      "productId": "0b1c2d3e-...",
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
| `items[].productId` | Yes | Real product UUID from `GET /api/products` |
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
        "id": "item-uuid",
        "orderId": 42,
        "productId": "0b1c2d3e-...",
        "quantity": 2,
        "unitPrice": 1600,
        "lineTotal": 3200
      }
    ]
  }
}
```

**Errors:**

- `400` — required fields missing, or a price/quantity is fractional
- `500` — product ID does not exist or DB error

---

# Admin: auth

## POST `/api/admin/auth/login`

**Body:**

```json
{
  "email": "admin@gmail.com",
  "password": "your-password"
}
```

**Response `200`:** sets `admin_token` cookie and returns:

```json
{
  "success": true,
  "data": {
    "id": "admin-uuid",
    "email": "admin@gmail.com",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T12:00:00.000Z"
  }
}
```

**Errors:**

- `401` — invalid email or password
- `429` — too many failed attempts

## POST `/api/admin/auth/logout`

Clears the `admin_token` cookie.

```json
{ "success": true }
```

## GET `/api/admin/auth/me`

Returns the currently authenticated admin. Requires the `admin_token` cookie.

```json
{
  "success": true,
  "data": {
    "id": "admin-uuid",
    "email": "admin@gmail.com",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T12:00:00.000Z"
  }
}
```

## PUT `/api/admin/auth/profile`

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
    "id": "admin-uuid",
    "email": "new-admin@example.com",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-11-04T10:00:00.000Z"
  }
}
```

**Errors:** `400` invalid email or email already used by another admin.

---

# Admin: products

> All routes in this section require the `admin_token` cookie.

## GET `/api/admin/products`

Returns **all** products (active and inactive), newest first.

```json
{ "success": true, "data": [ /* product objects */ ] }
```

## GET `/api/admin/products/:id`

Get a product by its UUID. `404` if not found.

## POST `/api/admin/products`

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

**Errors:** `422` validation failed, `500` duplicate slug / DB error.

## PUT `/api/admin/products/:id`

Updates a product. The body is the **same full schema as create** — all fields are required (`isActive` optional). It is not a partial update.

**Response `200`:** `{ "success": true, "data": { /* product */ } }`

## DELETE `/api/admin/products/:id`

Deletes a product.

**Response `200`:**

```json
{ "success": true }
```

**Errors:** `404` if not found; conflict if the product is referenced by an order.

---

# Admin: orders

> All routes in this section require the `admin_token` cookie.

## GET `/api/admin/orders`

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
| `q` | string | — | Search order number, customer name, or phone |

Example: `GET /api/admin/orders?page=1&limit=20&status=pending&q=rahim`

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
      "all": 1,
      "pending": 1,
      "confirmed": 0,
      "shipped": 0,
      "delivered": 0,
      "cancelled": 0
    }
  }
}
```

**Errors:** `422` invalid query values.

## GET `/api/admin/orders/:id`

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
        "id": "item-uuid",
        "productId": "0b1c2d3e-...",
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

## PATCH `/api/admin/orders/:id/status`

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

**Response `200`:** the full updated order (same shape as `GET /api/admin/orders/:id`).

**Errors:** `404` order not found, `409` invalid transition, `422` validation failed.

---

# Admin: settings

> All routes in this section require the `admin_token` cookie.

## GET `/api/admin/settings`

Returns the same store object as `GET /api/store`.

## PUT `/api/admin/settings`

Replaces the store settings. **All fields are required** (full object):

```json
{
  "name": "Power Zenox",
  "url": "https://powerzenox.com/",
  "tagline": "Explore our premium products",
  "currency": "BDT",
  "currency_symbol": "৳",
  "language": "bn",
  "contact": {
    "phone": "01780212230",
    "whatsapp": "01780212230"
  },
  "delivery": {
    "method": "Cash on Delivery",
    "note": "সারা বাংলাদেশ ক্যাশ অন ডেলিভারি",
    "free_delivery": true,
    "delivery_charge": 0
  }
}
```

**Validation rules:**

| Field | Rule |
| --- | --- |
| `name` | 1–100 chars |
| `url` | 1–200 chars |
| `tagline` | 1–200 chars |
| `currency` | 1–10 chars |
| `currency_symbol` | 1–10 chars |
| `language` | 1–10 chars |
| `contact.phone` | 1–30 chars |
| `contact.whatsapp` | 1–30 chars |
| `delivery.method` | 1–100 chars |
| `delivery.note` | ≤ 300 chars (may be empty) |
| `delivery.free_delivery` | Boolean |
| `delivery.delivery_charge` | Number ≥ 0 |

**Response `200`:**

```json
{
  "success": true,
  "data": { /* saved settings */ },
  "message": "Store settings updated successfully"
}
```

**Errors:** `400` invalid settings data.

## PUT `/api/admin/settings/password`

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

- `400` — current password incorrect, or new password shorter than 8 characters

---

## Enums and rules

**Order status:** `pending` → `confirmed` → `shipped` → `delivered`, plus `cancelled`.

**Payment status:** `unpaid`, `paid`.

**Payment method:** always `cod`.

**Money:** all amounts are whole integers (no decimals).

**Dates:** timestamps are ISO 8601 UTC strings.

---

## Error codes

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Bad request / business rule violation |
| `401` | Missing/invalid auth, or invalid login |
| `404` | Resource not found |
| `409` | Conflict (invalid status transition, duplicate) |
| `422` | Validation failed (Zod) |
| `429` | Login rate limit exceeded |
| `500` | Internal server error |

---

## Postman files

- `docs/postman/Ecom-Backend.postman_collection.json` — import into Postman
- `docs/postman/Ecom-Local.postman_environment.json` — local environment variables

**Import steps:**

1. Open Postman → **Import** → drop both JSON files.
2. Select the **Ecom Local** environment (top-right).
3. Run **Admin Auth → Login** first. Postman stores the `admin_token` cookie automatically.
4. Run any admin request.
5. Edit `adminEmail` / `adminPassword` in the environment to match your database (see `.env` and `npm run create-admin`).
