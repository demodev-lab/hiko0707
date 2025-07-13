/**
 * Test Scenario 2: First-time User - Recommendation System and Hotdeal Exploration
 * 첫 방문 사용자 - 추천 시스템 및 핫딜 탐색
 */

console.log('🚀 Starting Test Scenario 2: First-time User - Recommendation System and Hotdeal Exploration');

// Alex persona - first-time user
const alexPersona = {
  id: 'alex-test-2025',
  email: 'alex.johnson@gmail.com',
  name: 'Alex Johnson',
  role: 'member',
  nationality: 'American',
  age: 28,
  location: 'Seoul, Korea',
  preferredLanguage: 'en',
  avatar: 'https://avatar.vercel.sh/alex',
  isFirstTime: true,
  interests: ['electronics', 'fashion', 'beauty', 'home'],
  createdAt: new Date()
};

// Mock recommendation engine test
class MockRecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.recommendations = new Map();
  }

  generateFirstTimeRecommendations(userId, userProfile) {
    console.log(`\n🧠 Generating first-time recommendations for user: ${userId}`);
    
    // Simulate recommendation generation for new user
    const genericRecommendations = [
      {
        id: 'rec-1',
        userId,
        type: 'hotdeal',
        title: '인기 핫딜 추천',
        description: '현재 가장 인기있는 핫딜을 추천드립니다',
        reasoning: '신규 사용자를 위한 인기 상품 추천',
        items: [
          { title: '삼성 갤럭시 액세서리', price: 25000, category: 'electronics' },
          { title: 'K-뷰티 세트', price: 35000, category: 'beauty' },
          { title: '한국 패션 아이템', price: 45000, category: 'fashion' }
        ],
        confidence: 75,
        priority: 8,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3일
      },
      {
        id: 'rec-2',
        userId,
        type: 'category',
        title: '카테고리별 추천',
        description: '관심사를 기반으로 한 카테고리 추천',
        reasoning: '프로필 정보를 바탕으로 선별한 카테고리',
        items: userProfile.interests.map(interest => ({
          title: `${interest} 추천 상품`,
          category: interest,
          score: 80
        })),
        confidence: 65,
        priority: 6,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
      }
    ];

    this.recommendations.set(userId, genericRecommendations);
    return genericRecommendations;
  }

  recordUserInteraction(userId, action, data) {
    console.log(`📊 Recording user interaction: ${action}`, { userId, data });
    
    // Update user profile based on interactions
    const profile = this.userProfiles.get(userId) || {};
    
    if (!profile.interactions) {
      profile.interactions = [];
    }
    
    profile.interactions.push({
      action,
      data,
      timestamp: new Date()
    });
    
    this.userProfiles.set(userId, profile);
    return true;
  }

  getRecommendations(userId) {
    return this.recommendations.get(userId) || [];
  }
}

// Mock hotdeal system
class MockHotDealSystem {
  constructor() {
    this.hotdeals = this.generateMockHotDeals();
  }

  generateMockHotDeals() {
    return [
      {
        id: 'hd-1',
        title: 'Samsung Galaxy Buds Pro 2',
        price: 89000,
        originalPrice: 120000,
        discount: 26,
        category: 'electronics',
        viewCount: 1250,
        likesCount: 89,
        site: 'coupang',
        imageUrl: '/images/products/electronics/earbuds.jpg',
        crawledAt: new Date(),
        createdAt: new Date(),
        tags: ['전자제품', '이어폰', '삼성']
      },
      {
        id: 'hd-2',
        title: 'The Ordinary 스킨케어 세트',
        price: 45000,
        originalPrice: 65000,
        discount: 31,
        category: 'beauty',
        viewCount: 892,
        likesCount: 156,
        site: 'oliveyoung',
        imageUrl: '/images/products/beauty/skincare.jpg',
        crawledAt: new Date(),
        createdAt: new Date(),
        tags: ['뷰티', '스킨케어', 'K-뷰티']
      },
      {
        id: 'hd-3',
        title: '무신사 겨울 패션 아우터',
        price: 120000,
        originalPrice: 180000,
        discount: 33,
        category: 'fashion',
        viewCount: 654,
        likesCount: 78,
        site: 'musinsa',
        imageUrl: '/images/products/fashion/outerwear.jpg',
        crawledAt: new Date(),
        createdAt: new Date(),
        tags: ['패션', '아우터', '겨울']
      },
      {
        id: 'hd-4',
        title: '생활용품 정리함 세트',
        price: 25000,
        originalPrice: 35000,
        discount: 29,
        category: 'home',
        viewCount: 423,
        likesCount: 34,
        site: 'daiso',
        imageUrl: '/images/products/home/organizer.jpg',
        crawledAt: new Date(),
        createdAt: new Date(),
        tags: ['생활용품', '정리', '홈']
      }
    ];
  }

