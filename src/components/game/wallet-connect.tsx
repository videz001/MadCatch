"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  address: string | null;
}

export default function WalletConnect({ onConnect, address }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateFakeAddress = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'osmo1';
    for (let i = 0; i < 38; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    // This simulates checking for and connecting to Keplr wallet.
    // In a real app, you would interact with `window.keplr`.
    try {
      if (typeof window.keplr === 'undefined') {
        // This is a mock, in a real scenario we could guide the user to install Keplr.
        console.warn("Keplr not found, simulating connection.");
      }
      
      // Simulating a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      const fakeAddress = generateFakeAddress();
      onConnect(fakeAddress);

    } catch (err) {
      const errorMessage = "Failed to connect wallet. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          <span>Wallet</span>
        </CardTitle>
        <CardDescription>Connect to play with your NFTs.</CardDescription>
      </CardHeader>
      <CardContent>
        {address ? (
          <Alert variant="default" className="border-primary/50 bg-primary/10">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Connected!</AlertTitle>
            <AlertDescription className="truncate">
              {address}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Button onClick={handleConnect} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Keplr Wallet'
              )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
