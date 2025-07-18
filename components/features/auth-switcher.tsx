'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, LogOut, Shield, User } from 'lucide-react'

export function AuthSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentUser, login, logout, isLoading } = useAuth()

  const handleAdminLogin = async () => {
    await login('admin@hiko.kr', 'admin123')
  }

  const handleUserLogin = async () => {
    await login('user@example.com', 'password')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${isOpen ? 'w-64' : 'w-auto'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg w-full"
        >
          <span>Auth</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        
        {isOpen && (
          <div className="p-4 space-y-3">
            {currentUser ? (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    {currentUser.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <span className="font-medium">{currentUser.email}</span>
                  </div>
                  <div className="text-xs mt-1">Role: {currentUser.role}</div>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleAdminLogin}
                  variant="default"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Login as Admin
                </Button>
                <Button
                  onClick={handleUserLogin}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isLoading}
                >
                  <User className="h-4 w-4 mr-2" />
                  Login as User
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}