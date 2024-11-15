import pool from "../db.js";
import multer from "multer";
import fs from "fs/promises";
import sharp from "sharp";
import path from "path";
import bcrypt from "bcrypt";
import { bucket } from "../firebaseConfig.js";
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "src/public/images"); // Ruta relativa a la carpeta src
//   },
//   filename: function (req, file, cb) {
//     cb(
//       null,
//       file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//#region paginas del admin
export const renderAdmin = async (req, res) => {
  res.render("admin");
};
export const renderLoginAdmin = async (req, res) => {
  res.render("pages/admin/login", { errorMessage: null });
};
export const renderProducts = async (req, res) => {
  const query = `
      SELECT 
        bp.id,
        bp.name, 
        bp.description, 
        bp.image_url, 
        c.name AS category
      
    FROM base_products bp
    JOIN categories c ON bp.category_id = c.id
  
    GROUP BY bp.id, bp.name, bp.description, bp.image_url, c.name;
  `;
  const categoriesResult = await pool.query("SELECT id, name FROM categories");

  const categories = categoriesResult.rows;

  try {
    const { rows } = await pool.query(query);

    const formattedProducts = rows.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      category: product.category,
    }));

    res.render("pages/admin/products", {
      products: formattedProducts,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const renderCategories = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM categories");
  res.render("pages/admin/categories", { categories: rows });
};
export const renderTypes = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM product_types");
  res.render("pages/admin/types", { types: rows });
};
export const renderSizes = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM product_size");
  res.render("pages/admin/sizes", { sizes: rows });
};
export const renderProductDetails = async (req, res) => {
  const { rows } = await pool.query(`SELECT 
      bd.id,
      bp.name AS product, 
      pz.name AS size, 
      pt.type_name AS type, 
      bd.price,
      bd.quantity
    FROM product_details bd
    LEFT JOIN base_products bp ON bd.base_product_id = bp.id
    LEFT JOIN product_size pz ON bd.product_size_id = pz.id
    LEFT JOIN product_types pt ON bd.product_type_id = pt.id`);
  const sizeResult = await pool.query("SELECT id, name FROM product_size");
  const typeResult = await pool.query(
    "SELECT id, type_name FROM product_types"
  );
  const productResult = await pool.query("SELECT id, name FROM base_products");

  res.render("pages/admin/product_details", {
    products: productResult.rows,
    sizes: sizeResult.rows,
    types: typeResult.rows,
    details: rows,
  });
};
export const renderUsers = async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users");
  res.render("pages/admin/users", { users: rows });
};

// #region mant producto
// export const createProducts = async (req, res) => {
//   upload.single("image")(req, res, async function (err) {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Error al cargar la imagen");
//     }
//     const imageName = req.file ? req.file.filename : null;

//     const { name, description, category, type, size, quantity, price } =
//       req.body;

