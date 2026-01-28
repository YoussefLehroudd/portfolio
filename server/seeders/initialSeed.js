require('dotenv').config({ path: '../.env' });

const { connectDatabase, dbType, mongoose, sequelize } = require('../config/database');
const Admin = require('../models/Admin');
const Category = require('../models/Category');

const defaultAdmin = {
  username: 'Youssef',
  password: 'Youssef2004@' // Change this after first login!
};

const defaultCategories = [
  'HTML & CSS',
  'JavaScript',
  'React & MUI',
  'Node & Express',
  'REACT',
  'Vue.js',
  'Angular',
  'Python',
  'Full Stack'
];

const ensureAdmin = async () => {
  const existing = await Admin.findOne({ username: defaultAdmin.username });
  if (existing) {
    console.log('Admin already exists, skipping seed');
    return;
  }

  await Admin.create({
    username: defaultAdmin.username,
    password: defaultAdmin.password
  });

  console.log('Default admin created:');
  console.log(`- Username: ${defaultAdmin.username}`);
  console.log(`- Password: ${defaultAdmin.password}`);
  console.log('Please change this password after first login.');
};

const ensureCategories = async () => {
  const existing = await Category.find();
  const existingNames = existing.map((c) => c.name);

  const toAdd = defaultCategories.filter((name) => !existingNames.includes(name));
  if (!toAdd.length) {
    console.log('All default categories already exist, skipping seed');
    return;
  }

  for (const name of toAdd) {
    await Category.create({ name });
    console.log(`✓ Added category: ${name}`);
  }
};

const runInitialSeed = async (options = {}) => {
  const { standalone = false } = options;

  if (standalone) {
    await connectDatabase();
  }

  try {
    await ensureAdmin();
    await ensureCategories();
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    if (standalone) {
      if (dbType === 'mongodb') {
        await mongoose.connection.close();
      } else if (sequelize) {
        await sequelize.close();
      }
    }
  }
};

if (require.main === module) {
  runInitialSeed({ standalone: true }).then(() => {
    console.log('Seeding complete');
    process.exit(0);
  });
}

module.exports = runInitialSeed;
