import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { CORS_ORIGINS } from "./config/env.js";
import productRoutes from "./routes/product.routes.js";
import storeRoutes from "./routes/store.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminProductRoutes from "./routes/adminProduct.routes.js";
import adminSettingsRoutes from "./routes/adminSettings.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import path from "node:path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// // Health check route
// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Server is running successfully.",
//   });
// });

// ফ্রন্টএন্ডের dist ফোল্ডার স্ট্যাটিক হিসেবে সার্ভ করা
const frontendDistPath = path.resolve(process.cwd(), "../frontend/dist");
app.use(express.static(frontendDistPath));

// SPA ফলব্যাক মিডলওয়্যার
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
