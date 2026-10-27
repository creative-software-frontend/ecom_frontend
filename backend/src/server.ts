import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productRoutes from "./routes/product.routes.js";
import storeRoutes from "./routes/store.routes.js";
import orderRoutes from "./routes/order.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/orders", orderRoutes);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully.",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
