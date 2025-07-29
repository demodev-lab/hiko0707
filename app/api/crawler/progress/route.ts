import { NextRequest } from 'next/server'
import { crawlerScheduler } from '@/lib/services/crawler-scheduler'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // 클라이언트에게 연결 확인 메시지 전송
      controller.enqueue(encoder.encode('data: {"type":"connected","message":"Connected to crawler progress stream"}\n\n'))
      
      // 크롤러 이벤트 리스너 등록
      const handleCrawlStart = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', ...data })}\n\n`))
      }
      
      const handleCrawlProgress = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`))
      }
      
      const handleCrawlComplete = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`))
      }
      
      const handleCrawlError = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', ...data })}\n\n`))
      }
      
      crawlerScheduler.on('crawl:start', handleCrawlStart)
      crawlerScheduler.on('crawl:progress', handleCrawlProgress)
      crawlerScheduler.on('crawl:complete', handleCrawlComplete)
      crawlerScheduler.on('crawl:error', handleCrawlError)
      
      // Keep-alive 메시지 전송 (30초마다)
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(':keep-alive\n\n'))
      }, 30000)
      
      // 클린업 함수
      request.signal.addEventListener('abort', () => {
        crawlerScheduler.off('crawl:start', handleCrawlStart)
        crawlerScheduler.off('crawl:progress', handleCrawlProgress)
        crawlerScheduler.off('crawl:complete', handleCrawlComplete)
        crawlerScheduler.off('crawl:error', handleCrawlError)
        clearInterval(keepAliveInterval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}