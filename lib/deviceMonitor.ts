/**
 * Device Monitor - Comprehensive System Information
 *
 * Provides real-time device metrics:
 * - Network speed (live measurement)
 * - Device specs (GPU, CPU, RAM)
 * - IP address and location
 * - Performance metrics (FPS, memory)
 * - Battery status
 * - Connection quality
 * - Real hardware detection with device database
 */

// ============================================================================
// DEVICE DATABASE - Real devices with actual specs
// ============================================================================

interface DeviceSpec {
  model: string;
  manufacturer: string;
  ram: number; // GB
  cpu: string;
  cpuCores: number;
  screenWidth: number;
  screenHeight: number;
  ppi: number;
  year: number;
}

// Comprehensive device database - phones, tablets, desktops
const DEVICE_DATABASE: Record<string, DeviceSpec> = {
  // === APPLE IPHONES ===
  'iPhone17,1': { model: 'iPhone 16 Pro', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18 Pro', cpuCores: 6, screenWidth: 1206, screenHeight: 2622, ppi: 460, year: 2024 },
  'iPhone17,2': { model: 'iPhone 16 Pro Max', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18 Pro', cpuCores: 6, screenWidth: 1320, screenHeight: 2868, ppi: 460, year: 2024 },
  'iPhone17,3': { model: 'iPhone 16', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2024 },
  'iPhone17,4': { model: 'iPhone 16 Plus', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2024 },
  'iPhone16,1': { model: 'iPhone 15 Pro', manufacturer: 'Apple', ram: 8, cpu: 'Apple A17 Pro', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2023 },
  'iPhone16,2': { model: 'iPhone 15 Pro Max', manufacturer: 'Apple', ram: 8, cpu: 'Apple A17 Pro', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2023 },
  'iPhone15,4': { model: 'iPhone 15', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2023 },
  'iPhone15,5': { model: 'iPhone 15 Plus', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2023 },
  'iPhone15,2': { model: 'iPhone 14 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2022 },
  'iPhone15,3': { model: 'iPhone 14 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2022 },
  'iPhone14,7': { model: 'iPhone 14', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2022 },
  'iPhone14,8': { model: 'iPhone 14 Plus', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2022 },
  'iPhone14,2': { model: 'iPhone 13 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2021 },
  'iPhone14,3': { model: 'iPhone 13 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2021 },
  'iPhone14,5': { model: 'iPhone 13', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2021 },
  'iPhone14,4': { model: 'iPhone 13 mini', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 2340, ppi: 476, year: 2021 },
  'iPhone13,1': { model: 'iPhone 12 mini', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 2340, ppi: 476, year: 2020 },
  'iPhone13,2': { model: 'iPhone 12', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2020 },
  'iPhone13,3': { model: 'iPhone 12 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2020 },
  'iPhone13,4': { model: 'iPhone 12 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2020 },
  'iPhone12,1': { model: 'iPhone 11', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 828, screenHeight: 1792, ppi: 326, year: 2019 },
  'iPhone12,3': { model: 'iPhone 11 Pro', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2019 },
  'iPhone12,5': { model: 'iPhone 11 Pro Max', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 1242, screenHeight: 2688, ppi: 458, year: 2019 },
  'iPhone11,2': { model: 'iPhone XS', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2018 },
  'iPhone11,4': { model: 'iPhone XS Max', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 1242, screenHeight: 2688, ppi: 458, year: 2018 },
  'iPhone11,8': { model: 'iPhone XR', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 828, screenHeight: 1792, ppi: 326, year: 2018 },
  'iPhoneSE3': { model: 'iPhone SE (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2022 },
  
  // === APPLE IPADS ===
  'iPad14,3': { model: 'iPad Pro 11" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2022 },
  'iPad14,5': { model: 'iPad Pro 12.9" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2022 },
  'iPad13,16': { model: 'iPad Air (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  'iPad13,18': { model: 'iPad (10th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  'iPad14,8': { model: 'iPad Pro 11" (M4)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M4', cpuCores: 10, screenWidth: 2420, screenHeight: 1668, ppi: 264, year: 2024 },
  'iPad14,9': { model: 'iPad Pro 13" (M4)', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 2752, screenHeight: 2064, ppi: 264, year: 2024 },
  
  // === APPLE MACS ===
  'Mac14,2': { model: 'MacBook Air M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2560, screenHeight: 1664, ppi: 224, year: 2022 },
  'Mac14,7': { model: 'MacBook Pro 13" M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2022 },
  'Mac14,5': { model: 'MacBook Pro 14" M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac14,6': { model: 'MacBook Pro 16" M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac14,9': { model: 'MacBook Pro 14" M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac14,10': { model: 'MacBook Pro 16" M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,3': { model: 'MacBook Pro 14" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,6': { model: 'MacBook Pro 14" M3 Pro', manufacturer: 'Apple', ram: 18, cpu: 'Apple M3 Pro', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,7': { model: 'MacBook Pro 16" M3 Pro', manufacturer: 'Apple', ram: 18, cpu: 'Apple M3 Pro', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,8': { model: 'MacBook Pro 14" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,9': { model: 'MacBook Pro 16" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,12': { model: 'MacBook Air 13" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 2560, screenHeight: 1664, ppi: 224, year: 2024 },
  'Mac15,13': { model: 'MacBook Air 15" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 2880, screenHeight: 1864, ppi: 224, year: 2024 },
  'Mac16,1': { model: 'MacBook Pro 14" M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2024 },
  'Mac16,5': { model: 'MacBook Pro 16" M4 Pro', manufacturer: 'Apple', ram: 24, cpu: 'Apple M4 Pro', cpuCores: 14, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2024 },
  'Mac16,8': { model: 'MacBook Pro 16" M4 Max', manufacturer: 'Apple', ram: 48, cpu: 'Apple M4 Max', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2024 },
  'iMac21,1': { model: 'iMac 24" M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2021 },
  'Mac15,4': { model: 'iMac 24" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2023 },
  'Mac14,3': { model: 'Mac mini M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,12': { model: 'Mac mini M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac16,10': { model: 'Mac mini M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2024 },
  'Mac16,11': { model: 'Mac mini M4 Pro', manufacturer: 'Apple', ram: 24, cpu: 'Apple M4 Pro', cpuCores: 14, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2024 },
  'Mac14,13': { model: 'Mac Studio M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,14': { model: 'Mac Studio M2 Ultra', manufacturer: 'Apple', ram: 64, cpu: 'Apple M2 Ultra', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,8': { model: 'Mac Pro M2 Ultra', manufacturer: 'Apple', ram: 64, cpu: 'Apple M2 Ultra', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  
  // === SAMSUNG GALAXY PHONES (2020-2026) ===
  'SM-S928': { model: 'Galaxy S24 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3120, ppi: 505, year: 2024 },
  'SM-S926': { model: 'Galaxy S24+', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3120, ppi: 516, year: 2024 },
  'SM-S921': { model: 'Galaxy S24', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 2400', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 416, year: 2024 },
  'SM-S918': { model: 'Galaxy S23 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1440, screenHeight: 3088, ppi: 500, year: 2023 },
  'SM-S916': { model: 'Galaxy S23+', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 393, year: 2023 },
  'SM-S911': { model: 'Galaxy S23', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 425, year: 2023 },
  'SM-S908': { model: 'Galaxy S22 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1440, screenHeight: 3088, ppi: 500, year: 2022 },
  'SM-S906': { model: 'Galaxy S22+', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 393, year: 2022 },
  'SM-S901': { model: 'Galaxy S22', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 425, year: 2022 },
  'SM-G998': { model: 'Galaxy S21 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Exynos 2100', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 515, year: 2021 },
  'SM-G996': { model: 'Galaxy S21+', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 2100', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 394, year: 2021 },
  'SM-G991': { model: 'Galaxy S21', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 2100', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 421, year: 2021 },
  'SM-G988': { model: 'Galaxy S20 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Exynos 990', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 511, year: 2020 },
  'SM-G986': { model: 'Galaxy S20+', manufacturer: 'Samsung', ram: 12, cpu: 'Exynos 990', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 525, year: 2020 },
  'SM-G981': { model: 'Galaxy S20', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 990', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 563, year: 2020 },
  // Samsung Galaxy Z Fold/Flip
  'SM-F956': { model: 'Galaxy Z Fold 6', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1856, screenHeight: 2160, ppi: 374, year: 2024 },
  'SM-F741': { model: 'Galaxy Z Flip 6', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1080, screenHeight: 2640, ppi: 426, year: 2024 },
  'SM-F946': { model: 'Galaxy Z Fold 5', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1812, screenHeight: 2176, ppi: 374, year: 2023 },
  'SM-F731': { model: 'Galaxy Z Flip 5', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2640, ppi: 426, year: 2023 },
  // Samsung Galaxy A series
  'SM-A556': { model: 'Galaxy A55', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 1480', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 390, year: 2024 },
  'SM-A356': { model: 'Galaxy A35', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 1380', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 390, year: 2024 },
  'SM-A546': { model: 'Galaxy A54', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 1380', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 403, year: 2023 },
  
  // === GOOGLE PIXEL ===
  'Pixel 9 Pro XL': { model: 'Pixel 9 Pro XL', manufacturer: 'Google', ram: 16, cpu: 'Google Tensor G4', cpuCores: 8, screenWidth: 1344, screenHeight: 2992, ppi: 486, year: 2024 },
  'Pixel 9 Pro': { model: 'Pixel 9 Pro', manufacturer: 'Google', ram: 16, cpu: 'Google Tensor G4', cpuCores: 8, screenWidth: 1280, screenHeight: 2856, ppi: 495, year: 2024 },
  'Pixel 9': { model: 'Pixel 9', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G4', cpuCores: 8, screenWidth: 1080, screenHeight: 2424, ppi: 422, year: 2024 },
  'Pixel 9 Pro Fold': { model: 'Pixel 9 Pro Fold', manufacturer: 'Google', ram: 16, cpu: 'Google Tensor G4', cpuCores: 8, screenWidth: 2076, screenHeight: 2152, ppi: 373, year: 2024 },
  'Pixel 8 Pro': { model: 'Pixel 8 Pro', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G3', cpuCores: 8, screenWidth: 1344, screenHeight: 2992, ppi: 489, year: 2023 },
  'Pixel 8': { model: 'Pixel 8', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor G3', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 428, year: 2023 },
  'Pixel 8a': { model: 'Pixel 8a', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor G3', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 430, year: 2024 },
  'Pixel 7 Pro': { model: 'Pixel 7 Pro', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 1440, screenHeight: 3120, ppi: 512, year: 2022 },
  'Pixel 7': { model: 'Pixel 7', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 416, year: 2022 },
  'Pixel 7a': { model: 'Pixel 7a', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 429, year: 2023 },
  'Pixel 6 Pro': { model: 'Pixel 6 Pro', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor', cpuCores: 8, screenWidth: 1440, screenHeight: 3120, ppi: 512, year: 2021 },
  'Pixel 6': { model: 'Pixel 6', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 411, year: 2021 },
  'Pixel Fold': { model: 'Pixel Fold', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 2208, screenHeight: 1840, ppi: 380, year: 2023 },
  
  // === ONEPLUS ===
  'CPH2449': { model: 'OnePlus 12', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 510, year: 2024 },
  'CPH2447': { model: 'OnePlus 12R', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2780, ppi: 450, year: 2024 },
  'CPH2451': { model: 'OnePlus Open', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2268, screenHeight: 1992, ppi: 426, year: 2023 },
  'PHB110': { model: 'OnePlus 11', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1440, screenHeight: 3216, ppi: 525, year: 2023 },
  'NE2211': { model: 'OnePlus 10 Pro', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1440, screenHeight: 3216, ppi: 525, year: 2022 },
  
  // === XIAOMI ===
  '24072PX77G': { model: 'Xiaomi 14 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2024 },
  '23127PN0CC': { model: 'Xiaomi 14', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1200, screenHeight: 2670, ppi: 460, year: 2023 },
  '2304FPN6DC': { model: 'Xiaomi 13 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2023 },
  '2211133C': { model: 'Xiaomi 13', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2022 },
  '2203121C': { model: 'Xiaomi 12 Pro', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2022 },
  '2308CPXD0C': { model: 'Xiaomi Mix Fold 3', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2160, screenHeight: 1916, ppi: 402, year: 2023 },
  
  // === OPPO/REALME ===
  'CPH2583': { model: 'OPPO Find X7 Ultra', manufacturer: 'OPPO', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 510, year: 2024 },
  'PHQ110': { model: 'OPPO Find X6 Pro', manufacturer: 'OPPO', ram: 12, cpu: 'Dimensity 9200', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 510, year: 2023 },
  'RMX3888': { model: 'realme GT 5 Pro', manufacturer: 'realme', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1264, screenHeight: 2780, ppi: 452, year: 2023 },
  
  // === SONY ===
  'XQ-DQ72': { model: 'Xperia 1 VI', manufacturer: 'Sony', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 403, year: 2024 },
  'XQ-DQ54': { model: 'Xperia 5 V', manufacturer: 'Sony', ram: 8, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2520, ppi: 449, year: 2023 },
  'XQ-CT72': { model: 'Xperia 1 V', manufacturer: 'Sony', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1644, screenHeight: 3840, ppi: 643, year: 2023 },
  
  // === ASUS ROG ===
  'ASUS_AI2401': { model: 'ROG Phone 8 Pro', manufacturer: 'ASUS', ram: 24, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 395, year: 2024 },
  'ASUS_AI2205': { model: 'ROG Phone 7 Ultimate', manufacturer: 'ASUS', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2448, ppi: 395, year: 2023 },
  
  // === NOTHING ===
  'A065': { model: 'Nothing Phone (2)', manufacturer: 'Nothing', ram: 12, cpu: 'Snapdragon 8+ Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2412, ppi: 394, year: 2023 },
  'A063': { model: 'Nothing Phone (1)', manufacturer: 'Nothing', ram: 8, cpu: 'Snapdragon 778G+', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2022 },
  
  // === HUAWEI ===
  'ALT-AL00': { model: 'Huawei Mate 60 Pro', manufacturer: 'Huawei', ram: 12, cpu: 'Kirin 9000S', cpuCores: 8, screenWidth: 1260, screenHeight: 2720, ppi: 456, year: 2023 },
  'OCE-AN10': { model: 'Huawei Mate X5', manufacturer: 'Huawei', ram: 16, cpu: 'Kirin 9000S', cpuCores: 8, screenWidth: 2480, screenHeight: 2200, ppi: 426, year: 2023 },
  
  // === MOTOROLA ===
  'XT2343-3': { model: 'Motorola Edge 50 Ultra', manufacturer: 'Motorola', ram: 16, cpu: 'Snapdragon 8s Gen 3', cpuCores: 8, screenWidth: 1220, screenHeight: 2712, ppi: 446, year: 2024 },
  'XT2301-4': { model: 'Motorola Razr 40 Ultra', manufacturer: 'Motorola', ram: 12, cpu: 'Snapdragon 8+ Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2640, ppi: 413, year: 2023 },
  
  // === VIVO ===
  'V2324': { model: 'vivo X100 Pro', manufacturer: 'vivo', ram: 16, cpu: 'Dimensity 9300', cpuCores: 8, screenWidth: 1260, screenHeight: 2800, ppi: 452, year: 2023 },
  'V2309': { model: 'vivo X Fold3 Pro', manufacturer: 'vivo', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 2200, screenHeight: 2480, ppi: 402, year: 2024 },
  
  // === HONOR ===
  'PGT-AN20': { model: 'Honor Magic 6 Pro', manufacturer: 'Honor', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1280, screenHeight: 2800, ppi: 437, year: 2024 },
  'FRI-AN10': { model: 'Honor Magic V2', manufacturer: 'Honor', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2156, screenHeight: 2344, ppi: 402, year: 2023 },
  
  // === NUBIA/REDMAGIC ===
  'NX769J': { model: 'Red Magic 9 Pro', manufacturer: 'nubia', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1116, screenHeight: 2480, ppi: 387, year: 2023 },
  
  // === ANDROID TABLETS ===
  'SM-X910': { model: 'Galaxy Tab S9 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2960, screenHeight: 1848, ppi: 240, year: 2023 },
  'SM-X810': { model: 'Galaxy Tab S9+', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2800, screenHeight: 1752, ppi: 274, year: 2023 },
  'SM-X710': { model: 'Galaxy Tab S9', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 274, year: 2023 },
  'SM-X920': { model: 'Galaxy Tab S9 FE+', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 1380', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 197, year: 2023 },
  'GTR5X0': { model: 'Pixel Tablet', manufacturer: 'Google', ram: 8, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 276, year: 2023 },
  '23043RP34G': { model: 'Xiaomi Pad 6 Pro', manufacturer: 'Xiaomi', ram: 8, cpu: 'Snapdragon 8+ Gen 1', cpuCores: 8, screenWidth: 2880, screenHeight: 1800, ppi: 309, year: 2023 },
};

// CPU database for desktop identification
const CPU_DATABASE: Record<string, { name: string; cores: number; threads: number; year: number }> = {
  // Intel Desktop (12th-14th Gen)
  'i9-14900KS': { name: 'Intel Core i9-14900KS', cores: 24, threads: 32, year: 2024 },
  'i9-14900K': { name: 'Intel Core i9-14900K', cores: 24, threads: 32, year: 2023 },
  'i9-13900KS': { name: 'Intel Core i9-13900KS', cores: 24, threads: 32, year: 2023 },
  'i9-13900K': { name: 'Intel Core i9-13900K', cores: 24, threads: 32, year: 2022 },
  'i9-12900KS': { name: 'Intel Core i9-12900KS', cores: 16, threads: 24, year: 2022 },
  'i9-12900K': { name: 'Intel Core i9-12900K', cores: 16, threads: 24, year: 2021 },
  'i7-14700K': { name: 'Intel Core i7-14700K', cores: 20, threads: 28, year: 2023 },
  'i7-13700K': { name: 'Intel Core i7-13700K', cores: 16, threads: 24, year: 2022 },
  'i7-12700K': { name: 'Intel Core i7-12700K', cores: 12, threads: 20, year: 2021 },
  'i5-14600K': { name: 'Intel Core i5-14600K', cores: 14, threads: 20, year: 2023 },
  'i5-13600K': { name: 'Intel Core i5-13600K', cores: 14, threads: 20, year: 2022 },
  'i5-12600K': { name: 'Intel Core i5-12600K', cores: 10, threads: 16, year: 2021 },
  // Intel Laptop
  'i9-13980HX': { name: 'Intel Core i9-13980HX', cores: 24, threads: 32, year: 2023 },
  'i9-12900HX': { name: 'Intel Core i9-12900HX', cores: 16, threads: 24, year: 2022 },
  'i7-13700H': { name: 'Intel Core i7-13700H', cores: 14, threads: 20, year: 2023 },
  'i7-1365U': { name: 'Intel Core i7-1365U', cores: 10, threads: 12, year: 2023 },
  'i5-1340P': { name: 'Intel Core i5-1340P', cores: 12, threads: 16, year: 2023 },
  // Intel Core Ultra (Meteor Lake)
  'Ultra 9 185H': { name: 'Intel Core Ultra 9 185H', cores: 16, threads: 22, year: 2024 },
  'Ultra 7 155H': { name: 'Intel Core Ultra 7 155H', cores: 16, threads: 22, year: 2024 },
  'Ultra 5 125H': { name: 'Intel Core Ultra 5 125H', cores: 14, threads: 18, year: 2024 },
  // AMD Desktop (Ryzen 5000-9000)
  'Ryzen 9 9950X': { name: 'AMD Ryzen 9 9950X', cores: 16, threads: 32, year: 2024 },
  'Ryzen 9 9900X': { name: 'AMD Ryzen 9 9900X', cores: 12, threads: 24, year: 2024 },
  'Ryzen 9 7950X3D': { name: 'AMD Ryzen 9 7950X3D', cores: 16, threads: 32, year: 2023 },
  'Ryzen 9 7950X': { name: 'AMD Ryzen 9 7950X', cores: 16, threads: 32, year: 2022 },
  'Ryzen 9 7900X': { name: 'AMD Ryzen 9 7900X', cores: 12, threads: 24, year: 2022 },
  'Ryzen 9 5950X': { name: 'AMD Ryzen 9 5950X', cores: 16, threads: 32, year: 2020 },
  'Ryzen 9 5900X': { name: 'AMD Ryzen 9 5900X', cores: 12, threads: 24, year: 2020 },
  'Ryzen 7 9700X': { name: 'AMD Ryzen 7 9700X', cores: 8, threads: 16, year: 2024 },
  'Ryzen 7 7800X3D': { name: 'AMD Ryzen 7 7800X3D', cores: 8, threads: 16, year: 2023 },
  'Ryzen 7 7700X': { name: 'AMD Ryzen 7 7700X', cores: 8, threads: 16, year: 2022 },
  'Ryzen 7 5800X3D': { name: 'AMD Ryzen 7 5800X3D', cores: 8, threads: 16, year: 2022 },
  'Ryzen 7 5800X': { name: 'AMD Ryzen 7 5800X', cores: 8, threads: 16, year: 2020 },
  'Ryzen 5 9600X': { name: 'AMD Ryzen 5 9600X', cores: 6, threads: 12, year: 2024 },
  'Ryzen 5 7600X': { name: 'AMD Ryzen 5 7600X', cores: 6, threads: 12, year: 2022 },
  'Ryzen 5 5600X': { name: 'AMD Ryzen 5 5600X', cores: 6, threads: 12, year: 2020 },
  // AMD Laptop
  'Ryzen 9 7945HX': { name: 'AMD Ryzen 9 7945HX', cores: 16, threads: 32, year: 2023 },
  'Ryzen 9 7940HS': { name: 'AMD Ryzen 9 7940HS', cores: 8, threads: 16, year: 2023 },
  'Ryzen 7 7840HS': { name: 'AMD Ryzen 7 7840HS', cores: 8, threads: 16, year: 2023 },
  'Ryzen AI 9 HX 370': { name: 'AMD Ryzen AI 9 HX 370', cores: 12, threads: 24, year: 2024 },
  // AMD Threadripper
  'Threadripper PRO 7995WX': { name: 'AMD Threadripper PRO 7995WX', cores: 96, threads: 192, year: 2023 },
  'Threadripper PRO 5995WX': { name: 'AMD Threadripper PRO 5995WX', cores: 64, threads: 128, year: 2022 },
  // Apple Silicon (for Safari UA detection)
  'M4 Max': { name: 'Apple M4 Max', cores: 16, threads: 16, year: 2024 },
  'M4 Pro': { name: 'Apple M4 Pro', cores: 14, threads: 14, year: 2024 },
  'M4': { name: 'Apple M4', cores: 10, threads: 10, year: 2024 },
  'M3 Max': { name: 'Apple M3 Max', cores: 16, threads: 16, year: 2023 },
  'M3 Pro': { name: 'Apple M3 Pro', cores: 12, threads: 12, year: 2023 },
  'M3': { name: 'Apple M3', cores: 8, threads: 8, year: 2023 },
  'M2 Ultra': { name: 'Apple M2 Ultra', cores: 24, threads: 24, year: 2023 },
  'M2 Max': { name: 'Apple M2 Max', cores: 12, threads: 12, year: 2023 },
  'M2 Pro': { name: 'Apple M2 Pro', cores: 12, threads: 12, year: 2023 },
  'M2': { name: 'Apple M2', cores: 8, threads: 8, year: 2022 },
  'M1 Ultra': { name: 'Apple M1 Ultra', cores: 20, threads: 20, year: 2022 },
  'M1 Max': { name: 'Apple M1 Max', cores: 10, threads: 10, year: 2021 },
  'M1 Pro': { name: 'Apple M1 Pro', cores: 10, threads: 10, year: 2021 },
  'M1': { name: 'Apple M1', cores: 8, threads: 8, year: 2020 },
};

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceInfo {
  // Device Hardware
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    model: string;
    manufacturer: string;
    os: string;
    osVersion: string;
    browser: string;
    browserVersion: string;
    deviceId?: string;
    year?: number;
  };

  // Performance
  performance: {
    cpu: {
      name: string;
      cores: number;
      threads: number;
      architecture: string;
      baseSpeed?: string;
    };
    gpu: {
      vendor: string;
      renderer: string;
      tier: 'high' | 'medium' | 'low';
      score?: number;
      vram?: number;
    };
    memory: {
      total: number; // GB (real device RAM)
      used: number; // MB (JS heap)
      limit: number; // MB (JS heap limit)
      percentage: number;
      type?: string;
    };
    storage?: {
      total: number; // GB
      available: number; // GB
      type?: string;
    };
  };

  // Network
  network: {
    type: string;
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    downlink: number; // Mbps
    measuredDownlink?: number;
    measuredUpload?: number;
    rtt: number; // ms
    jitter?: number; // ms
    saveData: boolean;
    ip: string;
    location: string;
    isp: string;
    testTimestamp?: number;
  };

  // Battery
  battery: {
    level: number; // 0-100
    charging: boolean;
    chargingTime: number; // minutes
    dischargingTime: number; // minutes
    health?: string;
  };

  // Screen (Physical device resolution)
  screen: {
    physicalWidth: number; // Actual device pixels
    physicalHeight: number; // Actual device pixels
    viewportWidth: number; // Browser viewport
    viewportHeight: number; // Browser viewport
    orientation: 'portrait' | 'landscape';
    pixelRatio: number;
    colorDepth: number;
    refreshRate?: number;
    hdr?: boolean;
    touchSupport: boolean;
    ppi?: number;
    diagonal?: number; // inches
  };

  // Live Metrics
  live: {
    fps: number;
    frameTime: number; // ms
    networkSpeed: number; // Mbps (measured)
    uploadSpeed: number; // Mbps (measured)
    latency: number; // ms
    jitter: number; // ms
    cpuUsage?: number; // percentage estimate
    timestamp: number;
  };
}

// ============================================================================
// DEVICE MONITOR CLASS
// ============================================================================

class DeviceMonitor {
  private info: Partial<DeviceInfo> = {};
  private fps = 0;
  private frameCount = 0;
  private networkSpeed = 0;
  private uploadSpeed = 0;
  private latency = 0;
  private latencyJitter = 0;
  private battery: any = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all monitors
   */
  async initialize(): Promise<void> {
    console.log('[DeviceMonitor] Initializing...');

    await Promise.all([
      this.detectDevice(),
      this.detectPerformance(),
      this.detectNetwork(),
      this.detectBattery(),
      this.detectScreen()
    ]);

    // Start live monitoring
    this.startFPSMonitoring();
    this.startNetworkSpeedTest();
    
    // Detect storage
    this.detectStorage();

    console.log('[DeviceMonitor] Ready');
  }

  /**
   * Look up device from database by matching UA patterns
   */
  private lookupDevice(ua: string): DeviceSpec | null {
    // Try exact model matches from UA
    for (const [key, spec] of Object.entries(DEVICE_DATABASE)) {
      if (ua.includes(key)) {
        return spec;
      }
    }
    
    // Try partial matches for Samsung
    const samsungMatch = ua.match(/SM-[A-Z]\d{3,4}/);
    if (samsungMatch) {
      const prefix = samsungMatch[0].substring(0, 6);
      for (const [key, spec] of Object.entries(DEVICE_DATABASE)) {
        if (key.startsWith(prefix)) {
          return spec;
        }
      }
    }
    
    // Try Pixel match
    const pixelMatch = ua.match(/Pixel\s?\d+(\s?Pro)?(\s?XL)?(\s?Fold)?/i);
    if (pixelMatch) {
      const pixelModel = pixelMatch[0].replace(/\s+/g, ' ').trim();
      for (const [key, spec] of Object.entries(DEVICE_DATABASE)) {
        if (key.toLowerCase().includes(pixelModel.toLowerCase())) {
          return spec;
        }
      }
    }
    
    return null;
  }

  /**
   * Detect CPU from cores and UA patterns
   */
  private detectCPU(cores: number, ua: string, gpuRenderer: string): { name: string; threads: number } {
    // Check Apple Silicon from GPU
    if (/apple m4 max/i.test(gpuRenderer)) return { name: 'Apple M4 Max', threads: 16 };
    if (/apple m4 pro/i.test(gpuRenderer)) return { name: 'Apple M4 Pro', threads: 14 };
    if (/apple m4/i.test(gpuRenderer)) return { name: 'Apple M4', threads: 10 };
    if (/apple m3 max/i.test(gpuRenderer)) return { name: 'Apple M3 Max', threads: 16 };
    if (/apple m3 pro/i.test(gpuRenderer)) return { name: 'Apple M3 Pro', threads: 12 };
    if (/apple m3/i.test(gpuRenderer)) return { name: 'Apple M3', threads: 8 };
    if (/apple m2 ultra/i.test(gpuRenderer)) return { name: 'Apple M2 Ultra', threads: 24 };
    if (/apple m2 max/i.test(gpuRenderer)) return { name: 'Apple M2 Max', threads: 12 };
    if (/apple m2 pro/i.test(gpuRenderer)) return { name: 'Apple M2 Pro', threads: 12 };
    if (/apple m2/i.test(gpuRenderer)) return { name: 'Apple M2', threads: 8 };
    if (/apple m1 ultra/i.test(gpuRenderer)) return { name: 'Apple M1 Ultra', threads: 20 };
    if (/apple m1 max/i.test(gpuRenderer)) return { name: 'Apple M1 Max', threads: 10 };
    if (/apple m1 pro/i.test(gpuRenderer)) return { name: 'Apple M1 Pro', threads: 10 };
    if (/apple m1/i.test(gpuRenderer) || /apple gpu/i.test(gpuRenderer)) return { name: 'Apple M1', threads: 8 };
    
    // Check for A-series chips (iPhone/iPad)
    if (/apple a18 pro/i.test(gpuRenderer)) return { name: 'Apple A18 Pro', threads: 6 };
    if (/apple a18/i.test(gpuRenderer)) return { name: 'Apple A18', threads: 6 };
    if (/apple a17 pro/i.test(gpuRenderer)) return { name: 'Apple A17 Pro', threads: 6 };
    if (/apple a16/i.test(gpuRenderer)) return { name: 'Apple A16 Bionic', threads: 6 };
    if (/apple a15/i.test(gpuRenderer)) return { name: 'Apple A15 Bionic', threads: 6 };
    if (/apple a14/i.test(gpuRenderer)) return { name: 'Apple A14 Bionic', threads: 6 };
    
    // Estimate based on core count for desktop
    if (cores >= 24) return { name: 'Intel Core i9-14900K / Ryzen 9 7950X', threads: cores * 2 };
    if (cores >= 20) return { name: 'Intel Core i7-14700K / Ryzen 9 7900X', threads: cores + 8 };
    if (cores >= 16) return { name: 'Intel Core i9-13900K / Ryzen 9 5950X', threads: cores * 2 };
    if (cores >= 14) return { name: 'Intel Core i5-13600K / Ryzen 7', threads: cores + 6 };
    if (cores >= 12) return { name: 'Intel Core i7-12700K / Ryzen 7', threads: cores + 8 };
    if (cores >= 10) return { name: 'Intel Core i5-12600K / Ryzen 5', threads: cores + 6 };
    if (cores >= 8) return { name: 'Intel Core i7 / Ryzen 7 / Snapdragon 8', threads: cores * 2 };
    if (cores >= 6) return { name: 'Intel Core i5 / Ryzen 5 / Snapdragon', threads: cores * 2 };
    if (cores >= 4) return { name: 'Intel Core i3 / Ryzen 3 / Quad-Core', threads: cores * 2 };
    
    return { name: `${cores}-Core Processor`, threads: cores };
  }

  /**
   * Detect device information with database lookup
   */
  private async detectDevice(): Promise<void> {
    const ua = navigator.userAgent;
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

    // Device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/iPhone|iPod/.test(ua)) {
      type = 'mobile';
    } else if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
      type = 'tablet';
    } else if (/Android/.test(ua)) {
      type = 'mobile';
    }

    // OS detection with better version parsing
    let os = 'Unknown';
    let osVersion = '';

    if (/Windows NT 10\.0/.test(ua)) {
      os = 'Windows';
      // Check for Windows 11 (build number check)
      if (/Windows NT 10\.0.*Build\/(2[2-9]\d{3}|[3-9]\d{4})/.test(ua)) {
        osVersion = '11';
      } else {
        osVersion = '10';
      }
    } else if (/Windows NT ([\d.]+)/.test(ua)) {
      os = 'Windows';
      const ntVersion = RegExp.$1;
      const versionMap: Record<string, string> = {
        '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP'
      };
      osVersion = versionMap[ntVersion] || ntVersion;
    } else if (/Mac OS X ([\d_]+)/.test(ua)) {
      os = 'macOS';
      const version = RegExp.$1.replace(/_/g, '.');
      // Map to marketing name
      const majorMinor = version.split('.').slice(0, 2).join('.');
      const macNames: Record<string, string> = {
        '15.0': 'Sequoia', '15.1': 'Sequoia', '15.2': 'Sequoia',
        '14.0': 'Sonoma', '14.1': 'Sonoma', '14.2': 'Sonoma', '14.3': 'Sonoma', '14.4': 'Sonoma', '14.5': 'Sonoma', '14.6': 'Sonoma',
        '13.0': 'Ventura', '13.1': 'Ventura', '13.2': 'Ventura', '13.3': 'Ventura', '13.4': 'Ventura', '13.5': 'Ventura', '13.6': 'Ventura',
        '12.0': 'Monterey', '12.1': 'Monterey', '12.2': 'Monterey', '12.3': 'Monterey', '12.4': 'Monterey', '12.5': 'Monterey', '12.6': 'Monterey',
        '11.0': 'Big Sur', '11.1': 'Big Sur', '11.2': 'Big Sur', '11.3': 'Big Sur', '11.4': 'Big Sur', '11.5': 'Big Sur', '11.6': 'Big Sur',
        '10.15': 'Catalina', '10.14': 'Mojave', '10.13': 'High Sierra'
      };
      osVersion = macNames[majorMinor] || version;
    } else if (/Android ([\d.]+)/.test(ua)) {
      os = 'Android';
      osVersion = RegExp.$1;
    } else if (/iPhone OS ([\d_]+)/.test(ua) || /CPU OS ([\d_]+)/.test(ua)) {
      os = 'iOS';
      osVersion = (RegExp.$1 || '').replace(/_/g, '.');
    } else if (/CrOS/.test(ua)) {
      os = 'Chrome OS';
      if (/CrOS\s+\w+\s+([\d.]+)/.test(ua)) {
        osVersion = RegExp.$1;
      }
    } else if (/Linux/.test(ua)) {
      os = 'Linux';
      if (/Ubuntu/.test(ua)) osVersion = 'Ubuntu';
      else if (/Fedora/.test(ua)) osVersion = 'Fedora';
      else if (/Debian/.test(ua)) osVersion = 'Debian';
    }

    // Browser detection
    let browser = 'Unknown';
    let browserVersion = '';

    if (/OPR\/([\d.]+)/.test(ua)) {
      browser = 'Opera';
      browserVersion = RegExp.$1;
    } else if (/Edg\/([\d.]+)/.test(ua)) {
      browser = 'Edge';
      browserVersion = RegExp.$1;
    } else if (/Chrome\/([\d.]+)/.test(ua) && !/Edge|OPR/.test(ua)) {
      browser = 'Chrome';
      browserVersion = RegExp.$1;
    } else if (/Version\/([\d.]+).*Safari/.test(ua) && !/Chrome/.test(ua)) {
      browser = 'Safari';
      browserVersion = RegExp.$1;
    } else if (/Firefox\/([\d.]+)/.test(ua)) {
      browser = 'Firefox';
      browserVersion = RegExp.$1;
    } else if (/MSIE ([\d.]+)|Trident.*rv:([\d.]+)/.test(ua)) {
      browser = 'Internet Explorer';
      browserVersion = RegExp.$1 || RegExp.$2;
    }

    // Try database lookup first
    const dbDevice = this.lookupDevice(ua);
    
    let model = dbDevice?.model || 'Unknown';
    let manufacturer = dbDevice?.manufacturer || 'Unknown';
    let deviceId: string | undefined;
    let year = dbDevice?.year;

    // Fallback detection if not in database
    if (!dbDevice) {
      // iPhone detection
      if (/iPhone/.test(ua)) {
        manufacturer = 'Apple';
        model = 'iPhone';
        // Try to get model identifier
        const iPhoneMatch = ua.match(/iPhone(\d+,\d+)/);
        if (iPhoneMatch) {
          deviceId = `iPhone${iPhoneMatch[1]}`;
          const spec = DEVICE_DATABASE[deviceId];
          if (spec) {
            model = spec.model;
            year = spec.year;
          }
        }
      } 
      // iPad detection
      else if (/iPad/.test(ua)) {
        manufacturer = 'Apple';
        model = 'iPad';
        const iPadMatch = ua.match(/iPad(\d+,\d+)/);
        if (iPadMatch) {
          deviceId = `iPad${iPadMatch[1]}`;
          const spec = DEVICE_DATABASE[deviceId];
          if (spec) {
            model = spec.model;
            year = spec.year;
          }
        }
      }
      // Mac detection
      else if (/Macintosh/.test(ua)) {
        manufacturer = 'Apple';
        model = 'Mac';
      }
      // Samsung detection
      else if (/Samsung|SM-/.test(ua)) {
        manufacturer = 'Samsung';
        const samsungMatch = ua.match(/SM-[A-Z]\d{3,4}[A-Z]?/);
        if (samsungMatch) {
          deviceId = samsungMatch[0];
          model = deviceId;
        }
      }
      // Google Pixel
      else if (/Pixel/.test(ua)) {
        manufacturer = 'Google';
        const pixelMatch = ua.match(/Pixel\s?\d+(\s?Pro)?(\s?XL)?(\s?a)?(\s?Fold)?/i);
        if (pixelMatch) {
          model = pixelMatch[0].trim();
        }
      }
      // OnePlus
      else if (/OnePlus|ONEPLUS/.test(ua)) {
        manufacturer = 'OnePlus';
      }
      // Xiaomi
      else if (/Xiaomi|Redmi|POCO|Mi\s/.test(ua)) {
        manufacturer = 'Xiaomi';
      }
      // Oppo
      else if (/OPPO|CPH\d{4}/.test(ua)) {
        manufacturer = 'OPPO';
      }
      // Huawei
      else if (/HUAWEI|Honor/.test(ua)) {
        manufacturer = ua.includes('Honor') ? 'Honor' : 'Huawei';
      }
      // Sony
      else if (/Sony|Xperia/.test(ua)) {
        manufacturer = 'Sony';
      }
      // Motorola
      else if (/Motorola|moto|XT\d{4}/.test(ua)) {
        manufacturer = 'Motorola';
      }
      // LG
      else if (/LG-|LM-/.test(ua)) {
        manufacturer = 'LG';
      }
      // ASUS
      else if (/ASUS|ROG/.test(ua)) {
        manufacturer = 'ASUS';
      }
      // Nothing
      else if (/Nothing/.test(ua)) {
        manufacturer = 'Nothing';
      }
      // Generic Windows PC
      else if (/Windows/.test(ua)) {
        manufacturer = 'PC';
        model = 'Windows PC';
      }
      // Generic Linux
      else if (/Linux/.test(ua) && !/Android/.test(ua)) {
        manufacturer = 'PC';
        model = 'Linux PC';
      }
    }

    this.info.device = {
      type,
      model,
      manufacturer,
      os,
      osVersion,
      browser,
      browserVersion,
      deviceId,
      year
    };
  }

  /**
   * Classify GPU tier with a simple numeric score for clarity
   */
  private classifyGpuTier(renderer: string, vendor: string, memory: number): { tier: 'high' | 'medium' | 'low'; score: number; vram?: number } {
    const label = `${vendor} ${renderer}`.toLowerCase();

    // Heuristic score based on known GPU strings and available memory
    let score = 40; // baseline
    let vram: number | undefined;

    // Try to extract VRAM from renderer string
    const vramMatch = label.match(/(\d+)\s*gb/i);
    if (vramMatch) {
      vram = parseInt(vramMatch[1], 10);
    }

    // RTX 40 series
    if (/rtx\s?40[89]0|rtx\s?4090/i.test(label)) {
      score = 100;
      vram = vram || 24;
    } else if (/rtx\s?4080|rtx\s?4070\s?ti/i.test(label)) {
      score = 96;
      vram = vram || 16;
    } else if (/rtx\s?4070|rtx\s?4060\s?ti/i.test(label)) {
      score = 92;
      vram = vram || 12;
    } else if (/rtx\s?4060/i.test(label)) {
      score = 88;
      vram = vram || 8;
    }
    // RTX 30 series
    else if (/rtx\s?3090/i.test(label)) {
      score = 95;
      vram = vram || 24;
    } else if (/rtx\s?3080/i.test(label)) {
      score = 92;
      vram = vram || 12;
    } else if (/rtx\s?3070/i.test(label)) {
      score = 88;
      vram = vram || 8;
    } else if (/rtx\s?3060/i.test(label)) {
      score = 82;
      vram = vram || 12;
    }
    // AMD RX 7000
    else if (/rx\s?7900\s?xtx/i.test(label)) {
      score = 98;
      vram = vram || 24;
    } else if (/rx\s?7900\s?xt/i.test(label)) {
      score = 94;
      vram = vram || 20;
    } else if (/rx\s?7800\s?xt/i.test(label)) {
      score = 88;
      vram = vram || 16;
    } else if (/rx\s?7700\s?xt/i.test(label)) {
      score = 84;
      vram = vram || 12;
    } else if (/rx\s?7600/i.test(label)) {
      score = 78;
      vram = vram || 8;
    }
    // AMD RX 6000
    else if (/rx\s?6[89]00/i.test(label)) {
      score = 90;
      vram = vram || 16;
    } else if (/rx\s?6700/i.test(label)) {
      score = 82;
      vram = vram || 12;
    } else if (/rx\s?6600/i.test(label)) {
      score = 76;
      vram = vram || 8;
    }
    // Apple Silicon
    else if (/apple m4 max|apple gpu.*m4 max/i.test(label)) {
      score = 96;
      vram = 48;
    } else if (/apple m4 pro|apple gpu.*m4 pro/i.test(label)) {
      score = 92;
      vram = 24;
    } else if (/apple m4|apple gpu.*m4/i.test(label)) {
      score = 88;
      vram = 16;
    } else if (/apple m3 max|apple gpu.*m3 max/i.test(label)) {
      score = 94;
      vram = 36;
    } else if (/apple m3 pro|apple gpu.*m3 pro/i.test(label)) {
      score = 88;
      vram = 18;
    } else if (/apple m3|apple gpu.*m3/i.test(label)) {
      score = 82;
      vram = 8;
    } else if (/apple m2 ultra/i.test(label)) {
      score = 94;
      vram = 64;
    } else if (/apple m2 max/i.test(label)) {
      score = 90;
      vram = 32;
    } else if (/apple m2 pro/i.test(label)) {
      score = 85;
      vram = 16;
    } else if (/apple m2|apple gpu/i.test(label)) {
      score = 78;
      vram = 8;
    } else if (/apple m1 ultra/i.test(label)) {
      score = 88;
      vram = 64;
    } else if (/apple m1 max/i.test(label)) {
      score = 82;
      vram = 32;
    } else if (/apple m1 pro/i.test(label)) {
      score = 78;
      vram = 16;
    } else if (/apple m1/i.test(label)) {
      score = 72;
      vram = 8;
    }
    // GTX Series
    else if (/gtx\s?1080\s?ti/i.test(label)) {
      score = 75;
      vram = vram || 11;
    } else if (/gtx\s?1080/i.test(label)) {
      score = 70;
      vram = vram || 8;
    } else if (/gtx\s?1070/i.test(label)) {
      score = 65;
      vram = vram || 8;
    } else if (/gtx\s?1060/i.test(label)) {
      score = 58;
      vram = vram || 6;
    } else if (/gtx\s?1650|gtx\s?1660/i.test(label)) {
      score = 60;
      vram = vram || 4;
    }
    // Intel Arc
    else if (/arc\s?a7[78]0/i.test(label)) {
      score = 80;
      vram = vram || 16;
    } else if (/arc\s?a[56]80/i.test(label)) {
      score = 70;
      vram = vram || 8;
    }
    // Intel Integrated
    else if (/iris\s?xe/i.test(label)) {
      score = 52;
    } else if (/uhd\s?graphics\s?7[0-9]{2}/i.test(label)) {
      score = 48;
    } else if (/uhd\s?graphics/i.test(label)) {
      score = 42;
    } else if (/intel.*hd/i.test(label)) {
      score = 35;
    }
    // Mobile GPUs
    else if (/adreno\s?7[0-9]{2}/i.test(label)) {
      score = 75;
    } else if (/adreno\s?6[5-9][0-9]/i.test(label)) {
      score = 70;
    } else if (/adreno\s?6[0-4][0-9]/i.test(label)) {
      score = 62;
    } else if (/adreno\s?5[0-9]{2}/i.test(label)) {
      score = 50;
    } else if (/mali-g7[0-9]/i.test(label)) {
      score = 72;
    } else if (/mali-g6[0-9]/i.test(label)) {
      score = 65;
    } else if (/mali-g5[0-9]/i.test(label)) {
      score = 55;
    } else if (/mali/i.test(label)) {
      score = 45;
    } else if (/powervr/i.test(label)) {
      score = 40;
    }

    // Memory bonus
    if (memory >= 16) score = Math.min(100, score + 6);
    else if (memory >= 12) score = Math.min(100, score + 4);
    else if (memory >= 8) score = Math.min(100, score + 2);
    else if (memory <= 2) score = Math.max(20, score - 10);

    score = Math.max(20, Math.min(100, score));

    let tier: 'high' | 'medium' | 'low' = 'medium';
    if (score >= 80) tier = 'high';
    else if (score <= 50) tier = 'low';

    return { tier, score, vram };
  }

  /**
   * Map a measured speed back to a human readable connection tier
   */
  private deriveEffectiveTypeFromSpeed(speedMbps: number, fallback: string): '4g' | '3g' | '2g' | 'slow-2g' {
    if (!speedMbps || Number.isNaN(speedMbps)) return (fallback as any) || '4g';
    if (speedMbps < 0.15) return 'slow-2g';
    if (speedMbps < 0.4) return '2g';
    if (speedMbps < 1.5) return '3g';
    return '4g';
  }

  /**
   * Detect performance capabilities with real hardware info
   */
  private async detectPerformance(): Promise<void> {
    const ua = navigator.userAgent;
    
    // CPU cores from browser API
    const cores = navigator.hardwareConcurrency || 4;
    
    // Architecture detection
    let architecture = 'unknown';
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
    if (/arm64|aarch64/i.test(ua) || (/Mac/.test(platform) && !/Intel/.test(ua))) {
      architecture = 'ARM64';
    } else if (/x86_64|x64|amd64|Win64|WOW64/i.test(ua)) {
      architecture = 'x64';
    } else if (/x86|i[3-6]86/i.test(ua)) {
      architecture = 'x86';
    } else if (/arm/i.test(ua)) {
      architecture = 'ARM';
    }

    // GPU detection
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    let vendor = 'Unknown';
    let renderer = 'Unknown';
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const jsMemory = (performance as any).memory;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      }
    }

    const gpuInfo = this.classifyGpuTier(renderer, vendor, deviceMemory);
    
    // Detect CPU name based on cores and context
    const cpuInfo = this.detectCPU(cores, ua, renderer);
    
    // Get real RAM from device database or estimate
    let realRam = deviceMemory;
    const dbDevice = this.lookupDevice(ua);
    if (dbDevice) {
      realRam = dbDevice.ram;
    } else {
      // Estimate based on deviceMemory API (usually returns 4, 8, etc.)
      // For desktops, multiply by detected cores ratio for better estimate
      if (this.info.device?.type === 'desktop') {
        if (cores >= 16) realRam = Math.max(deviceMemory, 32);
        else if (cores >= 12) realRam = Math.max(deviceMemory, 16);
        else if (cores >= 8) realRam = Math.max(deviceMemory, 16);
        else if (cores >= 6) realRam = Math.max(deviceMemory, 8);
      }
    }

    // JS heap memory stats
    let used = 0;
    let limit = 0;
    let percentage = 0;

    if (jsMemory) {
      used = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
      limit = Math.round(jsMemory.jsHeapSizeLimit / 1024 / 1024);
      percentage = Math.round((used / limit) * 100);
    }

    this.info.performance = {
      cpu: { 
        name: cpuInfo.name,
        cores, 
        threads: cpuInfo.threads,
        architecture 
      },
      gpu: { 
        vendor, 
        renderer, 
        tier: gpuInfo.tier, 
        score: gpuInfo.score,
        vram: gpuInfo.vram
      },
      memory: { 
        total: realRam, 
        used, 
        limit, 
        percentage,
        type: realRam >= 16 ? 'DDR5' : realRam >= 8 ? 'DDR4' : 'DDR4/LPDDR'
      }
    };
  }
  
  /**
   * Detect storage information
   */
  private async detectStorage(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        
        // Storage quota is usually a portion of actual disk space
        // Estimate total storage (quota is typically 60% of free space)
        const estimatedTotal = Math.round((quota / 0.6) / 1024 / 1024 / 1024);
        const available = Math.round((quota - usage) / 1024 / 1024 / 1024);
        
        if (this.info.performance) {
          this.info.performance.storage = {
            total: Math.max(estimatedTotal, 64), // Minimum 64GB estimate
            available: Math.max(available, 1),
            type: estimatedTotal >= 512 ? 'NVMe SSD' : estimatedTotal >= 256 ? 'SSD' : 'Storage'
          };
        }
      }
    } catch (error) {
      console.warn('[DeviceMonitor] Storage detection failed:', error);
    }
  }

  /**
   * Detect network information
   */
  private async detectNetwork(): Promise<void> {
    const connection = (navigator as any).connection || {};

    const type = connection.type || 'unknown';
    const effectiveType = connection.effectiveType || '4g';
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 0;
    const saveData = connection.saveData || false;

    // Get IP and location
    let ip = 'Unknown';
    let location = 'Unknown';
    let isp = 'Unknown';

    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      ip = data.ip || 'Unknown';
      location = `${data.city || ''}, ${data.country_name || ''}`.trim();
      isp = data.org || 'Unknown';
    } catch (error) {
      console.warn('[DeviceMonitor] Failed to fetch IP info');
    }

    this.info.network = {
      type,
      effectiveType,
      downlink,
      rtt,
      saveData,
      ip,
      location,
      isp,
      measuredDownlink: downlink,
      measuredUpload: 0,
      jitter: 0,
      testTimestamp: Date.now()
    };
  }

  /**
   * Detect battery status
   */
  private async detectBattery(): Promise<void> {
    try {
      const battery = await (navigator as any).getBattery?.();
      this.battery = battery;

      if (battery) {
        this.info.battery = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime === Infinity ? -1 : Math.round(battery.chargingTime / 60),
          dischargingTime: battery.dischargingTime === Infinity ? -1 : Math.round(battery.dischargingTime / 60)
        };

        // Update on changes
        battery.addEventListener('levelchange', () => this.updateBattery());
        battery.addEventListener('chargingchange', () => this.updateBattery());
      } else {
        this.info.battery = {
          level: -1,
          charging: false,
          chargingTime: -1,
          dischargingTime: -1
        };
      }
    } catch (error) {
      this.info.battery = {
        level: -1,
        charging: false,
        chargingTime: -1,
        dischargingTime: -1
      };
    }
  }

  /**
   * Update battery info
   */
  private updateBattery(): void {
    if (this.battery && this.info.battery) {
      this.info.battery.level = Math.round(this.battery.level * 100);
      this.info.battery.charging = this.battery.charging;
      this.info.battery.chargingTime = this.battery.chargingTime === Infinity ? -1 : Math.round(this.battery.chargingTime / 60);
      this.info.battery.dischargingTime = this.battery.dischargingTime === Infinity ? -1 : Math.round(this.battery.dischargingTime / 60);
    }
  }

  /**
   * Detect screen information - Physical device resolution, not browser viewport
   */
  private detectScreen(): void {
    const ua = navigator.userAgent;
    
    // Browser viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Physical screen dimensions (using screen API with pixel ratio)
    let physicalWidth = Math.round(screen.width * pixelRatio);
    let physicalHeight = Math.round(screen.height * pixelRatio);
    
    // Also check screen.availWidth/availHeight for desktop
    const screenW = screen.width;
    const screenH = screen.height;
    
    // Try to get actual device resolution from database
    const dbDevice = this.lookupDevice(ua);
    let ppi: number | undefined;
    let diagonal: number | undefined;
    
    if (dbDevice && dbDevice.screenWidth > 0) {
      // Use database values for accurate physical resolution
      physicalWidth = dbDevice.screenWidth;
      physicalHeight = dbDevice.screenHeight;
      ppi = dbDevice.ppi;
      
      // Calculate diagonal in inches
      if (ppi > 0) {
        const diagPixels = Math.sqrt(physicalWidth ** 2 + physicalHeight ** 2);
        diagonal = Math.round((diagPixels / ppi) * 10) / 10;
      }
    } else {
      // Estimate based on pixel ratio and device type
      // For desktops, physical = screen dimensions (no scaling in device pixels)
      if (this.info.device?.type === 'desktop') {
        physicalWidth = screenW;
        physicalHeight = screenH;
        // Estimate PPI for common monitor sizes
        const diagPixels = Math.sqrt(screenW ** 2 + screenH ** 2);
        if (screenW >= 3840) {
          ppi = 163; // 27" 4K
          diagonal = 27;
        } else if (screenW >= 2560) {
          ppi = 109; // 27" QHD
          diagonal = 27;
        } else if (screenW >= 1920) {
          ppi = 92; // 24" FHD
          diagonal = 24;
        } else {
          ppi = 96;
          diagonal = Math.round((diagPixels / 96) * 10) / 10;
        }
      } else {
        // Mobile/tablet - use calculated physical pixels
        const diagPixels = Math.sqrt(physicalWidth ** 2 + physicalHeight ** 2);
        // Estimate PPI based on device type
        if (this.info.device?.type === 'mobile') {
          ppi = 400; // Typical smartphone
          diagonal = Math.round((diagPixels / ppi) * 10) / 10;
        } else {
          ppi = 264; // Typical tablet
          diagonal = Math.round((diagPixels / ppi) * 10) / 10;
        }
      }
    }
    
    const orientation = physicalWidth > physicalHeight ? 'landscape' : 'portrait';
    const colorDepth = screen.colorDepth || 24;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect HDR support
    let hdr = false;
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      hdr = window.matchMedia('(dynamic-range: high)').matches;
    }
    
    // Detect refresh rate (if available via Screen API)
    let refreshRate: number | undefined;
    // Use a heuristic based on device type and year
    if (dbDevice) {
      if (dbDevice.year >= 2022) {
        refreshRate = 120; // Most modern flagships
      } else if (dbDevice.year >= 2020) {
        refreshRate = 90;
      } else {
        refreshRate = 60;
      }
    } else if (this.info.device?.type === 'desktop') {
      // Estimate based on common monitor refresh rates
      // High-end gaming monitors are 144Hz+, but assume 60Hz as default
      refreshRate = 60;
    }

    this.info.screen = {
      physicalWidth,
      physicalHeight,
      viewportWidth,
      viewportHeight,
      orientation,
      pixelRatio,
      colorDepth,
      refreshRate,
      hdr,
      touchSupport,
      ppi,
      diagonal
    };

    // Update on resize (only viewport changes, physical stays same)
    window.addEventListener('resize', () => {
      if (this.info.screen) {
        this.info.screen.viewportWidth = window.innerWidth;
        this.info.screen.viewportHeight = window.innerHeight;
        this.info.screen.orientation = this.info.screen.physicalWidth > this.info.screen.physicalHeight ? 'landscape' : 'portrait';
      }
    });
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now();

    const measureFPS = (timestamp: number) => {
      this.frameCount++;

      // Update every second
      if (timestamp - lastTime >= 1000) {
        this.fps = Math.round(this.frameCount);
        this.frameCount = 0;
        lastTime = timestamp;

        // Update live metrics
        if (this.info.live) {
          this.info.live.fps = this.fps;
          this.info.live.frameTime = 1000 / Math.max(this.fps, 1);
        }
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Start network speed test
   */
  private async startNetworkSpeedTest(): Promise<void> {
    const pingUrl = 'https://speed.cloudflare.com/__down?bytes=64';
    const downUrl = 'https://speed.cloudflare.com/__down?bytes=2500000';
    const upUrl = 'https://speed.cloudflare.com/__up';

    const test = async () => {
      try {
        const latencyProbe = this.measureLatency(pingUrl);
        const downloadProbe = this.measureDownloadSpeed(`${downUrl}&ts=${Date.now()}`);
        const uploadProbe = this.measureUploadSpeed(`${upUrl}?ts=${Date.now()}`, 600000);

        const [{ latency, jitter }, measuredSpeed, measuredUpload] = await Promise.all([
          latencyProbe,
          downloadProbe,
          uploadProbe
        ]);

        this.networkSpeed = measuredSpeed;
        this.uploadSpeed = measuredUpload;
        this.latency = latency;
        this.latencyJitter = jitter;

        if (this.info.network) {
          this.info.network.measuredDownlink = measuredSpeed;
          this.info.network.measuredUpload = measuredUpload;
          this.info.network.downlink = this.info.network.downlink || measuredSpeed;
          this.info.network.rtt = latency;
          this.info.network.jitter = jitter;
          this.info.network.effectiveType = this.deriveEffectiveTypeFromSpeed(
            measuredSpeed,
            this.info.network.effectiveType
          );
          this.info.network.testTimestamp = Date.now();
        }
      } catch (error) {
        console.warn('[DeviceMonitor] Network test failed', error);
        if (this.info.network) {
          this.networkSpeed = this.info.network.downlink || this.networkSpeed;
          this.uploadSpeed = this.info.network.measuredUpload || this.uploadSpeed;
          this.latency = this.info.network.rtt || this.latency;
        }
      }
    };

    await test();
    setInterval(test, 15000);
  }

  /**
   * Measure download speed using a streamed payload
   */
  private async measureDownloadSpeed(url: string): Promise<number> {
    const startTime = performance.now();
    const response = await fetch(url, { cache: 'no-store' });

    let bytes = 0;
    if (response.body?.getReader) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value?.length || 0;
      }
    } else {
      const buffer = await response.arrayBuffer();
      bytes = buffer.byteLength;
    }

    const duration = (performance.now() - startTime) / 1000;
    const sizeMB = bytes / 1024 / 1024;
    const speedMbps = (sizeMB * 8) / Math.max(duration, 0.001);
    return Math.round(speedMbps * 100) / 100;
  }

  /**
   * Measure upload speed by sending a buffer
   */
  private async measureUploadSpeed(url: string, sizeBytes = 400000): Promise<number> {
    const payload = new Uint8Array(sizeBytes);
    const startTime = performance.now();
    await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      mode: 'cors',
      body: payload
    });
    const duration = (performance.now() - startTime) / 1000;
    const sizeMB = sizeBytes / 1024 / 1024;
    const speedMbps = (sizeMB * 8) / Math.max(duration, 0.001);
    return Math.round(speedMbps * 100) / 100;
  }

  /**
   * Measure latency and jitter with multiple pings
   */
  private async measureLatency(url: string, samples = 3): Promise<{ latency: number; jitter: number }> {
    const results: number[] = [];

    for (let i = 0; i < samples; i++) {
      const pingUrl = `${url}&ts=${Date.now()}-${i}`;
      const start = performance.now();
      try {
        await fetch(pingUrl, { method: 'GET', cache: 'no-store' });
        results.push(performance.now() - start);
      } catch (error) {
        console.warn('[DeviceMonitor] Latency probe failed', error);
      }
    }

    if (!results.length) {
      const fallbackRtt = this.info.network?.rtt || 0;
      return { latency: fallbackRtt, jitter: this.latencyJitter };
    }

    const avg = results.reduce((a, b) => a + b, 0) / Math.max(results.length, 1);
    const variance = results.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / Math.max(results.length, 1);
    const jitter = Math.sqrt(variance);

    return {
      latency: Math.round(avg),
      jitter: Math.round(jitter)
    };
  }

  /**
   * Get complete device info
   */
  getInfo(): DeviceInfo {
    const network = this.info.network || {
      type: 'unknown',
      effectiveType: '4g' as const,
      downlink: 0,
      rtt: 0,
      saveData: false,
      ip: 'Unknown',
      location: 'Unknown',
      isp: 'Unknown'
    };

    // Ensure the latest latency is reflected in the network payload
    network.rtt = this.latency || network.rtt;
    network.measuredDownlink = this.networkSpeed || network.measuredDownlink || network.downlink;
    network.measuredUpload = this.uploadSpeed || network.measuredUpload || 0;
    network.jitter = this.latencyJitter || network.jitter || 0;

    return {
      ...this.info,
      network,
      live: {
        fps: this.fps,
        frameTime: 1000 / Math.max(this.fps, 1),
        networkSpeed: this.networkSpeed,
        uploadSpeed: this.uploadSpeed,
        latency: this.latency,
        jitter: this.latencyJitter,
        timestamp: Date.now()
      }
    } as DeviceInfo;
  }

  /**
   * Get formatted info for display
   */
  getFormattedInfo(): Record<string, any> {
    const info = this.getInfo();

    return {
      // Device
      'Device Type': info.device.type.toUpperCase(),
      'Model': info.device.model,
      'Manufacturer': info.device.manufacturer,
      'Device Year': info.device.year || 'Unknown',
      'OS': `${info.device.os} ${info.device.osVersion}`,
      'Browser': `${info.device.browser} ${info.device.browserVersion}`,

      // Performance
      'CPU': info.performance.cpu.name,
      'CPU Cores': info.performance.cpu.cores,
      'CPU Threads': info.performance.cpu.threads,
      'Architecture': info.performance.cpu.architecture,
      'GPU': info.performance.gpu.renderer,
      'GPU Vendor': info.performance.gpu.vendor,
      'GPU Tier': info.performance.gpu.tier.toUpperCase(),
      'VRAM': info.performance.gpu.vram ? `${info.performance.gpu.vram}GB` : 'Unknown',
      'GPU Score': `${info.performance.gpu.score}/100`,
      'RAM': `${info.performance.memory.total}GB`,
      'RAM Type': info.performance.memory.type || 'Unknown',
      'JS Heap': `${info.performance.memory.used}MB / ${info.performance.memory.limit}MB (${info.performance.memory.percentage}%)`,
      'Storage': info.performance.storage ? `${info.performance.storage.available}GB free of ${info.performance.storage.total}GB` : 'Unknown',
      'Storage Type': info.performance.storage?.type || 'Unknown',

      // Network
      'IP Address': info.network.ip,
      'Location': info.network.location,
      'ISP': info.network.isp,
      'Connection': info.network.effectiveType.toUpperCase(),
      'Network Type': info.network.type,
      'Downlink': `${info.network.downlink} Mbps`,
      'Measured Upload': `${info.network.measuredUpload ?? info.live.uploadSpeed} Mbps`,
      'Measured Downlink': `${info.network.measuredDownlink ?? info.live.networkSpeed} Mbps`,
      'RTT': `${info.network.rtt}ms`,
      'Jitter': `${info.network.jitter ?? info.live.jitter}ms`,
      'Data Saver': info.network.saveData ? 'ON' : 'OFF',

      // Battery
      'Battery': info.battery.level >= 0 ? `${info.battery.level}%` : 'Unknown',
      'Charging': info.battery.charging ? 'Yes' : 'No',

      // Screen (Physical resolution)
      'Display': `${info.screen.physicalWidth}x${info.screen.physicalHeight}`,
      'Viewport': `${info.screen.viewportWidth}x${info.screen.viewportHeight}`,
      'Pixel Ratio': `${info.screen.pixelRatio}x`,
      'PPI': info.screen.ppi ? `${info.screen.ppi} ppi` : 'Unknown',
      'Screen Size': info.screen.diagonal ? `${info.screen.diagonal}"` : 'Unknown',
      'Refresh Rate': info.screen.refreshRate ? `${info.screen.refreshRate}Hz` : 'Unknown',
      'HDR': info.screen.hdr ? 'Yes' : 'No',
      'Orientation': info.screen.orientation.toUpperCase(),
      'Touch Support': info.screen.touchSupport ? 'Yes' : 'No',

      // Live
      'FPS': info.live.fps,
      'Frame Time': `${info.live.frameTime.toFixed(2)}ms`,
      'Network Speed': `${info.live.networkSpeed} Mbps`,
      'Upload Speed': `${info.live.uploadSpeed} Mbps`,
      'Latency': `${info.live.latency}ms`,
      'Jitter (Live)': `${info.live.jitter}ms`
    };
  }

  /**
   * Get data consumption stats
   */
  getDataUsage(): {
    sessionBytes: number;
    sessionMB: string;
    totalBytes: number;
    totalMB: string;
    totalGB: string;
  } {
    // Try to get real resource timing data
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      try {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const totalBytes = resources.reduce((sum, entry) => {
          const size = (entry as any).encodedBodySize || (entry as any).decodedBodySize || 0;
          return sum + size;
        }, 0);

        // Get stored total from localStorage
        const stored = localStorage.getItem('bm_data_total');
        const storedTotal = stored ? parseInt(stored, 10) : 0;
        const newTotal = storedTotal + totalBytes;

        // Update localStorage
        localStorage.setItem('bm_data_total', newTotal.toString());

        return {
          sessionBytes: totalBytes,
          sessionMB: (totalBytes / 1024 / 1024).toFixed(2),
          totalBytes: newTotal,
          totalMB: (newTotal / 1024 / 1024).toFixed(2),
          totalGB: (newTotal / 1024 / 1024 / 1024).toFixed(3)
        };
      } catch (error) {
        console.warn('[DeviceMonitor] Failed to get data usage:', error);
      }
    }

    // Fallback
    return {
      sessionBytes: 0,
      sessionMB: '0.00',
      totalBytes: 0,
      totalMB: '0.00',
      totalGB: '0.000'
    };
  }

  /**
   * Reset total data usage
   */
  resetDataUsage(): void {
    localStorage.removeItem('bm_data_total');
    console.log('[DeviceMonitor] Data usage reset');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    pageLoad: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  } {
    const metrics = {
      pageLoad: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      timeToInteractive: 0
    };

    try {
      // Navigation Timing
      if (performance.timing) {
        const timing = performance.timing;
        metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
        metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      }

      // Paint Timing
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry: any) => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        // LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          metrics.largestContentfulPaint = (lcpEntries[lcpEntries.length - 1] as any).startTime;
        }

        // TTI (estimate using domInteractive)
        if (performance.timing) {
          metrics.timeToInteractive = performance.timing.domInteractive - performance.timing.navigationStart;
        }
      }
    } catch (error) {
      console.warn('[DeviceMonitor] Failed to get performance metrics:', error);
    }

    return metrics;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DeviceMonitor };
export const deviceMonitor = new DeviceMonitor();

// Global access
if (typeof window !== 'undefined') {
  (window as any).deviceMonitor = deviceMonitor;
}
