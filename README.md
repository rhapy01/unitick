# UniTick - Multi-Vendor Crypto Ticketing Platform

> **One Cart, One Payment, Multi-Vendor** • **One Ticket, Proof Everything**

UniTick is a revolutionary blockchain-based ticketing platform that solves the complexity of multi-vendor bookings by allowing users to purchase tickets from multiple service providers in a single transaction, with one unified ticket serving as proof for all bookings.

## 🚀 Key Features

### Core Innovation
- **Multi-Vendor Booking**: Book services from different vendors in one cart
- **Single Payment**: Pay once for all services across multiple vendors
- **Unified Tickets**: One NFT ticket serves as proof for all bookings
- **Internal Wallet System**: Secure, encrypted wallet management
- **Gift Tickets**: Send tickets as gifts with recipient information

### Vendor Requirements
- **External Wallet Recommended**: Use MetaMask, Trust Wallet, etc. for receiving payments
- **Wallet Whitelist**: All vendor wallet addresses must be whitelisted to receive payments
- **Business Verification**: Vendors must complete verification process
- **Formspree Application**: Submit whitelist application form with business details
- **Smart Contract Compliance**: Only whitelisted addresses can receive funds
- **Status Tracking**: Real-time whitelist status monitoring

### Technical Features
- **Blockchain Integration**: Ethereum-based smart contracts
- **NFT Tickets**: Unique, verifiable digital tickets
- **Real-time Notifications**: Email and push notifications
- **QR Code Verification**: Instant ticket validation
- **PDF Tickets**: Professional downloadable tickets
- **Vendor Dashboard**: Complete management interface
- **Admin Panel**: Platform administration tools
- **Vendor Whitelist System**: Secure payment address management

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React PDF** for ticket generation
- **QR Code** integration

### Backend
- **Supabase** for authentication and database
- **PostgreSQL** database
- **Edge Functions** for serverless logic
- **Real-time subscriptions**

### Blockchain
- **Ethereum** smart contracts
- **Viem** for contract interactions
- **Hardhat** for development
- **OpenZeppelin** standards

## 📁 Project Structure

```
unitick/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── vendor/            # Vendor dashboard
│   └── ...                # Other pages
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── notifications/     # Notification components
│   └── ...                # Feature components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client
│   ├── wallet-secure.ts   # Secure wallet management
│   └── ...                # Other utilities
├── contracts/             # Smart contracts
│   ├── UniTick.sol        # ERC-20 token contract
│   ├── UnilaBook.sol      # Main booking contract
│   └── artifacts/         # Compiled contracts
├── database/              # Database scripts
│   └── *.sql              # Migration scripts
├── scripts/               # Utility scripts
│   ├── sql/               # SQL scripts
│   ├── js/                # JavaScript utilities
│   └── setup/             # Setup scripts
├── docs/                  # Documentation
│   └── *.md               # Project documentation
└── supabase/              # Supabase configuration
    ├── functions/         # Edge functions
    └── cron.yaml          # Scheduled tasks
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
- Ethereum wallet (for contract deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unitick.git
   cd unitick
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS=your_token_contract
   NEXT_PUBLIC_UNILABOOK_CONTRACT_ADDRESS=your_booking_contract
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   psql -f database/schema.sql
   ```

5. **Deploy smart contracts**
   ```bash
   npx hardhat compile
   npx hardhat deploy --network your_network
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations from `database/` folder
3. Set up Row Level Security (RLS) policies
4. Configure authentication providers

### Smart Contract Deployment
1. Update contract addresses in `lib/addresses.ts`
2. Deploy contracts to your target network
3. Update environment variables with new addresses

### Email Configuration
1. Set up Supabase email templates
2. Configure SMTP settings in Supabase dashboard
3. Test email notifications

## 📚 Documentation

- [Database Schema](docs/database-schema.md)
- [API Documentation](docs/api.md)
- [Smart Contract Documentation](docs/contracts.md)
- [Security Audit Report](docs/SECURITY_AUDIT_REPORT.md)
- [Wallet Security](docs/WALLET_SECURITY_DOCUMENTATION.md)

## 🧪 Testing

### Run Tests
```bash
# Unit tests
pnpm test

# Contract tests
npx hardhat test

# E2E tests
pnpm test:e2e
```

### Test Coverage
```bash
pnpm test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🔒 Security

### Wallet Security
- AES-256-GCM encryption for private keys
- PBKDF2 key derivation (100,000 iterations)
- Separate IVs for each encryption operation
- Secure random wallet generation

### Smart Contract Security
- OpenZeppelin standards
- Comprehensive access controls
- Reentrancy protection
- Input validation

### Application Security
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs/](docs/) folder
- **Issues**: Report bugs via [GitHub Issues](https://github.com/yourusername/unitick/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/yourusername/unitick/discussions)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for backend infrastructure
- [OpenZeppelin](https://openzeppelin.com/) for smart contract standards
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Viem](https://viem.sh/) for Ethereum interactions

---

**Built with ❤️ for the future of ticketing**
