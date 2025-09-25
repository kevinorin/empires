# Empires Game Development Notes

## 🚀 Development Milestones

### 2025-01-25 - Project Foundation
- ✅ **Repository Setup**: Created GitHub repo and cloned locally
- ✅ **Supabase Configuration**: Database configured with credentials
- ✅ **Project Structure**: Monorepo with Turbo, packages structure
- ✅ **Database Schema**: Master SQL schema created for scalable game mechanics
- ✅ **Game Engine**: Core constants and calculations for Travian-style gameplay

### Technology Stack Decisions
- **Frontend**: Next.js 14 + Expo Router (Universal App for Web/iOS/Android)
- **Backend**: Node.js + Fastify + PostgreSQL
- **Database**: Supabase (PostgreSQL with real-time features)
- **Payments**: BTC/ETH only (no Stripe complexity)
- **Real-time**: Socket.io for live game updates
- **Monorepo**: Turbo for package management

### MVP Focus (High-DAU Strategy)
**Core Engagement Features:**
- Instant gratification (2-minute tutorial hook)
- Real-time leaderboards and competition
- Social features (alliances, chat, player feed)
- Viral growth mechanics (referrals, sharing)
- Retention hooks (daily bonuses, events, FOMO)

**Target Metrics:**
- Month 1: 10K+ registered, 1.5K DAU, $5K revenue
- Month 3: 50K+ registered, 7.5K DAU, $25K revenue  
- Month 6: 200K+ registered, 30K DAU, $100K revenue

### Architecture Highlights
- **Single World Server**: Unified player experience with lore for expansion
- **UUID Primary Keys**: Better performance for 50K+ concurrent players
- **Row Level Security**: Multi-tenant security with Supabase auth
- **Real-time Events**: Game mechanics processed via event system
- **JSONB Storage**: Flexible data for battle reports and configurations

### Development Timeline (AI-Accelerated)
- **Week 1-2**: Foundation & database schema ✅
- **Week 3-4**: Core gameplay (villages, buildings, units)
- **Week 5-6**: Social features (alliances, chat, leaderboards)
- **Week 7-8**: Monetization & mobile optimization
- **Week 9-10**: Beta testing & launch preparation

---

*Updated: 2025-01-25*