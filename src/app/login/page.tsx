
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, LogIn, User } from 'lucide-react';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup, UserCredential, signInAnonymously } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

// You might want specific icons for Google, Lichess, etc.
// import { GoogleIcon, LichessIcon, ChesscomIcon, Chess24Icon } from '@/components/icons'; // Example

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (providerName: string) => {
    if (providerName === 'Google') {
      const provider = new GoogleAuthProvider();
      try {
        const result: UserCredential = await signInWithPopup(auth, provider);
        toast({ title: "Signed In", description: `Welcome, ${result.user.displayName || result.user.email}!`});
        router.push('/'); // Redirect to dashboard on successful login
      } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({ title: "Sign-In Error", description: error.message, variant: "destructive"});
      }
    } else if (providerName === 'Lichess') {
      // Placeholder: Actual Lichess OAuth flow will be more complex
      toast({ title: "Lichess Login", description: "Lichess login requires server-side setup. We'll guide you once you have your Lichess Client ID.", variant: "default"});
      // The actual flow would start with:
      // const lichessAuthUrl = `https://lichess.org/oauth?client_id=YOUR_LICHESS_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=preference:read%20game:read`;
      // window.location.href = lichessAuthUrl;
    } else {
      toast({ title: `${providerName} Login`, description: `Login with ${providerName} is coming soon!`, variant: "default"});
    }
  };

  const handleGuestAccess = async () => {
    try {
      const userCredential = await signInAnonymously(auth);
      toast({ title: "Guest Access", description: "You're browsing as a guest. Your data might be temporary." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Anonymous Sign-In Error:", error);
      toast({ title: "Guest Access Error", description: error.message, variant: "destructive"});
    }
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
              disabled // Temporarily disable until explicitly worked on
            >
              {/* <ChesscomIcon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Chess.com (Coming Soon)
            </Button>
             <Button 
              onClick={() => handleLogin('Chess24')} 
              className="w-full"
              variant="outline"
              disabled // Temporarily disable until explicitly worked on
            >
              {/* <Chess24Icon className="mr-2 h-5 w-5" /> // Example */}
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Chess24 (Coming Soon)
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
            <User className="mr-2 h-5 w-5" />
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

