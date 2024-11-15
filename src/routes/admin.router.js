import express from "express";
import authMiddleware from "../authMiddleware.js";
import {
  createCategory,
  createProductDetail,
  createProducts,
  createSize,
  createType,
  createUser,
  deleteCategory,
  deleteProduct,
  deleteProductDetail,
  deleteSize,
  deleteType,
  deleteUser,
  getCategoryById,
  getProductById,
  getProductDetailById,
  getSizeById,
  getTypeById,
  getUserById,
  login,
  logout,
  renderAdmin,
  renderCategories,
  renderLoginAdmin,
  renderProductDetails,
  renderProducts,
  renderSizes,
  renderTypes,
  renderUsers,
  updateCategory,
  updateProduct,
  updateProductDetail,
  updateSize,
  updateType,
  updateUser,
} from "../controllers/adminController.js";

const router = express.Router();

// renderizar paginas
router.get("/admin", authMiddleware, (req, res) => {
  res.render("admin");
});

router.get("/admin/login", renderLoginAdmin);
router.get("/admin/products", authMiddleware, renderProducts);
router.get("/admin/categories", authMiddleware, renderCategories);
router.get("/admin/types", authMiddleware, renderTypes);
router.get("/admin/sizes", authMiddleware, renderSizes);
router.get("/admin/product_details", authMiddleware, renderProductDetails);
router.get("/admin/users", authMiddleware, renderUsers);

// mantenimiento producto
router.post("/admin/products/addProduct", createProducts);
router.get("/admin/products/edit/:id", getProductById);
router.post("/admin/products/update/:id", updateProduct);
router.post("/admin/products/delete/:id", deleteProduct);

// mantenimiento categoria
router.post("/admin/categories/addCategory", createCategory);
router.get("/admin/categories/edit/:id", getCategoryById);
router.post("/admin/categories/update/:id", updateCategory);
router.post("/admin/categories/delete/:id", deleteCategory);

// mantenimiento tipo_producto
router.post("/admin/types/addType", createType);
router.get("/admin/types/edit/:id", getTypeById);
router.post("/admin/types/update/:id", updateType);
router.post("/admin/types/delete/:id", deleteType);

// mantenimiento tamaños
router.post("/admin/sizes/addSize", createSize);
router.get("/admin/sizes/edit/:id", getSizeById);
router.post("/admin/sizes/update/:id", updateSize);
router.post("/admin/sizes/delete/:id", deleteSize);

// mantenimiento detalles del producto
router.post("/admin/product_details/addDetail", createProductDetail);
router.get("/admin/product_details/edit/:id", getProductDetailById);
router.post("/admin/product_details/update/:id", updateProductDetail);
router.post("/admin/product_details/delete/:id", deleteProductDetail);

// mantenimiento usuario
router.post("/admin/users/addUser", createUser);
router.post("/admin/users/delete/:id", deleteUser);
router.get("/admin/users/edit/:id", authMiddleware, getUserById);
router.post("/admin/users/update/:id", updateUser);
router.post("/admin/login/entry", login);
router.post("/admin/logout", logout);

export default router;
