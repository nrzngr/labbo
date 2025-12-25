'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { FloatingBottomNav } from '@/components/layout/floating-bottom-nav'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
            if (window.innerWidth < 1024) {
                setIsCollapsed(false) // Always expanded logic for mobile drawer, processed differently
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
    }

    return (
        <div className="relative flex flex-col lg:flex-row min-h-screen w-full bg-[#f8fafe] text-gray-900 overflow-x-hidden font-sans page-gradient">
            {/* Subtle Grid Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>

            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={toggleSidebar}
            />

            <div
                className={cn(
                    "relative w-full flex-1 min-w-0 flex flex-col pt-16 lg:pt-0 pb-[88px] lg:pb-0 transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:pl-[80px]" : "lg:pl-72 xl:pl-[21rem]"
                )}
            >
                <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="w-full min-w-0 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <FloatingBottomNav />
        </div>
    )
}
