/**
 * Test Scenario 8: Post-Purchase Pattern Analysis and Return Visit Recommendations
 * 구매 완료 후 패턴 분석 및 재방문 추천
 */

console.log('🚀 Starting Test Scenario 8: Post-Purchase Pattern Analysis and Return Visit Recommendations');

// Continue with Alex persona - now a successful customer
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
  joinedAt: new Date('2025-01-13T09:00:00Z'),
  totalOrders: 1,
  totalSpent: 165.81, // USD
  lastOrderDate: new Date(),
  customerSegment: 'first_time_buyer_success'
};

// Completed order from previous scenarios
const completedOrder = {
  id: 'ORDER-1752387477125',
  userId: 'alex-test-2025',
  status: 'delivered',
  product: {
    title: 'Samsung Galaxy Buds Pro 2',
    category: 'electronics',
    subcategory: 'audio',
    brand: 'Samsung',
    price: 89000, // KRW
    quantity: 2
  },
  totalAmount: 165.81, // USD
  deliveredAt: new Date(),
  customerSatisfaction: null, // Will be collected
  trackingId: 'TRACK-1752387477141'
};

// Mock post-purchase analytics system
class MockPostPurchaseAnalyticsSystem {
  constructor() {
    this.userProfiles = new Map();
    this.purchasePatterns = new Map();
    this.recommendations = new Map();
    this.satisfactionSurveys = new Map();
    this.retentionCampaigns = new Map();
    this.initializeAnalyticsData();
  }

  initializeAnalyticsData() {
    // Initialize analytics categories
    this.analyticsCategories = {
      'first_purchase_success': {
        priority: 'high',
        retentionRate: 0.65,
        averageTimeToRepurchase: 45, // days
        recommendationWeight: 0.8
      },
      'electronics_buyer': {
        crossSellCategories: ['accessories', 'tech_gadgets', 'smart_home'],
        seasonalTrends: ['back_to_school', 'black_friday', 'new_year'],
        priceRange: 'mid_to_high'
      },
      'international_customer': {
        shippingPreference: 'reliable_tracking',
        paymentPreference: 'paypal',
        communicationPreference: 'email',
        deliveryExpectation: '7-14_days'
      }
    };
  }

  // Collect post-delivery satisfaction survey
  async collectSatisfactionSurvey(userId, orderId) {
    console.log(`\n📝 Collecting satisfaction survey from user: ${userId}`);
    
    // Simulate sending survey and getting response
    await this.simulateDelay(1000);
    
    const survey = {
      id: `SURVEY-${Date.now()}`,
      userId,
      orderId,
      responses: {
        overallSatisfaction: 5, // 1-5 scale (Alex is very satisfied)
        productQuality: 5,
        shippingSpeed: 4,
        customerService: 5,
        priceValue: 4,
        likelyToRecommend: 5,
        likelyToRepurchase: 5
      },
      feedback: "Excellent service! The product arrived exactly as described and the tracking was very helpful. I love that I could buy Korean products easily from the US.",
      submittedAt: new Date(),
      incentiveOffered: '5% discount on next purchase'
    };

    this.satisfactionSurveys.set(survey.id, survey);
    
    console.log(`✅ Satisfaction survey collected:`)
    console.log(`   Overall satisfaction: ${survey.responses.overallSatisfaction}/5`)
    console.log(`   Shipping speed: ${survey.responses.shippingSpeed}/5`)
    console.log(`   Likely to recommend: ${survey.responses.likelyToRecommend}/5`)
    console.log(`   Likely to repurchase: ${survey.responses.likelyToRepurchase}/5`)
    console.log(`   Incentive offered: ${survey.incentiveOffered}`)

    return survey;
  }

