# Usage Report (TypeScript-resolved) — All app routes

Generated: 2026-02-23T15:49:55.162Z

tsconfig: tsconfig.json

Entrypoints scanned: 246
Reachable files found: 765

## Entrypoints

- app/(shop)/crypto-guide/page.tsx
- app/(shop)/store/error.tsx
- app/(trading)/quotes/page.tsx
- app/@modal/(.)design/page.tsx
- app/@modal/(.)designs/page.tsx
- app/@modal/(.)recruit/page.tsx
- app/@modal/default.tsx
- app/about/layout.tsx
- app/about/page.tsx
- app/admin/drip-campaigns/page.tsx
- app/admin/emails/page.tsx
- app/admin/notifications/page.tsx
- app/api/account/crypto-payments/route.ts
- app/api/account/update/route.ts
- app/api/admin/login/route.ts
- app/api/admin/recruits/route.ts
- app/api/admin/route.ts
- app/api/affiliate-admin/content/route.ts
- app/api/affiliate-admin/send-qr-poster/route.ts
- app/api/affiliate-admin/update/route.ts
- app/api/affiliate/route.ts
- app/api/affiliate/track-click/route.ts
- app/api/analyses/[id]/comments/route.ts
- app/api/analyses/[id]/reactions/route.ts
- app/api/analyses/[id]/route.ts
- app/api/analyses/route.ts
- app/api/analytics/route.ts
- app/api/auth/session/route.ts
- app/api/auth/youtube/refresh/route.ts
- app/api/auth/youtube/route.ts
- app/api/blogs/[id]/route.ts
- app/api/blogs/hero/route.ts
- app/api/blogs/route.ts
- app/api/breaking-news/route.ts
- app/api/breaking-news/search/route.ts
- app/api/broker/accounts/route.ts
- app/api/broker/close/route.ts
- app/api/broker/connect/route.ts
- app/api/broker/trade/route.ts
- app/api/campaigns/[id]/route.ts
- app/api/campaigns/route.ts
- app/api/campaigns/send/route.ts
- app/api/casino/auth/login/route.ts
- app/api/casino/auth/logout/route.ts
- app/api/casino/auth/me/route.ts
- app/api/casino/auth/register/route.ts
- app/api/casino/crash/route.ts
- app/api/casino/dice/bet/route.ts
- app/api/casino/history/route.ts
- app/api/casino/jackpot/route.ts
- app/api/casino/mines/route.ts
- app/api/casino/slots/route.ts
- app/api/casino/telegram/webhook/route.ts
- app/api/casino/user/route.ts
- app/api/casino/wheel/route.ts
- app/api/categories/[id]/route.ts
- app/api/categories/route.ts
- app/api/checkout/route.ts
- app/api/cmc/global/route.ts
- app/api/crash-log/route.ts
- app/api/cron/campaigns/route.ts
- app/api/cron/email-drip/route.ts
- app/api/cron/notifications/route.ts
- app/api/crypto-news/route.ts
- app/api/crypto-payment/admin/recruits/route.ts
- app/api/crypto-payment/admin/route.ts
- app/api/crypto-payment/dev-test/route.ts
- app/api/crypto-payment/metrics/route.ts
- app/api/crypto-payment/refund/admin/route.ts
- app/api/crypto-payment/refund/route.ts
- app/api/crypto-payment/route.ts
- app/api/crypto-payment/status/route.ts
- app/api/crypto-payment/verify/route.ts
- app/api/dashboard/preferences/route.ts
- app/api/database/check/route.ts
- app/api/email-templates/route.ts
- app/api/email/blast/route.ts
- app/api/email/resubscribe/route.ts
- app/api/email/test/route.ts
- app/api/email/unsubscribe/route.ts
- app/api/exchange-rates/route.ts
- app/api/feed/route.ts
- app/api/geo-detect/route.ts
- app/api/health/route.ts
- app/api/hero/route.ts
- app/api/i18n/[lang]/route.ts
- app/api/image-proxy/route.ts
- app/api/instagram/route.ts
- app/api/link-preview/route.ts
- app/api/live-quotes/route.ts
- app/api/market-data/route.ts
- app/api/market-prices/route.ts
- app/api/memory-boost/route.ts
- app/api/network/route.ts
- app/api/notifications/send/route.ts
- app/api/notifications/subscribe/route.ts
- app/api/notifications/test/route.ts
- app/api/notifications/track/route.ts
- app/api/notifications/unsubscribe/route.ts
- app/api/prices/live/route.ts
- app/api/products/[id]/route.ts
- app/api/products/route.ts
- app/api/products/slug/[slug]/route.ts
- app/api/profile/[username]/route.ts
- app/api/profile/route.ts
- app/api/projects/route.ts
- app/api/push/cleanup/route.ts
- app/api/push/poll/route.ts
- app/api/push/send/route.ts
- app/api/push/status/route.ts
- app/api/push/test/route.ts
- app/api/recruit-auth/login/route.ts
- app/api/recruit-auth/register/route.ts
- app/api/recruit/batch-generate-codes/route.ts
- app/api/recruit/generate-affiliate-code/route.ts
- app/api/recruit/send-qr-email/route.ts
- app/api/register/route.ts
- app/api/rewards/route.ts
- app/api/showcase-boost/route.ts
- app/api/skrill/create-checkout/route.ts
- app/api/skrill/webhook/route.ts
- app/api/speedtest/route.ts
- app/api/spotify/callback/route.ts
- app/api/spotify/login/route.ts
- app/api/spotify/logout/route.ts
- app/api/spotify/status/route.ts
- app/api/store/account/route.ts
- app/api/store/admin/analytics/route.ts
- app/api/store/admin/orders/[id]/route.ts
- app/api/store/admin/orders/route.ts
- app/api/store/admin/products/[id]/route.ts
- app/api/store/admin/products/images/route.ts
- app/api/store/admin/products/manage/route.ts
- app/api/store/admin/products/route.ts
- app/api/store/admin/promos/route.ts
- app/api/store/admin/revenue/route.ts
- app/api/store/admin/stats/route.ts
- app/api/store/coupon/route.ts
- app/api/store/digital-art-purchases/route.ts
- app/api/store/digital-art/route.ts
- app/api/store/email/route.ts
- app/api/store/gift-cards/route.ts
- app/api/store/newsletter/subscribe/route.ts
- app/api/store/order-email/route.ts
- app/api/store/order-email/test/route.ts
- app/api/store/orders/auto-create/route.ts
- app/api/store/print-designs/route.ts
- app/api/store/print-orders/route.ts
- app/api/store/print-products/route.ts
- app/api/store/print-uploads/route.ts
- app/api/store/products/[slug]/route.ts
- app/api/store/products/route.ts
- app/api/store/settings/display-mode/route.ts
- app/api/store/settings/vip-shipping/route.ts
- app/api/store/subscribe/route.ts
- app/api/store/tracking/route.ts
- app/api/store/vip/route.ts
- app/api/stripe/create-checkout-session/route.ts
- app/api/stripe/create-portal-session/route.ts
- app/api/stripe/create-subscription/route.ts
- app/api/stripe/session/[sessionId]/route.ts
- app/api/stripe/test/route.ts
- app/api/stripe/webhook/route.ts
- app/api/support-chat/route.ts
- app/api/telegram/bot/route.ts
- app/api/telegram/channel/route.ts
- app/api/telegram/check/route.ts
- app/api/telegram/delete-webhook/route.ts
- app/api/telegram/messages/route.ts
- app/api/telegram/sync/route.ts
- app/api/telegram/test/route.ts
- app/api/telegram/webhook/route.ts
- app/api/trading-stats/route.ts
- app/api/translate/route.ts
- app/api/upload/presign/route.ts
- app/api/version/route.ts
- app/api/vip/messages/route.ts
- app/api/vip/status/route.ts
- app/api/vip/sync/route.ts
- app/api/warmup/route.ts
- app/api/webhooks/stripe/route.ts
- app/api/youtube/channel-videos/route.ts
- app/api/youtube/discover/route.ts
- app/auth/youtube/callback/page.tsx
- app/Blogs/page.tsx
- app/community/layout.tsx
- app/community/page.tsx
- app/course/layout.tsx
- app/course/page.tsx
- app/crypto-game/page.tsx
- app/design/error.tsx
- app/design/layout.tsx
- app/design/loading.tsx
- app/design/page.tsx
- app/designs/error.tsx
- app/designs/layout.tsx
- app/designs/loading.tsx
- app/designs/page.tsx
- app/desktop/page.tsx
- app/email/resubscribe/page.tsx
- app/email/unsubscribe/page.tsx
- app/error.tsx
- app/games/[game]/loading.tsx
- app/games/[game]/page.tsx
- app/games/layout.tsx
- app/games/page.tsx
- app/games/terms/page.tsx
- app/journal/layout.tsx
- app/journal/page.tsx
- app/layout.tsx
- app/login/page.tsx
- app/oldstore/layout.tsx
- app/oldstore/page.tsx
- app/page.tsx
- app/portfolio/page.tsx
- app/products/layout.tsx
- app/products/page.tsx
- app/Prop/layout.tsx
- app/Prop/page.tsx
- app/recruit/layout.tsx
- app/recruit/page.tsx
- app/resubscribe/page.tsx
- app/socials/layout.tsx
- app/socials/page.tsx
- app/store/account/layout.tsx
- app/store/account/page.tsx
- app/store/admin/emails/page.tsx
- app/store/admin/layout.tsx
- app/store/admin/newsletter/page.tsx
- app/store/admin/orders/[id]/page.tsx
- app/store/admin/orders/page.tsx
- app/store/admin/page.tsx
- app/store/admin/products/new/page.tsx
- app/store/admin/products/page.tsx
- app/store/checkout/layout.tsx
- app/store/checkout/page.tsx
- app/store/error.tsx
- app/store/gift-cards/layout.tsx
- app/store/gift-cards/page.tsx
- app/store/layout.tsx
- app/store/page.tsx
- app/store/product/[slug]/page.tsx
- app/store/success/layout.tsx
- app/store/success/page.tsx
- app/trading-showcase/page.tsx
- app/unsubscribe/page.tsx

