import { NextRequest, NextResponse } from 'next/server'
import { crawlerScheduler } from '@/lib/services/crawler-scheduler'
import { CrawlerSource } from '@/lib/crawlers/new-crawler-manager'
import '@/lib/services/crawler-scheduler-init' // 초기화 코드 실행

// GET: 모든 크롤링 작업 조회
export async function GET() {
  try {
    const jobs = crawlerScheduler.getAllJobs()
    return NextResponse.json({
      success: true,
      data: jobs
    })
  } catch (error) {
    console.error('Failed to get crawl jobs:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get crawl jobs'
    }, { status: 500 })
  }
}

// POST: 새로운 크롤링 작업 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const job = {
      id: `job_${Date.now()}`,
      source: body.source as CrawlerSource,
      schedule: body.schedule || '*/30 * * * *', // 기본값: 30분마다
      enabled: body.enabled !== false,
      status: 'idle' as const,
      lastRun: undefined,
      nextRun: undefined
    }
    
    crawlerScheduler.addJob(job)
    
    return NextResponse.json({
      success: true,
      data: job
    })
  } catch (error) {
    console.error('Failed to create crawl job:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create crawl job'
    }, { status: 500 })
  }
}

// PUT: 크롤링 작업 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, enabled } = body
    
    crawlerScheduler.toggleJob(jobId, enabled)
    
    return NextResponse.json({
      success: true,
      data: crawlerScheduler.getJob(jobId)
    })
  } catch (error) {
    console.error('Failed to update crawl job:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update crawl job'
    }, { status: 500 })
  }
}

// DELETE: 크롤링 작업 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 })
    }
    
    crawlerScheduler.removeJob(jobId)
    
    return NextResponse.json({
      success: true,
      message: 'Job removed successfully'
    })
  } catch (error) {
    console.error('Failed to delete crawl job:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete crawl job'
    }, { status: 500 })
  }
}