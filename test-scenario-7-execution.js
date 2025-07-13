/**
 * Test Scenario 7: Shipping Tracking Automation and Real-time Notifications
 * 배송 추적 자동화 및 실시간 알림
 */

console.log('🚀 Starting Test Scenario 7: Shipping Tracking Automation and Real-time Notifications');

// Continue with Alex persona and purchase order from previous scenarios
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
  phone: '+82-10-1234-5678',
  notifications: {
    email: true,
    sms: false,
    push: true,
    whatsapp: false
  },
  timezone: 'America/New_York'
};

// Admin persona from Test Scenario 4
const adminPersona = {
  id: 'admin-kimminsu',
  email: 'admin@hiko.kr',
  name: '김민수',
  role: 'admin',
  department: 'Operations',
  position: 'Buy-for-me Operations Manager'
};

// Purchase order from Test Scenario 6
const purchaseOrder = {
  id: 'PO-1752387343868',
  quoteId: 'QUOTE-1752386885686',
  transactionId: 'TXN-1752387343868',
  userId: 'alex-test-2025',
  status: 'ready_to_purchase',
  assignedTo: 'admin@hiko.kr',
  productInfo: {
    title: 'Samsung Galaxy Buds Pro 2',
    quantity: 2,
    price: 89000,
    seller: 'Coupang',
    productUrl: 'https://www.coupang.com/vp/products/123456789'
  },
  shippingInfo: {
    name: 'Alex Johnson',
    phone: '+1-555-123-4567',
    email: 'alex.johnson@gmail.com',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States'
  },
  createdAt: new Date()
};

// Mock shipping tracking system
class MockShippingTrackingSystem {
  constructor() {
    this.trackingRecords = new Map();
    this.carrierAPIs = new Map();
    this.notifications = new Map();
    this.automationRules = new Map();
    this.initializeShippingData();
  }

  initializeShippingData() {
    // Initialize carrier APIs
    this.carrierAPIs.set('coupang', {
      name: 'Coupang Logistics',
      apiEndpoint: 'https://api.coupang.com/tracking',
      trackingFormat: 'CJ-{12digits}',
      domesticOnly: true,
      reliability: 95
    });

    this.carrierAPIs.set('kdx', {
      name: 'KDX Express',
      apiEndpoint: 'https://api.kdx.co.kr/tracking',
      trackingFormat: 'KDX{10digits}',
      international: true,
      reliability: 92
    });

    this.carrierAPIs.set('dhl', {
      name: 'DHL Express',
      apiEndpoint: 'https://api.dhl.com/tracking',
      trackingFormat: '{10digits}',
      international: true,
      reliability: 98
    });

    // Initialize automation rules
    this.automationRules.set('status_change', {
      triggers: ['shipped', 'in_transit', 'delivered', 'delayed'],
      actions: ['notify_customer', 'update_database', 'log_event']
    });

    this.automationRules.set('delay_detection', {
      threshold: 24, // hours
      actions: ['alert_admin', 'notify_customer', 'escalate_support']
    });
  }

  // Admin processes purchase order
  async processPurchaseOrder(purchaseOrderId, adminId) {
    console.log(`\n🛒 Admin ${adminId} processing purchase order: ${purchaseOrderId}`);
    
    // Simulate admin purchase process
    await this.simulateDelay(2000);
    
    const purchaseResult = {
      orderId: `ORDER-${Date.now()}`,
      purchaseOrderId,
      status: 'purchased',
      purchasedAt: new Date(),
      seller: 'Coupang',
      sellerOrderId: `COUPANG-${Date.now()}`,
      domesticTrackingNumber: `CJ-${Math.random().toString().substr(2, 12)}`,
      domesticCarrier: 'coupang',
      estimatedPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      specialNotes: 'Space Gray color confirmed and purchased',
      purchasedBy: adminId
    };

    console.log(`✅ Purchase completed successfully:`)
    console.log(`   Order ID: ${purchaseResult.orderId}`)
    console.log(`   Seller Order ID: ${purchaseResult.sellerOrderId}`)
    console.log(`   Domestic tracking: ${purchaseResult.domesticTrackingNumber}`)
    console.log(`   Estimated pickup: ${purchaseResult.estimatedPickupDate.toLocaleString()}`)
    console.log(`   Special notes: ${purchaseResult.specialNotes}`)

    return purchaseResult;
  }

