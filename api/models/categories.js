import mongoose from "mongoose";
const { Schema, model } = mongoose;


/**
 * Category schema definition.
 *
 * @typedef {object} CategorySchema
 * @property {string} name - The name of the category.
 * @property {string} [description] - The description of the category.
 */

/**
 * Category model.
 *
 * @type {mongoose.Model<CategorySchema>}
 */
const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
});

const CategoryModel = model("Category", CategorySchema);
export default CategoryModel;
