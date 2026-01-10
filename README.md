# Architecture Microservices Chat - NestJS (Monorepo pnpm)

[![CI](https://github.com/cmamon/chat-api/actions/workflows/ci.yml/badge.svg)](https://github.com/cmamon/chat-api/actions/workflows/ci.yml)

## 📋 Vue d'ensemble

Cette documentation décrit l'architecture complète d'une application de chat professionnel basée sur NestJS avec une approche microservices dans un monorepo géré par pnpm.

### Stack Technologique

- **Framework**: NestJS + TypeScript
- **Package Manager**: pnpm (avec workspaces)
- **Architecture**: Monorepo Turborepo
- **Communication**: NATS (message broker)
- **Base de données**: PostgreSQL + Redis
- **WebSocket**: Socket.IO
- **Reverse Proxy**: Traefik
- **Logging**: Winston/Pino (logs structurés)
- **Monitoring**: Prometheus + Grafana
- **Containerisation**: Docker + Docker Compose

---

## 🏗️ Architecture Générale

```
┌─────────────┐
│   Traefik   │ (Reverse Proxy / Load Balancer)
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┬─────────────────┐
       │                 │                  │                 │
┌──────▼──────┐   ┌─────▼──────┐   ┌──────▼──────┐   ┌─────▼──────┐
│ API Gateway │   │  WebSocket │   │ Prometheus  │   │  Grafana   │
│             │   │   Gateway  │   │             │   │            │
└──────┬──────┘   └─────┬──────┘   └─────────────┘   └────────────┘
       │                │
       │         ┌──────▼──────────────────┐
       │         │                         │
       └─────────┤      NATS Broker        │
                 │                         │
                 └──┬──────────────┬───────┘
                    │              │
            ┌───────▼──────┐  ┌───▼──────────┐
            │ Chat Service │  │   Presence   │
            │              │  │   Service    │
            └───────┬──────┘  └───┬──────────┘
                    │              │
            ┌───────▼──────────────▼───────┐
            │                              │
            │    PostgreSQL     Redis      │
            │                              │
            └──────────────────────────────┘
```

---

## 📁 Structure du Projet (Monorepo pnpm)

```
chat-microservices/                    # ROOT du monorepo
├── pnpm-workspace.yaml               # Configuration workspace pnpm
├── package.json                       # Dependencies & scripts racine
├── pnpm-lock.yaml                    # Lockfile pnpm
├── .npmrc                            # Configuration pnpm
├── turbo.json                        # Configuration Turborepo (optionnel)
├── tsconfig.base.json                # Config TypeScript partagée
├── .eslintrc.js                      # ESLint config
├── .prettierrc                       # Prettier config
├── docker-compose.yml
├── docker-compose.monitoring.yml
├── .env.example
├── .gitignore
├── README.md
│
├── apps/                             # Applications (microservices)
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   └── guards/
│   │   │   │       └── jwt-auth.guard.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── users.service.ts
│   │   │   ├── health/
│   │   │   │   └── health.controller.ts
│   │   │   └── common/
│   │   │       ├── filters/
│   │   │       ├── interceptors/
│   │   │       └── middleware/
│   │   ├── test/
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── .env.example
│   │
│   ├── websocket-gateway/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── chat/
│   │   │   │   ├── chat.gateway.ts
│   │   │   │   ├── chat.module.ts
│   │   │   │   └── chat.service.ts
│   │   │   ├── auth/
│   │   │   │   └── ws-jwt.guard.ts
│   │   │   └── common/
│   │   │       ├── adapters/
│   │   │       │   └── redis-io.adapter.ts
│   │   │       └── filters/
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── chat-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── messages/
│   │   │   │   ├── messages.module.ts
│   │   │   │   ├── messages.controller.ts
│   │   │   │   ├── messages.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── message.entity.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-message.dto.ts
│   │   │   │       └── update-message.dto.ts
│   │   │   ├── rooms/
│   │   │   │   ├── rooms.module.ts
│   │   │   │   ├── rooms.controller.ts
│   │   │   │   ├── rooms.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── room.entity.ts
│   │   │   └── database/
│   │   │       └── database.module.ts
│   │   ├── test/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   └── presence-service/
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── presence/
│       │   │   ├── presence.module.ts
│       │   │   ├── presence.controller.ts
│       │   │   └── presence.service.ts
│       │   └── redis/
│       │       └── redis.module.ts
│       ├── test/
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
│
├── packages/                         # Bibliothèques partagées
│   ├── common/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── constants/
│   │   │   │   ├── message-patterns.ts
│   │   │   │   └── events.ts
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── filters/
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   └── rpc-exception.filter.ts
│   │   │   ├── guards/
│   │   │   │   ├── roles.guard.ts
│   │   │   │   └── throttle.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   └── transform.interceptor.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── message.interface.ts
│   │   │   │   ├── user.interface.ts
│   │   │   │   └── room.interface.ts
│   │   │   ├── dto/
│   │   │   │   └── pagination.dto.ts
│   │   │   └── utils/
│   │   │       └── helpers.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── logger/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── logger.module.ts
│   │   │   ├── logger.service.ts
│   │   │   └── winston.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── database/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── database.module.ts
│   │   │   ├── typeorm.config.ts
│   │   │   └── migrations/
│   │   │       └── .gitkeep
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── config/
│       ├── src/
│       │   ├── index.ts
│       │   ├── config.module.ts
│       │   ├── config.service.ts
│       │   ├── validation.schema.ts
│       │   └── configs/
│       │       ├── app.config.ts
│       │       ├── database.config.ts
│       │       └── redis.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── config/                           # Configuration infrastructure
│   ├── traefik/
│   │   ├── traefik.yml
│   │   └── dynamic.yml
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── datasources.yml
│       └── dashboards/
│           └── nestjs-dashboard.json
│
└── scripts/                          # Scripts utilitaires
    ├── seed-db.ts
    ├── generate-jwt-secret.sh
    ├── setup-dev.sh
    └── clean-docker.sh
```

### Explication de la Structure

#### `/apps` - Applications Microservices

Chaque dossier dans `apps/` est une application NestJS indépendante déployable. Elles partagent les mêmes packages via le workspace pnpm.

#### `/packages` - Bibliothèques Partagées

- **common**: Utilities, constants, decorators, guards partagés
- **logger**: Service de logging Winston configuré
- **database**: Configuration TypeORM et migrations
- **config**: Service de configuration centralisé avec validation

#### Avantages du Monorepo

1. **Code partagé facilement**: Import direct `import { Logger } from '@app/logger'`
2. **Type-safety**: TypeScript fonctionne entre packages
3. **Refactoring**: Changements cross-services en un commit
4. **DX**: Une seule installation, un workspace IDE
5. **CI/CD**: Build optimisé avec cache Turborepo

---

## ⚙️ Configuration Monorepo pnpm

### pnpm-workspace.yaml (racine)

```yaml
packages:
  # Applications microservices
  - 'apps/*'

  # Packages partagés
  - 'packages/*'
```

### .npmrc (racine)

```ini
# Performance optimizations
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true

# Lockfile settings
lockfile=true

# Registry
registry=https://registry.npmjs.org/

# Node version management
engine-strict=true

# Optional: Use local registry in development
# registry=http://localhost:4873/
```

### package.json (racine)

```json
{
  "name": "chat-microservices",
  "version": "1.0.0",
  "private": true,
  "description": "NestJS Microservices Chat Application",
  "author": "Your Team",
  "license": "MIT",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@10.27.0",
  "scripts": {
    "preinstall": "npx only-allow pnpm",

    "install:all": "pnpm install",

    "build": "turbo run build",
    "build:packages": "pnpm --filter './packages/*' build",
    "build:apps": "pnpm --filter './apps/*' build",

    "dev": "turbo run dev --parallel",
    "dev:api": "pnpm --filter api-gateway dev",
    "dev:ws": "pnpm --filter websocket-gateway dev",
    "dev:chat": "pnpm --filter chat-service dev",
    "dev:presence": "pnpm --filter presence-service dev",

    "start:api": "pnpm --filter api-gateway start",
    "start:ws": "pnpm --filter websocket-gateway start",
    "start:chat": "pnpm --filter chat-service start",
    "start:presence": "pnpm --filter presence-service start",

    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:cov": "turbo run test:cov",
    "test:e2e": "turbo run test:e2e",

    "lint": "turbo run lint",
    "lint:fix": "turbo run lint --fix",

    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",

    "clean": "turbo run clean && rm -rf node_modules",
    "clean:docker": "docker-compose down -v && docker system prune -af",

    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:ps": "docker-compose ps",

    "db:migrate": "pnpm --filter chat-service migration:run",
    "db:migrate:revert": "pnpm --filter chat-service migration:revert",
    "db:seed": "ts-node scripts/seed-db.ts",

    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@typescript-eslint/eslint-plugin": "^6.18.0",
    "@typescript-eslint/parser": "^6.18.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "turbo": "^2.3.3",
    "typescript": "^5.7.3"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### turbo.json (racine)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "test/**/*.ts"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### tsconfig.base.json (racine)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "paths": {
      "@app/common": ["packages/common/src"],
      "@app/common/*": ["packages/common/src/*"],
      "@app/logger": ["packages/logger/src"],
      "@app/logger/*": ["packages/logger/src/*"],
      "@app/database": ["packages/database/src"],
      "@app/database/*": ["packages/database/src/*"],
      "@app/config": ["packages/config/src"],
      "@app/config/*": ["packages/config/src/*"]
    }
  },
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### Package Configurations

#### apps/api-gateway/package.json

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "private": true,
  "description": "API Gateway for Chat Microservices",
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "start:debug": "nest start --debug --watch",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@nestjs/common": "11.1.11",
    "@nestjs/core": "11.1.11",
    "@nestjs/microservices": "11.1.11",
    "@nestjs/platform-express": "11.1.11",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/throttler": "^5.1.1",
    "@nestjs/typeorm": "^10.0.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "typeorm": "^0.3.19",
    "pg": "^8.11.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "nats": "^2.19.0",
    "bcrypt": "^5.1.1",
    "reflect-metadata": "^0.1.14",
    "rxjs": "^7.8.1",
    "@app/common": "workspace:*",
    "@app/logger": "workspace:*",
    "@app/database": "workspace:*",
    "@app/config": "workspace:*"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.14",
    "@nestjs/schematics": "11.0.9",
    "@nestjs/testing": "11.1.11",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.38",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@app/common(|/.*)$": "<rootDir>/../../packages/common/src/$1",
      "^@app/logger(|/.*)$": "<rootDir>/../../packages/logger/src/$1",
      "^@app/database(|/.*)$": "<rootDir>/../../packages/database/src/$1",
      "^@app/config(|/.*)$": "<rootDir>/../../packages/config/src/$1"
    }
  }
}
```

#### apps/api-gateway/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

#### packages/common/package.json

```json
{
  "name": "@app/common",
  "version": "1.0.0",
  "description": "Shared common utilities and constants",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "11.1.11",
    "@nestjs/microservices": "11.1.11",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.7.3"
  }
}
```

#### packages/common/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### packages/logger/package.json

```json
{
  "name": "@app/logger",
  "version": "1.0.0",
  "description": "Shared Winston logger service",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "lint": "eslint \"src/**/*.ts\" --fix"
  },
  "dependencies": {
    "@nestjs/common": "11.1.11",
    "winston": "^3.11.0",
    "nest-winston": "^1.9.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.7.3"
  }
}
```

---

## 🐳 Docker Compose Configuration

### docker-compose.yml

```yaml
version: '3.8'

networks:
  chat-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  nats-data:

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: chat-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-chatdb}
      POSTGRES_USER: ${POSTGRES_USER:-chatuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatpassword}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - chat-network
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-chatuser}']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Pub/Sub
  redis:
    image: redis:7-alpine
    container_name: chat-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redispassword}
    volumes:
      - redis-data:/data
    ports:
      - '6379:6379'
    networks:
      - chat-network
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # NATS Message Broker
  nats:
    image: nats:2.10-alpine
    container_name: chat-nats
    restart: unless-stopped
    command: '--cluster_name NATS --cluster nats://0.0.0.0:6222 --http_port 8222 --js'
    volumes:
      - nats-data:/data
    ports:
      - '4222:4222' # Client connections
      - '6222:6222' # Cluster routes
      - '8222:8222' # HTTP monitoring
    networks:
      - chat-network
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:8222/healthz']
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: apps/api-gateway/Dockerfile
    container_name: chat-api-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-1d}
      NATS_URL: nats://nats:4222
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${POSTGRES_DB:-chatdb}
      POSTGRES_USER: ${POSTGRES_USER:-chatuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatpassword}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispassword}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      nats:
        condition: service_healthy
    networks:
      - chat-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.api-gateway.rule=Host(`api.localhost`) || PathPrefix(`/api`)'
      - 'traefik.http.routers.api-gateway.entrypoints=web'
      - 'traefik.http.services.api-gateway.loadbalancer.server.port=3000'
      # Health check
      - 'traefik.http.routers.api-gateway.middlewares=api-gateway-healthcheck'
      - 'traefik.http.middlewares.api-gateway-healthcheck.healthcheck.path=/health'
      - 'traefik.http.middlewares.api-gateway-healthcheck.healthcheck.interval=10s'

  # WebSocket Gateway
  websocket-gateway:
    build:
      context: .
      dockerfile: apps/websocket-gateway/Dockerfile
    container_name: chat-websocket-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3001
      JWT_SECRET: ${JWT_SECRET}
      NATS_URL: nats://nats:4222
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispassword}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
    depends_on:
      redis:
        condition: service_healthy
      nats:
        condition: service_healthy
    networks:
      - chat-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.websocket.rule=Host(`ws.localhost`) || PathPrefix(`/socket.io`)'
      - 'traefik.http.routers.websocket.entrypoints=web'
      - 'traefik.http.services.websocket.loadbalancer.server.port=3001'
      # Sticky sessions for WebSocket
      - 'traefik.http.services.websocket.loadbalancer.sticky.cookie=true'
      - 'traefik.http.services.websocket.loadbalancer.sticky.cookie.name=websocket_session'

  # Chat Service
  chat-service:
    build:
      context: .
      dockerfile: apps/chat-service/Dockerfile
    container_name: chat-chat-service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      NATS_URL: nats://nats:4222
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${POSTGRES_DB:-chatdb}
      POSTGRES_USER: ${POSTGRES_USER:-chatuser}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatpassword}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispassword}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      nats:
        condition: service_healthy
    networks:
      - chat-network

  # Presence Service
  presence-service:
    build:
      context: .
      dockerfile: apps/presence-service/Dockerfile
    container_name: chat-presence-service
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      NATS_URL: nats://nats:4222
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispassword}
    depends_on:
      redis:
        condition: service_healthy
      nats:
        condition: service_healthy
    networks:
      - chat-network

  # Traefik Reverse Proxy
  traefik:
    image: traefik:v2.11
    container_name: chat-traefik
    restart: unless-stopped
    command:
      - '--api.insecure=true'
      - '--providers.docker=true'
      - '--providers.docker.exposedbydefault=false'
      - '--providers.file.directory=/etc/traefik/dynamic'
      - '--entrypoints.web.address=:80'
      - '--metrics.prometheus=true'
      - '--metrics.prometheus.buckets=0.1,0.3,1.2,5.0'
      - '--accesslog=true'
    ports:
      - '80:80'
      - '8080:8080' # Traefik Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./config/traefik:/etc/traefik/dynamic:ro
    networks:
      - chat-network
    labels:
      - 'traefik.enable=true'
```

### docker-compose.monitoring.yml

```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:v2.48.1
    container_name: chat-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - '9090:9090'
    networks:
      - chat-network
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.prometheus.rule=Host(`prometheus.localhost`)'
      - 'traefik.http.routers.prometheus.entrypoints=web'
      - 'traefik.http.services.prometheus.loadbalancer.server.port=9090'

  # Grafana
  grafana:
    image: grafana/grafana:10.2.3
    container_name: chat-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: redis-datasource
    volumes:
      - ./config/grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro
      - ./config/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - grafana-data:/var/lib/grafana
    ports:
      - '3002:3000'
    networks:
      - chat-network
    depends_on:
      - prometheus
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.grafana.rule=Host(`grafana.localhost`)'
      - 'traefik.http.routers.grafana.entrypoints=web'
      - 'traefik.http.services.grafana.loadbalancer.server.port=3000'

volumes:
  prometheus-data:
  grafana-data:

networks:
  chat-network:
    external: true
```

---

## ⚙️ Configuration Files

### .env.example

```env
# Environment
NODE_ENV=development

# Database
POSTGRES_DB=chatdb
POSTGRES_USER=chatuser
POSTGRES_PASSWORD=chatpassword

# Redis
REDIS_PASSWORD=redispassword

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

### config/traefik/traefik.yml

```yaml
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ':80'

providers:
  docker:
    exposedByDefault: false
  file:
    directory: '/etc/traefik/dynamic'
    watch: true

metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
    buckets:
      - 0.1
      - 0.3
      - 1.2
      - 5.0

log:
  level: INFO

accessLog:
  filePath: '/var/log/traefik/access.log'
  bufferingSize: 100
```

### config/traefik/dynamic.yml

```yaml
http:
  middlewares:
    rate-limit:
      rateLimit:
        average: 100
        burst: 50
        period: 1s

    security-headers:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        sslRedirect: false
        customFrameOptionsValue: 'SAMEORIGIN'

    compression:
      compress: {}
```

### config/prometheus/prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'websocket-gateway'
    static_configs:
      - targets: ['websocket-gateway:3001']
    metrics_path: '/metrics'

  - job_name: 'chat-service'
    static_configs:
      - targets: ['chat-service:3002']
    metrics_path: '/metrics'

  - job_name: 'presence-service'
    static_configs:
      - targets: ['presence-service:3003']
    metrics_path: '/metrics'

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nats'
    static_configs:
      - targets: ['nats:8222']
```

### config/grafana/datasources.yml

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  - name: Redis
    type: redis-datasource
    access: proxy
    url: redis:6379
    jsonData:
      client: standalone
    secureJsonData:
      password: ${REDIS_PASSWORD}
```

---

## 🚀 Guide de Démarrage

### Prérequis

- **Node.js** 20+ (avec Corepack activé)
- **pnpm** 8+ (`corepack enable` puis `corepack prepare pnpm@latest --activate`)
- **Docker** 24.0+
- **Docker Compose** 2.20+

### Installation Initiale

```bash
# 1. Cloner le repository
git clone <your-repo>
cd chat-microservices

# 2. Activer pnpm (si pas déjà fait)
corepack enable
corepack prepare pnpm@10.27.0 --activate

# 3. Vérifier la version de pnpm
pnpm --version

# 4. Installer toutes les dépendances (monorepo entier)
pnpm install

# 5. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env et changer les valeurs sensibles (JWT_SECRET, passwords, etc.)

# 6. Générer un JWT secret sécurisé
./scripts/generate-jwt-secret.sh >> .env

# 7. Build tous les packages partagés
pnpm run build:packages

# 8. Build toutes les applications
pnpm run build:apps
# Ou utiliser Turbo pour un build optimisé
pnpm run build
```

### Développement Local (Sans Docker)

```bash
# Option 1 : Lancer tous les services en parallèle
pnpm run dev

# Option 2 : Lancer un service spécifique dans un terminal
pnpm run dev:api        # API Gateway
pnpm run dev:ws         # WebSocket Gateway
pnpm run dev:chat       # Chat Service
pnpm run dev:presence   # Presence Service

# Note : Assurez-vous que PostgreSQL, Redis et NATS tournent localement
# ou via Docker :
docker-compose up -d postgres redis nats
```

### Développement avec Docker

```bash
# 1. Build tous les services Docker
pnpm run docker:build
# ou directement
docker-compose build

# 2. Lancer tous les services
pnpm run docker:up
# ou
docker-compose up -d

# 3. Vérifier que tous les services sont en cours d'exécution
pnpm run docker:ps
# ou
docker-compose ps

# 4. Voir les logs en temps réel
pnpm run docker:logs
# ou pour un service spécifique
docker-compose logs -f api-gateway

# 5. Lancer le monitoring (optionnel)
docker-compose -f docker-compose.monitoring.yml up -d
```

### Commandes pnpm Utiles

```bash
# Installation
pnpm install                          # Installer toutes les dépendances
pnpm install --frozen-lockfile        # Installation stricte (CI/CD)

# Gestion des dépendances
pnpm add express -w                   # Ajouter à la racine
pnpm add express --filter api-gateway # Ajouter à un service
pnpm add -D @types/express -w         # Ajouter dev dependency

# Build
pnpm run build                        # Build avec Turbo (optimisé)
pnpm run build:packages               # Build seulement les packages
pnpm run build:apps                   # Build seulement les apps
pnpm --filter api-gateway build       # Build un service spécifique

# Tests
pnpm run test                         # Tous les tests
pnpm run test:watch                   # Mode watch
pnpm run test:cov                     # Avec coverage
pnpm --filter api-gateway test        # Tests d'un service

# Linting & Formatting
pnpm run lint                         # Linter tout le code
pnpm run lint:fix                     # Fixer automatiquement
pnpm run format                       # Formatter avec Prettier
pnpm run format:check                 # Vérifier le formatage

# Nettoyage
pnpm run clean                        # Nettoyer dist/ et node_modules
pnpm --filter api-gateway clean       # Nettoyer un service
pnpm store prune                      # Nettoyer le store pnpm

# Workspace
pnpm -r exec <command>                # Exécuter dans tous les packages
pnpm --filter "@app/*" build          # Filtrer par pattern
pnpm --filter "!api-gateway" build    # Exclure un package
```

### Migration de Bases de Données

```bash
# Générer une migration
pnpm --filter chat-service migration:generate -- -n CreateUsersTable

# Exécuter les migrations
pnpm run db:migrate

# Revert dernière migration
pnpm run db:migrate:revert

# Seed la base de données
pnpm run db:seed
```

### Accès aux Services

- **API Gateway**: http://api.localhost ou http://localhost/api
- **WebSocket Gateway**: ws://ws.localhost ou ws://localhost/socket.io
- **Traefik Dashboard**: http://localhost:8080
- **Prometheus**: http://prometheus.localhost ou http://localhost:9090
- **Grafana**: http://grafana.localhost ou http://localhost:3002
- **NATS Monitoring**: http://localhost:8222

### Logs

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f api-gateway

# Logs en temps réel avec timestamps
docker-compose logs -f --tail=100 --timestamps
```

---

## 📦 Travailler avec le Monorepo pnpm

### Structure des Imports

Grâce au workspace pnpm et aux path mappings TypeScript, vous pouvez importer facilement :

```typescript
// Dans n'importe quelle app (api-gateway, websocket-gateway, etc.)
import { Logger } from '@app/logger';
import { MESSAGE_PATTERNS } from '@app/common/constants';
import { LoggingInterceptor } from '@app/common/interceptors';
import { DatabaseModule } from '@app/database';
```

### Ajouter une Nouvelle Dépendance

```bash
# À un service spécifique
pnpm add axios --filter api-gateway

# À tous les services
pnpm add -r axios

# À un package partagé
pnpm add class-validator --filter @app/common

# Dev dependency à la racine
pnpm add -D eslint -w
```

### Créer un Nouveau Package Partagé

```bash
# 1. Créer la structure
mkdir -p packages/validation/src
cd packages/validation

# 2. Créer package.json
cat > package.json << 'EOF'
{
  "name": "@app/validation",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "class-validator": "^0.14.0"
  }
}
EOF

# 3. Créer tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
EOF

# 4. Ajouter au path mapping dans tsconfig.base.json
# "@app/validation": ["packages/validation/src"]

# 5. Installer et utiliser
cd ../..
pnpm install
pnpm --filter @app/validation build
```

### Créer un Nouveau Microservice

```bash
# 1. Utiliser NestJS CLI
cd apps
pnpm exec nest new notification-service

# 2. Configurer package.json
cd notification-service
# Ajouter les dépendances des packages partagés :
pnpm add @app/common@workspace:* @app/logger@workspace:*

# 3. Mettre à jour tsconfig.json pour étendre tsconfig.base.json

# 4. Créer le Dockerfile (copier et adapter un existant)

# 5. Ajouter au docker-compose.yml
```

### Debugging dans le Monorepo

#### VS Code launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Gateway",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev:api"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug WebSocket Gateway",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev:ws"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "processId": "${command:PickProcess}",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Workflow de Développement Typique

```bash
# 1. Pull les dernières modifications
git pull origin main

# 2. Installer les dépendances (si package.json a changé)
pnpm install

# 3. Rebuild les packages partagés si modifiés
pnpm run build:packages

# 4. Lancer le dev en mode watch
pnpm run dev

# 5. Dans un autre terminal, lancer les services externes
docker-compose up -d postgres redis nats

# 6. Travailler sur votre feature...

# 7. Avant de commit, lancer les tests et le linter
pnpm run test
pnpm run lint:fix
pnpm run format

# 8. Commit (les hooks husky vont vérifier le code)
git add .
git commit -m "feat: add new feature"
```

### Optimisation des Performances

#### Cache Turbo

Turborepo met en cache les résultats de build :

```bash
# Premier build (lent)
pnpm run build

# Deuxième build sans changement (instantané grâce au cache)
pnpm run build

# Forcer le rebuild sans cache
pnpm run build --force

# Voir les stats de cache
turbo run build --summarize
```

#### Filtres pnpm

```bash
# Build seulement ce qui a changé depuis main
pnpm --filter "[origin/main]" build

# Build un package et ses dépendances
pnpm --filter api-gateway... build

# Build les dépendants d'un package
pnpm --filter ...@app/common build
```

---

## 📝 Exemples de Code

### 1. API Gateway - main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { LoggingInterceptor } from '@app/common';
import { Logger } from '@app/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Custom logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Connect to NATS for microservices communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://localhost:4222'],
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`API Gateway is running on port ${port}`, 'Bootstrap');
}

