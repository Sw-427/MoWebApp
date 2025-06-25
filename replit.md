# Multi-Agent Communication Platform

## Overview

This is a full-stack web application that simulates a multi-agent system for automating personal tasks like payments and phone calls. The application features a real-time conversation interface where different AI agents (supervisor, phone, and Venmo) collaborate to complete user-requested tasks. Built with React, Express, and WebSocket for real-time communication, it demonstrates agent coordination and task delegation patterns.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state management
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Real-time Updates**: WebSocket client for live agent conversations
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **WebSocket**: ws library for real-time bidirectional communication
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **API Design**: RESTful endpoints with WebSocket supplements
- **Development**: tsx for TypeScript execution

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured via Drizzle)
- **Development Storage**: In-memory storage fallback for development
- **Schema Management**: Drizzle migrations in `/migrations` directory
- **Connection**: Neon Database serverless PostgreSQL

## Key Components

### Database Schema (`shared/schema.ts`)
- **Tasks Table**: Stores user prompts, status tracking, and completion timestamps
- **Messages Table**: Logs all agent communications with metadata
- **Agent Status**: Tracks supervisor, phone, and Venmo agent states
- **Task Progress**: Monitors completion percentage

### Agent System (`server/services/`)
- **External Agent Service**: Handles API communication with external agent endpoints
- **Agent Service**: Manages local agent simulation and conversation flow
- **Storage Layer**: Abstracts database operations with in-memory fallback

### Real-time Communication
- **WebSocket Server**: Handles multiple client connections on `/ws` path
- **Broadcasting**: Sends agent messages to all connected clients
- **Connection Management**: Automatic cleanup of disconnected clients

### UI Components
- **Home Page**: Main interface with prompt input and conversation display
- **Agent Status Indicators**: Visual representation of agent states
- **Progress Tracking**: Real-time task completion progress
- **Message Threading**: Chronological display of agent conversations

## Data Flow

1. **Task Initiation**: User submits a prompt through the React frontend
2. **Task Storage**: Express API creates task record in PostgreSQL database
3. **Agent Processing**: External agent service processes the task via API call
4. **Real-time Updates**: Agent messages broadcast via WebSocket to all clients
5. **Status Updates**: Task status and agent states update in real-time
6. **Completion**: Final status update marks task as completed/failed

## External Dependencies

### Core Technologies
- **React Ecosystem**: React 18, React DOM, React Query
- **Database**: Drizzle ORM, PostgreSQL, Neon Database serverless
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Build Tools**: Vite, TypeScript, PostCSS

### Development Tools
- **Type Checking**: TypeScript with strict configuration
- **Development Server**: tsx for TypeScript execution
- **Hot Reload**: Vite HMR with React plugin
- **Database Tools**: Drizzle Kit for migrations

### External Services
- **Agent API**: External service at `closing-vocal-fowl.ngrok-free.app/ask`
- **Task Selection**: Predefined task IDs from JSON configuration
- **WebSocket**: Real-time communication protocol

## Deployment Strategy

### Build Process
- **Frontend Build**: Vite builds React app to `dist/public`
- **Backend Build**: esbuild bundles server code to `dist/index.js`
- **Static Assets**: Client assets served from build directory

### Environment Configuration
- **Development**: NODE_ENV=development with tsx execution
- **Production**: NODE_ENV=production with compiled JavaScript
- **Database**: DATABASE_URL environment variable required
- **Port Configuration**: Application runs on port 5000

### Deployment Target
- **Platform**: Replit with PostgreSQL module
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Static Files**: Served from `dist` directory

## Changelog
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.