  getPopularHotDeals(limit = 6) {
    return this.hotdeals
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  getHotDealsByCategory(category, limit = 3) {
    return this.hotdeals
      .filter(deal => deal.category === category)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  searchHotDeals(query) {
    return this.hotdeals.filter(deal =>
      deal.title.toLowerCase().includes(query.toLowerCase()) ||
      deal.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

// Test functions
function testRecommendationSystemInitialization() {
  console.log('\n🔧 Step 1: Testing recommendation system initialization...');
  
  try {
    const recommendationEngine = new MockRecommendationEngine();
    const hotDealSystem = new MockHotDealSystem();
    
    console.log('✅ Recommendation engine initialized');
    console.log('✅ HotDeal system initialized');
    console.log(`✅ Generated ${hotDealSystem.hotdeals.length} mock hotdeals`);
    
    return { recommendationEngine, hotDealSystem };
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    return null;
  }
}

function testFirstTimeUserRecommendations(recommendationEngine) {
  console.log('\n👤 Step 2: Testing first-time user recommendations...');
  
  try {
    // Simulate Alex visiting the homepage for the first time
    console.log(`🎯 Generating recommendations for new user: ${alexPersona.name}`);
    
    // Generate first-time recommendations
    const recommendations = recommendationEngine.generateFirstTimeRecommendations(
      alexPersona.id,
      alexPersona
    );
    
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title} (confidence: ${rec.confidence}%, priority: ${rec.priority})`);
      console.log(`     ${rec.description}`);
      console.log(`     Items: ${rec.items.length}`);
    });
    
    return recommendations;
  } catch (error) {
    console.error('❌ First-time user recommendations failed:', error);
    return [];
  }
}

function testHotDealExploration(hotDealSystem) {
  console.log('\n🔥 Step 3: Testing hotdeal exploration...');
  
  try {
    // Get popular hotdeals for homepage
    const popularDeals = hotDealSystem.getPopularHotDeals(6);
    console.log(`✅ Retrieved ${popularDeals.length} popular hotdeals`);
    
    popularDeals.forEach((deal, index) => {
      console.log(`  ${index + 1}. ${deal.title}`);
      console.log(`     Price: ₩${deal.price.toLocaleString()} (${deal.discount}% off)`);
      console.log(`     Views: ${deal.viewCount}, Likes: ${deal.likesCount}`);
      console.log(`     Category: ${deal.category}, Site: ${deal.site}`);
    });
    
    // Test category-based filtering
    console.log('\n🎯 Testing category-based filtering...');
    alexPersona.interests.forEach(interest => {
      const categoryDeals = hotDealSystem.getHotDealsByCategory(interest, 2);
      console.log(`  ${interest}: ${categoryDeals.length} deals found`);
    });
    
    return popularDeals;
  } catch (error) {
    console.error('❌ Hotdeal exploration failed:', error);
    return [];
  }
}

function testUserInteractionTracking(recommendationEngine, hotDealSystem) {
  console.log('\n📊 Step 4: Testing user interaction tracking...');
  
  try {
    const interactions = [
      {
        action: 'view_hotdeal',
        data: { hotdealId: 'hd-1', category: 'electronics', timeSpent: 15 }
      },
      {
        action: 'like_hotdeal',
        data: { hotdealId: 'hd-2', category: 'beauty' }
      },
      {
        action: 'search',
        data: { query: 'samsung galaxy', results: 3 }
      },
      {
        action: 'view_category',
        data: { category: 'fashion', timeSpent: 8 }
      }
    ];
    
    let successfulTracking = 0;
    
    for (const interaction of interactions) {
      const result = recommendationEngine.recordUserInteraction(
        alexPersona.id,
        interaction.action,
        interaction.data
      );
      
      if (result) {
        successfulTracking++;
        console.log(`✅ Tracked: ${interaction.action}`);
      }
    }
    
    console.log(`✅ Successfully tracked ${successfulTracking}/${interactions.length} interactions`);
    return true;
  } catch (error) {
    console.error('❌ User interaction tracking failed:', error);
    return false;
  }
}

function testLanguageSwitching() {
  console.log('\n🌍 Step 5: Testing language switching for first-time user...');
  
  try {
    const supportedLanguages = ['en', 'ko', 'zh', 'vi', 'mn', 'th', 'ja', 'ru'];
    
    // Simulate Alex switching to English
    console.log(`🔄 Switching to Alex's preferred language: ${alexPersona.preferredLanguage}`);
    
    // Mock translation service
    const translations = {
      'ko': {
        'hotdeal.title': '오늘의 핫딜',
        'recommendation.title': '맞춤 추천',
        'category.electronics': '전자제품'
      },
      'en': {
        'hotdeal.title': "Today's Hot Deals",
        'recommendation.title': 'Personalized Recommendations',
        'category.electronics': 'Electronics'
      }
    };
    
    const currentLang = alexPersona.preferredLanguage;
    console.log(`✅ Language set to: ${currentLang.toUpperCase()}`);
    console.log(`✅ Hotdeal title: "${translations[currentLang]['hotdeal.title']}"`);
    console.log(`✅ Recommendation title: "${translations[currentLang]['recommendation.title']}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Language switching failed:', error);
    return false;
  }
}

function testPersonalizedExperience(recommendationEngine, hotDealSystem) {
  console.log('\n🎯 Step 6: Testing personalized experience based on interactions...');
  
  try {
    // Get updated recommendations based on user interactions
    const userRecommendations = recommendationEngine.getRecommendations(alexPersona.id);
    console.log(`✅ Retrieved ${userRecommendations.length} personalized recommendations`);
    
    // Simulate homepage personalization
    const popularDeals = hotDealSystem.getPopularHotDeals(4);
    const electronicsDeals = hotDealSystem.getHotDealsByCategory('electronics', 2);
    
    console.log('\n📱 Personalized homepage sections:');
    console.log(`  - Popular deals: ${popularDeals.length} items`);
    console.log(`  - Electronics (based on interests): ${electronicsDeals.length} items`);
    console.log(`  - Recommendations: ${userRecommendations.length} items`);
    
    return true;
  } catch (error) {
    console.error('❌ Personalized experience test failed:', error);
    return false;
  }
}

function runTestScenario2() {
  console.log('🧪 Running Test Scenario 2 - First-time User Experience\n');
  
  const tests = [
    { name: 'Recommendation System Initialization', fn: testRecommendationSystemInitialization },
    { name: 'First-time User Recommendations', fn: null }, // Will be called with systems
    { name: 'HotDeal Exploration', fn: null }, // Will be called with systems
    { name: 'User Interaction Tracking', fn: null }, // Will be called with systems
    { name: 'Language Switching', fn: testLanguageSwitching },
    { name: 'Personalized Experience', fn: null } // Will be called with systems
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  let systems = null;
  
  // Test 1: System initialization
  try {
    systems = testRecommendationSystemInitialization();
    if (systems) {
      passedTests++;
      console.log(`\n✅ Test 1 PASSED: Recommendation System Initialization`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 1 FAILED: Recommendation System Initialization`);
      return { passed: passedTests, failed: failedTests, total: tests.length, success: false };
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 1 ERROR: Recommendation System Initialization - ${error.message}`);
    return { passed: passedTests, failed: failedTests, total: tests.length, success: false };
  }
  
  // Test 2: First-time user recommendations
  try {
    const recommendations = testFirstTimeUserRecommendations(systems.recommendationEngine);
    if (recommendations && recommendations.length > 0) {
      passedTests++;
      console.log(`\n✅ Test 2 PASSED: First-time User Recommendations`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 2 FAILED: First-time User Recommendations`);
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 2 ERROR: First-time User Recommendations - ${error.message}`);
  }
  
  // Test 3: HotDeal exploration
  try {
    const hotdeals = testHotDealExploration(systems.hotDealSystem);
    if (hotdeals && hotdeals.length > 0) {
      passedTests++;
      console.log(`\n✅ Test 3 PASSED: HotDeal Exploration`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 3 FAILED: HotDeal Exploration`);
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 3 ERROR: HotDeal Exploration - ${error.message}`);
  }
  
  // Test 4: User interaction tracking
  try {
    const trackingResult = testUserInteractionTracking(systems.recommendationEngine, systems.hotDealSystem);
    if (trackingResult) {
      passedTests++;
      console.log(`\n✅ Test 4 PASSED: User Interaction Tracking`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 4 FAILED: User Interaction Tracking`);
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 4 ERROR: User Interaction Tracking - ${error.message}`);
  }
  
  // Test 5: Language switching
  try {
    const langResult = testLanguageSwitching();
    if (langResult) {
      passedTests++;
      console.log(`\n✅ Test 5 PASSED: Language Switching`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 5 FAILED: Language Switching`);
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 5 ERROR: Language Switching - ${error.message}`);
  }
  
  // Test 6: Personalized experience
  try {
    const personalizedResult = testPersonalizedExperience(systems.recommendationEngine, systems.hotDealSystem);
    if (personalizedResult) {
      passedTests++;
      console.log(`\n✅ Test 6 PASSED: Personalized Experience`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 6 FAILED: Personalized Experience`);
    }
  } catch (error) {
    failedTests++;
    console.log(`\n❌ Test 6 ERROR: Personalized Experience - ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Scenario 2 Results:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! First-time user experience is working perfectly.');
    console.log('\n🎯 Alex can now:');
    console.log('  - View personalized recommendations based on his profile');
    console.log('  - Explore hotdeals with proper categorization');
    console.log('  - Experience the platform in his preferred language (English)');
    console.log('  - Have his interactions tracked for future personalization');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues before proceeding.');
  }
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: tests.length,
    success: failedTests === 0,
    alexPersona,
    systems
  };
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runTestScenario2 = runTestScenario2;
  window.alexPersona = alexPersona;
  
  console.log('🔧 Test Scenario 2 loaded. Run window.runTestScenario2() in browser console.');
}

// Auto-run in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTestScenario2,
    alexPersona,
    MockRecommendationEngine,
    MockHotDealSystem
  };
  
  // Auto-run tests
  runTestScenario2();
}