## Unresolved dynamic imports

_None_

## Home (app root)

Total files: 10
Used (reachable): 9
Not referenced from entrypoints: 1

### Used

- app/HomePageClient.tsx
- app/HomePageController.tsx
- app/HomePageMobileEntry.tsx
- app/HomePagePerformanceSystems.tsx
- app/HomePageShell.tsx
- app/PageSections.tsx
- app/Testimonial.tsx
- app/layout.tsx
- app/page.tsx

### Not referenced (candidates)

- app/SplinePage.tsx

## Store (app/store)

Total files: 30
Used (reachable): 25
Not referenced from entrypoints: 5

### Used

- app/store/StoreLayoutClient.tsx
- app/store/StoreMemoryContext.tsx
- app/store/StorePageClient.tsx
- app/store/error.tsx
- app/store/layout.tsx
- app/store/page.tsx
- app/store/store.config.ts
- app/store/store.utils.ts
- app/store/success/layout.tsx
- app/store/success/page.tsx
- app/store/product/[slug]/page.tsx
- app/store/gift-cards/layout.tsx
- app/store/gift-cards/page.tsx
- app/store/checkout/layout.tsx
- app/store/checkout/page.tsx
- app/store/admin/layout.tsx
- app/store/admin/page.tsx
- app/store/admin/products/page.tsx
- app/store/admin/products/new/page.tsx
- app/store/admin/orders/page.tsx
- app/store/admin/orders/[id]/page.tsx
- app/store/admin/newsletter/page.tsx
- app/store/admin/emails/page.tsx
- app/store/account/layout.tsx
- app/store/account/page.tsx

