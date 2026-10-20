// 여행 플래너 서비스 워커: 항상 인터넷에서 최신 파일을 먼저 받고, 끊겼을 때만 저장해 둔 파일 사용
const CACHE = 'travel-planner-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
    const req = event.request;
    // 카카오맵·지도 타일 같은 바깥 주소는 건드리지 않음
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : undefined))
                .then(hit => hit || Response.error()))
    );
});