  // Create shipping tracking record
  async createShippingTracking(orderId, purchaseResult, shippingInfo) {
    console.log(`\n📦 Creating shipping tracking for order: ${orderId}`);
    
    const trackingId = `TRACK-${Date.now()}`;
    
    const tracking = {
      id: trackingId,
      orderId,
      userId: purchaseResult.userId || 'alex-test-2025',
      status: 'processing',
      stages: {
        domestic: {
          carrier: purchaseResult.domesticCarrier,
          trackingNumber: purchaseResult.domesticTrackingNumber,
          status: 'pending_pickup',
          estimatedPickup: purchaseResult.estimatedPickupDate,
          estimatedDeliveryToHub: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          lastUpdated: new Date()
        },
        international: {
          carrier: 'dhl',
          trackingNumber: null, // Will be assigned when domestic delivery completes
          status: 'not_started',
          estimatedShipment: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
          estimatedDelivery: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
          lastUpdated: new Date()
        }
      },
      shippingAddress: shippingInfo,
      notifications: {
        lastSent: null,
        frequency: 'on_status_change',
        preferences: alexPersona.notifications
      },
      events: [
        {
          timestamp: new Date(),
          status: 'tracking_created',
          description: 'Shipping tracking initiated',
          location: 'Seoul, Korea',
          automated: true
        }
      ]
    };

    this.trackingRecords.set(trackingId, tracking);
    
    console.log(`✅ Shipping tracking created:`)
    console.log(`   Tracking ID: ${tracking.id}`)
    console.log(`   Status: ${tracking.status}`)
    console.log(`   Domestic carrier: ${tracking.stages.domestic.carrier}`)
    console.log(`   Domestic tracking: ${tracking.stages.domestic.trackingNumber}`)
    console.log(`   International carrier: ${tracking.stages.international.carrier}`)

    return tracking;
  }

  // Simulate domestic shipping events
  async simulateDomesticShipping(trackingId) {
    console.log(`\n🚚 Simulating domestic shipping events for: ${trackingId}`);
    
    const tracking = this.trackingRecords.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking record not found');
    }

    const domesticEvents = [
      {
        timestamp: new Date(Date.now() + 0.5 * 60 * 60 * 1000), // 30 min
        status: 'picked_up',
        description: 'Package picked up from seller',
        location: 'Seoul, Gangnam-gu',
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        status: 'in_transit_domestic',
        description: 'Package in transit to international shipping hub',
        location: 'Incheon Logistics Center',
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'arrived_at_hub',
        description: 'Package arrived at international shipping hub',
        location: 'Incheon International Airport',
        automated: true
      }
    ];

    for (const event of domesticEvents) {
      tracking.events.push(event);
      tracking.stages.domestic.status = event.status;
      tracking.stages.domestic.lastUpdated = event.timestamp;
      
      console.log(`📍 ${event.status}: ${event.description} (${event.location})`);
      
      // Trigger notification for each event
      await this.sendTrackingNotification(tracking.userId, trackingId, event);
    }

    // Update overall tracking status
    tracking.status = 'ready_for_international_shipping';
    tracking.stages.international.status = 'preparing_shipment';
    
    console.log(`✅ Domestic shipping simulation completed`)
    console.log(`   Current status: ${tracking.status}`)
    console.log(`   Events logged: ${tracking.events.length}`)

