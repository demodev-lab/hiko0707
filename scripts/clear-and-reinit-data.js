// Clear localStorage and reinitialize with fixed image mappings
// Run this in browser console: node scripts/clear-and-reinit-data.js

console.log('🧹 Clearing localStorage...')
localStorage.clear()

console.log('🔄 Reloading page to reinitialize data...')
window.location.reload()