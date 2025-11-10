# Database Layer - PostgreSQL + Drizzle + NestJS

Clean, production-ready database integration using **PostgreSQL** as the single
database option with **Drizzle ORM** and standard **NestJS patterns**.

## 🏗️ Architecture

```
src/database/
├── database.module.ts          # Global NestJS module
├── database.providers.ts       # Connection factories
├── database.service.ts         # Utilities (health checks)
├── schema/
│   ├── users.ts               # User table schema
│   └── index.ts               # Export all schemas
├── migrations/                # Generated migrations
└── database-usage.example.ts  # Usage patterns
```

## 🚀 Quick Start

### 1. Start PostgreSQL

```bash
cd .dev && docker-compose -f docker-compose.dev.yml up -d
```

### 2. Generate Initial Migration

```bash
npm run db:generate
```

### 3. Start API Server

```bash
npm run dev
# Migrations run automatically on startup
```

## 🔌 Usage Patterns

### Inject Drizzle Database (Recommended)

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: ReturnType<typeof drizzle>
  ) {}

  async createUser(userData: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(userData).returning();
    return user;
  }
}
```

### Inject Raw PostgreSQL Client (Advanced)

```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_CLIENT)
    private client: postgres.Sql
  ) {}

  async getComplexAnalytics() {
    return this.client`
      SELECT json_agg(json_build_object(...)) 
      FROM complex_query
    `;
  }
}
```

## 📋 Configuration

### Environment Variables

```bash
# PostgreSQL Connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=agam_space
DATABASE_PASSWORD=dev_password_123
DATABASE_NAME=agam_space
DATABASE_SSL=false
DATABASE_MAX_CONNECTIONS=10
DATABASE_CONNECTION_TIMEOUT=30000
```

### Features

- ✅ **Automatic migrations** on app startup
- ✅ **Connection pooling** with configurable limits
- ✅ **Health checks** via DatabaseService
- ✅ **Type-safe queries** with Drizzle + TypeScript
- ✅ **NestJS dependency injection** throughout app
- ✅ **PostgreSQL-specific** optimizations and features

## 🛠️ Development

### Generate New Migration

```bash
# 1. Modify schema files in src/database/schema/
# 2. Generate migration
npm run db:generate
# 3. Restart app to apply migrations
```

### Database Studio

```bash
npm run db:studio
# Opens Drizzle Studio at http://localhost:4983
```

### Database Health Check

Visit: `http://localhost:3331/api/v1/health`

```json
{
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "agam_space",
    "healthy": true,
    "ssl": false
  }
}
```

## 🏛️ Schema Design

### Users Table

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  // ... more fields
});
```

### Type Safety

```typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

## 🔥 Best Practices

### ✅ DO

- Inject `DATABASE_CONNECTION` for Drizzle queries
- Use schema types (`User`, `NewUser`) for type safety
- Use Drizzle query builder for standard operations
- Use raw PostgreSQL client for complex analytics
- Let NestJS manage connection lifecycle

### ❌ DON'T

- Create manual database connections
- Use `DatabaseService.getDb()` - inject directly instead
- Mix different connection instances
- Bypass the provider pattern

## 🚀 Production Ready

- **Connection pooling** with configurable limits
- **Automatic migration** deployment
- **Health monitoring** via health endpoint
- **Graceful shutdown** handling
- **SSL support** for production
- **Error handling** and logging
- **TypeScript** end-to-end type safety