    return tracking;
  }

  // Simulate international shipping events
  async simulateInternationalShipping(trackingId) {
    console.log(`\n✈️ Simulating international shipping events for: ${trackingId}`);
    
    const tracking = this.trackingRecords.get(trackingId);
    if (!tracking) {
      throw new Error('Tracking record not found');
    }

    // Assign international tracking number
    const intlTrackingNumber = `${Math.random().toString().substr(2, 10)}`;
    tracking.stages.international.trackingNumber = intlTrackingNumber;

    const internationalEvents = [
      {
        timestamp: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
        status: 'shipped_international',
        description: 'Package shipped internationally via DHL',
        location: 'Incheon International Airport',
        trackingNumber: intlTrackingNumber,
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        status: 'in_transit_international',
        description: 'Package in transit - left Seoul',
        location: 'In Transit to USA',
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'customs_processing',
        description: 'Package arrived in destination country - customs processing',
        location: 'New York, NY - Customs',
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days
        status: 'out_for_delivery',
        description: 'Package out for delivery',
        location: 'New York, NY',
        automated: true
      },
      {
        timestamp: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days
        status: 'delivered',
        description: 'Package delivered successfully',
        location: '123 Main Street, Apt 4B, New York, NY',
        deliveredTo: 'Alex Johnson',
        signature: 'A.Johnson',
        automated: true
      }
    ];

    for (const event of internationalEvents) {
      tracking.events.push(event);
      tracking.stages.international.status = event.status;
      tracking.stages.international.lastUpdated = event.timestamp;
      
      console.log(`📍 ${event.status}: ${event.description} (${event.location})`);
      
      // Trigger notification for important events
      if (['shipped_international', 'customs_processing', 'out_for_delivery', 'delivered'].includes(event.status)) {
        await this.sendTrackingNotification(tracking.userId, trackingId, event);
      }
    }

    // Update overall tracking status
    tracking.status = 'delivered';
    
    console.log(`✅ International shipping simulation completed`)
    console.log(`   Final status: ${tracking.status}`)
    console.log(`   International tracking: ${intlTrackingNumber}`)
    console.log(`   Total events: ${tracking.events.length}`)

    return tracking;
  }

  // Send tracking notification to customer
  async sendTrackingNotification(userId, trackingId, event) {
    console.log(`\n📧 Sending tracking notification to user: ${userId}`);
    
    const tracking = this.trackingRecords.get(trackingId);
    const preferences = tracking.notifications.preferences;

    const notification = {
      id: `NOTIF-${Date.now()}`,
      userId,
      trackingId,
      type: 'tracking_update',
      title: this.getNotificationTitle(event.status),
      message: this.getNotificationMessage(event, tracking),
      event,
      channels: [],
      sentAt: new Date(),
      priority: this.getNotificationPriority(event.status)
    };

    // Determine notification channels based on user preferences
    if (preferences.email) notification.channels.push('email');
    if (preferences.push) notification.channels.push('push');
    if (preferences.sms) notification.channels.push('sms');

    // Store notification
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId).push(notification);

    console.log(`✅ Tracking notification sent:`)
    console.log(`   Title: ${notification.title}`)
    console.log(`   Message: ${notification.message}`)
    console.log(`   Channels: ${notification.channels.join(', ')}`)
    console.log(`   Priority: ${notification.priority}`)

    return notification;
  }

  getNotificationTitle(status) {
    const titles = {
      'picked_up': '📦 Package Picked Up',
      'in_transit_domestic': '🚚 Package in Transit (Korea)',
      'arrived_at_hub': '🏢 Arrived at Shipping Hub',
      'shipped_international': '✈️ Shipped Internationally',
      'in_transit_international': '🌍 In Transit to USA',
      'customs_processing': '🛃 Customs Processing',
      'out_for_delivery': '🚚 Out for Delivery',
      'delivered': '🎉 Package Delivered!'
    };
    return titles[status] || '📦 Shipping Update';
  }

  getNotificationMessage(event, tracking) {
    const productTitle = 'Samsung Galaxy Buds Pro 2';
    const messages = {
      'picked_up': `Your ${productTitle} has been picked up from the seller and is on its way to our shipping facility.`,
      'in_transit_domestic': `Your package is in transit within Korea heading to the international shipping hub.`,
      'arrived_at_hub': `Your package has arrived at our international shipping hub and will be shipped overseas soon.`,
      'shipped_international': `Great news! Your package has been shipped internationally. International tracking: ${tracking.stages.international.trackingNumber}`,
      'customs_processing': `Your package has arrived in the USA and is currently being processed by customs.`,
      'out_for_delivery': `Your package is out for delivery and should arrive today!`,
      'delivered': `Your ${productTitle} has been delivered successfully! Thank you for using HiKo.`
    };
    return messages[event.status] || `Shipping update: ${event.description}`;
  }

  getNotificationPriority(status) {
    const highPriority = ['shipped_international', 'out_for_delivery', 'delivered'];
    const mediumPriority = ['picked_up', 'customs_processing'];
    
    if (highPriority.includes(status)) return 'high';
    if (mediumPriority.includes(status)) return 'medium';
    return 'low';
  }

  // Check for shipping delays
  async monitorShippingDelays() {
    console.log('\n⏰ Monitoring for shipping delays...');
    
    let delaysDetected = 0;
    
    for (const [trackingId, tracking] of this.trackingRecords.entries()) {
      if (tracking.status === 'delivered') continue;
      
      const lastEvent = tracking.events[tracking.events.length - 1];
      const hoursSinceLastUpdate = (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60);
      
      const delayThreshold = this.automationRules.get('delay_detection').threshold;
      
      if (hoursSinceLastUpdate > delayThreshold) {
        delaysDetected++;
        console.log(`⚠️ Potential delay detected for tracking: ${trackingId}`);
        console.log(`   Hours since last update: ${hoursSinceLastUpdate.toFixed(1)}`);
        console.log(`   Last status: ${lastEvent.status}`);
        
        // Trigger delay notification
        await this.sendDelayNotification(tracking.userId, trackingId, hoursSinceLastUpdate);
      }
    }
    
    console.log(`✅ Delay monitoring completed: ${delaysDetected} potential delays detected`);
    return delaysDetected;
  }

  async sendDelayNotification(userId, trackingId, hoursSinceUpdate) {
    const delayNotification = {
      id: `DELAY-${Date.now()}`,
      userId,
      trackingId,
      type: 'shipping_delay',
      title: '⏰ Shipping Delay Notice',
      message: `We've noticed your package hasn't been updated in ${hoursSinceUpdate.toFixed(1)} hours. We're monitoring the situation and will keep you updated.`,
      hoursSinceUpdate,
      sentAt: new Date(),
      priority: 'medium'
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId).push(delayNotification);

    console.log(`📧 Delay notification sent to user: ${userId}`);
    return delayNotification;
  }

  // Generate tracking summary
  getTrackingHistory(trackingId) {
    const tracking = this.trackingRecords.get(trackingId);
    if (!tracking) return null;

    return {
      trackingId,
      currentStatus: tracking.status,
      domesticTracking: tracking.stages.domestic.trackingNumber,
      internationalTracking: tracking.stages.international.trackingNumber,
      totalEvents: tracking.events.length,
      lastUpdate: tracking.events[tracking.events.length - 1],
      estimatedDelivery: tracking.stages.international.estimatedDelivery,
      deliveryAddress: tracking.shippingAddress
    };
  }

  getUserNotifications(userId) {
    return this.notifications.get(userId) || [];
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Test functions
async function testPurchaseOrderProcessing(shippingSystem) {
  console.log('\n🛒 Purchase Order Processing Test...');
  
  try {
    const purchaseResult = await shippingSystem.processPurchaseOrder(
      purchaseOrder.id,
      adminPersona.id
    );
    
    if (purchaseResult && purchaseResult.status === 'purchased') {
      console.log('✅ Purchase order processing test successful');
      return purchaseResult;
    } else {
      console.log('❌ Purchase order processing test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Purchase order processing test failed:', error.message);
    return null;
  }
}

async function testShippingTrackingCreation(shippingSystem, purchaseResult) {
  console.log('\n📦 Shipping Tracking Creation Test...');
  
  try {
    if (!purchaseResult) {
      console.log('❌ Cannot create tracking without purchase result');
      return null;
    }

    const tracking = await shippingSystem.createShippingTracking(
      purchaseResult.orderId,
      { ...purchaseResult, userId: alexPersona.id },
      purchaseOrder.shippingInfo
    );

    if (tracking && tracking.status === 'processing') {
      console.log('✅ Shipping tracking creation test successful');
      return tracking;
    } else {
      console.log('❌ Shipping tracking creation test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Shipping tracking creation test failed:', error.message);
    return null;
  }
}

async function testDomesticShippingSimulation(shippingSystem, tracking) {
  console.log('\n🚚 Domestic Shipping Simulation Test...');
  
  try {
    if (!tracking) {
      console.log('❌ Cannot simulate domestic shipping without tracking');
      return null;
    }

    const updatedTracking = await shippingSystem.simulateDomesticShipping(tracking.id);

    if (updatedTracking && updatedTracking.status === 'ready_for_international_shipping') {
      console.log('✅ Domestic shipping simulation test successful');
      return updatedTracking;
    } else {
      console.log('❌ Domestic shipping simulation test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Domestic shipping simulation test failed:', error.message);
    return null;
  }
}

async function testInternationalShippingSimulation(shippingSystem, tracking) {
  console.log('\n✈️ International Shipping Simulation Test...');
  
  try {
    if (!tracking) {
      console.log('❌ Cannot simulate international shipping without tracking');
      return null;
    }

    const updatedTracking = await shippingSystem.simulateInternationalShipping(tracking.id);

    if (updatedTracking && updatedTracking.status === 'delivered') {
      console.log('✅ International shipping simulation test successful');
      return updatedTracking;
    } else {
      console.log('❌ International shipping simulation test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ International shipping simulation test failed:', error.message);
    return null;
  }
}

function testNotificationSystem(shippingSystem) {
  console.log('\n📧 Notification System Test...');
  
  try {
    const userNotifications = shippingSystem.getUserNotifications(alexPersona.id);
    
    console.log(`✅ Retrieved ${userNotifications.length} notifications for user`)
    
    if (userNotifications.length > 0) {
      const trackingNotifications = userNotifications.filter(n => n.type === 'tracking_update');
      const highPriorityNotifications = userNotifications.filter(n => n.priority === 'high');
      
      console.log(`   Tracking notifications: ${trackingNotifications.length}`);
      console.log(`   High priority notifications: ${highPriorityNotifications.length}`);
      
      // Display some sample notifications
      userNotifications.slice(-3).forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title}: ${notif.message.substring(0, 50)}...`);
      });
      
      return true;
    } else {
      console.log('❌ No notifications found');
      return false;
    }
  } catch (error) {
    console.error('❌ Notification system test failed:', error.message);
    return false;
  }
}

async function testDelayMonitoring(shippingSystem) {
  console.log('\n⏰ Delay Monitoring Test...');
  
  try {
    const delaysDetected = await shippingSystem.monitorShippingDelays();
    
    console.log(`✅ Delay monitoring test completed`)
    console.log(`   Delays detected: ${delaysDetected}`)
    
    return true;
  } catch (error) {
    console.error('❌ Delay monitoring test failed:', error.message);
    return false;
  }
}

function testTrackingHistory(shippingSystem, trackingId) {
  console.log('\n📋 Tracking History Test...');
  
  try {
    if (!trackingId) {
      console.log('❌ Cannot test tracking history without tracking ID');
      return false;
    }

    const history = shippingSystem.getTrackingHistory(trackingId);
    
    if (history) {
      console.log(`✅ Tracking history retrieved successfully:`)
      console.log(`   Tracking ID: ${history.trackingId}`)
      console.log(`   Current status: ${history.currentStatus}`)
      console.log(`   Domestic tracking: ${history.domesticTracking}`)
      console.log(`   International tracking: ${history.internationalTracking}`)
      console.log(`   Total events: ${history.totalEvents}`)
      console.log(`   Last update: ${history.lastUpdate.description}`)
      
      return true;
    } else {
      console.log('❌ Tracking history test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Tracking history test failed:', error.message);
    return false;
  }
}

async function runTestScenario7() {
  console.log('🧪 Running Test Scenario 7 - Shipping Tracking Automation and Real-time Notifications\n');
  
  const tests = [
    { name: 'Purchase Order Processing', fn: null },
    { name: 'Shipping Tracking Creation', fn: null },
    { name: 'Domestic Shipping Simulation', fn: null },
    { name: 'International Shipping Simulation', fn: null },
    { name: 'Notification System', fn: null },
    { name: 'Delay Monitoring', fn: null },
    { name: 'Tracking History', fn: null }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  let shippingSystem = null;
  let purchaseResult = null;
  let tracking = null;
  
  try {
    // Initialize shipping tracking system
    shippingSystem = new MockShippingTrackingSystem();
    console.log('✅ Shipping tracking system initialized');
    
    // Test 1: Purchase Order Processing
    console.log('\n' + '='.repeat(50));
    purchaseResult = await testPurchaseOrderProcessing(shippingSystem);
    if (purchaseResult) {
      passedTests++;
      console.log(`\n✅ Test 1 PASSED: Purchase Order Processing`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 1 FAILED: Purchase Order Processing`);
    }
    
    // Test 2: Shipping Tracking Creation
    console.log('\n' + '='.repeat(50));
    tracking = await testShippingTrackingCreation(shippingSystem, purchaseResult);
    if (tracking) {
      passedTests++;
      console.log(`\n✅ Test 2 PASSED: Shipping Tracking Creation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 2 FAILED: Shipping Tracking Creation`);
    }
    
    // Test 3: Domestic Shipping Simulation
    console.log('\n' + '='.repeat(50));
    const domesticResult = await testDomesticShippingSimulation(shippingSystem, tracking);
    if (domesticResult) {
      passedTests++;
      tracking = domesticResult; // Update tracking reference
      console.log(`\n✅ Test 3 PASSED: Domestic Shipping Simulation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 3 FAILED: Domestic Shipping Simulation`);
    }
    
    // Test 4: International Shipping Simulation
    console.log('\n' + '='.repeat(50));
    const internationalResult = await testInternationalShippingSimulation(shippingSystem, tracking);
    if (internationalResult) {
      passedTests++;
      tracking = internationalResult; // Update tracking reference
      console.log(`\n✅ Test 4 PASSED: International Shipping Simulation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 4 FAILED: International Shipping Simulation`);
    }
    
    // Test 5: Notification System
    console.log('\n' + '='.repeat(50));
    const notificationResult = testNotificationSystem(shippingSystem);
    if (notificationResult) {
      passedTests++;
      console.log(`\n✅ Test 5 PASSED: Notification System`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 5 FAILED: Notification System`);
    }
    
    // Test 6: Delay Monitoring
    console.log('\n' + '='.repeat(50));
    const delayResult = await testDelayMonitoring(shippingSystem);
    if (delayResult) {
      passedTests++;
      console.log(`\n✅ Test 6 PASSED: Delay Monitoring`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 6 FAILED: Delay Monitoring`);
    }
    
    // Test 7: Tracking History
    console.log('\n' + '='.repeat(50));
    const historyResult = testTrackingHistory(shippingSystem, tracking?.id);
    if (historyResult) {
      passedTests++;
      console.log(`\n✅ Test 7 PASSED: Tracking History`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 7 FAILED: Tracking History`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    failedTests++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Scenario 7 Results:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Shipping tracking automation working perfectly.');
    console.log('\n🎯 Complete shipping journey demonstrated:');
    console.log('  ✅ Admin processed purchase order successfully');
    console.log('  ✅ Automatic shipping tracking creation');
    console.log('  ✅ Domestic shipping events with notifications');
    console.log('  ✅ International shipping with customs tracking');
    console.log('  ✅ Real-time notifications sent to Alex');
    console.log('  ✅ Automated delay monitoring system');
    console.log('  ✅ Complete tracking history available');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues before proceeding.');
  }
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: tests.length,
    success: failedTests === 0,
    results: {
      alexPersona,
      adminPersona,
      purchaseOrder,
      purchaseResult,
      tracking,
      shippingSystem
    }
  };
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runTestScenario7 = runTestScenario7;
  window.alexPersona = alexPersona;
  window.purchaseOrder = purchaseOrder;
  
  console.log('🔧 Test Scenario 7 loaded. Run window.runTestScenario7() in browser console.');
}

// Auto-run in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTestScenario7,
    alexPersona,
    purchaseOrder,
    MockShippingTrackingSystem
  };
  
  // Auto-run tests
  runTestScenario7();
}