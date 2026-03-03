"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNovaStore } from "@/lib/nova-store";
import { LogIn, LogOut, Loader2, User, Crown, UserPlus, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { VerificationDialog } from "./verification-dialog";

export function LoginDialog() {
  const { showLogin, setShowLogin } = useNovaStore();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // First, verify credentials and send verification code
      const verifyResponse = await fetch("/api/auth/signin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.error || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Credentials valid, show verification dialog
      setPendingEmail(email);
      setPendingPassword(password);
      setShowVerification(true);
      setIsLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // First, send verification code
      const verificationResponse = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const verificationData = await verificationResponse.json();

      if (!verificationData.success) {
        setError(verificationData.error || "Failed to send verification code");
        setIsLoading(false);
        return;
      }

      // Show verification dialog
      setPendingEmail(email);
      setShowVerification(true);
      setIsLoading(false);
    } catch {
      setError("Failed to send verification code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleVerified = async () => {
    setShowVerification(false);
    setIsLoading(true);

    try {
      if (isRegister) {
        // Create the account after verification
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail, password: pendingPassword, name }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setIsLoading(false);
          return;
        }
      }

      // Sign in (for both register and login)
      const result = await signIn("credentials", {
        email: pendingEmail,
        password: pendingPassword || password,
        redirect: false,
      });

      if (result?.error) {
        setError("Login failed. Please try again.");
      } else {
        setShowLogin(false);
        setEmail("");
        setPassword("");
        setName("");
        setPendingEmail("");
        setPendingPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    setShowLogin(false);
  };

  return (
    <>
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {session ? (
                <>
                  <User className="w-5 h-5 text-violet-500" />
                  Your Account
                </>
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5 text-violet-500" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 text-violet-500" />
                  Sign In to Nova AI
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {session
                ? "Manage your account and subscription"
                : isRegister
                ? "Create an account to save your chat history"
                : "Sign in with email verification for security"}
            </DialogDescription>
          </DialogHeader>

          {session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{session.user?.name || session.user?.email}</p>
                  <div className="flex items-center gap-1.5">
                    <Crown className={session.user?.plan === "enterprise" ? "w-4 h-4 text-yellow-500" : "w-4 h-4 text-muted-foreground"} />
                    <span className="text-sm text-muted-foreground capitalize">{session.user?.plan || "Free"} Plan</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLogin(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {isRegister && (
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-2 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                <Lock className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {isRegister 
                    ? "We'll send a verification code to your email"
                    : "For security, we'll verify your identity with a code sent to your email"}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {isLoading 
                  ? "Verifying..." 
                  : isRegister 
                    ? "Create Account" 
                    : "Continue with Email"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="text-sm text-violet-500 hover:underline"
                >
                  {isRegister
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <VerificationDialog
        isOpen={showVerification}
        onClose={() => {
          setShowVerification(false);
          setPendingEmail("");
          setPendingPassword("");
        }}
        email={pendingEmail}
        onVerified={handleVerified}
      />
    </>
  );
}
