#!/usr/bin/env tsx

import { Command } from 'commander'
import { CrawlerManager, CrawlerSource } from '@/lib/crawlers/crawler-manager'
import chalk from 'chalk'
import { CrawlerOptions } from '@/lib/crawlers/base-hotdeal-crawler'

const program = new Command()

program
  .name('crawl-hotdeals')
  .description('한국 핫딜 크롤러 - 뽐뿌 등 커뮤니티에서 핫딜 정보 수집')
  .version('1.0.0')

program
  .option('-s, --source <source>', '크롤링할 사이트 (ppomppu, ruliweb, clien, quasarzone, coolenjoy, itcm, all)', 'ppomppu')
  .option('-p, --pages <number>', '크롤링할 페이지 수', '2')
  .option('-o, --output <directory>', '출력 디렉토리 경로', './exports')
  .option('--headless <boolean>', '헤드리스 모드 사용 여부', 'true')
  .option('-d, --delay <ms>', '페이지 간 딜레이 (밀리초)', '2000')
  .option('--save-db', '데이터베이스에 저장', false)
  .option('--save-json', 'JSON 파일로 내보내기', true)
  .option('--group-by-source', '소스별로 별도 파일 생성', false)
  .option('--import <filepath>', 'JSON 파일에서 데이터 가져오기')
  .action(async (options) => {
    console.log(chalk.blue('🚀 한국 핫딜 크롤러 시작\n'))
    
    // Parse options
    const crawlerOptions: CrawlerOptions = {
      headless: options.headless === 'true',
      maxPages: parseInt(options.pages),
      delay: parseInt(options.delay)
    }
    
    console.log(chalk.gray('📋 설정:'))
    console.log(chalk.gray(`- 사이트: ${options.source}`))
    console.log(chalk.gray(`- 페이지: ${crawlerOptions.maxPages}`))
    console.log(chalk.gray(`- 출력: ${options.output}`))
    console.log(chalk.gray(`- 헤드리스: ${crawlerOptions.headless}`))
    console.log(chalk.gray(`- DB 저장: ${options.saveDb}`))
    console.log(chalk.gray(`- JSON 저장: ${options.saveJson}`))
    
    try {
      const manager = new CrawlerManager(crawlerOptions)
      
      // Import from JSON if specified
      if (options.import) {
        const hotdeals = await manager.importFromJson(options.import)
        
        if (options.saveDb) {
          const results = [{
            source: 'imported',
            hotdeals,
            totalCrawled: hotdeals.length,
            newDeals: hotdeals.length,
            updatedDeals: 0,
            errors: 0,
            duration: 0,
            statistics: {},
            crawledAt: new Date().toISOString()
          }]
          await manager.saveToDatabase(results)
        }
        
        return
      }
      
      // Crawl specified sources
      const results = await manager.crawl(options.source as CrawlerSource)
      
      // Save to database if requested
      if (options.saveDb) {
        await manager.saveToDatabase(results)
      }
      
      // Export to JSON if requested
      if (options.saveJson) {
        const files = await manager.exportToJson(
          results, 
          options.output, 
          options.groupBySource
        )
        
        console.log(chalk.green('\n✅ 크롤링 완료!'))
        console.log(chalk.gray(`내보낸 파일: ${files.length}개`))
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ 크롤링 실패:'), error)
      process.exit(1)
    }
  })

// Run examples
program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ pnpm crawl-hotdeals')
  console.log('  $ pnpm crawl-hotdeals -p 5 -o ./data')
  console.log('  $ pnpm crawl-hotdeals --headless false')
  console.log('  $ pnpm crawl-hotdeals --save-db --save-json')
  console.log('  $ pnpm crawl-hotdeals --import ./exports/hotdeal-ppomppu-2025-07-12.json --save-db')
})

program.parse(process.argv)