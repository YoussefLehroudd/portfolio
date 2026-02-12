# Portfolio Server

This server supports MongoDB, MySQL and PostgreSQL (e.g., Neon). You can switch between them using environment variables.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:

```env
# Choose your database: mongodb | mysql | postgres/postgresql/pg
DB_TYPE=mongodb

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/portfolio

# PostgreSQL (example Neon) - prefer full URI
# POSTGRES_URI=postgresql://user:pass@host/dbname?sslmode=require
# or discrete settings if you don't have a URI
# POSTGRES_HOST=localhost
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=your_password
# POSTGRES_DB=portfolio
# POSTGRES_PORT=5432

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=portfolio

# Server Configuration
PORT=5001
```

## Database Setup

### MongoDB
1. Make sure MongoDB is installed and running
2. The database and collections will be created automatically

### MySQL
1. Make sure MySQL is installed and running
2. Create the database and tables using the init script:
```bash
mysql -u your_username -p < database/init.sql
```

### PostgreSQL / Neon
1. Make sure Postgres is reachable (Neon provides a pooled URI)
2. Set `DB_TYPE=postgresql` and `POSTGRES_URI=your_connection_string`
3. Tables are created automatically by Sequelize on startup (`sequelize.sync()`), so no manual SQL needed

## Running the Server

1. Start the server:
```bash
npm start
```

2. The server will connect to the database specified by `DB_TYPE` in your `.env` file

## API Endpoints

- `GET /api` - Check server status and current database type
- `POST /api/messages` - Save a new message
- `GET /api/messages` - Retrieve all messages

## Switching Databases

To switch between databases:

1. Stop the server
2. Update `DB_TYPE` in your `.env` file
3. Restart the server

The server will automatically use the specified database type.

## Message Schema

Both databases use the same schema for messages:

```
{
  name: String,
  email: String,
  message: String,
  createdAt: Date
}
