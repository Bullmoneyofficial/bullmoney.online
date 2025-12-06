import { Schema, model, models } from 'mongoose';

// Define the Category schema
const CategorySchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, // Ensure category name is unique
      trim: true // Trim whitespace before and after the name
    },
  },
  { 
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
);

// Check if the Category model already exists in the models, if not, create it
const Category = models.Category || model('Category', CategorySchema);

export default Category;
