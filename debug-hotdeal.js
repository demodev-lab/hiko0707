// Debug script for hotdeal detail page
// This script should be run in the browser console at http://localhost:3001

// 1. Check if hotdeals exist in localStorage
const hotdeals = localStorage.getItem('hotdeals');
console.log('Hotdeals in localStorage:', hotdeals ? JSON.parse(hotdeals).length + ' items' : 'Not found');

// 2. If hotdeals exist, show the first one
if (hotdeals) {
  const parsed = JSON.parse(hotdeals);
  if (parsed.length > 0) {
    console.log('First hotdeal:', parsed[0]);
    console.log('First hotdeal ID:', parsed[0].id);
    console.log('To test, navigate to: /hotdeals/' + parsed[0].id);
  }
}

// 3. Add a test hotdeal if none exist
if (!hotdeals || JSON.parse(hotdeals).length === 0) {
  const testHotdeal = {
    id: 'test-hotdeal-1',
    title: 'Test Samsung Galaxy Book3 Pro',
    description: 'This is a test hotdeal for debugging purposes.',
    price: 1890000,
    originalPrice: 2290000,
    discountRate: 17,
    category: 'electronics',
    source: 'ppomppu',
    originalUrl: 'https://www.ppomppu.co.kr',
    imageUrl: 'https://images.unsplash.com/photo-1661961112951-f2bfd1f253ce?w=800',
    viewCount: 15420,
    likeCount: 324,
    commentCount: 89,
    status: 'active',
    crawledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    shipping: {
      isFree: true,
      cost: 0,
      method: '무료배송'
    }
  };
  
  localStorage.setItem('hotdeals', JSON.stringify([testHotdeal]));
  console.log('Test hotdeal added. Navigate to: /hotdeals/test-hotdeal-1');
}

// Instructions
console.log('\n=== INSTRUCTIONS ===');
console.log('1. Open http://localhost:3001 in your browser');
console.log('2. Open the browser console (F12)');
console.log('3. Copy and paste this entire script');
console.log('4. Follow the navigation instructions shown');
console.log('===================\n');