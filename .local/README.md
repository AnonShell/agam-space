# Local Development Environment

This directory contains all local development tools and data for Agam Space.

## 🗂️ Structure

```
.local/
├── docker-compose.dev.yml   # PostgreSQL + pgAdmin for local dev
├── init-db.sql             # PostgreSQL extensions setup
├── README.md               # This file
└── data/                   # Local development data (gitignored)
    ├── postgres/           # PostgreSQL data files
    └── pgadmin/            # pgAdmin settings
```

## 🚀 Quick Start

### Start Development Database

```bash
# From project root
cd .local
docker-compose -f docker-compose.dev.yml up -d
```

### Access Services

- **PostgreSQL**: `localhost:5432`
  - Database: `agam_space`
  - User: `agam_space`
  - Password: `dev_password_123`

- **pgAdmin**: http://localhost:8080
  - Email: `admin@agam-space.local`
  - Password: `admin123`

### Stop Services

```bash
cd .local
docker-compose -f docker-compose.dev.yml down
```

### Clean Database Data

```bash
# Stop containers first
docker-compose -f docker-compose.dev.yml down

# Remove data (⚠️ Destroys all data!)
rm -rf data/postgres data/pgadmin

# Restart fresh
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Configuration

The development database credentials match the default `.env` configuration in
`apps/api-server/env.example`.

## 🗑️ Data Management

- **`data/` directory**: Automatically created, contains all persistent
  development data
- **Gitignored**: `data/` is excluded from git to prevent committing database
  files
- **Portable**: Each developer gets their own local database state