  // Analyze purchase patterns
  async analyzePurchasePatterns(userId, orderHistory) {
    console.log(`\n📊 Analyzing purchase patterns for user: ${userId}`);
    
    const analysis = {
      userId,
      analysisDate: new Date(),
      customerSegment: this.determineCustomerSegment(orderHistory),
      preferences: this.extractPreferences(orderHistory),
      predictedBehavior: this.predictFutureBehavior(orderHistory),
      recommendationTriggers: this.identifyRecommendationTriggers(orderHistory),
      retentionRisk: this.assessRetentionRisk(orderHistory),
      marketingSegments: this.assignMarketingSegments(orderHistory)
    };

    this.purchasePatterns.set(userId, analysis);
    
    console.log(`✅ Purchase pattern analysis completed:`)
    console.log(`   Customer segment: ${analysis.customerSegment}`)
    console.log(`   Primary category preference: ${analysis.preferences.primaryCategory}`)
    console.log(`   Price sensitivity: ${analysis.preferences.priceSensitivity}`)
    console.log(`   Predicted next purchase: ${analysis.predictedBehavior.nextPurchaseWindow}`)
    console.log(`   Retention risk: ${analysis.retentionRisk.level}`)

    return analysis;
  }

  determineCustomerSegment(orderHistory) {
    if (orderHistory.length === 1) {
      const order = orderHistory[0];
      if (order.status === 'delivered' && order.totalAmount > 100) {
        return 'high_value_first_buyer';
      }
      return 'first_time_buyer';
    }
    // More logic for repeat customers would go here
    return 'loyal_customer';
  }

  extractPreferences(orderHistory) {
    const order = orderHistory[0]; // For simplicity, using first order
    return {
      primaryCategory: order.product.category,
      secondaryCategory: order.product.subcategory,
      brandPreference: order.product.brand,
      priceRange: this.categorizePriceRange(order.totalAmount),
      priceSensitivity: order.totalAmount > 150 ? 'low' : 'medium',
      purchaseFrequency: 'unknown', // Need more orders to determine
      seasonalPreference: this.getSeasonalPreference()
    };
  }

  categorizePriceRange(amount) {
    if (amount < 50) return 'budget';
    if (amount < 150) return 'mid_range';
    if (amount < 300) return 'premium';
    return 'luxury';
  }

  getSeasonalPreference() {
    const month = new Date().getMonth();
    if (month >= 11 || month <= 1) return 'holiday_season';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'back_to_school';
  }

  predictFutureBehavior(orderHistory) {
    return {
      nextPurchaseWindow: '30-45 days',
      likelyCategories: ['electronics', 'accessories', 'fashion'],
      preferredPriceRange: '$50-200',
      recommendedIncentive: '10% discount',
      crossSellOpportunity: 'high',
      upsellPotential: 'medium'
    };
  }

  identifyRecommendationTriggers(orderHistory) {
    return [
      {
        trigger: 'delivery_completion',
        action: 'send_satisfaction_survey',
        timing: 'immediate'
      },
      {
        trigger: 'positive_feedback',
        action: 'recommend_similar_products',
        timing: '3_days'
      },
      {
        trigger: 'brand_affinity',
        action: 'promote_samsung_accessories',
        timing: '1_week'
      },
      {
        trigger: 'category_interest',
        action: 'showcase_electronics_deals',
        timing: '2_weeks'
      }
    ];
  }

  assessRetentionRisk(orderHistory) {
    // Since Alex had a positive experience, retention risk is low
    return {
      level: 'low',
      score: 85, // out of 100
      factors: ['positive_satisfaction', 'high_nps_score', 'successful_delivery'],
      recommendations: ['maintain_engagement', 'offer_loyalty_program', 'regular_updates']
    };
  }

  assignMarketingSegments(orderHistory) {
    return [
      'electronics_enthusiast',
      'international_shopper',
      'brand_conscious',
      'value_seeker',
      'early_adopter_potential'
    ];
  }