bootstrap();
```

### 2. WebSocket Gateway - chat.gateway.ts

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { LoggingInterceptor } from '@app/common';
import { Logger } from '@app/logger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@app/common/constants';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseInterceptors(LoggingInterceptor)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: Logger,
    @Inject('CHAT_SERVICE') private chatClient: ClientProxy,
    @Inject('PRESENCE_SERVICE') private presenceClient: ClientProxy,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Validate JWT token from handshake
      const token = client.handshake.auth.token;
      // Token validation logic here...

      const userId = client.data.userId;

      // Notify presence service
      await this.presenceClient.emit(MESSAGE_PATTERNS.USER_CONNECTED, { userId, socketId: client.id }).toPromise();

      this.logger.log(`Client connected: ${client.id}`, 'ChatGateway');
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`, 'ChatGateway');
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    // Notify presence service
    await this.presenceClient.emit(MESSAGE_PATTERNS.USER_DISCONNECTED, { userId, socketId: client.id }).toPromise();

    this.logger.log(`Client disconnected: ${client.id}`, 'ChatGateway');
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string; content: string }) {
    const userId = client.data.userId;

    // Send to chat service for persistence
    const message = await this.chatClient
      .send(MESSAGE_PATTERNS.CREATE_MESSAGE, {
        userId,
        roomId: payload.roomId,
        content: payload.content,
      })
      .toPromise();

    // Broadcast to room
    this.server.to(payload.roomId).emit('new_message', message);

    return { success: true, messageId: message.id };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    await client.join(payload.roomId);

    this.logger.log(`Client ${client.id} joined room ${payload.roomId}`, 'ChatGateway');

    return { success: true, roomId: payload.roomId };
  }
}
```

### 3. Chat Service - messages.controller.ts

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MESSAGE_PATTERNS } from '@app/common/constants';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @MessagePattern(MESSAGE_PATTERNS.CREATE_MESSAGE)
  async createMessage(@Payload() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.GET_MESSAGES)
  async getMessages(@Payload() payload: { roomId: string; limit?: number; offset?: number }) {
    return this.messagesService.findByRoom(payload.roomId, payload.limit, payload.offset);
  }

  @MessagePattern(MESSAGE_PATTERNS.DELETE_MESSAGE)
  async deleteMessage(@Payload() payload: { messageId: string; userId: string }) {
    return this.messagesService.delete(payload.messageId, payload.userId);
  }
}
```

