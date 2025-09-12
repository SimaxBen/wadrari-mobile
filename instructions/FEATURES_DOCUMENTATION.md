# WADRARI - Gaming & Social Platform Documentation

## 🏗️ Project Overview

**WADRARI** is a comprehensive gaming and social platform featuring **React Web App** and **React Native Mobile App**. The platform combines real-time chat, social stories, and an advanced Clash Royale-inspired gamification system with multiple reward currencies, leaderboards, and quest mechanics.

## 🎮 Core Features

### 1. Authentication System
**Platforms**: Mobile

#### Web Authentication (MCP-based)
- **Registration**: Username, password, display name, avatar upload
- **Login**: Username/password with secure session management
- **Session Persistence**: Local storage with automatic refresh
- **Password Security**: Custom hashing algorithm
- **User Management**: Profile updates, logout functionality

#### Mobile Authentication (Supabase-based)
- **Direct Database Access**: Real-time Supabase integration
- **Password Hashing**: Base64 encoding with salt ("password + 'salt'")
- **Session Management**: Secure storage with Expo SecureStore
- **Error Handling**: Comprehensive error boundaries and fallbacks

#### Features:
- ✅ Secure password hashing
- ✅ User profile management
- ✅ Session persistence
- ✅ Error handling & validation
- ✅ Demo account support

### 2. Real-Time Chat System
**Platforms**: Mobile

#### Chat Features
- **Live Messaging**: Real-time message delivery and updates
- **Message History**: Persistent chat storage with full history
- **User Interface**: Mobile-optimized message bubbles and design
- **Auto-scroll**: Automatic scrolling to latest messages
- **User Identification**: Clear sender identification with usernames

#### Features:
- ✅ Real-time messaging
- ✅ Message persistence
- ✅ User identification
- ✅ Mobile-optimized UI

### 3. Social Stories System
**Platforms**: Mobile

#### Story Features
- **Image Upload**: Camera integration and gallery selection
- **Story Feed**: Timeline-style browsing with user stories
- **Story Actions**: Like, comment, and share functionality
- **Image Processing**: Automatic optimization and display

#### Features:
- ✅ Image upload (camera/gallery)
- ✅ Story timeline feed
- ✅ User interaction system
- ✅ Mobile camera integration

### 4. 🎮 Clash Royale-Inspired Reward System
**Platforms**: Mobile

The reward system is the core gamification feature, inspired by Clash Royale's progression mechanics. It features multiple currencies, seasonal competitions, and achievement-based progression.

#### 🏆 Currency System

**1. Trophies (Main Currency)**
- **Purpose**: Primary competitive ranking and progression metric
- **Earning Methods**:
  - Sending chat messages: +2 trophies per message
  - Posting stories: +5 trophies per story
  - Completing daily quests: +10-50 trophies
  - Completing weekly quests: +25-100 trophies
  - Special event participation: +15-75 trophies
- **Usage**: Leaderboard ranking, unlock new features, seasonal rewards
- **Display**: Real-time counter in profile, prominent in leaderboards

**2. Experience Points (XP)**
- **Purpose**: Character level progression and skill development
- **Earning Methods**:
  - Chat activity: +5 XP per message
  - Story engagement: +10 XP per story posted
  - Quest completion: +25-150 XP based on difficulty
  - Daily login: +20 XP
  - Profile updates: +15 XP
- **Level Calculation**: Level = Floor(XP / 1000) + 1
- **Benefits**: Unlock advanced features, higher quest rewards, special badges

**3. Coins (In-App Currency)**
- **Purpose**: Virtual economy for in-app purchases and upgrades
- **Earning Methods**:
  - Quest rewards: +50-500 coins
  - Daily bonuses: +100 coins
  - Achievement unlocks: +200-1000 coins
  - Seasonal rewards: +500-2500 coins
- **Usage**: Profile customization, special quest access, premium features
- **Economy**: Balanced inflation prevention with spending sinks

**4. Gems (Premium Currency)**
- **Purpose**: Rare rewards and exclusive content access
- **Earning Methods**:
  - Hard quest completion: +1-5 gems
  - Weekly challenges: +3-10 gems
  - Seasonal achievements: +5-25 gems
  - Special events: +2-15 gems
- **Usage**: Exclusive avatars, premium quest creation, advanced customization
- **Rarity**: Limited earning opportunities to maintain value

#### 🌟 Seasonal System

**Season Structure**
- **Duration**: month competitive seasons
- **Reset Mechanism**: Seasonal trophies reset, main trophies persist
- **Seasonal Trophies**: Separate ranking for fair competition
- **Season Themes**: Unique rewards and challenges each season

**Seasonal Rewards**
- **Legendary Tier** (Top 1%): 300 trophies, 1000 coins, 25 gems, legendary badge
- **Epic Tier** (Top 5%): 200 trophies, 750 coins, 15 gems, epic badge
- **Rare Tier** (Top 15%): 100 trophies, 500 coins, 10 gems, rare badge
- **Common Tier** (Top 50%): 50 trophies, 250 coins, 5 gems, participation badge

