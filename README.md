# Intellect Kanban

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A comprehensive course activity management application designed for educational environments, featuring separate interfaces for teachers and students with Kanban-style board management.

**For detailed development history and progress, please refer to the [`development.md`](./development.md) file.**

## Project Overview

Intellect Kanban is built as an Nx workspace containing multiple applications and shared libraries:

- **Applications**
  - `teacher`: Next.js application for educators to create classes, manage activities, and monitor student progress
  - `student`: Next.js application for students to view and update assignments
  - `backend`: NestJS API server providing data and authentication services

- **Libraries**
  - `ui`: Shared UI components built with shadcn/ui
  - `utils`: Shared utility functions, API helpers, and type definitions

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+

### Installation

```sh
# Install dependencies with legacy peer deps flag to resolve package conflicts
npm install --legacy-peer-deps
```

### Running the Applications

#### Teacher Application
```sh
npx nx dev teacher --port 3001
```
The teacher application will run on http://localhost:3001

#### Student Application
```sh
npx nx dev student
```
The student application will run on http://localhost:3000

#### Backend Server
```sh
npx nx serve backend --configuration=development
```
The backend API will be available at http://localhost:3005

### Project Structure

```
intellect-kanban/
├── apps/
│   ├── teacher/              # Teacher Next.js application
│   ├── student/              # Student Next.js application
│   └── backend/              # NestJS backend API server
├── libs/
│   ├── ui/                   # Shared UI components built with shadcn/ui
│   └── utils/                # Shared utilities, API helpers, and types
└── development.md            # Detailed development history
```

## Shared Components and Utilities

The project uses a shared component architecture:

- **UI Library**: Located at `libs/ui`, contains all shadcn/ui based components that are used by both teacher and student applications.
- **Utils Library**: Located at `libs/utils`, contains common utilities, API clients, and TypeScript interfaces shared across applications.

## Working with Nx

This project uses [Nx](https://nx.dev) for workspace management. Here are some common commands:

### Generate code

```sh
npx nx g @nx/react:component ComponentName --project=ui
```

### Run tasks

```sh
npx nx <target> <project-name>
```

### Visualize the project graph

```sh
npx nx graph
```

### Lint all applications

```sh
npx nx run-many --target=lint --all
```

## Useful links

- [Nx Documentation](https://nx.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
