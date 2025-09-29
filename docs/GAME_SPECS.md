# Empires Game - Feature Specifications

## Game Overview
A browser-based empire building strategy game inspired by Travian, built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Core Features

### 🏛️ **Village System**
- **Village Management**: Players can own multiple villages across the world map
- **Coordinate System**: World spans from -400 to +400 (801x801 grid)
- **Village Founding**: Interactive world map for selecting and founding new villages
- **Population System**: Villages start with ~87 population
- **Capital System**: First village becomes the capital with special status

### 🗺️ **World Map & Terrain**
- **Interactive Map**: 800x800px viewport with dragging/panning controls
- **Terrain Types**:
  - **Grassland** (default) - Light green, buildable
  - **Forest** - Dark green, +25% wood production, buildable
  - **Mountains** - Gray-brown, +50% iron production, NOT buildable
  - **Water/Rivers** - Blue, NOT buildable
  - **Desert** - Tan/sandy, +25% clay production, buildable
  - **Garden Oases** - Bright green, +100% crop & +50% wood production, buildable
  - **Indigenous Territory** - Brown, NOT buildable (NPC areas)
- **Procedural Generation**: 100x100 templates with rivers, mountain ranges, forests, deserts
- **Building Restrictions**: Terrain affects where villages can be founded
- **Resource Bonuses**: Different terrain provides production bonuses

### 👥 **User & Authentication System**
- **Supabase Auth**: Email/password authentication
- **User Profiles**: Username system with profile management
- **Row Level Security**: Secure data access with RLS policies

### 🏗️ **Building System** (Database Ready)
- **Building Positions**: 18 building slots per village (1-18)
- **Building Types**: Configurable building system
- **Building Levels**: Upgradeable structures with level constraints
- **Village Layout**: Position-based building placement

### 🌾 **Resource System** (Database Ready)
- **Resource Fields**: 18 field positions around each village
- **Resource Types**: Wood, Clay, Iron, Crop
- **Field Levels**: Upgradeable resource production fields
- **Terrain Bonuses**: Production affected by underlying terrain

## Technical Architecture

### 🛠️ **Technology Stack**
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Vercel (ready for deployment)

### 📊 **Database Schema**
- **villages**: Core village data with coordinates, population, resources
- **buildings**: Village structures with type, level, position
- **resource_fields**: Resource production fields around villages
- **User profiles**: Extended user information
- **RLS Policies**: Secure multi-tenant data access

### 🔗 **API Endpoints**
- **GET /api/world**: Fetch villages within coordinate bounds
- **POST /api/world**: Create new villages with validation
- **Coordinate Validation**: World bounds checking (-400 to +400)
- **Occupation Checking**: Prevent villages on same coordinates

## User Interface

### 🎨 **Design System**
- **Color Scheme**: Medieval-inspired browns, yellows, and earth tones
- **Responsive Design**: Mobile-friendly layout
- **Interactive Elements**: Hover effects, smooth transitions
- **Accessibility**: Proper contrast and navigation

### 🖱️ **User Experience**
- **Modal System**: Overlay dialogs for world map and actions
- **Navigation**: Intuitive menu system and breadcrumbs
- **Real-time Updates**: Dynamic village display and coordinate selection
- **Quick Navigation**: Jump to center (0,0) or player villages

## Game Mechanics

### ⚡ **Gameplay Features**
- **Multi-Village Management**: Scale from single village to empire
- **Strategic Positioning**: Terrain-based village placement decisions
- **Resource Production**: Terrain and building-based economy
- **Coordinate Strategy**: Location matters for expansion and defense

### 🎯 **Future Expansion Ready**
- **Alliance System**: Database structure supports player alliances
- **Combat System**: Village raiding and defense mechanisms
- **Trade System**: Resource exchange between players
- **Technology Tree**: Research and advancement system
- **Artifacts**: Special items and bonuses
- **Events**: Seasonal events and competitions

## Development Status

### ✅ **Completed Features**
- User authentication and profiles
- Interactive world map with terrain
- Village founding system
- Database schema and migrations
- API endpoints for world interaction
- Responsive UI components
- Terrain generation and visualization

### 🚧 **In Progress**
- Building construction interface
- Resource production calculations
- Village detail management

### 📋 **Planned Features**
- Combat and raiding system
- Alliance management
- Market and trading
- Technology research
- Mobile app version

## Performance & Scalability

### 🚀 **Optimizations**
- **Efficient Rendering**: Only render visible map areas
- **Database Indexing**: Optimized queries for coordinate lookups
- **Caching Strategy**: Template-based terrain generation
- **Lazy Loading**: On-demand resource loading

### 📈 **Scalability Considerations**
- **Multi-tenant Architecture**: RLS-based data isolation
- **Horizontal Scaling**: Stateless API design
- **Database Optimization**: Efficient indexing and constraints
- **CDN Ready**: Static asset optimization