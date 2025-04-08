import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <UtensilsCrossed className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-gray-700">BetterLifeDietPlan</span>
                    </div>
                    <div className="text-center md:text-right text-sm text-gray-500">
                        <p>&copy; {currentYear} BetterLifeDietPlan. All rights reserved.</p>
                        <div className="mt-2 space-x-4">
                            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
                            {/* Add other footer links as needed */}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 