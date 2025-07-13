/**
 * Test Scenario 3: Buy-for-me Application Process (2-step process)
 * 대리구매 신청 프로세스 (2단계 프로세스)
 */

console.log('🚀 Starting Test Scenario 3: Buy-for-me Application Process');

// Alex persona continuing from previous scenarios
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
  createdAt: new Date()
};

// Selected hotdeal for purchase
const selectedHotDeal = {
  id: 'hd-1',
  title: 'Samsung Galaxy Buds Pro 2',
  price: '89000',
  originalPrice: '120000',
  discountRate: '26%',
  imageUrl: '/images/products/electronics/galaxy-buds.jpg',
  productUrl: 'https://www.coupang.com/vp/products/123456789',
  category: 'electronics',
  seller: 'Coupang',
  deadline: '2025-01-16 23:59:59',
  shippingFee: 2500,
  estimatedShipping: '3-5 business days'
};

// Mock buy-for-me system
class MockBuyForMeSystem {
  constructor() {
    this.requests = new Map();
    this.addressBook = new Map();
    this.requestCounter = 1;
  }

  // Step 1: Initial application
  createInitialRequest(userId, productInfo, basicInfo) {
    console.log(`\n📝 Step 1: Creating initial buy-for-me request...`);
    
    const requestId = `BFM-${Date.now()}-${this.requestCounter++}`;
    
    const request = {
      id: requestId,
      userId,
      status: 'initial_review', // Step 1 status
      productInfo: {
        ...productInfo,
        requestedQuantity: basicInfo.quantity,
        specialRequests: basicInfo.specialRequests
      },
      basicInfo,
      estimatedCosts: this.calculateEstimatedCosts(productInfo, basicInfo),
      createdAt: new Date(),
      updatedAt: new Date(),
      step: 1, // Currently at step 1
      nextAction: 'await_detailed_info' // What needs to happen next
    };
    
    this.requests.set(requestId, request);
    console.log(`✅ Initial request created: ${requestId}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Product: ${productInfo.title}`);
    console.log(`   Quantity: ${basicInfo.quantity}`);
    
    return request;
  }

  // Calculate estimated costs for step 1
  calculateEstimatedCosts(productInfo, basicInfo) {
    const productPrice = parseInt(productInfo.price) * basicInfo.quantity;
    const shippingFee = productInfo.shippingFee || 2500;
    const commissionRate = 0.08; // 8%
    const commission = Math.round(productPrice * commissionRate);
    const internationalShipping = 15000; // Estimated international shipping
    
    return {
      productPrice,
      commission,
      domesticShipping: shippingFee,
      internationalShipping,
      total: productPrice + commission + shippingFee + internationalShipping,
      currency: 'KRW',
      breakdown: {
        product: productPrice,
        commission: `${commission} (8%)`,
        domesticShipping: shippingFee,
        internationalShipping: internationalShipping
      }
    };
  }

  // Step 2: Complete application with detailed info
  completeRequest(requestId, detailedInfo) {
    console.log(`\n📋 Step 2: Completing buy-for-me request with detailed info...`);
    
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }
    
    // Update request to step 2
    const updatedRequest = {
      ...request,
      status: 'pending_review', // Now ready for admin review
      shippingInfo: detailedInfo.shippingInfo,
      paymentPreference: detailedInfo.paymentPreference,
      specialRequests: detailedInfo.specialRequests,
      step: 2, // Completed step 2
      nextAction: 'admin_review', // Ready for admin
      updatedAt: new Date()
    };
    
    this.requests.set(requestId, updatedRequest);
    console.log(`✅ Request completed: ${requestId}`);
    console.log(`   Status: ${updatedRequest.status}`);
    console.log(`   Shipping to: ${detailedInfo.shippingInfo.address}`);
    console.log(`   Payment: ${detailedInfo.paymentPreference}`);
    
    return updatedRequest;
  }

  // Save address to address book
  saveAddress(userId, addressInfo) {
    const addressId = `addr-${Date.now()}`;
    const address = {
      id: addressId,
      userId,
      ...addressInfo,
      createdAt: new Date(),
      isDefault: false
    };
    
    if (!this.addressBook.has(userId)) {
      this.addressBook.set(userId, []);
    }
    
    const userAddresses = this.addressBook.get(userId);
    userAddresses.push(address);
    
    console.log(`✅ Address saved: ${addressId}`);
    return address;
  }

  getUserAddresses(userId) {
    return this.addressBook.get(userId) || [];
  }

  getRequest(requestId) {
    return this.requests.get(requestId);
  }

  getUserRequests(userId) {
    return Array.from(this.requests.values()).filter(req => req.userId === userId);
  }
}

