const validateMenuItem = (req, res, next) => {
  const { name, description, price, category } = req.body;

  // Check required fields
  if (!name || !description || !price || !category) {
    return res.status(400).json({
      message: 'Missing required fields',
      required: ['name', 'description', 'price', 'category']
    });
  }

  // Validate price
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({
      message: 'Price must be a positive number'
    });
  }

  // Validate name length
  if (name.length < 3 || name.length > 100) {
    return res.status(400).json({
      message: 'Name must be between 3 and 100 characters'
    });
  }

  // Validate description length
  if (description.length < 10 || description.length > 500) {
    return res.status(400).json({
      message: 'Description must be between 10 and 500 characters'
    });
  }

  // Validate category
  const validCategories = ['appetizers', 'main_course', 'desserts', 'beverages', 'sides'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      message: 'Invalid category',
      validCategories
    });
  }

  // Type validation
  if (typeof name !== 'string') {
    return res.status(400).json({ message: 'Name must be a string' });
  }
  if (typeof description !== 'string') {
    return res.status(400).json({ message: 'Description must be a string' });
  }
  if (typeof category !== 'string') {
    return res.status(400).json({ message: 'Category must be a string' });
  }

  // Optional fields validation
  if (req.body.preparationTime && (typeof req.body.preparationTime !== 'number' || req.body.preparationTime <= 0)) {
    return res.status(400).json({ message: 'Preparation time must be a positive number' });
  }

  if (req.body.customizationOptions) {
    if (!Array.isArray(req.body.customizationOptions)) {
      return res.status(400).json({ message: 'Customization options must be an array' });
    }
    
    for (const option of req.body.customizationOptions) {
      if (!option.name || typeof option.name !== 'string') {
        return res.status(400).json({ message: 'Each customization option must have a valid name' });
      }
      if (!Array.isArray(option.options)) {
        return res.status(400).json({ message: 'Each customization option must have an array of options' });
      }
      for (const subOption of option.options) {
        if (!subOption.name || typeof subOption.name !== 'string') {
          return res.status(400).json({ message: 'Each sub-option must have a valid name' });
        }
        if (typeof subOption.price !== 'number' || subOption.price < 0) {
          return res.status(400).json({ message: 'Each sub-option must have a valid price' });
        }
      }
    }
  }

  if (req.body.nutritionalInfo) {
    const { calories, protein, carbs, fat } = req.body.nutritionalInfo;
    if (typeof calories !== 'number' || calories < 0) {
      return res.status(400).json({ message: 'Calories must be a non-negative number' });
    }
    if (typeof protein !== 'number' || protein < 0) {
      return res.status(400).json({ message: 'Protein must be a non-negative number' });
    }
    if (typeof carbs !== 'number' || carbs < 0) {
      return res.status(400).json({ message: 'Carbs must be a non-negative number' });
    }
    if (typeof fat !== 'number' || fat < 0) {
      return res.status(400).json({ message: 'Fat must be a non-negative number' });
    }
  }

  if (req.body.allergens) {
    if (!Array.isArray(req.body.allergens)) {
      return res.status(400).json({ message: 'Allergens must be an array' });
    }
    for (const allergen of req.body.allergens) {
      if (typeof allergen !== 'string') {
        return res.status(400).json({ message: 'Each allergen must be a string' });
      }
    }
  }

  next();
};

module.exports = {
  validateMenuItem
}; 