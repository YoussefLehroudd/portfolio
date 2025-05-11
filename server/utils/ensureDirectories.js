const fs = require('fs').promises;
const path = require('path');

async function ensureDirectories() {
  const projectsImagePath = path.join(__dirname, '..', '..', 'public', 'images', 'projects');
  
  try {
    await fs.access(projectsImagePath);
  } catch (error) {
    // Directory doesn't exist, create it
    try {
      await fs.mkdir(projectsImagePath, { recursive: true });
      console.log('Created projects image directory:', projectsImagePath);
    } catch (error) {
      console.error('Error creating projects image directory:', error);
    }
  }
}

module.exports = ensureDirectories;
