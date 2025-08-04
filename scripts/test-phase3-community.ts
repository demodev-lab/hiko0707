import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase/client'
import { SupabaseCommentService } from '../lib/services/supabase-comment-service'
import { SupabaseLikeService } from '../lib/services/supabase-like-service'
import { SupabaseFavoriteService } from '../lib/services/supabase-favorite-service'
import type { Database } from '../database.types'

type CommentInsert = Database['public']['Tables']['hot_deal_comments']['Insert']

async function testPhase3Community() {
  console.log('🧪 Phase 3: 커뮤니티 기능 테스트 시작...\n')

  const client = supabaseAdmin()
  if (!client) {
    console.error('❌ Supabase 클라이언트 초기화 실패')
    return
  }

  console.log('✅ Supabase 클라이언트 초기화 성공')

  let allTestsPassed = true
  const testResults: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = []

  // 테스트 헬퍼 함수
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    try {
      await testFn()
      testResults.push({ name: testName, status: 'PASS' })
      console.log(`✅ ${testName}`)
    } catch (error) {
      testResults.push({ 
        name: testName, 
        status: 'FAIL', 
        error: error instanceof Error ? error.message : String(error)
      })
      console.log(`❌ ${testName}: ${error instanceof Error ? error.message : String(error)}`)
      allTestsPassed = false
    }
  }

  // 테스트용 데이터 변수들
  let testUserId: string
  let testUser2Id: string
  let testHotDealId: string
  let testCommentId: string
  let testReplyId: string
  let createdNewUser = false
  let createdNewUser2 = false

  // 1. 테스트 데이터 준비
  await runTest('테스트 데이터 준비', async () => {
    // 기존 사용자 조회 또는 생성
    const { data: existingUsers, error: existingUserError } = await client
      .from('users')
      .select('id')
      .limit(2)

    if (existingUserError || !existingUsers || existingUsers.length === 0) {
      // 첫 번째 사용자 생성
      const { data: testUser, error: userError } = await client
        .from('users')
        .insert({
          clerk_user_id: `test-clerk-${Date.now()}`,
          email: `test-${Date.now()}@example.com`,
          name: '테스트 사용자1',
          role: 'user',
          status: 'active',
          preferred_language: 'ko'
        })
        .select()
        .single()

      if (userError || !testUser) {
        throw new Error(`테스트 사용자1 생성 실패: ${userError?.message}`)
      }
      testUserId = testUser.id
      createdNewUser = true

      // 두 번째 사용자 생성
      const { data: testUser2, error: user2Error } = await client
        .from('users')
        .insert({
          clerk_user_id: `test-clerk-2-${Date.now()}`,
          email: `test-2-${Date.now()}@example.com`,
          name: '테스트 사용자2',
          role: 'user',
          status: 'active',
          preferred_language: 'ko'
        })
        .select()
        .single()

      if (user2Error || !testUser2) {
        throw new Error(`테스트 사용자2 생성 실패: ${user2Error?.message}`)
      }
      testUser2Id = testUser2.id
      createdNewUser2 = true
    } else {
      // 기존 사용자 사용
      testUserId = existingUsers[0].id
      testUser2Id = existingUsers.length > 1 ? existingUsers[1].id : existingUsers[0].id
    }

    // 테스트 핫딜 생성
    const { data: testHotDeal, error: hotDealError } = await client
      .from('hot_deals')
      .insert({
        title: '커뮤니티 테스트용 핫딜',
        source: 'ppomppu',
        source_id: `community-test-${Date.now()}`,
        author_name: '테스트 작성자',
        category: '디지털/가전',
        original_price: 200000,
        sale_price: 150000,
        discount_rate: 25,
        image_url: 'https://example.com/community-test-image.jpg',
        thumbnail_url: 'https://example.com/community-test-thumb.jpg',
        original_url: 'https://example.com/community-test-product',
        is_free_shipping: true,
        shopping_comment: '커뮤니티 테스트용 상품입니다',
        status: 'active',
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (hotDealError || !testHotDeal) {
      throw new Error(`테스트 핫딜 생성 실패: ${hotDealError?.message}`)
    }
    testHotDealId = testHotDeal.id

    console.log(`   테스트 사용자1 ID: ${testUserId}`)
    console.log(`   테스트 사용자2 ID: ${testUser2Id}`)
    console.log(`   테스트 핫딜 ID: ${testHotDealId}`)
  })

  // 2. 댓글 서비스 테스트
  await runTest('SupabaseCommentService - 댓글 생성', async () => {
    const commentData: Omit<CommentInsert, 'created_at' | 'updated_at'> = {
      user_id: testUserId,
      hotdeal_id: testHotDealId,
      content: '이것은 테스트 댓글입니다.',
      parent_id: null
    }

    const createdComment = await SupabaseCommentService.createComment(commentData)
    if (!createdComment) {
      throw new Error('댓글 생성 실패')
    }

    testCommentId = createdComment.id
    console.log(`   생성된 댓글 ID: ${testCommentId}`)
  })

  await runTest('SupabaseCommentService - 답글 생성', async () => {
    const replyData: Omit<CommentInsert, 'created_at' | 'updated_at'> = {
      user_id: testUser2Id,
      hotdeal_id: testHotDealId,
      content: '이것은 테스트 답글입니다.',
      parent_id: testCommentId
    }

    const createdReply = await SupabaseCommentService.createComment(replyData)
    if (!createdReply) {
      throw new Error('답글 생성 실패')
    }

    testReplyId = createdReply.id
    console.log(`   생성된 답글 ID: ${testReplyId}`)
  })

  await runTest('SupabaseCommentService - 댓글 목록 조회', async () => {
    const comments = await SupabaseCommentService.getCommentsByHotdeal(testHotDealId)
    if (comments.length === 0) {
      throw new Error('댓글 목록이 비어있음')
    }

    const hasTestComment = comments.some(comment => comment.id === testCommentId)
    if (!hasTestComment) {
      throw new Error('생성한 댓글이 목록에 없음')
    }

    console.log(`   조회된 댓글 개수: ${comments.length}`)
  })

  await runTest('SupabaseCommentService - 최상위 댓글 조회', async () => {
    const topLevelComments = await SupabaseCommentService.getTopLevelComments(testHotDealId)
    if (topLevelComments.length === 0) {
      throw new Error('최상위 댓글이 없음')
    }

    const hasMainComment = topLevelComments.some(comment => comment.id === testCommentId)
    if (!hasMainComment) {
      throw new Error('메인 댓글이 최상위 댓글 목록에 없음')
    }

    console.log(`   최상위 댓글 개수: ${topLevelComments.length}`)
  })

  await runTest('SupabaseCommentService - 답글 조회', async () => {
    const replies = await SupabaseCommentService.getReplies(testCommentId)
    if (replies.length === 0) {
      throw new Error('답글이 없음')
    }

    const hasTestReply = replies.some(reply => reply.id === testReplyId)
    if (!hasTestReply) {
      throw new Error('생성한 답글이 목록에 없음')
    }

    console.log(`   답글 개수: ${replies.length}`)
  })

  await runTest('SupabaseCommentService - 댓글 좋아요', async () => {
    const commentLike = await SupabaseCommentService.likeComment(testCommentId, testUser2Id)
    if (!commentLike) {
      throw new Error('댓글 좋아요 실패')
    }

    // 좋아요 여부 확인
    const isLiked = await SupabaseCommentService.isCommentLikedByUser(testCommentId, testUser2Id)
    if (!isLiked) {
      throw new Error('댓글 좋아요 상태가 올바르지 않음')
    }

    console.log(`   댓글 좋아요 성공`)
  })

  await runTest('SupabaseCommentService - 댓글 수정', async () => {
    const updatedComment = await SupabaseCommentService.updateComment(testCommentId, {
      content: '이것은 수정된 테스트 댓글입니다.'
    })

    if (!updatedComment) {
      throw new Error('댓글 수정 실패')
    }

    if (updatedComment.content !== '이것은 수정된 테스트 댓글입니다.') {
      throw new Error('댓글 내용이 수정되지 않음')
    }

    console.log(`   댓글 수정 성공`)
  })

  await runTest('SupabaseCommentService - 댓글 통계 조회', async () => {
    const stats = await SupabaseCommentService.getCommentStats(testHotDealId)
    if (!stats) {
      throw new Error('댓글 통계 조회 실패')
    }

    if (stats.total_comments === 0) {
      throw new Error('댓글 통계가 비어있음')
    }

    console.log(`   총 댓글: ${stats.total_comments}개`)
    console.log(`   최근 댓글: ${stats.recent_comments}개`)
  })

  // 3. 좋아요 서비스 테스트
  await runTest('SupabaseLikeService - 핫딜 좋아요', async () => {
    const hotdealLike = await SupabaseLikeService.likeHotDeal(testHotDealId, testUserId)
    if (!hotdealLike) {
      throw new Error('핫딜 좋아요 실패')
    }

    // 좋아요 여부 확인
    const isLiked = await SupabaseLikeService.isHotDealLikedByUser(testHotDealId, testUserId)
    if (!isLiked) {
      throw new Error('핫딜 좋아요 상태가 올바르지 않음')
    }

    console.log(`   핫딜 좋아요 성공`)
  })

  await runTest('SupabaseLikeService - 사용자가 좋아요한 핫딜 목록', async () => {
    const likedHotdeals = await SupabaseLikeService.getLikedHotDealsByUser(testUserId)
    if (likedHotdeals.length === 0) {
      throw new Error('좋아요한 핫딜 목록이 비어있음')
    }

    const hasTestHotdeal = likedHotdeals.some(like => like.hot_deal_id === testHotDealId)
    if (!hasTestHotdeal) {
      throw new Error('좋아요한 핫딜이 목록에 없음')
    }

    console.log(`   좋아요한 핫딜 개수: ${likedHotdeals.length}`)
  })

  await runTest('SupabaseLikeService - 핫딜을 좋아요한 사용자 목록', async () => {
    const likingUsers = await SupabaseLikeService.getUsersWhoLikedHotDeal(testHotDealId)
    if (likingUsers.length === 0) {
      throw new Error('핫딜을 좋아요한 사용자가 없음')
    }

    const hasTestUser = likingUsers.some(like => like.user_id === testUserId)
    if (!hasTestUser) {
      throw new Error('테스트 사용자가 좋아요 목록에 없음')
    }

    console.log(`   좋아요한 사용자 수: ${likingUsers.length}`)
  })

  await runTest('SupabaseLikeService - 좋아요 통계', async () => {
    const likeStats = await SupabaseLikeService.getHotDealLikeStats(testHotDealId)
    if (!likeStats) {
      throw new Error('좋아요 통계 조회 실패')
    }

    if (likeStats.total_likes === 0) {
      throw new Error('좋아요 통계가 비어있음')
    }

    console.log(`   총 좋아요: ${likeStats.total_likes}개`)
    console.log(`   최근 좋아요: ${likeStats.recent_likes}개`)
  })

  await runTest('SupabaseLikeService - 사용자 좋아요 통계', async () => {
    const userLikeStats = await SupabaseLikeService.getUserLikeStats(testUserId)
    if (!userLikeStats) {
      throw new Error('사용자 좋아요 통계 조회 실패')
    }

    if (userLikeStats.total_likes === 0) {
      throw new Error('사용자 좋아요 통계가 비어있음')
    }

    console.log(`   사용자 총 좋아요: ${userLikeStats.total_likes}개`)
    console.log(`   선호 카테고리: ${userLikeStats.favorite_categories.join(', ')}`)
  })

  // 4. 즐겨찾기 서비스 테스트
  await runTest('SupabaseFavoriteService - 즐겨찾기 추가', async () => {
    const favorite = await SupabaseFavoriteService.addToFavorites(testHotDealId, testUserId)
    if (!favorite) {
      throw new Error('즐겨찾기 추가 실패')
    }

    // 즐겨찾기 여부 확인
    const isFavorited = await SupabaseFavoriteService.isHotDealFavorited(testHotDealId, testUserId)
    if (!isFavorited) {
      throw new Error('즐겨찾기 상태가 올바르지 않음')
    }

    console.log(`   즐겨찾기 추가 성공`)
  })

  await runTest('SupabaseFavoriteService - 사용자 즐겨찾기 목록', async () => {
    const favorites = await SupabaseFavoriteService.getFavoriteHotDealsByUser(testUserId)
    if (favorites.length === 0) {
      throw new Error('즐겨찾기 목록이 비어있음')
    }

    const hasTestHotdeal = favorites.some(fav => fav.hotdeal_id === testHotDealId)
    if (!hasTestHotdeal) {
      throw new Error('즐겨찾기한 핫딜이 목록에 없음')
    }

    console.log(`   즐겨찾기 개수: ${favorites.length}`)
  })

  await runTest('SupabaseFavoriteService - 카테고리별 즐겨찾기', async () => {
    const favoritesByCategory = await SupabaseFavoriteService.getFavoritesByCategory(testUserId)
    const categoryKeys = Object.keys(favoritesByCategory)
    
    if (categoryKeys.length === 0) {
      throw new Error('카테고리별 즐겨찾기가 비어있음')
    }

    console.log(`   즐겨찾기 카테고리 수: ${categoryKeys.length}`)
    console.log(`   카테고리: ${categoryKeys.join(', ')}`)
  })

  await runTest('SupabaseFavoriteService - 즐겨찾기 통계', async () => {
    const favoriteStats = await SupabaseFavoriteService.getUserFavoriteStats(testUserId)
    if (!favoriteStats) {
      throw new Error('즐겨찾기 통계 조회 실패')
    }

    if (favoriteStats.total_favorites === 0) {
      throw new Error('즐겨찾기 통계가 비어있음')
    }

    console.log(`   총 즐겨찾기: ${favoriteStats.total_favorites}개`)
    console.log(`   카테고리별 통계: ${favoriteStats.categories.length}개 카테고리`)
  })

  await runTest('SupabaseFavoriteService - 추천 핫딜', async () => {
    const recommendedHotdeals = await SupabaseFavoriteService.getRecommendedHotDeals(testUserId, {
      limit: 5
    })

    // 추천 핫딜이 없을 수도 있으므로 에러가 아님
    console.log(`   추천 핫딜 개수: ${recommendedHotdeals.length}`)
  })

  // 5. 인기 핫딜 테스트
  await runTest('SupabaseLikeService - 인기 핫딜 목록', async () => {
    const popularHotdeals = await SupabaseLikeService.getPopularHotDeals({ limit: 10 })
    
    // 인기 핫딜이 있어야 함 (방금 좋아요한 핫딜 포함)
    const hasTestHotdeal = popularHotdeals.some(deal => deal.id === testHotDealId)
    if (!hasTestHotdeal) {
      // 테스트 핫딜이 인기 목록에 없을 수도 있으므로 로그만 출력
      console.log('   테스트 핫딜이 인기 목록에 없음 (정상)')
    }

    console.log(`   인기 핫딜 개수: ${popularHotdeals.length}`)
  })

  // 6. 데이터 정리 작업
  await runTest('SupabaseLikeService - 좋아요 제거', async () => {
    const success = await SupabaseLikeService.unlikeHotDeal(testHotDealId, testUserId)
    if (!success) {
      throw new Error('좋아요 제거 실패')
    }

    // 좋아요 상태 확인
    const isLiked = await SupabaseLikeService.isHotDealLikedByUser(testHotDealId, testUserId)
    if (isLiked) {
      throw new Error('좋아요가 제거되지 않음')
    }

    console.log(`   좋아요 제거 성공`)
  })

  await runTest('SupabaseFavoriteService - 즐겨찾기 제거', async () => {
    const success = await SupabaseFavoriteService.removeFromFavorites(testHotDealId, testUserId)
    if (!success) {
      throw new Error('즐겨찾기 제거 실패')
    }

    // 즐겨찾기 상태 확인
    const isFavorited = await SupabaseFavoriteService.isHotDealFavorited(testHotDealId, testUserId)
    if (isFavorited) {
      throw new Error('즐겨찾기가 제거되지 않음')
    }

    console.log(`   즐겨찾기 제거 성공`)
  })

  await runTest('SupabaseCommentService - 댓글 좋아요 제거', async () => {
    const success = await SupabaseCommentService.unlikeComment(testCommentId, testUser2Id)
    if (!success) {
      throw new Error('댓글 좋아요 제거 실패')
    }

    console.log(`   댓글 좋아요 제거 성공`)
  })

  await runTest('SupabaseCommentService - 댓글 삭제', async () => {
    const success = await SupabaseCommentService.deleteComment(testReplyId)
    if (!success) {
      throw new Error('답글 삭제 실패')
    }

    const success2 = await SupabaseCommentService.deleteComment(testCommentId)
    if (!success2) {
      throw new Error('댓글 삭제 실패')
    }

    console.log(`   댓글 삭제 성공`)
  })

  // 7. 테스트 데이터 정리
  await runTest('테스트 데이터 정리', async () => {
    // 댓글 좋아요 정리
    await client
      .from('comment_likes')
      .delete()
      .eq('comment_id', testCommentId)

    // 핫딜 좋아요 정리
    await client
      .from('hot_deal_likes')
      .delete()
      .eq('hot_deal_id', testHotDealId)

    // 즐겨찾기 정리
    await client
      .from('user_favorite_hotdeals')
      .delete()
      .eq('hotdeal_id', testHotDealId)

    // 댓글 정리
    await client
      .from('hot_deal_comments')
      .delete()
      .eq('hotdeal_id', testHotDealId)

    // 핫딜 삭제
    if (testHotDealId) {
      const { error: hotDealDeleteError } = await client
        .from('hot_deals')
        .delete()
        .eq('id', testHotDealId)
      
      if (hotDealDeleteError) {
        console.warn('핫딜 데이터 삭제 실패:', hotDealDeleteError.message)
      }
    }

    // 테스트에서 생성한 사용자만 삭제
    if (testUserId && createdNewUser) {
      const { error: userDeleteError } = await client
        .from('users')
        .delete()
        .eq('id', testUserId)
      
      if (userDeleteError) {
        console.warn('사용자1 데이터 삭제 실패:', userDeleteError.message)
      }
    }

    if (testUser2Id && createdNewUser2) {
      const { error: user2DeleteError } = await client
        .from('users')
        .delete()
        .eq('id', testUser2Id)
      
      if (user2DeleteError) {
        console.warn('사용자2 데이터 삭제 실패:', user2DeleteError.message)
      }
    }

    console.log('   테스트 데이터 정리 완료')
  })

  // 결과 출력
  console.log('\n📊 Phase 3 테스트 결과 요약:')
  console.log('─'.repeat(50))
  
  const passedTests = testResults.filter(r => r.status === 'PASS').length
  const failedTests = testResults.filter(r => r.status === 'FAIL').length
  
  console.log(`✅ 통과: ${passedTests}개`)
  console.log(`❌ 실패: ${failedTests}개`)
  console.log(`📈 성공률: ${Math.round((passedTests / testResults.length) * 100)}%`)

  if (failedTests > 0) {
    console.log('\n🚨 실패한 테스트 상세:')
    testResults
      .filter(r => r.status === 'FAIL')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`)
      })
  }

  console.log('\n' + (allTestsPassed ? '✅ Phase 3: 커뮤니티 기능 테스트 완료!' : '⚠️  일부 테스트 실패'))
  
  return allTestsPassed
}

// 스크립트 실행
testPhase3Community()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Phase 3 테스트 중 오류 발생:', error)
    process.exit(1)
  })