### Not referenced (candidates)

- app/store/sitemap.ts
- app/store/store-scoped.css
- app/store/store.hooks.ts
- app/store/store.imports.tsx
- app/store/admin/middleware.ts

## Games (app/games)

Total files: 56
Used (reachable): 21
Not referenced from entrypoints: 35

### Used

- app/games/GamesLayoutClient.tsx
- app/games/GamesPageClient.tsx
- app/games/layout.tsx
- app/games/page.tsx
- app/games/terms/page.tsx
- app/games/[game]/GamePageClient.tsx
- app/games/[game]/loading.tsx
- app/games/[game]/page.tsx
- app/games/[game]/games/CrashGame.tsx
- app/games/[game]/games/DiceGame.tsx
- app/games/[game]/games/FlappyBirdGame.tsx
- app/games/[game]/games/JackpotGame.tsx
- app/games/[game]/games/MinesGame.tsx
- app/games/[game]/games/PlinkoGame.tsx
- app/games/[game]/games/SlotsGame.tsx
- app/games/[game]/games/WheelGame.tsx
- app/games/[game]/games/game-notifications.ts
- app/games/[game]/games/game-styles.ts
- app/games/[game]/games/index.tsx
- app/games/[game]/games/useCasinoGlobals.ts
- app/games/[game]/games/valid-games.ts

