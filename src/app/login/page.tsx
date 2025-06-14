
"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, LogIn, User } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, type UserCredential, signInAnonymously } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

// Helper for PKCE
function dec2hex(dec: number) {
  return ('0' + dec.toString(16)).slice(-2);
}

function generateRandomString(len: number) {
  const arr = new Uint8Array((len || 40) / 2);
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(arr);
  } else {
    // Fallback for non-browser environments (less secure, for initial load/SSR if ever needed)
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, dec2hex).join('');
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle.digest('SHA-256', data);
  }
  // Basic polyfill/fallback for Node.js or environments without crypto.subtle for hashing
  // THIS IS NOT FOR PRODUCTION USE on client if window.crypto is unavailable
  // For Node.js, you'd use the 'crypto' module. This is a conceptual placeholder.
  const { createHash } = await import('crypto');
  return createHash('sha256').update(data).digest();
}

function base64urlencode(a: ArrayBuffer) {
  let str = "";
  const bytes = new Uint8Array(a);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


const LICHESS_CLIENT_ID = process.env.NEXT_PUBLIC_LICHESS_CLIENT_ID || "chessforgeai-dev"; 
const LICHESS_SCOPES = "preference:read game:read"; // Adjust scopes as needed

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [lichessRedirectUri, setLichessRedirectUri] = React.useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLichessRedirectUri(`${window.location.origin}/login`);
    }
  }, []);


  useEffect(() => {
    const authCode = searchParams.get('code');
    const state = searchParams.get('state'); // Lichess might send 'state' for CSRF protection

    if (authCode && typeof window !== 'undefined' && lichessRedirectUri) {
      const codeVerifier = sessionStorage.getItem('lichessCodeVerifier');
      if (!codeVerifier) {
        toast({ title: "Lichess Login Error", description: "Code verifier not found. Please try logging in again.", variant: "destructive" });
        router.replace('/login', undefined); // Remove query params
        return;
      }

      const exchangeCodeForToken = async (code: string, verifier: string) => {
        try {
          const params = new URLSearchParams();
          params.append('grant_type', 'authorization_code');
          params.append('code', code);
          params.append('redirect_uri', lichessRedirectUri);
          params.append('client_id', LICHESS_CLIENT_ID);
          params.append('code_verifier', verifier);

          const response = await fetch('https://lichess.org/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });

          const tokenData = await response.json();
          sessionStorage.removeItem('lichessCodeVerifier');
          router.replace('/login', undefined); // Clean URL

          if (response.ok && tokenData.access_token) {
            console.log("Lichess Access Token:", tokenData.access_token);
            toast({ 
              title: "Lichess Token Received!", 
              description: "Next step: Send this token to a Firebase Cloud Function to get a Firebase Custom Token, then sign in to Firebase and redirect to dashboard.",
              duration: 9000, // Keep toast longer
            });
            // TODO: Implement Firebase Cloud Function call here.
            // 1. Send tokenData.access_token to your Firebase Cloud Function.
            // 2. Cloud Function verifies Lichess token, gets Lichess user ID, mints Firebase Custom Token.
            // 3. Cloud Function returns Firebase Custom Token to client.
            // 4. Client calls: await signInWithCustomToken(auth, firebaseCustomToken);
            // 5. Then: router.push('/'); 
          } else {
            toast({ title: "Lichess Token Error", description: tokenData.error_description || "Failed to exchange code for Lichess token.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Lichess token exchange error:", error);
          toast({ title: "Lichess Login Error", description: "Could not exchange authorization code for token. " + (error instanceof Error ? error.message : String(error)), variant: "destructive" });
          sessionStorage.removeItem('lichessCodeVerifier');
          router.replace('/login', undefined);
        }
      };

      exchangeCodeForToken(authCode, codeVerifier);
    }
  }, [searchParams, router, toast, lichessRedirectUri]);


  const handleLogin = async (providerName: string) => {
    if (providerName === 'Google') {
      const provider = new GoogleAuthProvider();
      try {
        const result: UserCredential = await signInWithPopup(auth, provider);
        toast({ title: "Signed In with Google", description: `Welcome, ${result.user.displayName || result.user.email}!`});
        router.push('/'); 
      } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({ title: "Sign-In Error", description: error.message, variant: "destructive"});
      }
    } else if (providerName === 'Lichess') {
      if (!LICHESS_CLIENT_ID || LICHESS_CLIENT_ID === "chessforgeai-dev") {
         toast({ title: "Lichess Client ID Missing", description: "Please configure NEXT_PUBLIC_LICHESS_CLIENT_ID in your .env file.", variant: "destructive" });
         return;
      }
      if (!lichessRedirectUri) {
        toast({ title: "Lichess Login Setup Error", description: "Redirect URI not ready. Please try again in a moment.", variant: "destructive" });
        return;
      }
      try {
        const codeVerifier = generateRandomString(128);
        sessionStorage.setItem('lichessCodeVerifier', codeVerifier);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64urlencode(hashed);

        const authUrl = new URL('https://lichess.org/oauth');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', LICHESS_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', lichessRedirectUri);
        authUrl.searchParams.set('scope', LICHESS_SCOPES);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('code_challenge', codeChallenge);
        // authUrl.searchParams.set('state', generateRandomString(16)); // Optional: for CSRF protection

        window.location.href = authUrl.toString();
      } catch (error) {
        console.error("Lichess PKCE setup error:", error);
        toast({ title: "Lichess Login Setup Error", description: "Could not initiate Lichess login. " + (error instanceof Error ? error.message : String(error)), variant: "destructive" });
      }

    } else {
      toast({ title: `${providerName} Login`, description: `Login with ${providerName} is coming soon!`, variant: "default"});
    }
  };

  const handleGuestAccess = async () => {
    try {
      await signInAnonymously(auth);
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
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Google
            </Button>
            <Button 
              onClick={() => handleLogin('Lichess')} 
              className="w-full"
              variant="outline"
            >
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Lichess.org
            </Button>
            <Button 
              onClick={() => handleLogin('Chess.com')} 
              className="w-full"
              variant="outline"
              disabled 
            >
              <LogIn className="mr-2 h-5 w-5" /> 
              Sign in with Chess.com (Coming Soon)
            </Button>
             <Button 
              onClick={() => handleLogin('Chess24')} 
              className="w-full"
              variant="outline"
              disabled 
            >
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

