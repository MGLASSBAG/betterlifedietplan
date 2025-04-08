'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Hook to get user session client-side
import { Button } from '@/components/ui/button';
import { Home, UtensilsCrossed, LayoutDashboard, LogIn, LogOut } from 'lucide-react'; // Icons

const Navbar = () => {
    const user = useAuth();

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand Name */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-red-600 hover:text-red-700">
                             <UtensilsCrossed className="h-6 w-6" />
                             <span>BetterLife - Diet Plan</span>
                        </Link>
                    </div>

                    {/* Primary Navigation */}
                    <div className="hidden md:flex md:space-x-8">
                        <Link href="/" className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                            <Home className="mr-1 h-4 w-4"/> Home
                        </Link>
                        <Link href="/start-plan" className="text-gray-600 hover:text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                             <UtensilsCrossed className="mr-1 h-4 w-4"/> Start Plan
                        </Link>
                        {/* Add other primary links here if needed */}
                    </div>

                    {/* Auth Links/Actions */}
                    <div className="flex items-center space-x-4">
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
                     {/* TODO: Add Mobile Menu Button and Drawer/Dropdown */}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 