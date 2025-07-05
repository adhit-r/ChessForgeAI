# ChessForgeAI ♟️🧠

ChessForgeAI is a modern web application designed to help chess players analyze their games, get AI-powered insights, and train effectively. Built with a cutting-edge tech stack, it aims to provide a seamless and intuitive user experience.

This project is developed in Firebase Studio.

## ✨ Features

### Core Functionality
- **Dashboard**: At-a-glance overview of your chess performance and key insights (mock data currently).
- **Game Analysis**: 
    - Import games via PGN (Portable Game Notation) upload.
    - Import recent games by username from Lichess.org (currently using mock data, full API integration planned).
    - AI-powered analysis to identify blunders, mistakes, and inaccuracies.
    - Personalized improvement tips based on game analysis.
- **Train with AI Bot**: 
    - Interface to play against an AI.
    - Bot provides move suggestions, evaluation, and explanations (currently using mock interactions).
- **Learn Section**:
    - Placeholders for "Chess Puzzles" and "Chess Openings" pages.

### Authentication
- **Firebase Authentication**: Securely manage user accounts.
- **Google Sign-In**: Easy sign-in/sign-up using Google accounts.
- **Lichess.org Sign-In**: (Client-side PKCE flow implemented; Firebase Custom Token integration via Cloud Function is the next step).
- **Guest Access**: Browse the app with limited, temporary data storage using Firebase Anonymous Authentication.
- **Chess.com & Chess24 Sign-In**: Planned for future integration.

### Tech Stack
- **Frontend**:
    - [Next.js](https://nextjs.org/) (App Router)
    - [React](https://reactjs.org/)
    - [TypeScript](https://www.typescriptlang.org/)
- **UI**:
    - [ShadCN UI](https://ui.shadcn.com/) (Reusable components)
    - [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    - [Lucide React](https://lucide.dev/) (Icons)
- **AI & Backend Logic**:
    - AI-powered features (game analysis, suggestions) are provided via Next.js API Routes.
    - Analysis primarily utilizes the [Lichess API](https://lichess.org/api) for Stockfish cloud evaluation.
    - Direct integration with generative models like Google's Gemini is planned for future enhancements.
- **Authentication & Backend Services**:
    - [Firebase](https://firebase.google.com/)
        - Firebase Authentication (Google, Lichess via Custom Auth, Anonymous)
        - (Firebase Cloud Functions will be used for custom auth token minting)
        - (Firestore can be added for database needs)
- **Deployment**:
    - Configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Environment Variables
Create a `.env` file in the root of the project and add your Firebase project configuration and Lichess Client ID:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id (optional)

NEXT_PUBLIC_LICHESS_CLIENT_ID=your_lichess_client_id
```
Replace `your_...` with your actual credentials. You'll need to set up a Firebase project and register an OAuth app with Lichess.org.

### Installation & Running Locally
1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```
2. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The application will be available at `http://localhost:9002` (or the port specified in `package.json`).

## 🔮 Planned Features & Next Steps
- **Full Lichess API Integration**: Fetch actual game history and user data.
- **Firebase Custom Token Flow for Lichess**: Complete the Lichess sign-in by implementing the Firebase Cloud Function for token exchange.
- **Chess.com & Chess24 Integration**: Add authentication and game import for these platforms.
- **Interactive Chessboard**: Replace placeholders with a functional chessboard for game playback and training.
- **Puzzle & Opening Explorer Implementation**: Build out the "Learn" section features.
- **Database Integration (Firestore)**: For persisting user data, game analyses, and progress.
- **Advanced AI Features**:
    - Deeper opening analysis.
    - Tactical pattern recognition.
    - Long-term strategic advice.
- **User Profiles & Settings**.

## 🤝 Contributing
This project is primarily developed within Firebase Studio. Contributions and suggestions are welcome!

---

This `README.md` provides a good overview for anyone looking at the project.
