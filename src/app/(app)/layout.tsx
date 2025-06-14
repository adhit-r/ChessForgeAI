
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Bot, Github, Settings, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Placeholder for actual auth check
// In a real app, integrate Firebase Auth here.
// For example:
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import firebaseApp from "@/lib/firebase"; // Your firebase config
// const auth = getAuth(firebaseApp);
const checkAuthStatus = async (): Promise<boolean> => {
  // console.log("Checking auth status...");
  // return new Promise(resolve => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     unsubscribe();
  //     console.log("Auth state changed, user:", user);
  //     resolve(!!user);
  //   });
  // });
  
  // Simulate an asynchronous authentication check
  await new Promise(resolve => setTimeout(resolve, 500));
  // For demonstration, we'll assume the user is not authenticated.
  // To test authenticated flow, change this to: return true;
  // console.log("Simulated auth status: false");
  return false; 
};


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null: loading, true: authenticated, false: unauthenticated

  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuthStatus();
      setIsAuthenticated(authStatus);
      if (!authStatus) {
        router.push('/login');
      }
    };
    verifyAuth();
  }, [router]);

  const handleSignOut = async () => {
    // In a real app, call Firebase sign out:
    // try {
    //   await auth.signOut();
    //   toast({ title: "Signed Out", description: "You have been successfully signed out." });
    // } catch (error) {
    //   console.error("Sign out error", error);
    //   toast({ title: "Sign Out Error", description: "Could not sign out.", variant: "destructive" });
    // }
    alert("Simulated Sign Out. Implement actual sign out logic.");
    // Regardless of actual sign out success/failure for simulation, clear auth state and redirect
    setIsAuthenticated(false); // Simulate auth state change
    router.push('/login');
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state is usually brief as router.push should navigate away.
    // You can show a "Redirecting..." message or simply null if useEffect handles it quickly.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-medium">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="inset" collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4 flex flex-col items-center border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-sidebar-primary hover:text-sidebar-primary-foreground transition-colors">
            <Bot size={28} />
            <span className="font-headline group-data-[collapsible=icon]:hidden">ChessForgeAI</span>
          </Link>
          <div className="mt-2 group-data-[collapsible=icon]:hidden">
             <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground" />
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 p-2">
          <SidebarNav />
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="w-full justify-start group-data-[collapsible=icon]:justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Settings size={18} className="mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Button>
            <a
              href="https://github.com/your-repo/chessforgeai" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-start group-data-[collapsible=icon]:justify-center w-full h-9 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              aria-label="View source on GitHub"
            >
              <Github size={18} className="mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">GitHub</span>
            </a>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start group-data-[collapsible=icon]:justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
            >
              <LogOut size={18} className="mr-2 group-data-[collapsible=icon]:mr-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
         {children}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
