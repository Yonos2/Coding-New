const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderItemsRoutes = require("./routes/orderItemsRoutes");
const adminRoutes = require("./routes/adminRoutes"); // Idugang ang admin routes
const masterAdminRoutes = require("./routes/masterAdminRoutes"); // Bag-o para sa Master Admin

app.use(cors()); // I-enable ang CORS para sa tanang requests
app.use(express.json()); // nagtugot sa JSON body input

// I-serve ang tanang static files (HTML, CSS, JS) gikan sa kasamtangang directory.
// Kini ang magsilbi sa imong index.html, login.html, customer.js, ug uban pa.
app.use(express.static(__dirname));

// Mga ruta sa produkto
app.use("/api/products", productRoutes);

// Mga ruta sa customer
app.use("/api/customers", customerRoutes);

// Mga ruta sa order
app.use("/api/orders", orderRoutes);

// Mga ruta sa Order Items
app.use("/api/order-items", orderItemsRoutes);

// Mga ruta sa Admin
app.use("/api/admin", adminRoutes);

// Mga ruta sa Master Admin
app.use("/api/master-admin", masterAdminRoutes);

// Sugdi ang server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
