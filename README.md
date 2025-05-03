# Mr. Lotfy Zahran Educational Platform

## Overview

This is an educational platform for Mr. Lotfy Zahran, a mathematics teacher. The platform provides students with access to courses, video lectures, exams, and educational resources. It is designed specifically for Azhar students with a focus on mathematics education.

## Features

- **User Authentication**: Secure login and registration system
- **Course Management**: Browse and enroll in available courses
- **Video Lectures**: Access high-quality educational videos with completion tracking
- **Exam System**: Comprehensive quiz system with immediate feedback and detailed results
- **Progress Tracking**: View exam history, scores, and performance analytics
- **User Dashboard**: Track progress and manage enrolled courses
- **Responsive Design**: Optimized for both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit for global state management
- **UI Components**: Shadcn UI components
- **Authentication**: JWT-based authentication
- **Styling**: Tailwind CSS with custom theme configuration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app                  # Next.js app router pages
  /course             # Course-related pages
    /[id]/video      # Video player and quiz pages
  /login              # Authentication pages
  /register           # User registration
  /me                 # User dashboard
    /user            # User-specific pages
      /exam-results  # Individual exam results
      /all-exam-results # Complete exam history
/components           # Reusable UI components
  /ui                 # Shadcn UI components
/store                # Redux store configuration
  /slices             # Redux slices for state management
/public               # Static assets
/lib                  # Utility functions
```

## State Management

The application uses Redux Toolkit for state management with the following slices:

- **Auth Slice**: Manages user authentication state
- **Course Slice**: Handles course data and enrollment status
- **UI Slice**: Manages UI-related state like theme and notifications
- **Quiz Slice**: Handles quiz data, submission, and results tracking

## API Integration

The frontend connects to a backend API running on `http://localhost:3005` with the following main endpoints:

- `/auth/login` - User authentication
- `/auth/register` - User registration
- `/courses` - Course management
- `/enroll` - Course enrollment

## Deployment

The application can be built for production using:

```bash
npm run build
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and owned by Mr. Lotfy Zahran.