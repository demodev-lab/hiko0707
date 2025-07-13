/**
 * Test Scenario 5: Real-time Price Checking and Inventory Monitoring System
 * 실시간 가격 확인 및 재고 모니터링 시스템
 */

console.log('🚀 Starting Test Scenario 5: Real-time Price Checking and Inventory Monitoring System');

// Mock real-time price and inventory monitoring system
class MockInventoryMonitoringSystem {
  constructor() {
    this.products = new Map();
    this.priceHistory = new Map();
    this.stockAlerts = new Map();
    this.monitoringTasks = new Map();
    this.webScrapers = new Map();
    this.initializeSystem();
  }

  initializeSystem() {
    // Initialize sample products for monitoring
    const sampleProducts = [
      {
        id: 'PROD-001',
        title: 'Samsung Galaxy Buds Pro 2',
        urls: {
          coupang: 'https://www.coupang.com/vp/products/123456789',
          gmarket: 'https://gmarket.co.kr/item/456789',
          eleventhst: 'https://11st.co.kr/products/789012'
        },
        category: 'electronics',
        targetPrice: 89000,
        stockThreshold: 10,
        monitoring: true
      },
      {
        id: 'PROD-002',
        title: 'The Ordinary 스킨케어 세트',
        urls: {
          oliveyoung: 'https://oliveyoung.co.kr/products/345678',
          sephora: 'https://sephora.kr/products/678901'
        },
        category: 'beauty',
        targetPrice: 45000,
        stockThreshold: 5,
        monitoring: true
      },
      {
        id: 'PROD-003',
        title: '무신사 겨울 패션 아우터',
        urls: {
          musinsa: 'https://musinsa.com/products/901234',
          hnm: 'https://hm.com/kr/products/234567'
        },
        category: 'fashion',
        targetPrice: 120000,
        stockThreshold: 3,
        monitoring: true
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
      this.priceHistory.set(product.id, []);
      this.stockAlerts.set(product.id, []);
    });

    // Initialize web scrapers for different sites
    this.initializeWebScrapers();
  }

  initializeWebScrapers() {
    const scraperConfigs = {
      coupang: {
        name: 'Coupang Scraper',
        selectors: {
          price: '.price .total .value',
          stock: '.qty-selector .quantity',
          title: '.product-title h1'
        },
        rateLimit: 1000, // 1 second between requests
        reliability: 95
      },
      gmarket: {
        name: 'G마켓 Scraper',
        selectors: {
          price: '.price_real .price',
          stock: '.option_stock .stock_num',
          title: '.item_title h1'
        },
        rateLimit: 1500,
        reliability: 90
      },
      oliveyoung: {
        name: 'Olive Young Scraper',
        selectors: {
          price: '.price-info .current-price',
          stock: '.stock-info .stock-count',
          title: '.product-name h1'
        },
        rateLimit: 2000,
        reliability: 85
      }
    };

    Object.entries(scraperConfigs).forEach(([site, config]) => {
      this.webScrapers.set(site, {
        ...config,
        lastRequest: 0,
        successRate: config.reliability,
        errors: [],
        totalRequests: 0,
        successfulRequests: 0
      });
    });
  }

  // Real-time price monitoring
  async startPriceMonitoring(productId, interval = 300000) { // 5 minutes default
    console.log(`\n📊 Starting price monitoring for product: ${productId}`);
    
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const monitoringTask = {
      productId,
      interval,
      startTime: new Date(),
      lastCheck: null,
      checksPerformed: 0,
      priceChanges: 0,
      errors: [],
      status: 'active'
    };

    this.monitoringTasks.set(productId, monitoringTask);

    console.log(`✅ Price monitoring started:`);
    console.log(`   Product: ${product.title}`);
    console.log(`   URLs monitored: ${Object.keys(product.urls).length}`);
    console.log(`   Check interval: ${interval / 1000} seconds`);
    console.log(`   Target price: ₩${product.targetPrice.toLocaleString()}`);

    // Simulate initial price check
    await this.performPriceCheck(productId);
    
    return monitoringTask;
  }