// Test functions
function testStep1InitialApplication(buyForMeSystem) {
  console.log('\n🛒 Step 1 Test: Initial Application Process...');
  
  try {
    // Simulate Alex clicking "Buy for me" on a hotdeal
    console.log(`👤 Alex (${alexPersona.name}) wants to buy: ${selectedHotDeal.title}`);
    
    const basicInfo = {
      quantity: 2,
      urgency: 'normal',
      specialRequests: 'Please check if the color is Space Gray before purchasing'
    };
    
    // Create initial request
    const initialRequest = buyForMeSystem.createInitialRequest(
      alexPersona.id,
      selectedHotDeal,
      basicInfo
    );
    
    // Verify request creation
    if (initialRequest && initialRequest.step === 1) {
      console.log('✅ Step 1 completed successfully');
      console.log(`   Request ID: ${initialRequest.id}`);
      console.log(`   Estimated total: ₩${initialRequest.estimatedCosts.total.toLocaleString()}`);
      console.log(`   Commission: ₩${initialRequest.estimatedCosts.commission.toLocaleString()}`);
      return initialRequest;
    } else {
      console.log('❌ Step 1 failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Step 1 error:', error.message);
    return null;
  }
}

function testStep2DetailedInformation(buyForMeSystem, initialRequest) {
  console.log('\n📝 Step 2 Test: Detailed Information Submission...');
  
  try {
    if (!initialRequest) {
      console.log('❌ Cannot proceed without initial request');
      return null;
    }
    
    console.log(`📋 Completing request ${initialRequest.id} with detailed information...`);
    
    // Alex provides detailed shipping and payment information
    const detailedInfo = {
      shippingInfo: {
        fullName: 'Alex Johnson',
        phoneNumber: '+1-555-123-4567',
        email: 'alex.johnson@gmail.com',
        address: '123 Main Street, Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        detailAddress: 'Please leave at front desk'
      },
      paymentPreference: 'paypal',
      paymentEmail: 'alex.johnson@paypal.com',
      specialRequests: 'Please double-check the product model number before purchasing. If the Space Gray color is not available, please contact me before buying an alternative color.',
      insuranceRequested: true,
      expeditedShipping: false
    };
    
    // Complete the request
    const completedRequest = buyForMeSystem.completeRequest(initialRequest.id, detailedInfo);
    
    // Save address to address book
    const savedAddress = buyForMeSystem.saveAddress(alexPersona.id, {
      name: 'Home Address (USA)',
      ...detailedInfo.shippingInfo
    });
    
    if (completedRequest && completedRequest.step === 2) {
      console.log('✅ Step 2 completed successfully');
      console.log(`   Status: ${completedRequest.status}`);
      console.log(`   Ready for admin review`);
      console.log(`   Address saved: ${savedAddress.id}`);
      return completedRequest;
    } else {
      console.log('❌ Step 2 failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Step 2 error:', error.message);
    return null;
  }
}

function testRequestValidation(buyForMeSystem, completedRequest) {
  console.log('\n✅ Request Validation Test...');
  
  try {
    if (!completedRequest) {
      console.log('❌ No completed request to validate');
      return false;
    }
    
    console.log('🔍 Validating completed request...');
    
    // Validate required fields
    const validation = {
      hasProductInfo: !!completedRequest.productInfo,
      hasShippingInfo: !!completedRequest.shippingInfo,
      hasPaymentInfo: !!completedRequest.paymentPreference,
      hasEstimatedCosts: !!completedRequest.estimatedCosts,
      isReadyForReview: completedRequest.status === 'pending_review',
      stepCompleted: completedRequest.step === 2
    };
    
    const allValid = Object.values(validation).every(v => v === true);
    
    if (allValid) {
      console.log('✅ Request validation passed');
      console.log('   All required information provided');
      console.log('   Ready for admin review');
      console.log('   2-step process completed successfully');
      return true;
    } else {
      console.log('❌ Request validation failed');
      console.log('   Missing required information');
      Object.entries(validation).forEach(([key, value]) => {
        if (!value) console.log(`   - ${key}: missing`);
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return false;
  }
}

function testAddressManagement(buyForMeSystem) {
  console.log('\n🏠 Address Management Test...');
  
  try {
    // Get user addresses
    const userAddresses = buyForMeSystem.getUserAddresses(alexPersona.id);
    console.log(`✅ Retrieved ${userAddresses.length} saved addresses`);
    
    if (userAddresses.length > 0) {
      userAddresses.forEach((addr, index) => {
        console.log(`   ${index + 1}. ${addr.name}: ${addr.address}, ${addr.city}, ${addr.country}`);
      });
    }
    
    // Test address reuse for future orders
    if (userAddresses.length > 0) {
      console.log('✅ Address book functionality working');
      console.log('   Future orders can reuse saved addresses');
      return true;
    } else {
      console.log('❌ No addresses found in address book');
      return false;
    }
  } catch (error) {
    console.error('❌ Address management test failed:', error.message);
    return false;
  }
}

function testCostCalculation(buyForMeSystem, completedRequest) {
  console.log('\n💰 Cost Calculation Test...');
  
  try {
    if (!completedRequest || !completedRequest.estimatedCosts) {
      console.log('❌ No cost information to validate');
      return false;
    }
    
    const costs = completedRequest.estimatedCosts;
    console.log('🧮 Cost breakdown validation:');
    console.log(`   Product price: ₩${costs.productPrice.toLocaleString()}`);
    console.log(`   Commission (8%): ₩${costs.commission.toLocaleString()}`);
    console.log(`   Domestic shipping: ₩${costs.domesticShipping.toLocaleString()}`);
    console.log(`   International shipping: ₩${costs.internationalShipping.toLocaleString()}`);
    console.log(`   Total: ₩${costs.total.toLocaleString()}`);
    
    // Validate calculation
    const expectedTotal = costs.productPrice + costs.commission + costs.domesticShipping + costs.internationalShipping;
    
    if (costs.total === expectedTotal) {
      console.log('✅ Cost calculation is accurate');
      return true;
    } else {
      console.log('❌ Cost calculation error');
      console.log(`   Expected: ₩${expectedTotal.toLocaleString()}`);
      console.log(`   Actual: ₩${costs.total.toLocaleString()}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Cost calculation test failed:', error.message);
    return false;
  }
}

function runTestScenario3() {
  console.log('🧪 Running Test Scenario 3 - Buy-for-me Application Process\n');
  
  const tests = [
    { name: 'Step 1: Initial Application', fn: null },
    { name: 'Step 2: Detailed Information', fn: null },
    { name: 'Request Validation', fn: null },
    { name: 'Address Management', fn: null },
    { name: 'Cost Calculation', fn: null }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  let buyForMeSystem = null;
  let initialRequest = null;
  let completedRequest = null;
  
  try {
    // Initialize system
    buyForMeSystem = new MockBuyForMeSystem();
    console.log('✅ Buy-for-me system initialized');
    
    // Test 1: Step 1 - Initial Application
    console.log('\n' + '='.repeat(50));
    initialRequest = testStep1InitialApplication(buyForMeSystem);
    if (initialRequest) {
      passedTests++;
      console.log(`\n✅ Test 1 PASSED: Step 1 - Initial Application`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 1 FAILED: Step 1 - Initial Application`);
      return { passed: passedTests, failed: failedTests, total: tests.length, success: false };
    }
    
    // Test 2: Step 2 - Detailed Information
    console.log('\n' + '='.repeat(50));
    completedRequest = testStep2DetailedInformation(buyForMeSystem, initialRequest);
    if (completedRequest) {
      passedTests++;
      console.log(`\n✅ Test 2 PASSED: Step 2 - Detailed Information`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 2 FAILED: Step 2 - Detailed Information`);
    }
    
    // Test 3: Request Validation
    console.log('\n' + '='.repeat(50));
    const validationResult = testRequestValidation(buyForMeSystem, completedRequest);
    if (validationResult) {
      passedTests++;
      console.log(`\n✅ Test 3 PASSED: Request Validation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 3 FAILED: Request Validation`);
    }
    
    // Test 4: Address Management
    console.log('\n' + '='.repeat(50));
    const addressResult = testAddressManagement(buyForMeSystem);
    if (addressResult) {
      passedTests++;
      console.log(`\n✅ Test 4 PASSED: Address Management`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 4 FAILED: Address Management`);
    }
    
    // Test 5: Cost Calculation
    console.log('\n' + '='.repeat(50));
    const costResult = testCostCalculation(buyForMeSystem, completedRequest);
    if (costResult) {
      passedTests++;
      console.log(`\n✅ Test 5 PASSED: Cost Calculation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 5 FAILED: Cost Calculation`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    failedTests++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Scenario 3 Results:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Buy-for-me 2-step process is working perfectly.');
    console.log('\n🎯 Alex successfully completed:');
    console.log('  ✅ Step 1: Basic product and quantity selection');
    console.log('  ✅ Step 2: Detailed shipping and payment information');
    console.log('  ✅ Address saved to address book for future use');
    console.log('  ✅ Accurate cost calculation with 8% commission');
    console.log('  ✅ Request ready for admin review');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues before proceeding.');
  }
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: tests.length,
    success: failedTests === 0,
    requestData: {
      initialRequest,
      completedRequest,
      alexPersona,
      selectedHotDeal
    }
  };
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runTestScenario3 = runTestScenario3;
  window.alexPersona = alexPersona;
  window.selectedHotDeal = selectedHotDeal;
  
  console.log('🔧 Test Scenario 3 loaded. Run window.runTestScenario3() in browser console.');
}

// Auto-run in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTestScenario3,
    alexPersona,
    selectedHotDeal,
    MockBuyForMeSystem
  };
  
  // Auto-run tests
  runTestScenario3();
}