### Not referenced (candidates)

- app/games/components/BullcasinoShell.tsx
- app/games/components/CasinoMusicAutoplay.tsx
- app/games/bullcasino/server/app.js
- app/games/bullcasino/server/crash.js
- app/games/bullcasino/js/admin_app.js
- app/games/bullcasino/js/app.js
- app/games/bullcasino/js/chart.js
- app/games/bullcasino/js/crash.js
- app/games/bullcasino/js/dice.js
- app/games/bullcasino/js/flappybird.js
- app/games/bullcasino/js/jquery.flot.min.js
- app/games/bullcasino/js/jquery.kinetic.min.js
- app/games/bullcasino/js/mines.js
- app/games/bullcasino/js/notifyme.js
- app/games/bullcasino/js/notifyme.min.js
- app/games/bullcasino/js/plinko.js
- app/games/bullcasino/js/socket.js
- app/games/bullcasino/js/wallet.js
- app/games/bullcasino/js/compiled/admin_app.js
- app/games/bullcasino/js/compiled/app.js
- app/games/bullcasino/js/compiled/chart.js
- app/games/bullcasino/js/compiled/crash.js
- app/games/bullcasino/js/compiled/dice.js
- app/games/bullcasino/js/compiled/jquery.flot.min.js
- app/games/bullcasino/js/compiled/jquery.kinetic.min.js
- app/games/bullcasino/js/compiled/mines.js
- app/games/bullcasino/js/compiled/notifyme.js
- app/games/bullcasino/js/compiled/notifyme.min.js
- app/games/bullcasino/js/compiled/plinko.js
- app/games/bullcasino/js/compiled/socket.js
- app/games/bullcasino/js/compiled/wallet.js
- app/games/bullcasino/css/admin_style.css
- app/games/bullcasino/css/flappybird.css
- app/games/bullcasino/css/notifyme.css
- app/games/bullcasino/css/style.css

## Design (app/design + app/designs)

Total files: 15
Used (reachable): 14
Not referenced from entrypoints: 1

### Used

- app/design/DesignPageClient.tsx
- app/design/DesignPageClientLoader.tsx
- app/design/DesignPrintSections.tsx
- app/design/DesignScrollGuard.tsx
- app/design/DesignShowcaseCards.tsx
- app/design/design.css
- app/design/error.tsx
- app/design/layout.tsx
- app/design/loading.tsx
- app/design/page.tsx
- app/designs/error.tsx
- app/designs/layout.tsx
- app/designs/loading.tsx
- app/designs/page.tsx