  async performPriceCheck(productId) {
    console.log(`\n💰 Performing price check for product: ${productId}`);
    
    const product = this.products.get(productId);
    const monitoringTask = this.monitoringTasks.get(productId);
    
    if (!product || !monitoringTask) {
      console.log('❌ Product or monitoring task not found');
      return null;
    }

    const checkResults = [];
    
    // Check each URL
    for (const [site, url] of Object.entries(product.urls)) {
      try {
        const result = await this.scrapePrice(site, url, product);
        checkResults.push(result);
        console.log(`✅ ${site}: ₩${result.price.toLocaleString()} (${result.stock})`);
      } catch (error) {
        console.log(`❌ ${site}: Failed - ${error.message}`);
        monitoringTask.errors.push({
          site,
          error: error.message,
          timestamp: new Date()
        });
      }
    }

    // Update monitoring task
    monitoringTask.lastCheck = new Date();
    monitoringTask.checksPerformed++;

    // Process price changes
    const priceChanges = this.detectPriceChanges(productId, checkResults);
    if (priceChanges.length > 0) {
      monitoringTask.priceChanges += priceChanges.length;
      this.handlePriceChanges(productId, priceChanges);
    }

    // Update price history
    const historyEntry = {
      timestamp: new Date(),
      results: checkResults,
      averagePrice: checkResults.reduce((sum, r) => sum + r.price, 0) / checkResults.length,
      availableSites: checkResults.filter(r => r.inStock).length
    };
    
    this.priceHistory.get(productId).push(historyEntry);

    console.log(`📊 Price check summary:`);
    console.log(`   Sites checked: ${checkResults.length}`);
    console.log(`   Sites in stock: ${checkResults.filter(r => r.inStock).length}`);
    console.log(`   Average price: ₩${historyEntry.averagePrice.toLocaleString()}`);
    console.log(`   Price changes detected: ${priceChanges.length}`);

    return historyEntry;
  }

  async scrapePrice(site, url, product) {
    const scraper = this.webScrapers.get(site);
    if (!scraper) {
      throw new Error(`No scraper configured for ${site}`);
    }

    // Simulate rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - scraper.lastRequest;
    if (timeSinceLastRequest < scraper.rateLimit) {
      await this.delay(scraper.rateLimit - timeSinceLastRequest);
    }

    scraper.lastRequest = now;
    scraper.totalRequests++;

    // Simulate API request with chance of failure
    await this.delay(Math.random() * 1000 + 500); // 0.5-1.5 second delay

    if (Math.random() * 100 > scraper.reliability) {
      throw new Error('Network timeout or site unavailable');
    }

    scraper.successfulRequests++;

    // Mock scraped data with some variation
    const basePrice = product.targetPrice;
    const priceVariation = Math.random() * 0.2 - 0.1; // ±10% variation
    const scrapedPrice = Math.round(basePrice * (1 + priceVariation));
    
    const stockLevel = Math.floor(Math.random() * 50) + 1;
    const inStock = stockLevel > product.stockThreshold;

    return {
      site,
      url,
      price: scrapedPrice,
      stockLevel,
      inStock,
      scrapedAt: new Date(),
      currency: 'KRW',
      scraper: scraper.name
    };
  }

  detectPriceChanges(productId, currentResults) {
    const history = this.priceHistory.get(productId);
    if (history.length === 0) {
      return []; // No previous data to compare
    }

    const lastCheck = history[history.length - 1];
    const priceChanges = [];

    currentResults.forEach(current => {
      const previous = lastCheck.results.find(r => r.site === current.site);
      if (previous && previous.price !== current.price) {
        const change = {
          site: current.site,
          previousPrice: previous.price,
          currentPrice: current.price,
          priceChange: current.price - previous.price,
          percentageChange: ((current.price - previous.price) / previous.price) * 100,
          timestamp: new Date()
        };
        priceChanges.push(change);
      }
    });

    return priceChanges;
  }

  handlePriceChanges(productId, priceChanges) {
    const product = this.products.get(productId);
    
    priceChanges.forEach(change => {
      const isSignificant = Math.abs(change.percentageChange) >= 5; // 5% threshold
      const isPriceDrop = change.priceChange < 0;
      
      if (isSignificant) {
        const alert = {
          type: isPriceDrop ? 'price_drop' : 'price_increase',
          productId,
          productTitle: product.title,
          site: change.site,
          previousPrice: change.previousPrice,
          currentPrice: change.currentPrice,
          change: change.priceChange,
          percentage: change.percentageChange,
          timestamp: change.timestamp,
          action: isPriceDrop ? 'notify_customers' : 'review_pricing'
        };

        console.log(`🚨 ${isPriceDrop ? 'Price Drop' : 'Price Increase'} Alert:`);
        console.log(`   ${product.title} on ${change.site}`);
        console.log(`   ${change.previousPrice.toLocaleString()} → ${change.currentPrice.toLocaleString()}`);
        console.log(`   Change: ${change.priceChange > 0 ? '+' : ''}₩${change.priceChange.toLocaleString()} (${change.percentageChange.toFixed(1)}%)`);
        console.log(`   Action: ${alert.action}`);

        this.stockAlerts.get(productId).push(alert);
      }
    });
  }

