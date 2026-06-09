export type SupportedLocale = "en" | "ko";

export const supportedLocales = ["en", "ko"] as const;

export const fallbackMessages = {
  en: {
    "content.overlay.aria.hide": "Hide Footballay overlay",
    "content.overlay.aria.open": "Open Footballay overlay",
    "content.overlay.aria.ticker": "Footballay live stat ticker",
    "content.overlay.title.liveStats": "Footballay live stats",
    "content.overlay.waiting.liveData": "Waiting for live data",
    "content.overlay.waiting.matchStats": "Waiting for match stats",
    "overlay.stat.cards": "Cards",
    "overlay.stat.possession": "Possession",
    "overlay.stat.shots": "Shots",
    "overlay.stat.shotsOnGoal": "SOT",
    "popup.error.pageOverlayUnavailable": "This page cannot run the overlay",
    "popup.fixture.empty.noFixtures": "No fixtures",
    "popup.fixture.empty.noLeague": "Select a league",
    "popup.fixture.loading": "Loading fixtures",
    "popup.settings.close": "Close settings",
    "popup.settings.open": "Open settings",
    "popup.settings.overlayPosition": "Display position",
    "popup.settings.title": "Setting",
    "popup.title": "Footballay"
  },
  ko: {
    "content.overlay.aria.hide": "Footballay 오버레이 숨기기",
    "content.overlay.aria.open": "Footballay 오버레이 열기",
    "content.overlay.aria.ticker": "Footballay 실시간 통계 티커",
    "content.overlay.title.liveStats": "Footballay 실시간 통계",
    "content.overlay.waiting.liveData": "실시간 데이터를 기다리는 중",
    "content.overlay.waiting.matchStats": "경기 통계를 기다리는 중",
    "overlay.stat.cards": "카드",
    "overlay.stat.possession": "점유율",
    "overlay.stat.shots": "슈팅",
    "overlay.stat.shotsOnGoal": "유효슛",
    "popup.error.pageOverlayUnavailable": "이 페이지에서는 오버레이를 실행할 수 없습니다",
    "popup.fixture.empty.noFixtures": "경기가 없습니다",
    "popup.fixture.empty.noLeague": "리그를 선택하세요",
    "popup.fixture.loading": "경기 목록을 불러오는 중",
    "popup.settings.close": "설정 닫기",
    "popup.settings.open": "설정 열기",
    "popup.settings.overlayPosition": "표시 위치",
    "popup.settings.title": "설정",
    "popup.title": "Footballay"
  }
} as const;

export type MessageKey = keyof typeof fallbackMessages.en;