//     try {
//       const result = await pool.query(
//         "INSERT INTO base_products (name, description, image_url, category_id) VALUES ($1, $2, $3, $4) RETURNING id",
//         [name, description, imageName, category]
//       );
//       res.redirect("/admin/products");
//     } catch (error) {
//       console.error("Error al insertar el producto:", error);
//       res.status(500).send("Error interno del servidor");
//     }
//   });
// };
export const createProducts = async (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al cargar la imagen");
    }

    const { name, description, category } = req.body;

    if (req.file) {
      try {
        const imageName = `image-${Date.now()}.jpeg`;
        const file = bucket.file(imageName);

        // Procesa la imagen en memoria
        await sharp(req.file.buffer)
          .resize(350, 500)
          .jpeg({ quality: 80 })
          .toBuffer()
          .then(async (buffer) => {
            await file.save(buffer, {
              contentType: "image/jpeg",
              public: true, // Asegúrate de que la imagen sea pública si necesitas que sea accesible desde la web
            });
          });

        // Inserta el producto en la base de datos con la URL de la imagen
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imageName}`;

        const result = await pool.query(
          "INSERT INTO base_products (name, description, image_url, category_id) VALUES ($1, $2, $3, $4) RETURNING id",
          [name, description, imageUrl, category]
        );

        res.redirect("/admin/products");
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        res.status(500).send("Error interno del servidor");
      }
    } else {
      try {
        // Inserta el producto sin imagen
        const result = await pool.query(
          "INSERT INTO base_products (name, description, category_id) VALUES ($1, $2, $3) RETURNING id",
          [name, description, category]
        );

        res.redirect("/admin/products");
      } catch (error) {
        console.error("Error al insertar el producto:", error);
        res.status(500).send("Error interno del servidor");
      }
    }
  });
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const productResult = await pool.query(
      `SELECT * FROM base_products WHERE id = $1`,
      [id]
    );

    const categoryResult = await pool.query(`SELECT id, name FROM categories`);

    if (productResult.rows.length === 0) {
      return res.status(404).send("Producto no encontrado");
    }

    const product = productResult.rows[0];

    res.render("pages/admin/edit/editProd", {
      product,
      categories: categoryResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// export const updateProduct = async (req, res) => {
//   const { id } = req.params;
//   upload.single("image")(req, res, async function (err) {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Error al cargar la imagen");
//     }
//     const { name, description, category, currentImage } = req.body;
//     const imageName = req.file ? req.file.filename : currentImage;
//     try {
//       if (req.file && currentImage) {
//         const oldImagePath = path.join("src/public/images", currentImage);
//         fs.unlink(oldImagePath, (err) => {
//           if (err) console.error("Error al eliminar la imagen anterior:", err);
//         });
//       }
//       await pool.query(
//         `UPDATE base_products
//          SET name = $1, description = $2, image_url = $3, category_id = $4
//          WHERE id = $5`,
//         [name, description, imageName, category, id]
//       );

//       res.redirect("/admin/products");
//     } catch (error) {
//       console.error("Error al actualizar el producto:", error);
//       res.status(500).send("Error interno del servidor");
//     }
//   });
// };

export const updateProduct = async (req, res) => {
  const { id } = req.params;

  upload.single("image")(req, res, async function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send("Error al cargar la imagen");
    }

    const { name, description, category, currentImage } = req.body;
    let imageName = currentImage;

    if (req.file) {
      try {
        imageName = `image-${Date.now()}.jpeg`;
        const file = bucket.file(imageName);

        // Procesa y guarda la imagen optimizada
        const buffer = await sharp(req.file.buffer)
          .resize(350, 500) // Ajusta el tamaño según tus necesidades
          .jpeg({ quality: 80 }) // Ajusta la calidad según tus necesidades
          .toBuffer();

        await file.save(buffer, {
          contentType: "image/jpeg",
          public: true, // Asegúrate de que la imagen sea pública
        });

        // Elimina la imagen antigua si existe
        if (currentImage) {
          const oldFile = bucket.file(currentImage);
          await oldFile.delete().catch((err) => {
            console.error("Error al eliminar la imagen anterior:", err);
          });
        }
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return res.status(500).send("Error interno del servidor");
      }
    }

    try {
      // Actualiza el producto en la base de datos con la nueva URL de la imagen
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imageName}`;

      await pool.query(
        `UPDATE base_products 
         SET name = $1, description = $2, image_url = $3, category_id = $4 
         WHERE id = $5`,
        [name, description, imageUrl, category, id]
      );

      res.redirect("/admin/products");
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      res.status(500).send("Error interno del servidor");
    }
  });
};
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `SELECT * FROM product_details WHERE base_product_id = $1`,
      [id]
    );

    if (rowCount > 0) {
      return res
        .status(400)
        .send(
          "No se puede eliminar el producto porque está asociado con detalles de productos."
        );
    }

    await pool.query(`DELETE FROM base_products WHERE id = $1`, [id]);

    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region mant categoria
export const createCategory = async (req, res) => {
  try {
    await pool.query("INSERT INTO categories (name) VALUES ($1)", [
      req.body.name,
    ]);
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error al insertar el producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const getCategoryById = async (req, res) => {
  const categoryId = req.params.id;

  try {
    const { rows: category } = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [categoryId]
    );

    if (category.length === 0) {
      return res.status(404).send("Categoría no encontrada");
    }

    res.render("pages/admin/edit/editCat", { category: category[0] });
  } catch (error) {
    console.error("Error al obtener la categoría:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const { name } = req.body;

  try {
    await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [
      name,
      categoryId,
    ]);

    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const deleteCategory = async (req, res) => {
  const categoryId = req.params.id;

  try {
    // Verificar si la categoría está asociada con algún producto
    const { rowCount: productCount } = await pool.query(
      "SELECT 1 FROM base_products WHERE category_id = $1",
      [categoryId]
    );

    if (productCount > 0) {
      return res
        .status(400)
        .send(
          "No se puede eliminar la categoría porque está asociada con productos."
        );
    }

    // Eliminar la categoría
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);

    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region mant tipo
export const createType = async (req, res) => {
  try {
    await pool.query("INSERT INTO product_types (type_name) VALUES ($1)", [
      req.body.name,
    ]);
    res.redirect("/admin/types");
  } catch (error) {
    console.error("Error al insertar el producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const getTypeById = async (req, res) => {
  const typeId = req.params.id;

  try {
    const { rows: type } = await pool.query(
      "SELECT * FROM product_types WHERE id = $1",
      [typeId]
    );

    if (type.length === 0) {
      return res.status(404).send("tipo no encontrada");
    }

    res.render("pages/admin/edit/editType", { type: type[0] });
  } catch (error) {
    console.error("Error al obtener el tipo:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const updateType = async (req, res) => {
  const typeId = req.params.id;
  const { name } = req.body;

  try {
    await pool.query("UPDATE product_types SET type_name = $1 WHERE id = $2", [
      name,
      typeId,
    ]);

    res.redirect("/admin/types");
  } catch (error) {
    console.error("Error al actualizar el tamaño:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const deleteType = async (req, res) => {
  const typeId = req.params.id;

  try {
    // Verificar si la categoría está asociada con algún producto
    const { rowCount: product_Details } = await pool.query(
      "SELECT 1 FROM product_details WHERE product_type_id = $1",
      [typeId]
    );

    if (product_Details > 0) {
      return res
        .status(400)
        .send(
          "No se puede eliminar el tipo porque está asociada con detalle de productos."
        );
    }

    // Eliminar la categoría
    await pool.query("DELETE FROM product_types WHERE id = $1", [typeId]);

    res.redirect("/admin/types");
  } catch (error) {
    console.error("Error al eliminar el tamaño:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region mant tamaños
export const createSize = async (req, res) => {
  try {
    await pool.query("INSERT INTO product_size (name) VALUES ($1)", [
      req.body.name,
    ]);
    res.redirect("/admin/sizes");
  } catch (error) {
    console.error("Error al insertar el proyecto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const getSizeById = async (req, res) => {
  const sizeId = req.params.id;

  try {
    const { rows: size } = await pool.query(
      "SELECT * FROM product_size WHERE id = $1",
      [sizeId]
    );

    if (size.length === 0) {
      return res.status(404).send("tamaño no encontrada");
    }

    res.render("pages/admin/edit/editSize", { size: size[0] });
  } catch (error) {
    console.error("Error al obtener el tamaño:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const updateSize = async (req, res) => {
  const sizeId = req.params.id;
  const { name } = req.body;

  try {
    await pool.query("UPDATE product_size SET name = $1 WHERE id = $2", [
      name,
      sizeId,
    ]);

    res.redirect("/admin/sizes");
  } catch (error) {
    console.error("Error al actualizar el tamaño:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const deleteSize = async (req, res) => {
  const sizeId = req.params.id;

  try {
    // Verificar si la categoría está asociada con algún producto
    const { rowCount: product_Details } = await pool.query(
      "SELECT 1 FROM product_details WHERE product_size_id = $1",
      [sizeId]
    );

    if (product_Details > 0) {
      return res
        .status(400)
        .send(
          "No se puede eliminar el tamaño porque está asociada con detalle de productos."
        );
    }

    // Eliminar la categoría
    await pool.query("DELETE FROM product_size WHERE id = $1", [sizeId]);

    res.redirect("/admin/sizes");
  } catch (error) {
    console.error("Error al eliminar el tamaño:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region mant detalle
export const createProductDetail = async (req, res) => {
  const productSize = req.body.sizes === "-1" ? null : req.body.sizes;
  const productType = req.body.types === "-1" ? null : req.body.types;
  const price = req.body.price ? req.body.price : null;
  const quantity = req.body.quantity ? req.body.quantity : null;

  try {
    await pool.query(
      "INSERT INTO product_details (base_product_id, product_type_id, product_size_id, price, quantity) VALUES ($1, $2, $3, $4, $5)",
      [req.body.products, productType, productSize, price, quantity]
    );
    res.redirect("/admin/product_details");
  } catch (error) {
    console.error("Error al insertar el detalle del producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const getProductDetailById = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: details } = await pool.query(
      `SELECT 
        bd.id,
        bd.base_product_id,
        bd.product_size_id,
        bd.product_type_id,
        bd.price,
        bd.quantity
      FROM product_details bd
      WHERE bd.id = $1`,
      [id]
    );

    if (details.length === 0) {
      return res.status(404).send("Detalle del producto no encontrado");
    }

    const sizeResult = await pool.query("SELECT id, name FROM product_size");
    const typeResult = await pool.query(
      "SELECT id, type_name FROM product_types"
    );
    const productResult = await pool.query(
      "SELECT id, name FROM base_products"
    );

    res.render("pages/admin/edit/editDetails", {
      detail: details[0],
      products: productResult.rows,
      sizes: sizeResult.rows,
      types: typeResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener el detalle del producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const updateProductDetail = async (req, res) => {
  const { id } = req.params;

  const productType = req.body.types === "-1" ? null : req.body.types;
  const productSize = req.body.sizes === "-1" ? null : req.body.sizes;
  const price = req.body.price === "" ? null : req.body.price;
  const quantity = req.body.quantity === "" ? null : req.body.quantity;

  try {
    await pool.query(
      `UPDATE product_details 
       SET base_product_id = $1, product_type_id = $2, product_size_id = $3, price = $4, quantity = $5 
       WHERE id = $6`,
      [
        req.body.products,
        productType || null,
        productSize || null,
        req.body.price || null,
        req.body.quantity || null,
        id,
      ]
    );

    res.redirect("/admin/product_details");
  } catch (error) {
    console.error("Error al actualizar el detalle del producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const deleteProductDetail = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM product_details WHERE id = $1", [id]);

    res.redirect("/admin/product_details");
  } catch (error) {
    console.error("Error al eliminar el detalle del producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region mant usuario
export const createUser = async (req, res) => {
  try {
    const { name, lastname, email, phone, user_name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Genera el hash de la contraseña

    await pool.query(
      "INSERT INTO users (name, lastname, email, phone, user_name, password) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, lastname, email, phone, user_name, hashedPassword]
    );
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al insertar el usuario:", error);
    res.status(500).send("Error interno del servidor");
  }
};
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (rows.length > 0) {
      res.render("pages/admin/edit/editUser", { user: rows[0] });
    } else {
      res.send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).send("Error interno del servidor");
  }
};
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lastname, email, phone, user_name, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET name = $1, lastname = $2, email = $3, phone = $4, user_name = $5, password = $6 WHERE id = $7",
      [name, lastname, email, phone, user_name, hashedPassword, id]
    );

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.redirect("/admin/users");
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).send("Error interno del servidor");
  }
};

export const login = async (req, res) => {
  try {
    const { user_name, password } = req.body;
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE user_name = $1",
      [user_name]
    );

    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.userId = user.id;
        req.session.userName = user.user_name;
        res.redirect("/admin");
      } else {
        res.render("pages/admin/login", {
          errorMessage: "    Usuario no encontrado",
        });
      }
    } else {
      res.render("pages/admin/login", {
        errorMessage: "Contraseña incorrecta",
      });
    }
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).render("pages/error", {
      errorMessage: "Error interno del servidor",
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Destruir la sesión
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al cerrar sesión:", err);
        res.status(500).send("Error al cerrar sesión");
      } else {
        res.redirect("/admin/login"); // Redirigir al usuario al inicio de sesión
      }
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    res.status(500).send("Error interno del servidor");
  }
};
