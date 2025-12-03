require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const { connectMongo } = require('./config/database');
const Category = require('./models/Category');

const defaultCategories = [
  'HTML & CSS',
  'JavaScript', 
  'React & MUI',
  'Node & Express',
  'REACT', // Add the missing REACT category
  'Vue.js',
  'Angular',
  'Python',
  'Full Stack'
];

const seedCategories = async () => {
  try {
    await connectMongo();
    console.log('Connected to MongoDB');

    // Get existing categories
    const existingCategories = await Category.find();
    const existingNames = existingCategories.map(cat => cat.name);
    
    console.log('Existing categories:', existingNames);

    // Add missing categories
    const categoriesToAdd = defaultCategories.filter(name => !existingNames.includes(name));
    
    if (categoriesToAdd.length === 0) {
      console.log('All default categories already exist');
      return;
    }

    console.log('Adding categories:', categoriesToAdd);

    for (const categoryName of categoriesToAdd) {
      const category = new Category({ name: categoryName });
      await category.save();
      console.log(`✓ Added category: ${categoryName}`);
    }

    console.log('Categories seeded successfully!');
    
    // Display all categories
    const allCategories = await Category.find().sort('name');
    console.log('\nAll categories in database:');
    allCategories.forEach(cat => console.log(`- ${cat.name}`));
    
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedCategories();
