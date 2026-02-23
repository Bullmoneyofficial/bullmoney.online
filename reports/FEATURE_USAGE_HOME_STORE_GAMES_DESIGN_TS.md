# Feature Usage Report (TypeScript-resolved) — Home + Store + Games + Design

Generated: 2026-02-23T15:49:19.669Z

tsconfig: tsconfig.json

Entrypoints scanned: 39
Reachable files found: 488

## Entrypoints

- app/design/error.tsx
- app/design/layout.tsx
- app/design/loading.tsx
- app/design/page.tsx
- app/designs/error.tsx
- app/designs/layout.tsx
- app/designs/loading.tsx
- app/designs/page.tsx
- app/games/[game]/loading.tsx
- app/games/[game]/page.tsx
- app/games/layout.tsx
- app/games/page.tsx
- app/games/terms/page.tsx
- app/HomePageClient.tsx
- app/HomePageController.tsx
- app/HomePageMobileEntry.tsx
- app/HomePageShell.tsx
- app/layout.tsx
- app/page.tsx
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
Used (reachable): 45
Not referenced from entrypoints: 52

### Used

- lib/CrashTracker.tsx
- lib/FpsCompatibility.ts
- lib/FpsMeasurement.ts
- lib/FpsOptimizer.tsx
- lib/SplinePreloader.ts
- lib/UnifiedPerformanceSystem.tsx
- lib/analytics.ts
- lib/appVersion.ts
- lib/bigDeviceScrollOptimizer.ts
- lib/browserDetection.ts
- lib/bullAlgo.ts
- lib/cacheManager.ts
- lib/cinematicTransitions.ts
- lib/cookieConsent.ts
- lib/crypto-wallets.ts
- lib/deviceMonitor.ts
- lib/email-template-renderer.ts
- lib/forceScrollEnabler.ts
- lib/keepAlive.ts
- lib/lazyPerformanceHooks.ts
- lib/logger.ts
- lib/memory.js
- lib/mobileDetection.ts
- lib/performanceSystem.tsx
- lib/prefetchHelper.ts
- lib/resourcePreloading.ts
- lib/safariOptimizations.ts
- lib/seo-domains.ts
- lib/seo-languages.ts
- lib/sessionPersistence.ts
- lib/showcaseBoost.ts
- lib/smartStorage.ts
- lib/smoothScroll.tsx
- lib/spline-wrapper.d.ts
- lib/splineManager.ts
- lib/splineQueueManager.ts
- lib/storeLocalCache.ts
- lib/supabase.ts
- lib/supabaseClient.ts
- lib/tradingCalculations.ts
- lib/utils.ts
- lib/zustandStorage.ts
- lib/supabase/client.ts
- lib/quotes/instruments.ts
- lib/quotes/useLiveQuotes.ts

### Not referenced (candidates)

- lib/FpsAudit.ts
- lib/SmartMountSystem.tsx
- lib/auth.ts
- lib/blockchain-verify.ts
- lib/campaign-service.ts
- lib/campaign-types.ts
- lib/casino-db.ts
- lib/crypto-encryption.ts
- lib/desktopOptimizations.ts
- lib/deviceProfile.ts
- lib/drip-email-sequences.ts
- lib/email-attachments.ts
- lib/email-service.ts
- lib/email-templates.ts
- lib/gameAnimations.ts
- lib/gpuAnimation.ts
- lib/inputManager.ts
- lib/interactionUtils.tsx
- lib/invoice-generator.ts
- lib/localStorage.ts
- lib/memoryBoost.js
- lib/mobileLoaderOptimization.ts
- lib/mobileMemoryManager.ts
- lib/mobileOptimizations.tsx
- lib/mobileSplineOptimizer.ts
- lib/mongodb.ts
- lib/pageConfig.ts
- lib/performance.ts
- lib/performanceMonitor.ts
- lib/premiumUISystem.ts
- lib/rateLimit.ts
- lib/renderingOptimizations.ts
- lib/sceneStorage.ts
- lib/seo-keywords.ts
- lib/serviceWorker.ts
- lib/skrill.ts
- lib/smartLoading.ts
- lib/spline-wrapper.js
- lib/splineCache.ts
- lib/splineStreamer.ts
- lib/spotifyPkce.ts
- lib/stripe-client.ts
- lib/stripe.ts
- lib/telegram.ts
- lib/telemetry.ts
- lib/tickerParser.ts
- lib/uiLayers.ts
- lib/universalFallback.ts
- lib/use120Hz.ts
- lib/useOptimizations.ts
- lib/validation.ts
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