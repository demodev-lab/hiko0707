#!/usr/bin/env node

/**
 * HiKo 샘플 이미지 생성 스크립트
 * Canvas API를 사용하여 플레이스홀더 이미지 생성
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 이미지 프리셋 정의
const IMAGE_PRESETS = {
  // 히어로 섹션
  "hero-desktop": { size: [1920, 1080], color: '#FF6B00', text: '히어로 섹션 데스크톱' },
  "hero-tablet": { size: [1024, 768], color: '#FF6B00', text: '히어로 섹션 태블릿' },
  "hero-mobile": { size: [768, 1024], color: '#FF6B00', text: '히어로 섹션 모바일' },
  
  // 핫딜 카드
  "hotdeal-thumb": { size: [400, 300], color: '#0066FF', text: '핫딜 썸네일' },
  "hotdeal-detail": { size: [800, 600], color: '#0066FF', text: '핫딜 상세' },
  
  // 카테고리
  "category-icon": { size: [120, 120], color: '#00C896', text: '카테고리' },
  "category-banner": { size: [360, 200], color: '#00C896', text: '카테고리 배너' },
  
  // 프로필
  "avatar-large": { size: [200, 200], color: '#666666', text: '프로필' },
  "avatar-small": { size: [80, 80], color: '#666666', text: '' },
  
  // 소셜
  "og-image": { size: [1200, 630], color: '#FF6F0F', text: 'HiKo - 한국 쇼핑 도우미' },
  "twitter-card": { size: [1200, 675], color: '#FF6F0F', text: 'HiKo' },
};

function createPlaceholderImage(preset, outputPath) {
  const [width, height] = preset.size;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 그라디언트 배경
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, preset.color);
  gradient.addColorStop(1, adjustColor(preset.color, -30));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 패턴 오버레이
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < width; i += 40) {
    for (let j = 0; j < height; j += 40) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(i, j, 20, 20);
    }
  }
  ctx.globalAlpha = 1.0;
  
  // 텍스트
  if (preset.text) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.min(width, height) / 10}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 텍스트 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(preset.text, width / 2, height / 2);
  }
  
  // 크기 정보
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowBlur = 0;
  ctx.fillText(`${width}x${height}`, width - 10, height - 10);
  
  // 파일 저장
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ 생성 완료: ${outputPath}`);
}

function adjustColor(color, amount) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 메인 실행
function main() {
  const outputDir = path.join(__dirname, '..', 'public', 'images');
  
  // 디렉토리 생성
  const dirs = ['hero', 'hotdeal', 'category', 'profile', 'social'];
  dirs.forEach(dir => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  // 이미지 생성
  Object.entries(IMAGE_PRESETS).forEach(([name, preset]) => {
    const category = name.split('-')[0];
    const outputPath = path.join(outputDir, category, `${name}.jpg`);
    createPlaceholderImage(preset, outputPath);
  });
  
  console.log('\n✅ 모든 샘플 이미지가 생성되었습니다!');
}

// canvas 모듈 체크
try {
  require('canvas');
  main();
} catch (error) {
  console.log('Canvas 모듈이 필요합니다. 설치하려면:');
  console.log('npm install canvas');
  console.log('\n대신 Next.js의 동적 이미지 생성을 사용하겠습니다.');
}