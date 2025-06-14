
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, LogIn } from 'lucide-react'; // Assuming LogIn icon for general login
// You might want specific icons for Google, Lichess, etc.
// import { GoogleIcon, LichessIcon, ChesscomIcon, Chess24Icon } from '@/components/icons'; // Example

export default function LoginPage() {
  const handleLogin = (provider: string) => {
    // Placeholder for actual login logic
    // e.g., firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    alert(`Login with ${provider} clicked. Implement actual authentication.`);
    // On successful login, you'd typically redirect to the app's dashboard
    // window.location.href = '/'; 
  };

  const handleGuestAccess = () => {
    alert("Guest access clicked. Implement guest session/redirect.");
    // window.location.href = '/'; // Or a specific guest dashboard
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-3 mb-8 text-primary">
        <Bot size={48} />
        <h1 className="text-4xl font-headline font-semibold text-foreground">
          ChessForgeAI
        </h1>
      </div>
      <Card className="w-full max-w-md bg-card rounded-xl shadow-soft-ui">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Access Your Account</CardTitle>
          <CardDescription>
            Sign in to continue to your dashboard or explore as a guest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Button 
              onClick={() => handleLogin('Google')} 
              className="w-full" 
              variant="outline"
            >
              {/* <GoogleIcon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Google
            </Button>
            <Button 
              onClick={() => handleLogin('Lichess')} 
              className="w-full"
              variant="outline"
            >
              {/* <LichessIcon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Lichess.org
            </Button>
            <Button 
              onClick={() => handleLogin('Chess.com')} 
              className="w-full"
              variant="outline"
            >
              {/* <ChesscomIcon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Chess.com
            </Button>
             <Button 
              onClick={() => handleLogin('Chess24')} 
              className="w-full"
              variant="outline"
            >
              {/* <Chess24Icon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Chess24
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button 
            onClick={handleGuestAccess} 
            className="w-full" 
            variant="secondary"
          >
            Continue as Guest
          </Button>
          
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to ChessForgeAI? Guest access gives limited features. <br /> Sign in to unlock full potential and save your progress.
      </p>
    </div>
  );
}
