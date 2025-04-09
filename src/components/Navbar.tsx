'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Hook to get user session client-side
import { Button } from '@/components/ui/button';
import { Home, UtensilsCrossed, LayoutDashboard, LogIn, LogOut, Menu } from 'lucide-react'; // Icons
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from 'react'; // Import useState

const Navbar = () => {
    const user = useAuth();
    const [isSheetOpen, setIsSheetOpen] = useState(false); // State for Sheet

    // Function to close the sheet
    const closeSheet = () => setIsSheetOpen(false);

    return (
        // Add relative positioning for potential absolute elements like Sheet overlay
        <nav className="bg-white shadow-md sticky top-0 z-50 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand Name */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-red-600 hover:text-red-700">
                             <UtensilsCrossed className="h-6 w-6" />
                             <span>BetterLife - Diet Plan</span>
                        </Link>
                    </div>

                    {/* Primary Navigation (Desktop) */}
                    <div className="hidden md:flex md:space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                            <Home className="mr-1 h-4 w-4"/> Home
                        </Link>
                        <Link href="/start-plan" className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                             <UtensilsCrossed className="mr-1 h-4 w-4"/> Start Plan
                        </Link>
                        {/* Add other primary links here if needed */}
                    </div>

                    {/* Right side elements (Auth & Mobile Menu Trigger) */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                         {/* Auth Links/Actions - Keep these visible */}
                        <div className="hidden sm:flex items-center space-x-4"> {/* Hide on xs screens, show sm and up */}
                            {user ? (
                                <>
                                    <Link href="/dashboard">
                                        <Button variant="ghost" size="sm" className="inline-flex items-center">
                                             <LayoutDashboard className="mr-1 h-4 w-4"/> Dashboard
                                        </Button>
                                    </Link>
                                    <form action="/auth/signout" method="post">
                                        <Button variant="outline" size="sm" type="submit" className="inline-flex items-center">
                                            <LogOut className="mr-1 h-4 w-4"/> Sign Out
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <Link href="/login">
                                     <Button variant="default" size="sm" className="inline-flex items-center bg-red-600 hover:bg-red-700">
                                          <LogIn className="mr-1 h-4 w-4"/> Login / Sign Up
                                     </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu className="h-6 w-6" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left">
                                    <SheetHeader className="mb-6">
                                        <SheetTitle>
                                             <Link href="/" onClick={closeSheet} className="flex items-center space-x-2 text-lg font-bold text-red-600 hover:text-red-700">
                                                 <UtensilsCrossed className="h-5 w-5" />
                                                 <span>BetterLife</span>
                                            </Link>
                                        </SheetTitle>
                                    </SheetHeader>
                                    {/* Mobile Navigation Links */}
                                    <div className="flex flex-col space-y-4">
                                        <Link href="/" onClick={closeSheet} className="text-gray-700 hover:bg-gray-100 rounded-md p-2 flex items-center">
                                            <Home className="mr-2 h-5 w-5"/> Home
                                        </Link>
                                        <Link href="/start-plan" onClick={closeSheet} className="text-gray-700 hover:bg-gray-100 rounded-md p-2 flex items-center">
                                             <UtensilsCrossed className="mr-2 h-5 w-5"/> Start Plan
                                        </Link>

                                         {/* Mobile Auth Links */}
                                        {user ? (
                                            <>
                                                <Link href="/dashboard" onClick={closeSheet} className="text-gray-700 hover:bg-gray-100 rounded-md p-2 flex items-center">
                                                     <LayoutDashboard className="mr-2 h-5 w-5"/> Dashboard
                                                </Link>
                                                <form action="/auth/signout" method="post" className="w-full">
                                                    {/* Using a Link styled as a Button for client-side nav feeling, but still submitting form */}
                                                    <Button variant="ghost" size="sm" type="submit" className="w-full justify-start p-2 text-gray-700 hover:bg-gray-100">
                                                        <LogOut className="mr-2 h-5 w-5"/> Sign Out
                                                    </Button>
                                                </form>
                                            </>
                                        ) : (
                                            <Link href="/login" onClick={closeSheet} className="text-gray-700 hover:bg-gray-100 rounded-md p-2 flex items-center bg-red-600 hover:bg-red-700 text-white">
                                                 <LogIn className="mr-2 h-5 w-5"/> Login / Sign Up
                                            </Link>
                                        )}
                                        {/* Add other links here */}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                    {/* Mobile Menu Button and Drawer/Dropdown - Implementation above */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 