
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wallet, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  address: string | null;
}

// Extend the Window interface to include Keplr
declare global {
  interface Window {
    keplr?: any;
    getOfflineSigner?: any;
  }
}

export default function WalletConnect({ onConnect, address }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const chainId = "osmosis-1";

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.keplr) {
        throw new Error("Keplr extension not found. Please install it.");
      }

      await window.keplr.enable(chainId);
      const offlineSigner = window.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();
      
      if (accounts.length > 0) {
        const userAddress = accounts[0].address;
        onConnect(userAddress);
      } else {
        throw new Error("No accounts found in Keplr wallet.");
      }

    } catch (err: any) {
      const errorMessage = err.message || "Failed to connect wallet. Please try again.";
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
            <AlertDescription className="truncate font-mono text-xs">
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
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
