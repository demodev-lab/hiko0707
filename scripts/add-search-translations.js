const fs = require('fs');
const path = require('path');

const searchTranslations = {
  ko: {
    search: {
      noSuggestions: '검색 제안이 없습니다',
      recentSearches: '최근 검색어',
      popularSearches: '인기 검색어',
      searchPlaceholder: '검색어를 입력하세요...',
      clearRecentSearches: '최근 검색어 삭제',
      searchResults: '검색 결과',
      noResults: '검색 결과가 없습니다',
      showingResults: '{count}개의 검색 결과',
    }
  },
  en: {
    search: {
      noSuggestions: 'No suggestions found',
      recentSearches: 'Recent searches',
      popularSearches: 'Popular searches',
      searchPlaceholder: 'Search...',
      clearRecentSearches: 'Clear recent searches',
      searchResults: 'Search results',
      noResults: 'No results found',
      showingResults: 'Showing {count} results',
    }
  },
  zh: {
    search: {
      noSuggestions: '没有搜索建议',
      recentSearches: '最近搜索',
      popularSearches: '热门搜索',
      searchPlaceholder: '搜索...',
      clearRecentSearches: '清除最近搜索',
      searchResults: '搜索结果',
      noResults: '未找到结果',
      showingResults: '显示 {count} 个结果',
    }
  },
  ja: {
    search: {
      noSuggestions: '候補が見つかりません',
      recentSearches: '最近の検索',
      popularSearches: '人気の検索',
      searchPlaceholder: '検索...',
      clearRecentSearches: '最近の検索をクリア',
      searchResults: '検索結果',
      noResults: '結果が見つかりません',
      showingResults: '{count}件の結果を表示',
    }
  },
  vi: {
    search: {
      noSuggestions: 'Không có gợi ý',
      recentSearches: 'Tìm kiếm gần đây',
      popularSearches: 'Tìm kiếm phổ biến',
      searchPlaceholder: 'Tìm kiếm...',
      clearRecentSearches: 'Xóa tìm kiếm gần đây',
      searchResults: 'Kết quả tìm kiếm',
      noResults: 'Không tìm thấy kết quả',
      showingResults: 'Hiển thị {count} kết quả',
    }
  },
  th: {
    search: {
      noSuggestions: 'ไม่พบคำแนะนำ',
      recentSearches: 'การค้นหาล่าสุด',
      popularSearches: 'การค้นหายอดนิยม',
      searchPlaceholder: 'ค้นหา...',
      clearRecentSearches: 'ล้างการค้นหาล่าสุด',
      searchResults: 'ผลการค้นหา',
      noResults: 'ไม่พบผลลัพธ์',
      showingResults: 'แสดง {count} ผลลัพธ์',
    }
  },
  mn: {
    search: {
      noSuggestions: 'Санал зөвлөмж олдсонгүй',
      recentSearches: 'Сүүлийн хайлтууд',
      popularSearches: 'Түгээмэл хайлтууд',
      searchPlaceholder: 'Хайх...',
      clearRecentSearches: 'Сүүлийн хайлтуудыг арилгах',
      searchResults: 'Хайлтын үр дүн',
      noResults: 'Үр дүн олдсонгүй',
      showingResults: '{count} үр дүн харуулж байна',
    }
  },
  ru: {
    search: {
      noSuggestions: 'Предложения не найдены',
      recentSearches: 'Недавние поиски',
      popularSearches: 'Популярные запросы',
      searchPlaceholder: 'Поиск...',
      clearRecentSearches: 'Очистить недавние поиски',
      searchResults: 'Результаты поиска',
      noResults: 'Результаты не найдены',
      showingResults: 'Показано {count} результатов',
    }
  }
};

// Read the current translations file
const filePath = path.join(__dirname, '..', 'lib', 'i18n', 'translations-merged.ts');
let content = fs.readFileSync(filePath, 'utf8');

// For each language, find where to insert the search translations
Object.entries(searchTranslations).forEach(([lang, translations]) => {
  // Find the auth section for this language
  const authPattern = new RegExp(`(${lang}: {[\\s\\S]*?auth: {[\\s\\S]*?}),`, 'g');
  
  content = content.replace(authPattern, (match, group1) => {
    // Add search translations after auth
    return `${group1},\n    // Search\n    search: ${JSON.stringify(translations.search, null, 6).replace(/"/g, "'").replace(/\n/g, '\n    ')},`;
  });
});

// Write the updated content back
fs.writeFileSync(filePath, content);

console.log('Search translations added successfully!');