### Not referenced (candidates)

- app/design/DesignLayoutClient.tsx

## Hooks (app/hooks)

Total files: 6
Used (reachable): 5
Not referenced from entrypoints: 1

### Used

- app/hooks/useAudioEngine.ts
- app/hooks/useCalEmbed.ts
- app/hooks/useHeroVideoVolume.ts
- app/hooks/useSoundEffects.ts
- app/hooks/useSplineAudio.ts

### Not referenced (candidates)

- app/hooks/use-binance.ts

## Hooks (root /hooks)

Total files: 45
Used (reachable): 22
Not referenced from entrypoints: 23

### Used

- hooks/useAdminAuth.ts
- hooks/useAffiliateDashboardContent.ts
- hooks/useBrowserInfo.ts
- hooks/useCryptoPrices.ts
- hooks/useDashboardPreferences.ts
- hooks/useDesktopPerformance.ts
- hooks/useDevSkipShortcut.ts
- hooks/useDeviceVolumeDetector.ts
- hooks/useHeroMode.ts
- hooks/useHydrationOptimization.ts
- hooks/useMobileLazyRender.ts
- hooks/useMobilePerformance.ts
- hooks/useNotifications.ts
- hooks/useOffscreenAnimationPause.tsx
- hooks/usePerformanceInit.ts
- hooks/useRealTimeCache.ts
- hooks/useRealTimeMemory.ts
- hooks/useScrollOptimization.ts
- hooks/useShowcaseScroll.ts
- hooks/useSplinePreload.ts
- hooks/useStorageInfo.ts
- hooks/useThermalOptimization.ts

### Not referenced (candidates)

- hooks/use-outside-click.tsx
- hooks/useAnalytics.ts
- hooks/useAnalyticsTracking.ts
- hooks/useBatterySaver.ts
- hooks/useCacheManager.ts
- hooks/useCasinoUser.ts
- hooks/useMobileCrashShield.ts
- hooks/useMusicState.ts
- hooks/usePageInitialization.ts
- hooks/usePageState.ts
- hooks/usePerformanceHooks.ts
- hooks/usePerformanceState.ts
- hooks/useScrollLock.ts
- hooks/useScrollManagement.ts
- hooks/useSplineCache.ts
- hooks/useThemeState.ts
- hooks/useTradingSounds.ts
- hooks/useTranslation.ts
- hooks/useUIState.ts
- hooks/useUltraFpsOptimization.ts
- hooks/useVersionedCache.ts
- hooks/useViewportDetection.ts
- hooks/useVipStatus.ts

## Components (components/home)

Total files: 7
Used (reachable): 5
Not referenced from entrypoints: 2

### Used

- components/home/BrokerSignupSectionDark.tsx
- components/home/dynamicImports.tsx
- components/home/bundles/aboveFold.ts
- components/home/bundles/belowFold.ts
- components/home/bundles/heavy.ts

### Not referenced (candidates)

- components/home/SplineComponents.tsx
- components/home/index.ts

## Components (components/shop)

Total files: 54
Used (reachable): 37
Not referenced from entrypoints: 17

### Used