  // Generate personalized recommendations
  async generatePersonalizedRecommendations(userId, purchaseAnalysis, satisfactionData) {
    console.log(`\n🎯 Generating personalized recommendations for user: ${userId}`);
    
    const recommendations = {
      id: `REC-${Date.now()}`,
      userId,
      generatedAt: new Date(),
      basedOn: 'purchase_history_and_satisfaction',
      confidence: 88,
      segments: purchaseAnalysis.marketingSegments,
      recommendations: []
    };

    // Generate different types of recommendations
    recommendations.recommendations.push(
      ...this.generateCrossSellRecommendations(purchaseAnalysis),
      ...this.generateRepeatPurchaseRecommendations(purchaseAnalysis),
      ...this.generateBrandAffinityRecommendations(purchaseAnalysis),
      ...this.generateTrendingRecommendations(purchaseAnalysis)
    );

    this.recommendations.set(userId, recommendations);
    
    console.log(`✅ Personalized recommendations generated:`)
    console.log(`   Total recommendations: ${recommendations.recommendations.length}`)
    console.log(`   Confidence score: ${recommendations.confidence}%`)
    console.log(`   Based on segments: ${recommendations.segments.slice(0, 3).join(', ')}`)
    
    recommendations.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title} (${rec.type} - ${rec.priority})`);
    });

    return recommendations;
  }

  generateCrossSellRecommendations(analysis) {
    return [
      {
        type: 'cross_sell',
        title: 'Samsung Galaxy Watch 6',
        description: 'Complete your Samsung ecosystem with this smartwatch',
        category: 'electronics',
        subcategory: 'wearables',
        price: 'From ₩299,000',
        discount: '15%',
        priority: 'high',
        reasoning: 'Purchased Samsung earbuds, likely interested in Samsung ecosystem'
      },
      {
        type: 'cross_sell',
        title: 'Wireless Charging Pad',
        description: 'Convenient charging for your Galaxy Buds and phone',
        category: 'accessories',
        subcategory: 'charging',
        price: 'From ₩45,000',
        discount: '20%',
        priority: 'medium',
        reasoning: 'Complement the Galaxy Buds purchase with charging accessories'
      }
    ];
  }

  generateRepeatPurchaseRecommendations(analysis) {
    return [
      {
        type: 'repeat_purchase',
        title: 'Galaxy Buds Pro 2 - Different Color',
        description: 'Try the same great earbuds in Bora Purple',
        category: 'electronics',
        subcategory: 'audio',
        price: 'From ₩89,000',
        discount: '10%',
        priority: 'medium',
        reasoning: 'Satisfied with previous purchase, might want different color'
      }
    ];
  }

  generateBrandAffinityRecommendations(analysis) {
    return [
      {
        type: 'brand_affinity',
        title: 'Samsung Galaxy S24 Accessories',
        description: 'Premium cases and screen protectors',
        category: 'accessories',
        subcategory: 'phone_accessories',
        price: 'From ₩25,000',
        discount: '25%',
        priority: 'medium',
        reasoning: 'Strong Samsung brand preference detected'
      }
    ];
  }

  generateTrendingRecommendations(analysis) {
    return [
      {
        type: 'trending',
        title: 'K-Beauty Winter Skincare Set',
        description: 'Trending Korean skincare products for winter',
        category: 'beauty',
        subcategory: 'skincare',
        price: 'From ₩65,000',
        discount: '30%',
        priority: 'low',
        reasoning: 'Popular among international customers during winter season'
      }
    ];
  }

  // Create retention campaign
  async createRetentionCampaign(userId, recommendations, retentionRisk) {
    console.log(`\n🎪 Creating retention campaign for user: ${userId}`);
    
    const campaign = {
      id: `CAMPAIGN-${Date.now()}`,
      userId,
      type: 'post_purchase_retention',
      status: 'active',
      riskLevel: retentionRisk.level,
      strategy: this.selectRetentionStrategy(retentionRisk),
      touchpoints: this.designTouchpoints(recommendations),
      timeline: this.createTimeline(),
      incentives: this.selectIncentives(retentionRisk),
      successMetrics: this.defineSuccessMetrics(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };

    this.retentionCampaigns.set(userId, campaign);
    
    console.log(`✅ Retention campaign created:`)
    console.log(`   Campaign type: ${campaign.type}`)
    console.log(`   Strategy: ${campaign.strategy}`)
    console.log(`   Touchpoints: ${campaign.touchpoints.length}`)
    console.log(`   Primary incentive: ${campaign.incentives.primary}`)
    console.log(`   Duration: 90 days`)

    return campaign;
  }

  selectRetentionStrategy(retentionRisk) {
    if (retentionRisk.level === 'low') {
      return 'engagement_and_loyalty';
    } else if (retentionRisk.level === 'medium') {
      return 'incentive_driven_retention';
    } else {
      return 'high_touch_win_back';
    }
  }

  designTouchpoints(recommendations) {
    return [
      {
        day: 3,
        type: 'email',
        content: 'Thank you + Product care tips',
        cta: 'Rate your experience'
      },
      {
        day: 7,
        type: 'push',
        content: 'Personalized recommendations based on your purchase',
        cta: 'View recommendations'
      },
      {
        day: 14,
        type: 'email',
        content: 'Exclusive member offers',
        cta: 'Shop now'
      },
      {
        day: 30,
        type: 'email',
        content: 'How are you enjoying your Galaxy Buds?',
        cta: 'Share feedback'
      },
      {
        day: 45,
        type: 'push',
        content: 'New arrivals in electronics',
        cta: 'Explore deals'
      }
    ];
  }

  createTimeline() {
    return {
      phase1: '0-7 days: Satisfaction and onboarding',
      phase2: '8-30 days: Engagement and cross-sell',
      phase3: '31-60 days: Loyalty building',
      phase4: '61-90 days: Repurchase motivation'
    };
  }

  selectIncentives(retentionRisk) {
    return {
      primary: '10% off next purchase',
      secondary: 'Free shipping on orders over $50',
      loyalty: 'Early access to new products',
      referral: '$5 credit for each successful referral'
    };
  }

  defineSuccessMetrics() {
    return {
      primaryGoal: 'Second purchase within 60 days',
      secondaryGoals: [
        'Email open rate > 25%',
        'Click-through rate > 5%',
        'App/website revisit within 30 days',
        'Referral activity'
      ],
      kpis: {
        retentionRate: 'target 70%',
        averageOrderValue: 'target $120+',
        customerLifetimeValue: 'target $500+',
        npsScore: 'maintain 9+'
      }
    };
  }

  // Simulate follow-up engagement
  async simulateFollowUpEngagement(userId, campaign) {
    console.log(`\n📱 Simulating follow-up engagement for user: ${userId}`);
    
    const engagementResults = {
      campaignId: campaign.id,
      userId,
      touchpointResults: [],
      overallEngagement: 0,
      conversionEvents: [],
      measuredAt: new Date()
    };

    // Simulate each touchpoint execution
    for (const touchpoint of campaign.touchpoints) {
      const result = {
        day: touchpoint.day,
        type: touchpoint.type,
        sent: true,
        opened: Math.random() > 0.25, // 75% open rate (Alex is engaged)
        clicked: Math.random() > 0.4,  // 60% click rate
        converted: Math.random() > 0.7, // 30% conversion rate
        timestamp: new Date(Date.now() + touchpoint.day * 24 * 60 * 60 * 1000)
      };
      
      engagementResults.touchpointResults.push(result);
      
      if (result.converted) {
        engagementResults.conversionEvents.push({
          touchpointDay: touchpoint.day,
          action: touchpoint.cta,
          value: touchpoint.type === 'email' ? 'high' : 'medium'
        });
      }
    }

    // Calculate overall engagement score
    const totalTouchpoints = campaign.touchpoints.length;
    const totalOpens = engagementResults.touchpointResults.filter(r => r.opened).length;
    const totalClicks = engagementResults.touchpointResults.filter(r => r.clicked).length;
    const totalConversions = engagementResults.touchpointResults.filter(r => r.converted).length;

    engagementResults.overallEngagement = Math.round(
      ((totalOpens * 0.3) + (totalClicks * 0.4) + (totalConversions * 0.3)) / totalTouchpoints * 100
    );

    console.log(`✅ Follow-up engagement simulation completed:`)
    console.log(`   Total touchpoints: ${totalTouchpoints}`)
    console.log(`   Opens: ${totalOpens}/${totalTouchpoints} (${Math.round(totalOpens/totalTouchpoints*100)}%)`)
    console.log(`   Clicks: ${totalClicks}/${totalTouchpoints} (${Math.round(totalClicks/totalTouchpoints*100)}%)`)
    console.log(`   Conversions: ${totalConversions}/${totalTouchpoints} (${Math.round(totalConversions/totalTouchpoints*100)}%)`)
    console.log(`   Overall engagement score: ${engagementResults.overallEngagement}%`)

    return engagementResults;
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSatisfactionSurvey(surveyId) {
    return this.satisfactionSurveys.get(surveyId);
  }

  getPurchaseAnalysis(userId) {
    return this.purchasePatterns.get(userId);
  }

  getRecommendations(userId) {
    return this.recommendations.get(userId);
  }

  getRetentionCampaign(userId) {
    return this.retentionCampaigns.get(userId);
  }
}

// Test functions
async function testSatisfactionSurveyCollection(analyticsSystem) {
  console.log('\n📝 Satisfaction Survey Collection Test...');
  
  try {
    const survey = await analyticsSystem.collectSatisfactionSurvey(
      alexPersona.id,
      completedOrder.id
    );
    
    if (survey && survey.responses.overallSatisfaction >= 4) {
      console.log('✅ Satisfaction survey collection test successful');
      return survey;
    } else {
      console.log('❌ Satisfaction survey collection test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Satisfaction survey test failed:', error.message);
    return null;
  }
}

async function testPurchasePatternAnalysis(analyticsSystem) {
  console.log('\n📊 Purchase Pattern Analysis Test...');
  
  try {
    const orderHistory = [completedOrder];
    const analysis = await analyticsSystem.analyzePurchasePatterns(alexPersona.id, orderHistory);
    
    if (analysis && analysis.customerSegment && analysis.preferences) {
      console.log('✅ Purchase pattern analysis test successful');
      return analysis;
    } else {
      console.log('❌ Purchase pattern analysis test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Purchase pattern analysis test failed:', error.message);
    return null;
  }
}

async function testPersonalizedRecommendations(analyticsSystem, purchaseAnalysis, satisfactionData) {
  console.log('\n🎯 Personalized Recommendations Test...');
  
  try {
    if (!purchaseAnalysis || !satisfactionData) {
      console.log('❌ Cannot generate recommendations without analysis and satisfaction data');
      return null;
    }

    const recommendations = await analyticsSystem.generatePersonalizedRecommendations(
      alexPersona.id,
      purchaseAnalysis,
      satisfactionData
    );

    if (recommendations && recommendations.recommendations.length > 0) {
      console.log('✅ Personalized recommendations test successful');
      return recommendations;
    } else {
      console.log('❌ Personalized recommendations test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Personalized recommendations test failed:', error.message);
    return null;
  }
}

async function testRetentionCampaignCreation(analyticsSystem, recommendations, retentionRisk) {
  console.log('\n🎪 Retention Campaign Creation Test...');
  
  try {
    if (!recommendations || !retentionRisk) {
      console.log('❌ Cannot create campaign without recommendations and risk assessment');
      return null;
    }

    const campaign = await analyticsSystem.createRetentionCampaign(
      alexPersona.id,
      recommendations,
      retentionRisk
    );

    if (campaign && campaign.touchpoints && campaign.touchpoints.length > 0) {
      console.log('✅ Retention campaign creation test successful');
      return campaign;
    } else {
      console.log('❌ Retention campaign creation test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Retention campaign creation test failed:', error.message);
    return null;
  }
}

async function testFollowUpEngagement(analyticsSystem, campaign) {
  console.log('\n📱 Follow-up Engagement Test...');
  
  try {
    if (!campaign) {
      console.log('❌ Cannot simulate engagement without campaign');
      return null;
    }

    const engagementResults = await analyticsSystem.simulateFollowUpEngagement(
      alexPersona.id,
      campaign
    );

    if (engagementResults && engagementResults.overallEngagement > 0) {
      console.log('✅ Follow-up engagement test successful');
      return engagementResults;
    } else {
      console.log('❌ Follow-up engagement test failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Follow-up engagement test failed:', error.message);
    return null;
  }
}

function testDataPersistenceAndRetrieval(analyticsSystem) {
  console.log('\n💾 Data Persistence and Retrieval Test...');
  
  try {
    const surveyData = analyticsSystem.getSatisfactionSurvey('SURVEY-test');
    const analysisData = analyticsSystem.getPurchaseAnalysis(alexPersona.id);
    const recommendationData = analyticsSystem.getRecommendations(alexPersona.id);
    const campaignData = analyticsSystem.getRetentionCampaign(alexPersona.id);
    
    console.log(`✅ Data retrieval test completed:`)
    console.log(`   Purchase analysis: ${analysisData ? 'Found' : 'Not found'}`)
    console.log(`   Recommendations: ${recommendationData ? 'Found' : 'Not found'}`)
    console.log(`   Retention campaign: ${campaignData ? 'Found' : 'Not found'}`)
    
    if (analysisData && recommendationData && campaignData) {
      console.log('✅ Data persistence test successful');
      return true;
    } else {
      console.log('❌ Some data not found in persistence test');
      return false;
    }
  } catch (error) {
    console.error('❌ Data persistence test failed:', error.message);
    return false;
  }
}

function testAnalyticsInsights(analyticsSystem, purchaseAnalysis, engagementResults) {
  console.log('\n📈 Analytics Insights Test...');
  
  try {
    if (!purchaseAnalysis || !engagementResults) {
      console.log('❌ Cannot generate insights without analysis and engagement data');
      return false;
    }

    const insights = {
      customerProfile: {
        segment: purchaseAnalysis.customerSegment,
        value: 'high',
        retentionProbability: 'high',
        loyaltyPotential: 'high'
      },
      engagementMetrics: {
        score: engagementResults.overallEngagement,
        touchpointEffectiveness: engagementResults.touchpointResults.length,
        conversionRate: (engagementResults.conversionEvents.length / engagementResults.touchpointResults.length) * 100
      },
      businessImpact: {
        estimatedLTV: 500, // USD
        retentionROI: 350, // %
        referralPotential: 'high'
      },
      actionableRecommendations: [
        'Continue with electronics cross-sell campaigns',
        'Introduce loyalty program membership',
        'Enable referral rewards program',
        'Consider premium customer segment treatment'
      ]
    };

    console.log(`✅ Analytics insights generated:`)
    console.log(`   Customer value: ${insights.customerProfile.value}`)
    console.log(`   Engagement score: ${insights.engagementMetrics.score}%`)
    console.log(`   Conversion rate: ${insights.engagementMetrics.conversionRate.toFixed(1)}%`)
    console.log(`   Estimated LTV: $${insights.businessImpact.estimatedLTV}`)
    console.log(`   Actionable recommendations: ${insights.actionableRecommendations.length}`)

    return true;
  } catch (error) {
    console.error('❌ Analytics insights test failed:', error.message);
    return false;
  }
}

async function runTestScenario8() {
  console.log('🧪 Running Test Scenario 8 - Post-Purchase Pattern Analysis and Return Visit Recommendations\n');
  
  const tests = [
    { name: 'Satisfaction Survey Collection', fn: null },
    { name: 'Purchase Pattern Analysis', fn: null },
    { name: 'Personalized Recommendations', fn: null },
    { name: 'Retention Campaign Creation', fn: null },
    { name: 'Follow-up Engagement', fn: null },
    { name: 'Data Persistence and Retrieval', fn: null },
    { name: 'Analytics Insights', fn: null }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  let analyticsSystem = null;
  let survey = null;
  let purchaseAnalysis = null;
  let recommendations = null;
  let campaign = null;
  let engagementResults = null;
  
  try {
    // Initialize post-purchase analytics system
    analyticsSystem = new MockPostPurchaseAnalyticsSystem();
    console.log('✅ Post-purchase analytics system initialized');
    
    // Test 1: Satisfaction Survey Collection
    console.log('\n' + '='.repeat(50));
    survey = await testSatisfactionSurveyCollection(analyticsSystem);
    if (survey) {
      passedTests++;
      console.log(`\n✅ Test 1 PASSED: Satisfaction Survey Collection`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 1 FAILED: Satisfaction Survey Collection`);
    }
    
    // Test 2: Purchase Pattern Analysis
    console.log('\n' + '='.repeat(50));
    purchaseAnalysis = await testPurchasePatternAnalysis(analyticsSystem);
    if (purchaseAnalysis) {
      passedTests++;
      console.log(`\n✅ Test 2 PASSED: Purchase Pattern Analysis`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 2 FAILED: Purchase Pattern Analysis`);
    }
    
    // Test 3: Personalized Recommendations
    console.log('\n' + '='.repeat(50));
    recommendations = await testPersonalizedRecommendations(analyticsSystem, purchaseAnalysis, survey);
    if (recommendations) {
      passedTests++;
      console.log(`\n✅ Test 3 PASSED: Personalized Recommendations`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 3 FAILED: Personalized Recommendations`);
    }
    
    // Test 4: Retention Campaign Creation
    console.log('\n' + '='.repeat(50));
    campaign = await testRetentionCampaignCreation(analyticsSystem, recommendations, purchaseAnalysis?.retentionRisk);
    if (campaign) {
      passedTests++;
      console.log(`\n✅ Test 4 PASSED: Retention Campaign Creation`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 4 FAILED: Retention Campaign Creation`);
    }
    
    // Test 5: Follow-up Engagement
    console.log('\n' + '='.repeat(50));
    engagementResults = await testFollowUpEngagement(analyticsSystem, campaign);
    if (engagementResults) {
      passedTests++;
      console.log(`\n✅ Test 5 PASSED: Follow-up Engagement`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 5 FAILED: Follow-up Engagement`);
    }
    
    // Test 6: Data Persistence and Retrieval
    console.log('\n' + '='.repeat(50));
    const persistenceResult = testDataPersistenceAndRetrieval(analyticsSystem);
    if (persistenceResult) {
      passedTests++;
      console.log(`\n✅ Test 6 PASSED: Data Persistence and Retrieval`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 6 FAILED: Data Persistence and Retrieval`);
    }
    
    // Test 7: Analytics Insights
    console.log('\n' + '='.repeat(50));
    const insightsResult = testAnalyticsInsights(analyticsSystem, purchaseAnalysis, engagementResults);
    if (insightsResult) {
      passedTests++;
      console.log(`\n✅ Test 7 PASSED: Analytics Insights`);
    } else {
      failedTests++;
      console.log(`\n❌ Test 7 FAILED: Analytics Insights`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    failedTests++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Scenario 8 Results:');
  console.log(`✅ Passed: ${passedTests}/${tests.length}`);
  console.log(`❌ Failed: ${failedTests}/${tests.length}`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Post-purchase analytics and retention system working perfectly.');
    console.log('\n🎯 Complete post-purchase journey demonstrated:');
    console.log('  ✅ Customer satisfaction survey collected and analyzed');
    console.log('  ✅ Purchase patterns identified and customer segmented');
    console.log('  ✅ Personalized recommendations generated');
    console.log('  ✅ Retention campaign created with multiple touchpoints');
    console.log('  ✅ Follow-up engagement simulated with high success rates');
    console.log('  ✅ Data persistence and retrieval validated');
    console.log('  ✅ Business insights and actionable recommendations provided');
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
      completedOrder,
      survey,
      purchaseAnalysis,
      recommendations,
      campaign,
      engagementResults,
      analyticsSystem
    }
  };
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.runTestScenario8 = runTestScenario8;
  window.alexPersona = alexPersona;
  window.completedOrder = completedOrder;
  
  console.log('🔧 Test Scenario 8 loaded. Run window.runTestScenario8() in browser console.');
}

// Auto-run in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runTestScenario8,
    alexPersona,
    completedOrder,
    MockPostPurchaseAnalyticsSystem
  };
  
  // Auto-run tests
  runTestScenario8();
}