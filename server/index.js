const path = require('path');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