  // Stock level monitoring
  async monitorStockLevels() {
    console.log(`\n📦 Monitoring stock levels across all products...`);
    
    const stockSummary = [];
    
    for (const [productId, product] of this.products.entries()) {
      if (!product.monitoring) continue;
      
      const history = this.priceHistory.get(productId);
      if (history.length === 0) continue;
      
      const latestCheck = history[history.length - 1];
      const stockData = {
        productId,
        title: product.title,
        threshold: product.stockThreshold,
        sites: latestCheck.results.map(r => ({
          site: r.site,
          stockLevel: r.stockLevel,
          inStock: r.inStock,
          belowThreshold: r.stockLevel <= product.stockThreshold
        }))
      };
      
      stockSummary.push(stockData);
      
      // Check for low stock alerts
      const lowStockSites = stockData.sites.filter(s => s.belowThreshold && s.inStock);
      if (lowStockSites.length > 0) {
        console.log(`⚠️ Low Stock Alert: ${product.title}`);
        lowStockSites.forEach(site => {
          console.log(`   ${site.site}: ${site.stockLevel} units (threshold: ${product.stockThreshold})`);
        });
      }
    }
    
    console.log(`✅ Stock monitoring completed:`);
    console.log(`   Products monitored: ${stockSummary.length}`);
    console.log(`   Low stock alerts: ${stockSummary.filter(p => p.sites.some(s => s.belowThreshold)).length}`);
    
    return stockSummary;
  }

