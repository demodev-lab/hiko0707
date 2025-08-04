/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu'],
  },
  // 개발 환경에서 청크 로드 에러 방지
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }
    return config;
  },
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 외부 이미지 호스트 허용
    remotePatterns: [
      // 플레이스홀더 이미지 서비스
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      
      // 핫딜 커뮤니티 이미지 도메인
      // 뽐뿌 (Ppomppu)
      {
        protocol: 'https',
        hostname: 'cdn2.ppomppu.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ppomppu.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ppomppu.co.kr',
        port: '',
        pathname: '/**',
      },
      
      // 루리웹 (Ruliweb)
      {
        protocol: 'https',
        hostname: 'bbs.ruliweb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.ruliweb.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ruliweb.com',
        port: '',
        pathname: '/**',
      },
      
      // 클리앙 (Clien)
      {
        protocol: 'https',
        hostname: 'www.clien.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.clien.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.clien.net',
        port: '',
        pathname: '/**',
      },
      
      // 퀘이사존 (Quasarzone)
      {
        protocol: 'https',
        hostname: 'quasarzone.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.quasarzone.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.quasarzone.com',
        port: '',
        pathname: '/**',
      },
      
      // 쿨엔조이 (Coolenjoy)
      {
        protocol: 'https',
        hostname: 'coolenjoy.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.coolenjoy.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.coolenjoy.net',
        port: '',
        pathname: '/**',
      },
      
      // 어미새 (Eomisae)
      {
        protocol: 'https',
        hostname: 'eomisae.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.eomisae.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.eomisae.co.kr',
        port: '',
        pathname: '/**',
      },
      
      // ZOD
      {
        protocol: 'https',
        hostname: 'zod.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.zod.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.zod.kr',
        port: '',
        pathname: '/**',
      },
      
      // 알구몬 (Algumon)
      {
        protocol: 'https',
        hostname: 'www.algumon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.algumon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.algumon.com',
        port: '',
        pathname: '/**',
      },
      
      // ITCM
      {
        protocol: 'https',
        hostname: 'www.itcm.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.itcm.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.itcm.co.kr',
        port: '',
        pathname: '/**',
      },
      
      // 주요 쇼핑몰 이미지 도메인
      // 쿠팡
      {
        protocol: 'https',
        hostname: 'thumbnail.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
      
      // G마켓, 옥션
      {
        protocol: 'https',
        hostname: 'gdimg.gmarket.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.gmarket.co.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pic.auction.co.kr',
        port: '',
        pathname: '/**',
      },
      
      // 11번가
      {
        protocol: 'https',
        hostname: 'cdn.011st.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.011st.com',
        port: '',
        pathname: '/**',
      },
      
      // 네이버 쇼핑
      {
        protocol: 'https',
        hostname: 'shopping-phinf.pstatic.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shop-phinf.pstatic.net',
        port: '',
        pathname: '/**',
      },
      
      // 일반적인 CDN 도메인
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Bundle analyzer (uncomment to analyze bundle size)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback.fs = false;
  //   }
  //   return config;
  // },
}

module.exports = nextConfig