### 4. Shared Logger - logger.service.ts

```typescript
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class Logger implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'chat-service',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              return `${timestamp} [${context || 'App'}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
```

### 5. Message Patterns Constants

```typescript
// libs/common/src/constants/message-patterns.ts
export const MESSAGE_PATTERNS = {
  // Chat Service
  CREATE_MESSAGE: 'chat.message.create',
  GET_MESSAGES: 'chat.message.get',
  DELETE_MESSAGE: 'chat.message.delete',
  UPDATE_MESSAGE: 'chat.message.update',

  // Room Service
  CREATE_ROOM: 'chat.room.create',
  GET_ROOM: 'chat.room.get',
  JOIN_ROOM: 'chat.room.join',
  LEAVE_ROOM: 'chat.room.leave',

  // Presence Service
  USER_CONNECTED: 'presence.user.connected',
  USER_DISCONNECTED: 'presence.user.disconnected',
  GET_ONLINE_USERS: 'presence.users.online',
  UPDATE_STATUS: 'presence.status.update',
};
```

---

## 🔧 Dockerfile avec pnpm

### apps/api-gateway/Dockerfile

```dockerfile
# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy all package.json files to leverage Docker cache
COPY packages/*/package.json ./packages/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway

# Build shared packages first
RUN pnpm --filter "@app/*" build

# Build the application
RUN pnpm --filter api-gateway build

# Production stage
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy package.json files
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY packages/common/package.json ./packages/common/
COPY packages/logger/package.json ./packages/logger/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/packages/common/dist ./packages/common/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/config/dist ./packages/config/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3000

CMD ["node", "apps/api-gateway/dist/main.js"]
```

### Dockerfile Optimisé (Multi-Service)

Pour optimiser les builds Docker en monorepo, créez un Dockerfile.base :

#### Dockerfile.base (racine)

```dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy all package.json files
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps ./apps

# Build all packages
RUN pnpm --filter "@app/*" build
```

#### apps/api-gateway/Dockerfile (utilisant base)

```dockerfile
ARG SERVICE_NAME=api-gateway

# Use base image
FROM docker-registry.local/chat-base:latest AS builder

# Build specific service
RUN pnpm --filter ${SERVICE_NAME} build

# Production stage
FROM node:22-alpine

ARG SERVICE_NAME=api-gateway
ENV SERVICE_NAME=${SERVICE_NAME}

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

WORKDIR /app

# Copy workspace config
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy package.json files
COPY --from=builder /app/apps/${SERVICE_NAME}/package.json ./apps/${SERVICE_NAME}/
COPY --from=builder /app/packages/*/package.json ./packages/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./apps/${SERVICE_NAME}/dist
COPY --from=builder /app/packages/*/dist ./packages/

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD node apps/${SERVICE_NAME}/dist/main.js
```

### .dockerignore (racine)

```
node_modules
dist
coverage
.git
.env
.env.*
*.log
npm-debug.log*
.DS_Store
.vscode
.idea
README.md
docker-compose*.yml
*.md
test
**/*.spec.ts
**/*.test.ts
.github
```

---

## 📊 Monitoring & Métriques

### Prometheus Metrics dans NestJS

Installez `@willsoto/nestjs-prometheus`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
  ],
})
export class AppModule {}
```

### Custom Metrics

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('messages_sent_total')
    private readonly messageCounter: Counter,

    @InjectMetric('message_processing_duration_seconds')
    private readonly messageHistogram: Histogram,
  ) {}

  incrementMessagesSent(roomId: string) {
    this.messageCounter.inc({ room_id: roomId });
  }

  recordMessageProcessingTime(duration: number) {
    this.messageHistogram.observe(duration);
  }
}
```

---

## 🔐 Sécurité

### Best Practices Implémentées

1. **Authentication JWT** avec rotation de tokens
2. **Rate Limiting** via Traefik et NestJS throttler
3. **Validation des données** avec class-validator
4. **Helmet** pour les headers de sécurité
5. **CORS** configuré strictement
6. **Secrets** via variables d'environnement
7. **Non-root user** dans les containers Docker
8. **Health checks** pour tous les services

### Variables Sensibles

```bash
# NE JAMAIS commit ces valeurs en production
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
```

---

## 🧪 Tests

### Structure des Tests

```
apps/api-gateway/
├── test/
│   ├── app.e2e-spec.ts
│   └── auth.e2e-spec.ts
└── src/
    └── auth/
        ├── auth.service.spec.ts
        └── auth.controller.spec.ts
```

### Commandes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## 📈 Performance

### Optimisations Recommandées

1. **Connection pooling** pour PostgreSQL (max 20 connexions)
2. **Redis caching** pour les requêtes fréquentes
3. **Compression** via Traefik middleware
4. **Lazy loading** des modules NestJS
5. **Clustering** avec PM2 en production

### Benchmarks Attendus

- Latence WebSocket: < 50ms
- Throughput messages: > 10,000 msg/s
- Connexions simultanées: > 50,000

---

## 🚀 Déploiement Production

### Checklist Pré-Production

- [ ] Tous les secrets générés et sécurisés
- [ ] Variables d'environnement configurées
- [ ] SSL/TLS configuré (Let's Encrypt)
- [ ] Logs centralisés (ELK ou Loki)
- [ ] Alerting configuré (AlertManager)
- [ ] Backups automatisés (PostgreSQL)
- [ ] Rate limiting activé
- [ ] Monitoring actif (Grafana dashboards)
- [ ] Documentation API (Swagger)
- [ ] Tests E2E passants
- [ ] pnpm lockfile committé
- [ ] Turbo cache configuré pour CI/CD
- [ ] Docker images optimisées (multi-stage builds)
- [ ] Health checks configurés pour tous les services

### Build de Production

```bash
# 1. Installer les dépendances (production uniquement)
pnpm install --prod --frozen-lockfile

# 2. Build optimisé avec Turbo
NODE_ENV=production pnpm run build

# 3. Build Docker images (Optimisé avec Bake)
pnpm docker:bake

# 4. Push vers registry
# Note: Bake peut aussi gérer le push automatiquement avec --push
docker buildx bake --push
```

### 🚀 Optimisation des Builds (Docker Bake)

Pour accélérer les builds, nous utilisons **Docker BuildKit** et **Docker Bake**. Cela permet de builder tous les microservices en parallèle de manière extrêmement efficace.

**Avantages :**

- **Parallélisation maximale** : Tous les services sont buildés simultanément.
- **Cache intelligent** : Partage de cache optimal entre les services du monorepo.
- **Définition déclarative** : Configuration centralisée dans `docker-bake.hcl`.

**Utilisation :**

```bash
# Build local de tous les services
pnpm docker:bake
```

### CI/CD Pipeline (GitHub Actions)

Nous utilisons GitHub Actions pour automatiser les tests et les builds Docker. Le workflow tire parti de **Docker Bake** et du cache GitHub Actions pour des performances optimales.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.27.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build images (Docker Bake)
        run: |
          pnpm docker:bake \
            --set "*.cache-from=type=gha" \
            --set "*.cache-to=type=gha,mode=max"
```

### Scaling Horizontal

```bash
# Scale un service spécifique
docker-compose up -d --scale websocket-gateway=3 --scale chat-service=2

# Traefik gérera automatiquement le load balancing
```

### Monitoring du Monorepo en Production

```bash
# Vérifier la taille des bundles
pnpm exec node --max-old-space-size=4096 node_modules/.bin/webpack-bundle-analyzer apps/*/dist/stats.json

# Analyser les dépendances
pnpm list --depth=0
pnpm list --prod --depth=0  # Production uniquement

# Trouver les packages dupliqués
pnpm dedupe --check
pnpm dedupe  # Optimiser

# Audit de sécurité
pnpm audit
pnpm audit --fix
```

---

## 📚 Ressources

### Documentation Officielle

- [NestJS](https://docs.nestjs.com/)
- [pnpm](https://pnpm.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo/docs)
- [Socket.IO](https://socket.io/docs/)
- [NATS](https://docs.nats.io/)
- [Traefik](https://doc.traefik.io/traefik/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)

### Tutoriels & Articles

#### Monorepo & pnpm

- [Why pnpm?](https://pnpm.io/motivation)
- [Monorepo best practices](https://monorepo.tools/)
- [NestJS Monorepo setup](https://docs.nestjs.com/cli/monorepo)
- [pnpm workspace protocol](https://pnpm.io/workspaces#workspace-protocol-workspace)

#### Microservices NestJS

- [NestJS Microservices patterns](https://docs.nestjs.com/microservices/basics)
- [NATS with NestJS](https://docs.nestjs.com/microservices/nats)
- [Building scalable chat applications](https://socket.io/get-started/chat)

#### Performance & Scalability

- [WebSocket scaling strategies](https://socket.io/docs/v4/using-multiple-nodes/)
- [Redis Pub/Sub patterns](https://redis.io/docs/manual/pubsub/)
- [Distributed tracing with OpenTelemetry](https://opentelemetry.io/docs/)

### Outils Recommandés

- **VS Code Extensions**:
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [NestJS Files](https://marketplace.visualstudio.com/items?itemName=AbhijoyBasak.nestjs-files)
  - [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- **CLI Tools**:
  - [NestJS CLI](https://docs.nestjs.com/cli/overview)
  - [pnpm dlx](https://pnpm.io/cli/dlx) - Run packages without installing
  - [turbo](https://turbo.build/repo/docs/installing) - Build system

### Exemples de Projets

- [NestJS Realtime Chat (Official)](https://github.com/nestjs/nest/tree/master/sample)
- [pnpm Monorepo Examples](https://github.com/pnpm/pnpm/tree/main/workspace)
- [Turborepo Examples](https://github.com/vercel/turbo/tree/main/examples)

---

## 🤝 Contribution

### Workflow Git avec Monorepo

```bash
# Feature branch
git checkout -b feature/new-feature

# Travailler sur plusieurs packages
cd packages/common
# ... modifications ...

cd ../../apps/api-gateway
# ... modifications ...

# Commit avec conventional commits
git add .
git commit -m "feat(common,api): add message reactions feature"

# Push et créer une PR
git push origin feature/new-feature
```

### Standards de Code

- **ESLint** + **Prettier** configurés à la racine
- **Husky** pour pre-commit hooks
- **lint-staged** pour linter uniquement les fichiers modifiés
- **Conventional Commits** obligatoire
- Tests obligatoires pour nouvelles features

### Pre-commit Hook (.husky/pre-commit)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged
pnpm exec lint-staged

# Run type check
pnpm run build

# Run tests on changed files
pnpm run test --findRelatedTests
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore
**Scopes**: api-gateway, websocket, chat-service, presence, common, logger, etc.

**Exemples**:

```
feat(api): add user authentication endpoint
fix(websocket): resolve memory leak in socket connections
docs(readme): update installation instructions
refactor(common): simplify logging interceptor
test(chat): add unit tests for message service
```

---

## 🔧 Troubleshooting

### Problèmes Courants avec pnpm

#### "Cannot find module '@app/common'"

**Cause**: Path mappings TypeScript non résolus ou package non buildé

**Solution**:

```bash
# 1. Rebuild les packages partagés
pnpm --filter "@app/*" build

# 2. Vérifier tsconfig.base.json paths
# 3. Redémarrer TypeScript server dans VS Code (Cmd+Shift+P > "Restart TS Server")

# 4. Si le problème persiste, nettoyer et réinstaller
pnpm run clean
pnpm install
pnpm run build
```

#### "ENOENT: no such file or directory"

**Cause**: node_modules non synchronisés ou corruption du store pnpm

**Solution**:

```bash
# Nettoyer le store pnpm
pnpm store prune

# Supprimer node_modules et réinstaller
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install --frozen-lockfile
```

#### Versions de packages en conflit

**Cause**: Dépendances incompatibles entre workspaces

**Solution**:

```bash
# Lister toutes les versions d'un package
pnpm list <package-name>

# Forcer une version spécifique dans package.json racine
{
  "pnpm": {
    "overrides": {
      "problematic-package": "^1.2.3"
    }
  }
}

# Réinstaller
pnpm install
```

#### Build lent ou pas de cache Turbo

**Solution**:

```bash
# Vérifier la config Turbo
cat turbo.json

# Nettoyer le cache Turbo
rm -rf .turbo
turbo run build --force

# Vérifier les outputs dans turbo.json
# Assurez-vous que "outputs" pointe vers les bons dossiers
```

### Problèmes Docker

#### Container ne démarre pas

```bash
# Voir les logs détaillés
docker-compose logs <service-name>

# Reconstruire l'image from scratch
docker-compose build --no-cache <service-name>

# Vérifier les health checks
docker inspect <container-name> | grep -A 10 Health
```

#### "Error: Cannot find module" dans Docker

**Cause**: Build incomplet ou copie incorrecte des fichiers

**Solution**:

```dockerfile
# Vérifier que vous copiez TOUS les packages buildés
COPY --from=builder /app/packages/*/dist ./packages/

# ET les node_modules de production
RUN pnpm install --prod --frozen-lockfile
```

#### Volumes Docker non synchronisés

```bash
# Supprimer tous les volumes
docker-compose down -v

# Recréer proprement
docker-compose up -d
```

### Problèmes NestJS / Microservices

#### NATS connection timeout

```bash
# Vérifier que NATS est accessible
docker-compose ps nats

# Tester la connexion
telnet localhost 4222

# Vérifier les logs NATS
docker-compose logs nats

# Solution: Augmenter le timeout dans la config
{
  transport: Transport.NATS,
  options: {
    servers: ['nats://nats:4222'],
    timeout: 5000,  // Augmenter si nécessaire
  }
}
```

#### WebSocket déconnexions fréquentes

**Causes possibles**:

1. Sticky sessions non configurées dans Traefik
2. Redis Adapter mal configuré
3. Timeouts trop courts

**Solutions**:

```yaml
# docker-compose.yml - Traefik labels
labels:
  - 'traefik.http.services.websocket.loadbalancer.sticky.cookie=true'
  - 'traefik.http.services.websocket.loadbalancer.sticky.cookie.name=io'
```

```typescript
// WebSocket Gateway - Augmenter les timeouts
@WebSocketGateway({
  pingTimeout: 60000,
  pingInterval: 25000,
})
```

#### TypeORM migrations échouent

```bash
# Générer une nouvelle migration
pnpm --filter chat-service exec typeorm migration:generate -n MigrationName

# Exécuter manuellement
pnpm --filter chat-service exec typeorm migration:run

# Vérifier la connexion DB
docker-compose exec postgres psql -U chatuser -d chatdb -c "SELECT version();"
```

### Performance Issues

#### Build très lent

```bash
# Activer le cache Turbo (si pas déjà fait)
pnpm add -D turbo -w

# Utiliser des filtres pour build incrémental
pnpm --filter "[origin/main]" build

# Paralléliser les builds
turbo run build --parallel

# Vérifier les bottlenecks
turbo run build --profile=profile.json
```

#### Hot reload lent en dev

```typescript
// nest-cli.json - Activer les builders rapides
{
  "compilerOptions": {
    "webpack": true,
    "webpackConfigPath": "webpack.config.js"
  }
}

// Ou utiliser swc (plus rapide que tsc)
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

### Debugging Tips

#### Activer les logs détaillés

```bash
# pnpm
pnpm install --loglevel debug

# NestJS
DEBUG=* pnpm run dev:api

# Docker
docker-compose --verbose up

# NATS
nats-server -D  # Debug mode
```

#### Profiling d'une app NestJS

```bash
# Lancer avec profiler Node.js
node --inspect apps/api-gateway/dist/main.js

# Ouvrir chrome://inspect dans Chrome
# Cliquer sur "inspect" sous votre app
```

#### Memory leaks

```typescript
// Utiliser clinic.js
pnpm add -D clinic

// package.json
{
  "scripts": {
    "clinic:doctor": "clinic doctor -- node dist/main.js",
    "clinic:flame": "clinic flame -- node dist/main.js"
  }
}
```

---

## 📞 Support

Pour toute question ou problème:

1. **Vérifier d'abord les logs**: `docker-compose logs -f` ou `pnpm run dev`
2. **Vérifier le health des services**: `docker-compose ps`
3. **Consulter Grafana pour les métriques**: http://localhost:3002
4. **Consulter cette section troubleshooting** ☝️
5. **Vérifier les issues GitHub** du projet
6. **Ouvrir une issue** avec:
   - Commande exécutée
   - Logs complets
   - Versions (node, pnpm, docker)
   - OS

### Commandes de diagnostic rapide

````bash
# Santé complète du système
./scripts/health-check.sh

# Ou manuellement
echo "=== Node & pnpm ==="
node --version
pnpm --version

echo "=== Docker ==="
docker --version
docker-compose ps

echo "=== Services Status ==="
curl -s http://localhost:3000/health | jq
curl -s http://localhost:3001/health | jq

echo "=== Database ==="
docker-compose exec postgres pg_isready -U chatuser

echo "=== Redis ==="
docker-compose exec redis redis-cli ping

echo "=== NATS ==="
curl -s http://localhost:8222/varz | jq '.version'


---

**Version**: 2.0.0 (pnpm Monorepo Edition)
**Dernière mise à jour**: 2026-01-09
**Architecture**: NestJS Microservices + pnpm Workspaces + Turborepo
**Maintenu par**: Votre équipe

---

## 📋 Quick Reference Card

### Installation Rapide
```bash
git clone <repo> && cd chat-microservices
corepack enable && pnpm install
pnpm run build
docker-compose up -d
````

### Commandes Essentielles

```bash
pnpm run dev              # Dev tous services
pnpm run build            # Build avec Turbo
pnpm run test             # Tests
pnpm run docker:up        # Lancer Docker
pnpm --filter api-gateway <cmd>  # Commande spécifique
```

### Ports Importants

- API Gateway: 3000
- WebSocket: 3001
- PostgreSQL: 5432
- Redis: 6379
- NATS: 4222
- Traefik Dashboard: 8080
- Prometheus: 9090
- Grafana: 3002

### Structure des Imports

```typescript
import { Logger } from '@app/logger';
import { MESSAGE_PATTERNS } from '@app/common';
import { DatabaseModule } from '@app/database';
```
