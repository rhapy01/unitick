# UniTick Project Structure

This document outlines the standardized project structure for UniTick.

## 📁 Directory Structure

```
unitick/
├── 📁 app/                     # Next.js App Router
│   ├── 📁 api/                 # API Routes
│   ├── 📁 auth/                # Authentication pages
│   ├── 📁 vendor/               # Vendor dashboard
│   ├── 📁 admin/                # Admin panel
│   └── 📄 ...                   # Other pages
├── 📁 components/               # React Components
│   ├── 📁 ui/                   # Reusable UI components
│   ├── 📁 notifications/        # Notification components
│   ├── 📁 shop/                 # Shop-specific components
│   └── 📄 ...                   # Feature components
├── 📁 lib/                      # Utility Libraries
│   ├── 📁 supabase/             # Supabase client
│   ├── 📄 wallet-secure.ts      # Secure wallet management
│   ├── 📄 contract-client.ts    # Blockchain interactions
│   └── 📄 ...                   # Other utilities
├── 📁 contracts/               # Smart Contracts
│   ├── 📄 UniTick.sol           # ERC-20 token contract
│   ├── 📄 UnilaBook.sol         # Main booking contract
│   ├── 📁 artifacts/             # Compiled contracts
│   └── 📁 build-info/           # Build metadata
├── 📁 database/                 # Database Scripts
│   └── 📄 *.sql                 # Migration scripts
├── 📁 scripts/                  # Utility Scripts
│   ├── 📁 sql/                  # SQL scripts
│   ├── 📁 js/                   # JavaScript utilities
│   └── 📁 setup/                # Setup scripts
├── 📁 docs/                     # Documentation
│   └── 📄 *.md                  # Project documentation
├── 📁 supabase/                 # Supabase Configuration
│   ├── 📁 functions/            # Edge functions
│   └── 📄 cron.yaml             # Scheduled tasks
├── 📁 public/                   # Static Assets
│   └── 📄 *.png, *.svg          # Images and icons
├── 📁 hooks/                    # Custom React Hooks
├── 📁 styles/                   # Global Styles
├── 📄 README.md                 # Project documentation
├── 📄 CONTRIBUTING.md           # Contribution guidelines
├── 📄 LICENSE                   # MIT License
├── 📄 .gitignore               # Git ignore rules
├── 📄 package.json             # Dependencies and scripts
├── 📄 next.config.mjs          # Next.js configuration
├── 📄 tailwind.config.js       # Tailwind CSS configuration
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 hardhat.config.js        # Hardhat configuration
└── 📄 vercel.json              # Vercel deployment config
```

## 🏷️ File Organization Rules

### Documentation Files
- All `.md` files → `docs/` directory
- Keep `README.md` and `CONTRIBUTING.md` in root
- Technical documentation in `docs/`

### Database Files
- All `.sql` files → `database/` directory
- Migration scripts organized by date/version
- Setup scripts in `scripts/sql/`

### Scripts
- JavaScript utilities → `scripts/js/`
- SQL scripts → `scripts/sql/`
- Setup scripts → `scripts/setup/`

### Smart Contracts
- Solidity files → `contracts/` directory
- Compiled artifacts → `contracts/artifacts/`
- Build info → `contracts/build-info/`

### Configuration Files
- Keep in root directory
- Environment template → `env.example`
- Never commit actual `.env` files

## 🔧 Import Path Standards

### Absolute Imports
```typescript
// Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Utilities
import { createClient } from '@/lib/supabase/client'
import { getSecureWalletForUser } from '@/lib/wallet-secure'

// Types
import { Order, Booking } from '@/lib/types'

// Constants
import { CONTRACT_ADDRESSES } from '@/lib/addresses'
```

### Relative Imports
```typescript
// Within same directory
import { Header } from './header'
import { Footer } from './footer'

// Parent directory
import { utils } from '../utils'
```

## 📋 Naming Conventions

### Files and Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: kebab-case (`user-profile/page.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Variables and Functions
- **Variables**: camelCase (`userName`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)

## 🚀 Deployment Structure

### Production Build
```
.next/                    # Next.js build output
out/                      # Static export (if used)
node_modules/             # Dependencies
public/                   # Static assets
```

### Environment Files
```
.env.local               # Local development
.env.production          # Production (not committed)
env.example              # Template (committed)
```

## 🔍 Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/component-name` - Code refactoring

### Commit Messages
```
feat(auth): add OAuth login support
fix(wallet): resolve encryption key generation issue
docs(readme): update installation instructions
test(api): add unit tests for payment verification
```

## 📊 Monitoring and Analytics

### Logging
- Use structured logging
- Include request IDs
- Log errors with context
- Avoid logging sensitive data

### Performance
- Monitor Core Web Vitals
- Track API response times
- Monitor database query performance
- Track user engagement metrics

---

This structure ensures maintainability, scalability, and ease of collaboration for the UniTick project.