- components/shop/AnimatedProductGrid.tsx
- components/shop/BackInStockButton.tsx
- components/shop/BrokerSignupSection.tsx
- components/shop/CartDrawer.tsx
- components/shop/CircularProductGrid.tsx
- components/shop/CryptoCheckoutInline.tsx
- components/shop/CryptoPayButton.tsx
- components/shop/CryptoPaymentModal.tsx
- components/shop/DigitalArtSection.tsx
- components/shop/GlassProductGrid.tsx
- components/shop/PrintDesignPromoGrid.tsx
- components/shop/PrintDesignStudio.tsx
- components/shop/PrintProductsSection.tsx
- components/shop/ProductCard.tsx
- components/shop/ProductGallery.tsx
- components/shop/ProductInfo.tsx
- components/shop/ProductMediaCarousel.tsx
- components/shop/ProductReviews.tsx
- components/shop/ProductsCarousel.tsx
- components/shop/RecentlyViewedProducts.tsx
- components/shop/RelatedProducts.tsx
- components/shop/SearchAutocomplete.tsx
- components/shop/ShareProductButton.tsx
- components/shop/ShippingReturnsModal.tsx
- components/shop/SizeGuideModal.tsx
- components/shop/StoreAboutTimeline.tsx
- components/shop/StoreFooter.tsx
- components/shop/StoreSupportButton.tsx
- components/shop/StoreTextEffects.tsx
- components/shop/SupportDrawer.tsx
- components/shop/admin/AdminDashboard.tsx
- components/shop/admin/AdminOrderDetail.tsx
- components/shop/admin/AdminOrdersTable.tsx
- components/shop/admin/AdminProductUpload.tsx
- components/shop/admin/AdminProductsList.tsx
- components/shop/admin/AdminSidebar.tsx
- components/shop/admin/RevenueChart.tsx

### Not referenced (candidates)

- components/shop/AppleProductsSection.tsx
- components/shop/CheckoutWizard.tsx
- components/shop/CryptoAcceptedBanner.tsx
- components/shop/CurrencyLanguageSelector.tsx
- components/shop/FeaturedProductSpotlight.tsx
- components/shop/FeaturedProductsTimeline.tsx
- components/shop/FilterSheet.tsx
- components/shop/MarketPriceTicker.tsx
- components/shop/MobileProductsDome.tsx
- components/shop/StoreFluidGlassSection.tsx
- components/shop/StoreHeader.tsx
- components/shop/StoreHero3D.tsx
- components/shop/StoreHeroFluidGlass.tsx
- components/shop/StoreRewardsBanner.tsx
- components/shop/TimelineProductsSection.tsx
- components/shop/VIP3DProducts.tsx
- components/shop/admin/index.ts

## Components (components/store)

Total files: 4
Used (reachable): 4
Not referenced from entrypoints: 0

### Used

- components/store/NewsletterAdminPanel.tsx
- components/store/StoreAccountDrawer.tsx
- components/store/StoreHeader.tsx
- components/store/StorePillNav.tsx

### Not referenced (candidates)

_None_

## Components (components/games)

Total files: 2
Used (reachable): 1
Not referenced from entrypoints: 1

### Used

- components/games/DonationFundSection.tsx

### Not referenced (candidates)

- components/games/DonationHero.tsx

## Lib (lib)

Total files: 97
Used (reachable): 65
Not referenced from entrypoints: 32

### Used