#### 🏅 Achievement & Badge System

**Badge Categories**
- **Social Badges**: "Chatmaster" (1000 messages), "Storyteller" (100 stories)
- **Achievement Badges**: "Quest Conqueror" (50 quests), "Streak Master" (30-day streak)
- **Seasonal Badges**: Season-specific rewards for top performers
- **Special Badges**: Event participation, community contributions

**Achievement Tracking**
- **Progress Bars**: Visual progression indicators
- **Milestone Rewards**: Trophies, XP, coins, and gems at achievement levels
- **Collection Display**: Profile showcase of all earned badges
- **Rarity System**: Common, rare, epic, legendary badge tiers

#### 📈 Progression Mechanics

**Daily Streaks**
- **Streak Tracking**: Consecutive day login and activity tracking
- **Streak Rewards**: Increasing daily bonuses (5-50 trophies per day)
- **Streak Multipliers**: 2x rewards at 7 days, 3x at 30 days
- **Streak Recovery**: Grace period for missed days

**Level Progression**
- **XP Requirements**: Increasing XP needed per level (Level * 1000)
- **Level Benefits**: Higher quest rewards, exclusive content access
- **Prestige System**: Special recognition for high-level players
- **Level Display**: Prominent level indicators throughout the app

#### ⚡ Reward Distribution

**Quest Reward Scaling**
- **Easy Quests**: 10-25 trophies, 25-50 XP, 50-100 coins
- **Medium Quests**: 25-50 trophies, 50-100 XP, 100-300 coins, 1-2 gems
- **Hard Quests**: 50-100 trophies, 100-200 XP, 300-500 coins, 2-5 gems

**Activity-Based Rewards**
- **Chat Messages**: Immediate +2 trophies, +5 XP
- **Story Posts**: Immediate +5 trophies, +10 XP
- **Profile Updates**: +15 XP, +2 trophies
- **Daily Login**: +20 XP, streak bonus

**Balanced Economy**
- **Inflation Control**: Spending sinks for all currencies
- **Reward Scaling**: Higher rewards for continued engagement
- **Fair Distribution**: Multiple earning paths for all player types
- **Competitive Balance**: Seasonal resets prevent permanent advantages

#### Features:
- ✅ Four-currency reward system (Trophies, XP, Coins, Gems)
- ✅ Seasonal competitive rankings with rewards
- ✅ Achievement badges and progression tracking
- ✅ Daily streak bonuses and multipliers
- ✅ Balanced economy with fair reward distribution

### 5. Leaderboard System
**Platforms**: Mobile

#### Ranking Categories
- **Trophy Leaderboard**: Main competitive ranking
- **Level Leaderboard**: Experience-based ranking  
- **XP Leaderboard**: Total experience points
- **Seasonal Ranking**: Time-limited competitions

#### Features:
- ✅ Multiple ranking categories
- ✅ Real-time updates
- ✅ User position tracking
- ✅ Visual rank indicators
- ✅ Statistics display

### 6. Quest & Challenge System
**Platforms**: Mobile

#### Quest Types
- **Daily Quests**: 24-hour reset challenges
- **Weekly Quests**: 7-day long challenges
- **Special Quests**: Event-based challenges
- **Custom Quests**: User-created challenges

#### Features:
- ✅ Multiple quest types
- ✅ Multi-currency rewards
- ✅ Difficulty scaling
- ✅ User-generated content
- ✅ Progress tracking

### 7. Profile Management
**Platforms**: Mobile

#### Profile Features
- **User Information**: Username, display name, bio, avatar
- **Statistics Dashboard**: Comprehensive user stats
- **Achievement Display**: Badges and accomplishments
- **Activity Tracking**: Login streaks, last activity
- **Profile Customization**: Editable user information

#### Features:
- ✅ Comprehensive user profiles
- ✅ Statistics dashboard
- ✅ Achievement tracking
- ✅ Profile customization
- ✅ Activity monitoring

### 8. Theme System
**Platforms**: Mobile

#### Theme Features
- **Dark/Light Mode**: Full theme switching
- **Clash Royale Colors**: Game-inspired color palette
- **Persistent Settings**: Theme preference storage

#### Color Palette
- **Primary**: Clash Blue (#4a90e2)
- **Secondary**: Clash Purple (#8e44ad)
- **Accent**: Clash Gold (#f1c40f)
- **Success**: Green (#27ae60)
- **Warning**: Orange (#f39c12)
- **Error**: Red (#e74c3c)

#### Features:
- ✅ Dark/light mode toggle
- ✅ Clash Royale-inspired design
- ✅ Persistent preferences

---

**Platform**: React Native Mobile App  
**Database**: Supabase PostgreSQL  
**Authentication**: Custom secure authentication system