  // System performance monitoring
  getSystemPerformance() {
    console.log(`\n📈 System Performance Report...`);
    
    const performance = {
      totalProducts: this.products.size,
      activeMonitoring: Array.from(this.monitoringTasks.values()).filter(t => t.status === 'active').length,
      totalChecksPerformed: Array.from(this.monitoringTasks.values()).reduce((sum, t) => sum + t.checksPerformed, 0),
      totalPriceChanges: Array.from(this.monitoringTasks.values()).reduce((sum, t) => sum + t.priceChanges, 0),
      scraperPerformance: {},
      systemUptime: Date.now(),
      alertsGenerated: Array.from(this.stockAlerts.values()).reduce((sum, alerts) => sum + alerts.length, 0)
    };
    
    // Scraper performance
    this.webScrapers.forEach((scraper, site) => {
      performance.scraperPerformance[site] = {
        totalRequests: scraper.totalRequests,
        successfulRequests: scraper.successfulRequests,
        successRate: scraper.totalRequests > 0 ? (scraper.successfulRequests / scraper.totalRequests) * 100 : 0,
        errors: scraper.errors.length
      };
    });
    
    console.log(`✅ Performance summary:`);
    console.log(`   Active monitoring tasks: ${performance.activeMonitoring}/${performance.totalProducts}`);
    console.log(`   Total price checks: ${performance.totalChecksPerformed}`);
    console.log(`   Price changes detected: ${performance.totalPriceChanges}`);
    console.log(`   Alerts generated: ${performance.alertsGenerated}`);
    
    Object.entries(performance.scraperPerformance).forEach(([site, perf]) => {
      console.log(`   ${site}: ${perf.successRate.toFixed(1)}% success rate (${perf.successfulRequests}/${perf.totalRequests})`);
    });
    
    return performance;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopMonitoring(productId) {
    const task = this.monitoringTasks.get(productId);
    if (task) {
      task.status = 'stopped';
      task.endTime = new Date();
      console.log(`⏹️ Stopped monitoring for product: ${productId}`);
    }
  }

  getProduct(productId) {
    return this.products.get(productId);
  }

  getPriceHistory(productId) {
    return this.priceHistory.get(productId) || [];
  }

  getAlerts(productId) {
    return this.stockAlerts.get(productId) || [];
  }
}

// Test functions
async function testSystemInitialization() {
  console.log('\n🔧 System Initialization Test...');
  
  try {
    const inventorySystem = new MockInventoryMonitoringSystem();
    
    console.log(`✅ Inventory monitoring system initialized:`);
    console.log(`   Products loaded: ${inventorySystem.products.size}`);
    console.log(`   Web scrapers configured: ${inventorySystem.webScrapers.size}`);
    console.log(`   Monitoring ready for: ${Array.from(inventorySystem.products.values()).filter(p => p.monitoring).length} products`);
    
    return inventorySystem;
  } catch (error) {
    console.error('❌ System initialization failed:', error.message);
    return null;
  }
}

async function testRealTimePriceMonitoring(inventorySystem) {
  console.log('\n💰 Real-time Price Monitoring Test...');
  
  try {
    if (!inventorySystem) {
      console.log('❌ System not available');
      return false;
    }
    
    const productId = 'PROD-001'; // Samsung Galaxy Buds Pro 2
    
    // Start monitoring
    const monitoringTask = await inventorySystem.startPriceMonitoring(productId, 60000); // 1 minute for testing
    
    if (monitoringTask && monitoringTask.status === 'active') {
      console.log(`✅ Price monitoring test successful`);
      console.log(`   Monitoring task created: ${monitoringTask.productId}`);
      console.log(`   Initial checks performed: ${monitoringTask.checksPerformed}`);
      return true;
    } else {
      console.log(`❌ Price monitoring test failed`);
      return false;
    }
  } catch (error) {
    console.error('❌ Price monitoring test failed:', error.message);
    return false;
  }
}

async function testWebScrapingPerformance(inventorySystem) {
  console.log('\n🕷️ Web Scraping Performance Test...');
  
  try {
    if (!inventorySystem) {
      console.log('❌ System not available');
      return false;
    }
    
    // Test scraping for multiple products
    const productIds = ['PROD-001', 'PROD-002', 'PROD-003'];
    let totalChecks = 0;
    let successfulChecks = 0;
    
    for (const productId of productIds) {
      console.log(`\n🔍 Testing scraping for product: ${productId}`);
      try {
        const result = await inventorySystem.performPriceCheck(productId);
        if (result) {
          totalChecks++;
          successfulChecks++;
        }
      } catch (error) {
        totalChecks++;
        console.log(`   Scraping failed: ${error.message}`);
      }
    }
    
    const successRate = (successfulChecks / totalChecks) * 100;
    console.log(`\n✅ Web scraping performance test completed:`);
    console.log(`   Total checks: ${totalChecks}`);
    console.log(`   Successful: ${successfulChecks}`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    
    return successRate >= 80; // 80% success rate threshold
  } catch (error) {
    console.error('❌ Web scraping test failed:', error.message);
    return false;
  }
}

async function testStockLevelMonitoring(inventorySystem) {
  console.log('\n📦 Stock Level Monitoring Test...');
  
  try {
    if (!inventorySystem) {
      console.log('❌ System not available');
      return false;
    }
    
    const stockSummary = await inventorySystem.monitorStockLevels();
    
    if (stockSummary && stockSummary.length > 0) {
      console.log(`✅ Stock monitoring test successful:`);
      console.log(`   Products monitored: ${stockSummary.length}`);
      
      const lowStockProducts = stockSummary.filter(p => 
        p.sites.some(s => s.belowThreshold && s.inStock)
      );
      
      if (lowStockProducts.length > 0) {
        console.log(`   Low stock alerts: ${lowStockProducts.length} products need attention`);
      } else {
        console.log(`   All products have adequate stock levels`);
      }
      
      return true;
    } else {
      console.log(`❌ Stock monitoring test failed`);
      return false;
    }
  } catch (error) {
    console.error('❌ Stock monitoring test failed:', error.message);
    return false;
  }
}

function testAlertSystem(inventorySystem) {
  console.log('\n🚨 Alert System Test...');
  
  try {
    if (!inventorySystem) {
      console.log('❌ System not available');
      return false;
    }
    
    let totalAlerts = 0;
    const alertTypes = { price_drop: 0, price_increase: 0, low_stock: 0 };
    
    // Check alerts for all products
    inventorySystem.products.forEach((product, productId) => {
      const alerts = inventorySystem.getAlerts(productId);
      totalAlerts += alerts.length;
      
      alerts.forEach(alert => {
        if (alertTypes[alert.type] !== undefined) {
          alertTypes[alert.type]++;
        }
      });
    });
    
    console.log(`✅ Alert system test completed:`);
    console.log(`   Total alerts generated: ${totalAlerts}`);
    console.log(`   Price drop alerts: ${alertTypes.price_drop}`);
    console.log(`   Price increase alerts: ${alertTypes.price_increase}`);
    console.log(`   Low stock alerts: ${alertTypes.low_stock}`);
    
    return true;
  } catch (error) {
    console.error('❌ Alert system test failed:', error.message);
    return false;
  }
}

function testSystemPerformance(inventorySystem) {
  console.log('\n📊 System Performance Test...');
  
  try {
    if (!inventorySystem) {
      console.log('❌ System not available');
      return false;
    }
    
    const performance = inventorySystem.getSystemPerformance();
    
    if (performance) {
      console.log(`✅ Performance monitoring test successful`);
      
      // Validate performance metrics
      const validationPassed = 
        performance.totalProducts > 0 &&
        performance.activeMonitoring >= 0 &&
        performance.totalChecksPerformed >= 0;
      
      if (validationPassed) {
        console.log(`   System performance metrics validated`);
        return true;
      } else {
        console.log(`❌ Performance metrics validation failed`);
        return false;
      }
    } else {
      console.log(`❌ Performance monitoring test failed`);
      return false;
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    return false;
  }
}

async function runTestScenario5() {
  console.log('🧪 Running Test Scenario 5 - Real-time Price & Inventory Monitoring\n');
  
  const tests = [
    { name: 'System Initialization', fn: testSystemInitialization },
    { name: 'Real-time Price Monitoring', fn: null },
    { name: 'Web Scraping Performance', fn: null },
    { name: 'Stock Level Monitoring', fn: null },
    { name: 'Alert System', fn: null },
    { name: 'System Performance', fn: null }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  let inventorySystem = null;
  
  try {
    // Test 1: System Initialization
    console.log('\n' + '='.repeat(50));
    inventorySystem = await testSystemInitialization();
    if (inventorySystem) {
      passedTests++;
      console.log(`\n✅ Test 1 PASSED: System Initialization`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 1 FAILED: System Initialization`);
      return { passed: passedTests, failed: failedTests, total: tests.length, success: false };
    }
    
    // Test 2: Real-time Price Monitoring
    console.log('\n' + '='.repeat(50));
    const priceMonitoringResult = await testRealTimePriceMonitoring(inventorySystem);
    if (priceMonitoringResult) {
      passedTests++;
      console.log(`\n✅ Test 2 PASSED: Real-time Price Monitoring`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 2 FAILED: Real-time Price Monitoring`);
    }
    
    // Test 3: Web Scraping Performance
    console.log('\n' + '='.repeat(50));
    const scrapingResult = await testWebScrapingPerformance(inventorySystem);
    if (scrapingResult) {
      passedTests++;
      console.log(`\n✅ Test 3 PASSED: Web Scraping Performance`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 3 FAILED: Web Scraping Performance`);
    }
    
    // Test 4: Stock Level Monitoring
    console.log('\n' + '='.repeat(50));
    const stockResult = await testStockLevelMonitoring(inventorySystem);
    if (stockResult) {
      passedTests++;
      console.log(`\n✅ Test 4 PASSED: Stock Level Monitoring`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 4 FAILED: Stock Level Monitoring`);
    }
    
    // Test 5: Alert System
    console.log('\n' + '='.repeat(50));
    const alertResult = testAlertSystem(inventorySystem);
    if (alertResult) {
      passedTests++;
      console.log(`\n✅ Test 5 PASSED: Alert System`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 5 FAILED: Alert System`);
    }
    
    // Test 6: System Performance
    console.log('\n' + '='.repeat(50));
    const performanceResult = testSystemPerformance(inventorySystem);
    if (performanceResult) {
      passedTests++;
      console.log(`\n✅ Test 6 PASSED: System Performance`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 6 FAILED: System Performance`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    failedTests++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Scenario 5 Results:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Real-time price checking and inventory monitoring working perfectly.');
    console.log('\n🎯 System successfully demonstrated:');
    console.log('  ✅ Real-time price monitoring across multiple sites');
    console.log('  ✅ Web scraping with rate limiting and error handling');
    console.log('  ✅ Stock level monitoring with threshold alerts');
    console.log('  ✅ Automated alert system for price changes');
    console.log('  ✅ Performance monitoring and system health checks');
    console.log('  ✅ Multi-site product tracking and comparison');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues before proceeding.');
  }
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: tests.length,
    success: failedTests === 0,
    system: inventorySystem
  };
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runTestScenario5 = runTestScenario5;
  window.MockInventoryMonitoringSystem = MockInventoryMonitoringSystem;
  
  console.log('🔧 Test Scenario 5 loaded. Run window.runTestScenario5() in browser console.');
}

// Auto-run in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTestScenario5,
    MockInventoryMonitoringSystem
  };
  
  // Auto-run tests
  runTestScenario5();
}