- lib/CrashTracker.tsx
- lib/FpsCompatibility.ts
- lib/FpsMeasurement.ts
- lib/FpsOptimizer.tsx
- lib/SplinePreloader.ts
- lib/UnifiedPerformanceSystem.tsx
- lib/analytics.ts
- lib/appVersion.ts
- lib/auth.ts
- lib/bigDeviceScrollOptimizer.ts
- lib/blockchain-verify.ts
- lib/browserDetection.ts
- lib/bullAlgo.ts
- lib/cacheManager.ts
- lib/campaign-service.ts
- lib/campaign-types.ts
- lib/casino-db.ts
- lib/cinematicTransitions.ts
- lib/cookieConsent.ts
- lib/crypto-encryption.ts
- lib/crypto-wallets.ts
- lib/deviceMonitor.ts
- lib/drip-email-sequences.ts
- lib/email-attachments.ts
- lib/email-service.ts
- lib/email-template-renderer.ts
- lib/email-templates.ts
- lib/forceScrollEnabler.ts
- lib/invoice-generator.ts
- lib/keepAlive.ts
- lib/lazyPerformanceHooks.ts
- lib/localStorage.ts
- lib/logger.ts
- lib/memory.js
- lib/mobileDetection.ts
- lib/mongodb.ts
- lib/performanceSystem.tsx
- lib/prefetchHelper.ts
- lib/premiumUISystem.ts
- lib/rateLimit.ts
- lib/resourcePreloading.ts
- lib/safariOptimizations.ts
- lib/seo-domains.ts
- lib/seo-languages.ts
- lib/sessionPersistence.ts
- lib/showcaseBoost.ts
- lib/skrill.ts
- lib/smartStorage.ts
- lib/smoothScroll.tsx
- lib/spline-wrapper.d.ts
- lib/splineManager.ts
- lib/splineQueueManager.ts
- lib/spotifyPkce.ts
- lib/storeLocalCache.ts
- lib/stripe.ts
- lib/supabase.ts
- lib/supabaseClient.ts
- lib/telegram.ts
- lib/tradingCalculations.ts
- lib/utils.ts
- lib/validation.ts
- lib/zustandStorage.ts
- lib/supabase/client.ts
- lib/quotes/instruments.ts
- lib/quotes/useLiveQuotes.ts

### Not referenced (candidates)

- lib/FpsAudit.ts
- lib/SmartMountSystem.tsx
- lib/desktopOptimizations.ts
- lib/deviceProfile.ts
- lib/gameAnimations.ts
- lib/gpuAnimation.ts
- lib/inputManager.ts
- lib/interactionUtils.tsx
- lib/memoryBoost.js
- lib/mobileLoaderOptimization.ts
- lib/mobileMemoryManager.ts
- lib/mobileOptimizations.tsx
- lib/mobileSplineOptimizer.ts
- lib/pageConfig.ts
- lib/performance.ts
- lib/performanceMonitor.ts
- lib/renderingOptimizations.ts
- lib/sceneStorage.ts
- lib/seo-keywords.ts
- lib/serviceWorker.ts
- lib/smartLoading.ts
- lib/spline-wrapper.js
- lib/splineCache.ts
- lib/splineStreamer.ts
- lib/stripe-client.ts
- lib/telemetry.ts
- lib/tickerParser.ts
- lib/uiLayers.ts
- lib/universalFallback.ts
- lib/use120Hz.ts
- lib/useOptimizations.ts
- lib/web3-config.ts

## Contexts (contexts + context)

Total files: 15
Used (reachable): 13
Not referenced from entrypoints: 2

### Used

- contexts/AudioSettingsProvider.tsx
- contexts/AuthContext.tsx
- contexts/GlobalThemeProvider.tsx
- contexts/MobileMenuContext.tsx
- contexts/MobilePerformanceProvider.tsx
- contexts/RecruitAuthContext.tsx
- contexts/SoundContext.tsx
- contexts/ThemesContext.tsx
- contexts/UIStateContext.tsx
- contexts/UIStateHook.ts
- contexts/ViewportStateContext.tsx
- context/StudioContext.tsx
- context/providers.tsx

### Not referenced (candidates)

- contexts/ColorOverlayContext.tsx
- contexts/ThemeEffectsContext.tsx

## Stores (stores)

Total files: 10
Used (reachable): 7
Not referenced from entrypoints: 3

### Used

- stores/cart-store.ts
- stores/currency-locale-store.ts
- stores/feedStore.ts
- stores/performanceStore.ts
- stores/recently-viewed-store.ts
- stores/userStore.ts
- stores/wishlist-store.ts

### Not referenced (candidates)

- stores/index.ts
- stores/uiStore.ts
- stores/welcomeControlsStore.ts

## Types (types)

Total files: 5
Used (reachable): 4
Not referenced from entrypoints: 1

### Used

- types/feed.ts
- types/store.ts
- types/tradingJournal.ts
- types/user.ts

### Not referenced (candidates)

- types/lucide-icons.d.ts