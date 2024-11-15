'use client';

import { useEffect, useState } from 'react';

import { AppSidebar } from '@/components/custom/app-sidebar';
import { WalletButton } from '@/components/custom/WalletButton';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null); // Adjust the type for your session
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Handle Success and Error in the client
  const handleSuccess = (address: string) => {
    console.log('Wallet connected successfully:', address);
    // Here, you can set state or trigger any other client-side logic when the wallet is connected
  };

  const handleError = (error: unknown) => {
    console.error('Error connecting wallet:', error);
    // Here you can handle any errors from the wallet connection
  };

  // Fetch session data and cookies on the client side
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setSession(data.user);
      const cookie = document.cookie.match(/sidebar:state=(true|false)/);
      setIsCollapsed(cookie ? cookie[1] === 'true' : false);
    };

    fetchData();
  }, []);

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <WalletButton handleSuccess={handleSuccess} handleError={handleError} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
