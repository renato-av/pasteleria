import pool from "../db.js";

export const renderPrincipal = async (req, res) => {
  res.render("principal");
};
export const renderAbout = async (req, res) => {
  res.render("pages/principal/about");
};

export const renderFAQ = async (req, res) => {
  res.render("pages/principal/FAQ");
};

export const renderLetter = async (req, res) => {
  try {
    const searchWord = req.query.searchWord || "";
    const selectedCategory = req.query.category || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        bp.id,
        bp.name,
        bp.description,
        bp.image_url,
        c.name AS category,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'type', COALESCE(pt.type_name, 'No Type'),
                'size', COALESCE(pz.name, 'No Size'),
                'quantity', pd.quantity,
                'price', pd.price
            )
        ) AS product_details
      FROM base_products bp
      JOIN categories c ON bp.category_id = c.id
      LEFT JOIN product_details pd ON bp.id = pd.base_product_id
      LEFT JOIN product_types pt ON pd.product_type_id = pt.id
      LEFT JOIN product_size pz ON pd.product_size_id = pz.id
    `;

    const queryParams = [];
    let queryParamsIndex = 1;

    if (searchWord.length > 0) {
      query += `WHERE (bp.name ILIKE $${queryParamsIndex} OR bp.description ILIKE $${queryParamsIndex})`
      queryParams.push(`%${searchWord}%`);
      queryParamsIndex++;
    }

    if (selectedCategory.length > 0) {
      if (searchWord.length > 0) {
        query += " AND ";
      } else {
        query += " WHERE ";
      }
      query += `bp.category_id = $${queryParamsIndex}`;
      queryParams.push(selectedCategory);
      queryParamsIndex++;
    }

    query += " GROUP BY bp.id, bp.name, bp.description, bp.image_url, c.name";
    query += ` LIMIT $${queryParamsIndex} OFFSET $${queryParamsIndex + 1}`;
    queryParams.push(limit, offset);

    console.log({
      query,
      queryParams
    });

    const { rows: products } = await pool.query(query, queryParams);

  
    let countQuery = `
      SELECT COUNT(*) 
      FROM base_products bp
      JOIN categories c ON bp.category_id = c.id
    `;

    const countParams = [];
    let countParamsIndex = 1;

    if (searchWord.length > 0) {
      countQuery += `WHERE (bp.name ILIKE $${countParamsIndex} OR bp.description ILIKE $${countParamsIndex})`;
      countParams.push(`%${searchWord}%`);
      countParamsIndex++;
    }

    if (selectedCategory.length > 0) {
      if (searchWord.length > 0) {
        countQuery += " AND ";
      } else {
        countQuery += " WHERE ";
      }

      countQuery += ` bp.category_id = $${countParamsIndex}`;
      countParams.push(+selectedCategory);
      countParamsIndex++;
    }

    console.log({
      countQuery,
      countParams
    });

    const { rows: totalRows } = await pool.query(countQuery, countParams);
    const totalProducts = parseInt(totalRows[0].count);
    const totalPages = Math.ceil(totalProducts / limit);

    // Obtener todas las categorías para el menú de selección
    const { rows: categories } = await pool.query("SELECT id, name FROM categories");

    const start = offset + 1;
    const end = Math.min(offset + limit, totalProducts);

    res.render("pages/principal/letter", {
      products,
      categories,
      searchWord,
      selectedCategory,
      currentPage: page,
      totalProducts,
      totalPages,
      limit,
      start,
      end
    });
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res.status(500).send("Error interno del servidor");
  }
};

// #region details

export const renderProductDetails = async (req, res) => {
  const productId = req.params.id;

  try {
    // Consulta SQL para obtener los detalles del producto
    const { rows: products } = await pool.query(
      `
      SELECT 
        bp.id,
        bp.name,
        bp.category_id,
        bp.description,
        bp.image_url,
        c.name AS category,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'type', COALESCE(pt.type_name, ''),
                'size', COALESCE(pz.name, ''),
                'quantity', pd.quantity,
                'price', pd.price
            )
        ) AS product_details
      FROM base_products bp
      JOIN categories c ON bp.category_id = c.id
      LEFT JOIN product_details pd ON bp.id = pd.base_product_id
      LEFT JOIN product_size pz ON pd.product_size_id = pz.id
      LEFT JOIN product_types pt ON pd.product_type_id = pt.id
      WHERE bp.id = $1
      GROUP BY bp.id, bp.name, bp.description, bp.image_url, c.name;
    `,
      [productId]
    );

    // Si el producto no existe, enviar un mensaje de error
    if (products.length === 0) {
      return res.status(404).send("Producto no encontrado");
    }

    const product = products[0];
    console.log(product);
    const categoryId = products[0].category_id;

    // Obtener productos relacionados de la misma categoría
    const { rows: relatedProducts } = await pool.query(
      `SELECT * FROM base_products WHERE category_id = $1 and id != $2  LIMIT 5`,
      [categoryId, productId]
    );
    res.render("pages/principal/detail", {
      product,
      relatedProducts: relatedProducts,
    });
  } catch (error) {
    console.error("Error al obtener los detalles del producto:", error);
    res.status(500).send("Error interno del servidor");
  }
};
