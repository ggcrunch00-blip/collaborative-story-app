const adjectives = [
  '용감한', '빠른', '귀여운', '똑똑한', '신나는',
  '멋진', '행복한', '씩씩한', '재빠른', '친절한',
  '엉뚱한', '활발한', '조용한', '따뜻한', '재미있는',
  '당당한', '늠름한', '밝은', '느긋한', '영리한',
]

const animals = [
  '호랑이', '토끼', '강아지', '고양이', '판다',
  '코끼리', '기린', '펭귄', '여우', '늑대',
  '곰', '사자', '독수리', '돌고래', '햄스터',
  '다람쥐', '부엉이', '오리', '코알라', '고슴도치',
]

export function generateRandomNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adj}${animal}`
}

export { generateRandomNickname as randomNickname }
