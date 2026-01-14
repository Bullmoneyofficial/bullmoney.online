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
  // === APPLE IPHONES (2010-2026) ===
  // 2026 (Future/Expected)
  'iPhone18,1': { model: 'iPhone 17 Pro', manufacturer: 'Apple', ram: 12, cpu: 'Apple A19 Pro', cpuCores: 6, screenWidth: 1206, screenHeight: 2622, ppi: 460, year: 2025 },
  'iPhone18,2': { model: 'iPhone 17 Pro Max', manufacturer: 'Apple', ram: 12, cpu: 'Apple A19 Pro', cpuCores: 6, screenWidth: 1320, screenHeight: 2868, ppi: 460, year: 2025 },
  'iPhone18,3': { model: 'iPhone 17', manufacturer: 'Apple', ram: 8, cpu: 'Apple A19', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2025 },
  'iPhone18,4': { model: 'iPhone 17 Plus', manufacturer: 'Apple', ram: 8, cpu: 'Apple A19', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2025 },
  // 2024
  'iPhone17,1': { model: 'iPhone 16 Pro', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18 Pro', cpuCores: 6, screenWidth: 1206, screenHeight: 2622, ppi: 460, year: 2024 },
  'iPhone17,2': { model: 'iPhone 16 Pro Max', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18 Pro', cpuCores: 6, screenWidth: 1320, screenHeight: 2868, ppi: 460, year: 2024 },
  'iPhone17,3': { model: 'iPhone 16', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2024 },
  'iPhone17,4': { model: 'iPhone 16 Plus', manufacturer: 'Apple', ram: 8, cpu: 'Apple A18', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2024 },
  // 2023
  'iPhone16,1': { model: 'iPhone 15 Pro', manufacturer: 'Apple', ram: 8, cpu: 'Apple A17 Pro', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2023 },
  'iPhone16,2': { model: 'iPhone 15 Pro Max', manufacturer: 'Apple', ram: 8, cpu: 'Apple A17 Pro', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2023 },
  'iPhone15,4': { model: 'iPhone 15', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2023 },
  'iPhone15,5': { model: 'iPhone 15 Plus', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2023 },
  // 2022
  'iPhone15,2': { model: 'iPhone 14 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1179, screenHeight: 2556, ppi: 460, year: 2022 },
  'iPhone15,3': { model: 'iPhone 14 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A16 Bionic', cpuCores: 6, screenWidth: 1290, screenHeight: 2796, ppi: 460, year: 2022 },
  'iPhone14,7': { model: 'iPhone 14', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2022 },
  'iPhone14,8': { model: 'iPhone 14 Plus', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2022 },
  'iPhoneSE3': { model: 'iPhone SE (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2022 },
  // 2021
  'iPhone14,2': { model: 'iPhone 13 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2021 },
  'iPhone14,3': { model: 'iPhone 13 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2021 },
  'iPhone14,5': { model: 'iPhone 13', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2021 },
  'iPhone14,4': { model: 'iPhone 13 mini', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 2340, ppi: 476, year: 2021 },
  // 2020
  'iPhone13,1': { model: 'iPhone 12 mini', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 2340, ppi: 476, year: 2020 },
  'iPhone13,2': { model: 'iPhone 12', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2020 },
  'iPhone13,3': { model: 'iPhone 12 Pro', manufacturer: 'Apple', ram: 6, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1170, screenHeight: 2532, ppi: 460, year: 2020 },
  'iPhone13,4': { model: 'iPhone 12 Pro Max', manufacturer: 'Apple', ram: 6, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 1284, screenHeight: 2778, ppi: 458, year: 2020 },
  'iPhoneSE2': { model: 'iPhone SE (2nd gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2020 },
  // 2019
  'iPhone12,1': { model: 'iPhone 11', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 828, screenHeight: 1792, ppi: 326, year: 2019 },
  'iPhone12,3': { model: 'iPhone 11 Pro', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2019 },
  'iPhone12,5': { model: 'iPhone 11 Pro Max', manufacturer: 'Apple', ram: 4, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 1242, screenHeight: 2688, ppi: 458, year: 2019 },
  // 2018
  'iPhone11,2': { model: 'iPhone XS', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2018 },
  'iPhone11,4': { model: 'iPhone XS Max', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 1242, screenHeight: 2688, ppi: 458, year: 2018 },
  'iPhone11,6': { model: 'iPhone XS Max', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 1242, screenHeight: 2688, ppi: 458, year: 2018 },
  'iPhone11,8': { model: 'iPhone XR', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 828, screenHeight: 1792, ppi: 326, year: 2018 },
  // 2017
  'iPhone10,1': { model: 'iPhone 8', manufacturer: 'Apple', ram: 2, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2017 },
  'iPhone10,4': { model: 'iPhone 8', manufacturer: 'Apple', ram: 2, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2017 },
  'iPhone10,2': { model: 'iPhone 8 Plus', manufacturer: 'Apple', ram: 3, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2017 },
  'iPhone10,5': { model: 'iPhone 8 Plus', manufacturer: 'Apple', ram: 3, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2017 },
  'iPhone10,3': { model: 'iPhone X', manufacturer: 'Apple', ram: 3, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2017 },
  'iPhone10,6': { model: 'iPhone X', manufacturer: 'Apple', ram: 3, cpu: 'Apple A11 Bionic', cpuCores: 6, screenWidth: 1125, screenHeight: 2436, ppi: 458, year: 2017 },
  // 2016
  'iPhone9,1': { model: 'iPhone 7', manufacturer: 'Apple', ram: 2, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2016 },
  'iPhone9,3': { model: 'iPhone 7', manufacturer: 'Apple', ram: 2, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2016 },
  'iPhone9,2': { model: 'iPhone 7 Plus', manufacturer: 'Apple', ram: 3, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2016 },
  'iPhone9,4': { model: 'iPhone 7 Plus', manufacturer: 'Apple', ram: 3, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2016 },
  // 2015
  'iPhone8,1': { model: 'iPhone 6s', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2015 },
  'iPhone8,2': { model: 'iPhone 6s Plus', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2015 },
  'iPhone8,4': { model: 'iPhone SE', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2016 },
  // 2014
  'iPhone7,1': { model: 'iPhone 6 Plus', manufacturer: 'Apple', ram: 1, cpu: 'Apple A8', cpuCores: 2, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2014 },
  'iPhone7,2': { model: 'iPhone 6', manufacturer: 'Apple', ram: 1, cpu: 'Apple A8', cpuCores: 2, screenWidth: 750, screenHeight: 1334, ppi: 326, year: 2014 },
  // 2013
  'iPhone6,1': { model: 'iPhone 5s', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2013 },
  'iPhone6,2': { model: 'iPhone 5s', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2013 },
  'iPhone5,3': { model: 'iPhone 5c', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2013 },
  'iPhone5,4': { model: 'iPhone 5c', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2013 },
  // 2012
  'iPhone5,1': { model: 'iPhone 5', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2012 },
  'iPhone5,2': { model: 'iPhone 5', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6', cpuCores: 2, screenWidth: 640, screenHeight: 1136, ppi: 326, year: 2012 },
  // 2011
  'iPhone4,1': { model: 'iPhone 4s', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 640, screenHeight: 960, ppi: 326, year: 2011 },
  // 2010
  'iPhone3,1': { model: 'iPhone 4', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A4', cpuCores: 1, screenWidth: 640, screenHeight: 960, ppi: 326, year: 2010 },
  'iPhone3,2': { model: 'iPhone 4', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A4', cpuCores: 1, screenWidth: 640, screenHeight: 960, ppi: 326, year: 2010 },
  'iPhone3,3': { model: 'iPhone 4', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A4', cpuCores: 1, screenWidth: 640, screenHeight: 960, ppi: 326, year: 2010 },
  
  // === APPLE IPADS (2010-2026) ===
  // 2024-2025
  'iPad16,3': { model: 'iPad Pro 11" (M5)', manufacturer: 'Apple', ram: 16, cpu: 'Apple M5', cpuCores: 12, screenWidth: 2420, screenHeight: 1668, ppi: 264, year: 2025 },
  'iPad16,4': { model: 'iPad Pro 13" (M5)', manufacturer: 'Apple', ram: 16, cpu: 'Apple M5', cpuCores: 12, screenWidth: 2752, screenHeight: 2064, ppi: 264, year: 2025 },
  'iPad14,8': { model: 'iPad Pro 11" (M4)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M4', cpuCores: 10, screenWidth: 2420, screenHeight: 1668, ppi: 264, year: 2024 },
  'iPad14,9': { model: 'iPad Pro 13" (M4)', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 2752, screenHeight: 2064, ppi: 264, year: 2024 },
  'iPad14,10': { model: 'iPad Air 11" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2024 },
  'iPad14,11': { model: 'iPad Air 13" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2024 },
  // 2022-2023
  'iPad14,3': { model: 'iPad Pro 11" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2022 },
  'iPad14,4': { model: 'iPad Pro 11" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2022 },
  'iPad14,5': { model: 'iPad Pro 12.9" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2022 },
  'iPad14,6': { model: 'iPad Pro 12.9" (M2)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2022 },
  'iPad13,18': { model: 'iPad (10th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  'iPad13,19': { model: 'iPad (10th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  'iPad13,16': { model: 'iPad Air (5th gen M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  'iPad13,17': { model: 'iPad Air (5th gen M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2022 },
  // 2021
  'iPad13,8': { model: 'iPad Pro 11" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2021 },
  'iPad13,9': { model: 'iPad Pro 11" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2021 },
  'iPad13,10': { model: 'iPad Pro 11" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2021 },
  'iPad13,11': { model: 'iPad Pro 11" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2021 },
  'iPad13,4': { model: 'iPad Pro 12.9" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2021 },
  'iPad13,5': { model: 'iPad Pro 12.9" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2021 },
  'iPad13,6': { model: 'iPad Pro 12.9" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2021 },
  'iPad13,7': { model: 'iPad Pro 12.9" (M1)', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2021 },
  'iPad12,1': { model: 'iPad (9th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2021 },
  'iPad12,2': { model: 'iPad (9th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A13 Bionic', cpuCores: 6, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2021 },
  'iPad14,1': { model: 'iPad mini (6th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 2266, screenHeight: 1488, ppi: 326, year: 2021 },
  'iPad14,2': { model: 'iPad mini (6th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A15 Bionic', cpuCores: 6, screenWidth: 2266, screenHeight: 1488, ppi: 326, year: 2021 },
  // 2020
  'iPad13,1': { model: 'iPad Air (4th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2020 },
  'iPad13,2': { model: 'iPad Air (4th gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A14 Bionic', cpuCores: 6, screenWidth: 2360, screenHeight: 1640, ppi: 264, year: 2020 },
  'iPad11,6': { model: 'iPad (8th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2020 },
  'iPad11,7': { model: 'iPad (8th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2020 },
  'iPad8,11': { model: 'iPad Pro 12.9" (4th gen)', manufacturer: 'Apple', ram: 6, cpu: 'Apple A12Z Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2020 },
  'iPad8,12': { model: 'iPad Pro 12.9" (4th gen)', manufacturer: 'Apple', ram: 6, cpu: 'Apple A12Z Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2020 },
  'iPad8,9': { model: 'iPad Pro 11" (2nd gen)', manufacturer: 'Apple', ram: 6, cpu: 'Apple A12Z Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2020 },
  'iPad8,10': { model: 'iPad Pro 11" (2nd gen)', manufacturer: 'Apple', ram: 6, cpu: 'Apple A12Z Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2020 },
  // 2019
  'iPad11,1': { model: 'iPad mini (5th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2019 },
  'iPad11,2': { model: 'iPad mini (5th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2019 },
  'iPad11,3': { model: 'iPad Air (3rd gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2224, screenHeight: 1668, ppi: 264, year: 2019 },
  'iPad11,4': { model: 'iPad Air (3rd gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A12 Bionic', cpuCores: 6, screenWidth: 2224, screenHeight: 1668, ppi: 264, year: 2019 },
  'iPad7,11': { model: 'iPad (7th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2019 },
  'iPad7,12': { model: 'iPad (7th gen)', manufacturer: 'Apple', ram: 3, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 2160, screenHeight: 1620, ppi: 264, year: 2019 },
  // 2018
  'iPad8,1': { model: 'iPad Pro 11" (1st gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2018 },
  'iPad8,2': { model: 'iPad Pro 11" (1st gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2018 },
  'iPad8,3': { model: 'iPad Pro 11" (1st gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2018 },
  'iPad8,4': { model: 'iPad Pro 11" (1st gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2388, screenHeight: 1668, ppi: 264, year: 2018 },
  'iPad8,5': { model: 'iPad Pro 12.9" (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2018 },
  'iPad8,6': { model: 'iPad Pro 12.9" (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2018 },
  'iPad8,7': { model: 'iPad Pro 12.9" (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2018 },
  'iPad8,8': { model: 'iPad Pro 12.9" (3rd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A12X Bionic', cpuCores: 8, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2018 },
  'iPad7,5': { model: 'iPad (6th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2018 },
  'iPad7,6': { model: 'iPad (6th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A10 Fusion', cpuCores: 4, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2018 },
  // 2017
  'iPad7,1': { model: 'iPad Pro 12.9" (2nd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A10X Fusion', cpuCores: 6, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2017 },
  'iPad7,2': { model: 'iPad Pro 12.9" (2nd gen)', manufacturer: 'Apple', ram: 4, cpu: 'Apple A10X Fusion', cpuCores: 6, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2017 },
  'iPad7,3': { model: 'iPad Pro 10.5"', manufacturer: 'Apple', ram: 4, cpu: 'Apple A10X Fusion', cpuCores: 6, screenWidth: 2224, screenHeight: 1668, ppi: 264, year: 2017 },
  'iPad7,4': { model: 'iPad Pro 10.5"', manufacturer: 'Apple', ram: 4, cpu: 'Apple A10X Fusion', cpuCores: 6, screenWidth: 2224, screenHeight: 1668, ppi: 264, year: 2017 },
  'iPad5,1': { model: 'iPad (5th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2017 },
  'iPad5,2': { model: 'iPad (5th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2017 },
  // 2015-2016
  'iPad6,11': { model: 'iPad (5th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2017 },
  'iPad6,12': { model: 'iPad (5th gen)', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2017 },
  'iPad6,7': { model: 'iPad Pro 12.9"', manufacturer: 'Apple', ram: 4, cpu: 'Apple A9X', cpuCores: 2, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2015 },
  'iPad6,8': { model: 'iPad Pro 12.9"', manufacturer: 'Apple', ram: 4, cpu: 'Apple A9X', cpuCores: 2, screenWidth: 2732, screenHeight: 2048, ppi: 264, year: 2015 },
  'iPad6,3': { model: 'iPad Pro 9.7"', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2016 },
  'iPad6,4': { model: 'iPad Pro 9.7"', manufacturer: 'Apple', ram: 2, cpu: 'Apple A9X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2016 },
  'iPad5,3': { model: 'iPad Air 2', manufacturer: 'Apple', ram: 2, cpu: 'Apple A8X', cpuCores: 3, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2014 },
  'iPad5,4': { model: 'iPad Air 2', manufacturer: 'Apple', ram: 2, cpu: 'Apple A8X', cpuCores: 3, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2014 },
  'iPad4,7': { model: 'iPad mini 3', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2014 },
  'iPad4,8': { model: 'iPad mini 3', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2014 },
  'iPad4,9': { model: 'iPad mini 3', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2014 },
  // 2012-2013
  'iPad4,1': { model: 'iPad Air', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2013 },
  'iPad4,2': { model: 'iPad Air', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2013 },
  'iPad4,3': { model: 'iPad Air', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2013 },
  'iPad4,4': { model: 'iPad mini 2', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2013 },
  'iPad4,5': { model: 'iPad mini 2', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2013 },
  'iPad4,6': { model: 'iPad mini 2', manufacturer: 'Apple', ram: 1, cpu: 'Apple A7', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 326, year: 2013 },
  'iPad3,4': { model: 'iPad (4th gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  'iPad3,5': { model: 'iPad (4th gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  'iPad3,6': { model: 'iPad (4th gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A6X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  'iPad2,5': { model: 'iPad mini', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 163, year: 2012 },
  'iPad2,6': { model: 'iPad mini', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 163, year: 2012 },
  'iPad2,7': { model: 'iPad mini', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 163, year: 2012 },
  'iPad3,1': { model: 'iPad (3rd gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A5X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  'iPad3,2': { model: 'iPad (3rd gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A5X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  'iPad3,3': { model: 'iPad (3rd gen)', manufacturer: 'Apple', ram: 1, cpu: 'Apple A5X', cpuCores: 2, screenWidth: 2048, screenHeight: 1536, ppi: 264, year: 2012 },
  // 2011
  'iPad2,1': { model: 'iPad 2', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 132, year: 2011 },
  'iPad2,2': { model: 'iPad 2', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 132, year: 2011 },
  'iPad2,3': { model: 'iPad 2', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 132, year: 2011 },
  'iPad2,4': { model: 'iPad 2', manufacturer: 'Apple', ram: 0.5, cpu: 'Apple A5', cpuCores: 2, screenWidth: 1024, screenHeight: 768, ppi: 132, year: 2011 },
  // 2010
  'iPad1,1': { model: 'iPad', manufacturer: 'Apple', ram: 0.25, cpu: 'Apple A4', cpuCores: 1, screenWidth: 1024, screenHeight: 768, ppi: 132, year: 2010 },
  
  // === APPLE MACS (2010-2026) ===
  // 2024-2025 (M4 Generation)
  'Mac17,1': { model: 'MacBook Pro 14" M5', manufacturer: 'Apple', ram: 18, cpu: 'Apple M5', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2025 },
  'Mac17,2': { model: 'MacBook Pro 16" M5 Pro', manufacturer: 'Apple', ram: 32, cpu: 'Apple M5 Pro', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2025 },
  'Mac17,3': { model: 'MacBook Pro 16" M5 Max', manufacturer: 'Apple', ram: 64, cpu: 'Apple M5 Max', cpuCores: 18, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2025 },
  'Mac16,1': { model: 'MacBook Pro 14" M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2024 },
  'Mac16,2': { model: 'MacBook Pro 14" M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2024 },
  'Mac16,5': { model: 'MacBook Pro 16" M4 Pro', manufacturer: 'Apple', ram: 24, cpu: 'Apple M4 Pro', cpuCores: 14, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2024 },
  'Mac16,6': { model: 'MacBook Pro 16" M4 Pro', manufacturer: 'Apple', ram: 24, cpu: 'Apple M4 Pro', cpuCores: 14, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2024 },
  'Mac16,7': { model: 'MacBook Pro 14" M4 Max', manufacturer: 'Apple', ram: 48, cpu: 'Apple M4 Max', cpuCores: 16, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2024 },
  'Mac16,8': { model: 'MacBook Pro 16" M4 Max', manufacturer: 'Apple', ram: 48, cpu: 'Apple M4 Max', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2024 },
  'Mac16,10': { model: 'Mac mini M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2024 },
  'Mac16,11': { model: 'Mac mini M4 Pro', manufacturer: 'Apple', ram: 24, cpu: 'Apple M4 Pro', cpuCores: 14, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2024 },
  'Mac16,12': { model: 'iMac 24" M4', manufacturer: 'Apple', ram: 16, cpu: 'Apple M4', cpuCores: 10, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2024 },
  // 2023 (M3 Generation)
  'Mac15,3': { model: 'MacBook Pro 14" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,6': { model: 'MacBook Pro 14" M3 Pro', manufacturer: 'Apple', ram: 18, cpu: 'Apple M3 Pro', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,7': { model: 'MacBook Pro 16" M3 Pro', manufacturer: 'Apple', ram: 18, cpu: 'Apple M3 Pro', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,8': { model: 'MacBook Pro 14" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,9': { model: 'MacBook Pro 16" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,10': { model: 'MacBook Pro 14" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac15,11': { model: 'MacBook Pro 16" M3 Max', manufacturer: 'Apple', ram: 36, cpu: 'Apple M3 Max', cpuCores: 16, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac15,12': { model: 'MacBook Air 13" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 2560, screenHeight: 1664, ppi: 224, year: 2024 },
  'Mac15,13': { model: 'MacBook Air 15" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 2880, screenHeight: 1864, ppi: 224, year: 2024 },
  'Mac15,4': { model: 'iMac 24" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2023 },
  'Mac15,5': { model: 'iMac 24" M3', manufacturer: 'Apple', ram: 8, cpu: 'Apple M3', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2023 },
  // 2022-2023 (M2 Generation)
  'Mac14,2': { model: 'MacBook Air 13" M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2560, screenHeight: 1664, ppi: 224, year: 2022 },
  'Mac14,15': { model: 'MacBook Air 15" M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2880, screenHeight: 1864, ppi: 224, year: 2023 },
  'Mac14,7': { model: 'MacBook Pro 13" M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2022 },
  'Mac14,5': { model: 'MacBook Pro 14" M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac14,6': { model: 'MacBook Pro 16" M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac14,9': { model: 'MacBook Pro 14" M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2023 },
  'Mac14,10': { model: 'MacBook Pro 16" M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2023 },
  'Mac14,3': { model: 'Mac mini M2', manufacturer: 'Apple', ram: 8, cpu: 'Apple M2', cpuCores: 8, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,12': { model: 'Mac mini M2 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M2 Pro', cpuCores: 12, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,13': { model: 'Mac Studio M2 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M2 Max', cpuCores: 12, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,14': { model: 'Mac Studio M2 Ultra', manufacturer: 'Apple', ram: 64, cpu: 'Apple M2 Ultra', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Mac14,8': { model: 'Mac Pro M2 Ultra', manufacturer: 'Apple', ram: 64, cpu: 'Apple M2 Ultra', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  // 2020-2021 (M1 Generation)
  'Mac13,1': { model: 'MacBook Air M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'Mac13,2': { model: 'MacBook Air M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'Mac14,1': { model: 'MacBook Pro 13" M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'Mac13,3': { model: 'MacBook Pro 13" M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'Mac14,4': { model: 'Mac mini M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2020 },
  'iMac21,1': { model: 'iMac 24" M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2021 },
  'iMac21,2': { model: 'iMac 24" M1', manufacturer: 'Apple', ram: 8, cpu: 'Apple M1', cpuCores: 8, screenWidth: 4480, screenHeight: 2520, ppi: 218, year: 2021 },
  'Mac10,1': { model: 'MacBook Pro 14" M1 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M1 Pro', cpuCores: 10, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2021 },
  'Mac10,2': { model: 'MacBook Pro 16" M1 Pro', manufacturer: 'Apple', ram: 16, cpu: 'Apple M1 Pro', cpuCores: 10, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2021 },
  'MacBookPro18,3': { model: 'MacBook Pro 14" M1 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M1 Max', cpuCores: 10, screenWidth: 3024, screenHeight: 1964, ppi: 254, year: 2021 },
  'MacBookPro18,4': { model: 'MacBook Pro 16" M1 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M1 Max', cpuCores: 10, screenWidth: 3456, screenHeight: 2234, ppi: 254, year: 2021 },
  'Mac13,4': { model: 'Mac Studio M1 Max', manufacturer: 'Apple', ram: 32, cpu: 'Apple M1 Max', cpuCores: 10, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2022 },
  'Mac13,5': { model: 'Mac Studio M1 Ultra', manufacturer: 'Apple', ram: 64, cpu: 'Apple M1 Ultra', cpuCores: 20, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2022 },
  // 2019-2020 (Intel Generation - Last Intel Macs)
  'MacBookPro16,1': { model: 'MacBook Pro 16" (2019)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-9750H', cpuCores: 6, screenWidth: 3072, screenHeight: 1920, ppi: 226, year: 2019 },
  'MacBookPro16,2': { model: 'MacBook Pro 13" (2020)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i5-1038NG7', cpuCores: 4, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'MacBookPro16,3': { model: 'MacBook Pro 13" (2020)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-1068NG7', cpuCores: 4, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'MacBookPro16,4': { model: 'MacBook Pro 16" (2019)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i9-9980HK', cpuCores: 8, screenWidth: 3072, screenHeight: 1920, ppi: 226, year: 2019 },
  'MacBookAir9,1': { model: 'MacBook Air (2020)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i3-1000NG4', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'MacBookAir10,1': { model: 'MacBook Air (2020)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-1030NG7', cpuCores: 4, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2020 },
  'iMac20,1': { model: 'iMac 27" (2020)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-10500', cpuCores: 6, screenWidth: 5120, screenHeight: 2880, ppi: 218, year: 2020 },
  'iMac20,2': { model: 'iMac 27" (2020)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i7-10700K', cpuCores: 8, screenWidth: 5120, screenHeight: 2880, ppi: 218, year: 2020 },
  'Macmini8,1': { model: 'Mac mini (2018)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i3-8100B', cpuCores: 4, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2018 },
  'MacPro7,1': { model: 'Mac Pro (2019)', manufacturer: 'Apple', ram: 32, cpu: 'Intel Xeon W-3235', cpuCores: 12, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2019 },
  // 2015-2018 (Intel Generation)
  'MacBookPro15,1': { model: 'MacBook Pro 15" (2018)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-8750H', cpuCores: 6, screenWidth: 2880, screenHeight: 1800, ppi: 220, year: 2018 },
  'MacBookPro15,2': { model: 'MacBook Pro 13" (2018)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-8259U', cpuCores: 4, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2018 },
  'MacBookPro14,1': { model: 'MacBook Pro 13" (2017)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-7360U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2017 },
  'MacBookPro14,2': { model: 'MacBook Pro 13" (2017)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-7267U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2017 },
  'MacBookPro14,3': { model: 'MacBook Pro 15" (2017)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-7700HQ', cpuCores: 4, screenWidth: 2880, screenHeight: 1800, ppi: 220, year: 2017 },
  'MacBookPro13,1': { model: 'MacBook Pro 13" (2016)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-6360U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2016 },
  'MacBookPro13,2': { model: 'MacBook Pro 13" (2016)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-6267U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2016 },
  'MacBookPro13,3': { model: 'MacBook Pro 15" (2016)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-6700HQ', cpuCores: 4, screenWidth: 2880, screenHeight: 1800, ppi: 220, year: 2016 },
  'MacBookAir8,1': { model: 'MacBook Air (2018)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-8210Y', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2018 },
  'MacBookAir8,2': { model: 'MacBook Air (2019)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-8210Y', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2019 },
  'MacBookAir7,2': { model: 'MacBook Air (2017)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-5350U', cpuCores: 2, screenWidth: 1440, screenHeight: 900, ppi: 128, year: 2017 },
  'iMac19,1': { model: 'iMac 27" (2019)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-8500', cpuCores: 6, screenWidth: 5120, screenHeight: 2880, ppi: 218, year: 2019 },
  'iMac18,3': { model: 'iMac 27" (2017)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-7500', cpuCores: 4, screenWidth: 5120, screenHeight: 2880, ppi: 218, year: 2017 },
  'iMac17,1': { model: 'iMac 27" 5K (2015)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-6500', cpuCores: 4, screenWidth: 5120, screenHeight: 2880, ppi: 218, year: 2015 },
  // 2010-2014 (Early Intel Generation)
  'MacBookPro12,1': { model: 'MacBook Pro 13" (2015)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-5257U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2015 },
  'MacBookPro11,1': { model: 'MacBook Pro 13" (2013)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-4258U', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2013 },
  'MacBookPro11,2': { model: 'MacBook Pro 15" (2014)', manufacturer: 'Apple', ram: 16, cpu: 'Intel Core i7-4750HQ', cpuCores: 4, screenWidth: 2880, screenHeight: 1800, ppi: 220, year: 2014 },
  'MacBookPro10,1': { model: 'MacBook Pro 15" (2012)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i7-3615QM', cpuCores: 4, screenWidth: 2880, screenHeight: 1800, ppi: 220, year: 2012 },
  'MacBookPro10,2': { model: 'MacBook Pro 13" (2012)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-3210M', cpuCores: 2, screenWidth: 2560, screenHeight: 1600, ppi: 227, year: 2012 },
  'MacBookAir6,2': { model: 'MacBook Air 13" (2013)', manufacturer: 'Apple', ram: 4, cpu: 'Intel Core i5-4250U', cpuCores: 2, screenWidth: 1440, screenHeight: 900, ppi: 128, year: 2013 },
  'MacBookAir5,2': { model: 'MacBook Air 13" (2012)', manufacturer: 'Apple', ram: 4, cpu: 'Intel Core i5-3427U', cpuCores: 2, screenWidth: 1440, screenHeight: 900, ppi: 128, year: 2012 },
  'MacBookAir4,2': { model: 'MacBook Air 13" (2011)', manufacturer: 'Apple', ram: 4, cpu: 'Intel Core i5-2557M', cpuCores: 2, screenWidth: 1440, screenHeight: 900, ppi: 128, year: 2011 },
  'MacBookAir3,2': { model: 'MacBook Air 13" (2010)', manufacturer: 'Apple', ram: 2, cpu: 'Intel Core 2 Duo', cpuCores: 2, screenWidth: 1440, screenHeight: 900, ppi: 128, year: 2010 },
  'iMac14,2': { model: 'iMac 27" (2013)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-4570', cpuCores: 4, screenWidth: 2560, screenHeight: 1440, ppi: 109, year: 2013 },
  'iMac13,2': { model: 'iMac 27" (2012)', manufacturer: 'Apple', ram: 8, cpu: 'Intel Core i5-3470S', cpuCores: 4, screenWidth: 2560, screenHeight: 1440, ppi: 109, year: 2012 },
  'iMac12,2': { model: 'iMac 27" (2011)', manufacturer: 'Apple', ram: 4, cpu: 'Intel Core i5-2400', cpuCores: 4, screenWidth: 2560, screenHeight: 1440, ppi: 109, year: 2011 },
  'iMac11,3': { model: 'iMac 27" (2010)', manufacturer: 'Apple', ram: 4, cpu: 'Intel Core i3-540', cpuCores: 2, screenWidth: 2560, screenHeight: 1440, ppi: 109, year: 2010 },
  
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
  // Samsung Galaxy A series (2020-2024)
  'SM-A556': { model: 'Galaxy A55', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 1480', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 390, year: 2024 },
  'SM-A356': { model: 'Galaxy A35', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 1380', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 390, year: 2024 },
  'SM-A546': { model: 'Galaxy A54', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 1380', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 403, year: 2023 },
  'SM-A346': { model: 'Galaxy A34', manufacturer: 'Samsung', ram: 6, cpu: 'Dimensity 1080', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 390, year: 2023 },
  'SM-A536': { model: 'Galaxy A53', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 1280', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 405, year: 2022 },
  'SM-A526': { model: 'Galaxy A52', manufacturer: 'Samsung', ram: 6, cpu: 'Snapdragon 720G', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 405, year: 2021 },
  'SM-A515': { model: 'Galaxy A51', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 9611', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 405, year: 2020 },
  'SM-A716': { model: 'Galaxy A71', manufacturer: 'Samsung', ram: 6, cpu: 'Snapdragon 730', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 393, year: 2020 },
  // Samsung Galaxy S series (2010-2019)
  'SM-G975': { model: 'Galaxy S10+', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 9820', cpuCores: 8, screenWidth: 1440, screenHeight: 3040, ppi: 522, year: 2019 },
  'SM-G973': { model: 'Galaxy S10', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 9820', cpuCores: 8, screenWidth: 1440, screenHeight: 3040, ppi: 550, year: 2019 },
  'SM-G970': { model: 'Galaxy S10e', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 9820', cpuCores: 8, screenWidth: 1080, screenHeight: 2280, ppi: 438, year: 2019 },
  'SM-G965': { model: 'Galaxy S9+', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 9810', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 529, year: 2018 },
  'SM-G960': { model: 'Galaxy S9', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 9810', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 570, year: 2018 },
  'SM-G955': { model: 'Galaxy S8+', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 8895', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 529, year: 2017 },
  'SM-G950': { model: 'Galaxy S8', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 8895', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 570, year: 2017 },
  'SM-G935': { model: 'Galaxy S7 Edge', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 8890', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 534, year: 2016 },
  'SM-G930': { model: 'Galaxy S7', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 8890', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 577, year: 2016 },
  'SM-G928': { model: 'Galaxy S6 Edge+', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 7420', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 518, year: 2015 },
  'SM-G925': { model: 'Galaxy S6 Edge', manufacturer: 'Samsung', ram: 3, cpu: 'Exynos 7420', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 577, year: 2015 },
  'SM-G920': { model: 'Galaxy S6', manufacturer: 'Samsung', ram: 3, cpu: 'Exynos 7420', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 577, year: 2015 },
  'SM-G900': { model: 'Galaxy S5', manufacturer: 'Samsung', ram: 2, cpu: 'Snapdragon 801', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 432, year: 2014 },
  'GT-I9505': { model: 'Galaxy S4', manufacturer: 'Samsung', ram: 2, cpu: 'Snapdragon 600', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2013 },
  'GT-I9300': { model: 'Galaxy S3', manufacturer: 'Samsung', ram: 1, cpu: 'Exynos 4412', cpuCores: 4, screenWidth: 720, screenHeight: 1280, ppi: 306, year: 2012 },
  'GT-I9100': { model: 'Galaxy S2', manufacturer: 'Samsung', ram: 1, cpu: 'Exynos 4210', cpuCores: 2, screenWidth: 480, screenHeight: 800, ppi: 217, year: 2011 },
  'GT-I9000': { model: 'Galaxy S', manufacturer: 'Samsung', ram: 0.5, cpu: 'Hummingbird', cpuCores: 1, screenWidth: 480, screenHeight: 800, ppi: 233, year: 2010 },
  // Samsung Galaxy Note series
  'SM-N986': { model: 'Galaxy Note20 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Exynos 990', cpuCores: 8, screenWidth: 1440, screenHeight: 3088, ppi: 494, year: 2020 },
  'SM-N981': { model: 'Galaxy Note20', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 990', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 393, year: 2020 },
  'SM-N975': { model: 'Galaxy Note10+', manufacturer: 'Samsung', ram: 12, cpu: 'Exynos 9825', cpuCores: 8, screenWidth: 1440, screenHeight: 3040, ppi: 498, year: 2019 },
  'SM-N970': { model: 'Galaxy Note10', manufacturer: 'Samsung', ram: 8, cpu: 'Exynos 9825', cpuCores: 8, screenWidth: 1080, screenHeight: 2280, ppi: 401, year: 2019 },
  'SM-N960': { model: 'Galaxy Note9', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 9810', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 516, year: 2018 },
  'SM-N950': { model: 'Galaxy Note8', manufacturer: 'Samsung', ram: 6, cpu: 'Exynos 8895', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 521, year: 2017 },
  'SM-N930': { model: 'Galaxy Note7', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 8890', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 518, year: 2016 },
  'SM-N920': { model: 'Galaxy Note5', manufacturer: 'Samsung', ram: 4, cpu: 'Exynos 7420', cpuCores: 8, screenWidth: 1440, screenHeight: 2560, ppi: 518, year: 2015 },
  'SM-N910': { model: 'Galaxy Note4', manufacturer: 'Samsung', ram: 3, cpu: 'Snapdragon 805', cpuCores: 4, screenWidth: 1440, screenHeight: 2560, ppi: 515, year: 2014 },
  'SM-N9005': { model: 'Galaxy Note3', manufacturer: 'Samsung', ram: 3, cpu: 'Snapdragon 800', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 386, year: 2013 },
  'GT-N7100': { model: 'Galaxy Note2', manufacturer: 'Samsung', ram: 2, cpu: 'Exynos 4412', cpuCores: 4, screenWidth: 720, screenHeight: 1280, ppi: 267, year: 2012 },
  'GT-N7000': { model: 'Galaxy Note', manufacturer: 'Samsung', ram: 1, cpu: 'Exynos 4210', cpuCores: 2, screenWidth: 800, screenHeight: 1280, ppi: 285, year: 2011 },
  
  // === GOOGLE PIXEL (2016-2026 complete) ===
  // 2024-2025
  'Pixel 10 Pro XL': { model: 'Pixel 10 Pro XL', manufacturer: 'Google', ram: 16, cpu: 'Google Tensor G5', cpuCores: 8, screenWidth: 1344, screenHeight: 2992, ppi: 486, year: 2025 },
  'Pixel 10 Pro': { model: 'Pixel 10 Pro', manufacturer: 'Google', ram: 16, cpu: 'Google Tensor G5', cpuCores: 8, screenWidth: 1280, screenHeight: 2856, ppi: 495, year: 2025 },
  'Pixel 10': { model: 'Pixel 10', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G5', cpuCores: 8, screenWidth: 1080, screenHeight: 2424, ppi: 422, year: 2025 },
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
  'Pixel 6a': { model: 'Pixel 6a', manufacturer: 'Google', ram: 6, cpu: 'Google Tensor', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 429, year: 2022 },
  'Pixel Fold': { model: 'Pixel Fold', manufacturer: 'Google', ram: 12, cpu: 'Google Tensor G2', cpuCores: 8, screenWidth: 2208, screenHeight: 1840, ppi: 380, year: 2023 },
  'Pixel 5a': { model: 'Pixel 5a', manufacturer: 'Google', ram: 6, cpu: 'Snapdragon 765G', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 415, year: 2021 },
  'Pixel 5': { model: 'Pixel 5', manufacturer: 'Google', ram: 8, cpu: 'Snapdragon 765G', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 432, year: 2020 },
  'Pixel 4a 5G': { model: 'Pixel 4a 5G', manufacturer: 'Google', ram: 6, cpu: 'Snapdragon 765G', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 413, year: 2020 },
  'Pixel 4a': { model: 'Pixel 4a', manufacturer: 'Google', ram: 6, cpu: 'Snapdragon 730G', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 443, year: 2020 },
  'Pixel 4 XL': { model: 'Pixel 4 XL', manufacturer: 'Google', ram: 6, cpu: 'Snapdragon 855', cpuCores: 8, screenWidth: 1440, screenHeight: 3040, ppi: 537, year: 2019 },
  'Pixel 4': { model: 'Pixel 4', manufacturer: 'Google', ram: 6, cpu: 'Snapdragon 855', cpuCores: 8, screenWidth: 1080, screenHeight: 2280, ppi: 444, year: 2019 },
  'Pixel 3a XL': { model: 'Pixel 3a XL', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 670', cpuCores: 8, screenWidth: 1080, screenHeight: 2160, ppi: 402, year: 2019 },
  'Pixel 3a': { model: 'Pixel 3a', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 670', cpuCores: 8, screenWidth: 1080, screenHeight: 2220, ppi: 441, year: 2019 },
  'Pixel 3 XL': { model: 'Pixel 3 XL', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 845', cpuCores: 8, screenWidth: 1440, screenHeight: 2960, ppi: 523, year: 2018 },
  'Pixel 3': { model: 'Pixel 3', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 845', cpuCores: 8, screenWidth: 1080, screenHeight: 2160, ppi: 443, year: 2018 },
  'Pixel 2 XL': { model: 'Pixel 2 XL', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 835', cpuCores: 8, screenWidth: 1440, screenHeight: 2880, ppi: 538, year: 2017 },
  'Pixel 2': { model: 'Pixel 2', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 835', cpuCores: 8, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2017 },
  'Pixel XL': { model: 'Pixel XL', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 821', cpuCores: 4, screenWidth: 1440, screenHeight: 2560, ppi: 534, year: 2016 },
  'Pixel': { model: 'Pixel', manufacturer: 'Google', ram: 4, cpu: 'Snapdragon 821', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2016 },
  
  // === ONEPLUS (2014-2026) ===
  // 2024-2025
  'CPH2609': { model: 'OnePlus 13', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 4', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 510, year: 2025 },
  'CPH2449': { model: 'OnePlus 12', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 510, year: 2024 },
  'CPH2447': { model: 'OnePlus 12R', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2780, ppi: 450, year: 2024 },
  'CPH2451': { model: 'OnePlus Open', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2268, screenHeight: 1992, ppi: 426, year: 2023 },
  'PHB110': { model: 'OnePlus 11', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1440, screenHeight: 3216, ppi: 525, year: 2023 },
  'NE2211': { model: 'OnePlus 10 Pro', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1440, screenHeight: 3216, ppi: 525, year: 2022 },
  'LE2123': { model: 'OnePlus 10T', manufacturer: 'OnePlus', ram: 16, cpu: 'Snapdragon 8+ Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2022 },
  'LE2121': { model: 'OnePlus 9 Pro', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 888', cpuCores: 8, screenWidth: 1440, screenHeight: 3216, ppi: 525, year: 2021 },
  'LE2115': { model: 'OnePlus 9', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 888', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2021 },
  'LE2117': { model: 'OnePlus 9R', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 870', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2021 },
  'IN2023': { model: 'OnePlus 8 Pro', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 865', cpuCores: 8, screenWidth: 1440, screenHeight: 3168, ppi: 513, year: 2020 },
  'IN2013': { model: 'OnePlus 8', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 865', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2020 },
  'HD1905': { model: 'OnePlus 7 Pro', manufacturer: 'OnePlus', ram: 12, cpu: 'Snapdragon 855', cpuCores: 8, screenWidth: 1440, screenHeight: 3120, ppi: 516, year: 2019 },
  'GM1913': { model: 'OnePlus 7', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 855', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 402, year: 2019 },
  'A6013': { model: 'OnePlus 6T', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 845', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 402, year: 2018 },
  'A6003': { model: 'OnePlus 6', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 845', cpuCores: 8, screenWidth: 1080, screenHeight: 2280, ppi: 402, year: 2018 },
  'A5010': { model: 'OnePlus 5T', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 835', cpuCores: 8, screenWidth: 1080, screenHeight: 2160, ppi: 401, year: 2017 },
  'A5000': { model: 'OnePlus 5', manufacturer: 'OnePlus', ram: 8, cpu: 'Snapdragon 835', cpuCores: 8, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2017 },
  'A3010': { model: 'OnePlus 3T', manufacturer: 'OnePlus', ram: 6, cpu: 'Snapdragon 821', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2016 },
  'A3003': { model: 'OnePlus 3', manufacturer: 'OnePlus', ram: 6, cpu: 'Snapdragon 820', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2016 },
  'A2005': { model: 'OnePlus 2', manufacturer: 'OnePlus', ram: 4, cpu: 'Snapdragon 810', cpuCores: 8, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2015 },
  'A0001': { model: 'OnePlus One', manufacturer: 'OnePlus', ram: 3, cpu: 'Snapdragon 801', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 401, year: 2014 },
  
  // === XIAOMI (2011-2026) ===
  // 2024-2025
  '24116PN5BC': { model: 'Xiaomi 15 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Elite', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2025 },
  '24072PX77G': { model: 'Xiaomi 14 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2024 },
  '23127PN0CC': { model: 'Xiaomi 14', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 3', cpuCores: 8, screenWidth: 1200, screenHeight: 2670, ppi: 460, year: 2023 },
  '2304FPN6DC': { model: 'Xiaomi 13 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2023 },
  '2211133C': { model: 'Xiaomi 13', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 402, year: 2022 },
  '2203121C': { model: 'Xiaomi 12 Pro', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 522, year: 2022 },
  '2112123G': { model: 'Xiaomi 12', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 1080, screenHeight: 2400, ppi: 419, year: 2021 },
  '2308CPXD0C': { model: 'Xiaomi Mix Fold 3', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 8 Gen 2', cpuCores: 8, screenWidth: 2160, screenHeight: 1916, ppi: 402, year: 2023 },
  '2107113SG': { model: 'Xiaomi 11 Ultra', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 888', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 515, year: 2021 },
  'M2011K2G': { model: 'Xiaomi 11', manufacturer: 'Xiaomi', ram: 8, cpu: 'Snapdragon 888', cpuCores: 8, screenWidth: 1440, screenHeight: 3200, ppi: 515, year: 2021 },
  'M2007J3SG': { model: 'Xiaomi Mi 10 Ultra', manufacturer: 'Xiaomi', ram: 16, cpu: 'Snapdragon 865', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 386, year: 2020 },
  'M2001J2G': { model: 'Xiaomi Mi 10 Pro', manufacturer: 'Xiaomi', ram: 12, cpu: 'Snapdragon 865', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 386, year: 2020 },
  'M2002J9G': { model: 'Xiaomi Mi 10', manufacturer: 'Xiaomi', ram: 8, cpu: 'Snapdragon 865', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 386, year: 2020 },
  'M1908F1XE': { model: 'Xiaomi Mi 9', manufacturer: 'Xiaomi', ram: 8, cpu: 'Snapdragon 855', cpuCores: 8, screenWidth: 1080, screenHeight: 2340, ppi: 403, year: 2019 },
  'M1803E1A': { model: 'Xiaomi Mi 8', manufacturer: 'Xiaomi', ram: 6, cpu: 'Snapdragon 845', cpuCores: 8, screenWidth: 1080, screenHeight: 2248, ppi: 402, year: 2018 },
  'MDG2': { model: 'Xiaomi Mi Mix 2', manufacturer: 'Xiaomi', ram: 6, cpu: 'Snapdragon 835', cpuCores: 8, screenWidth: 1080, screenHeight: 2160, ppi: 403, year: 2017 },
  'MI5': { model: 'Xiaomi Mi 5', manufacturer: 'Xiaomi', ram: 4, cpu: 'Snapdragon 820', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 428, year: 2016 },
  '2015811': { model: 'Xiaomi Mi 4c', manufacturer: 'Xiaomi', ram: 3, cpu: 'Snapdragon 808', cpuCores: 6, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2015 },
  '2014813': { model: 'Xiaomi Mi 4', manufacturer: 'Xiaomi', ram: 3, cpu: 'Snapdragon 801', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2014 },
  '2013062': { model: 'Xiaomi Mi 3', manufacturer: 'Xiaomi', ram: 2, cpu: 'Snapdragon 800', cpuCores: 4, screenWidth: 1080, screenHeight: 1920, ppi: 441, year: 2013 },
  '2012051': { model: 'Xiaomi Mi 2S', manufacturer: 'Xiaomi', ram: 2, cpu: 'Snapdragon S4 Pro', cpuCores: 4, screenWidth: 720, screenHeight: 1280, ppi: 342, year: 2013 },
  '2012061': { model: 'Xiaomi Mi 2', manufacturer: 'Xiaomi', ram: 2, cpu: 'Snapdragon S4 Pro', cpuCores: 4, screenWidth: 720, screenHeight: 1280, ppi: 342, year: 2012 },
  '2011121': { model: 'Xiaomi Mi 1', manufacturer: 'Xiaomi', ram: 1, cpu: 'Snapdragon S3', cpuCores: 2, screenWidth: 480, screenHeight: 854, ppi: 233, year: 2011 },
  
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
  'SM-X800': { model: 'Galaxy Tab S8 Ultra', manufacturer: 'Samsung', ram: 12, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 2960, screenHeight: 1848, ppi: 240, year: 2022 },
  'SM-X706': { model: 'Galaxy Tab S8+', manufacturer: 'Samsung', ram: 8, cpu: 'Snapdragon 8 Gen 1', cpuCores: 8, screenWidth: 2800, screenHeight: 1752, ppi: 274, year: 2022 },
  
  // === WINDOWS LAPTOPS - DELL ===
  'XPS 15 9530': { model: 'Dell XPS 15 (2023)', manufacturer: 'Dell', ram: 32, cpu: 'Intel Core i9-13900H', cpuCores: 14, screenWidth: 3456, screenHeight: 2160, ppi: 254, year: 2023 },
  'XPS 15 9520': { model: 'Dell XPS 15 (2022)', manufacturer: 'Dell', ram: 32, cpu: 'Intel Core i9-12900HK', cpuCores: 14, screenWidth: 3456, screenHeight: 2160, ppi: 254, year: 2022 },
  'XPS 15 9510': { model: 'Dell XPS 15 (2021)', manufacturer: 'Dell', ram: 32, cpu: 'Intel Core i9-11900H', cpuCores: 8, screenWidth: 3456, screenHeight: 2160, ppi: 254, year: 2021 },
  'XPS 13 9340': { model: 'Dell XPS 13 (2024)', manufacturer: 'Dell', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2880, screenHeight: 1920, ppi: 250, year: 2024 },
  'XPS 13 9315': { model: 'Dell XPS 13 (2022)', manufacturer: 'Dell', ram: 32, cpu: 'Intel Core i7-1250U', cpuCores: 10, screenWidth: 1920, screenHeight: 1200, ppi: 177, year: 2022 },
  'Alienware x16': { model: 'Alienware x16', manufacturer: 'Dell', ram: 64, cpu: 'Intel Core i9-13900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2023 },
  'Alienware m18': { model: 'Alienware m18', manufacturer: 'Dell', ram: 64, cpu: 'Intel Core i9-13980HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 165, year: 2023 },
  
  // === WINDOWS LAPTOPS - HP ===
  'HP Spectre x360 14': { model: 'HP Spectre x360 14', manufacturer: 'HP', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2880, screenHeight: 1800, ppi: 252, year: 2024 },
  'HP Envy 16': { model: 'HP Envy 16', manufacturer: 'HP', ram: 32, cpu: 'Intel Core i9-13900H', cpuCores: 14, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2023 },
  'HP Omen 17': { model: 'HP Omen 17', manufacturer: 'HP', ram: 32, cpu: 'Intel Core i9-13900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1440, ppi: 173, year: 2023 },
  'HP Pavilion 15': { model: 'HP Pavilion 15', manufacturer: 'HP', ram: 16, cpu: 'AMD Ryzen 7 7730U', cpuCores: 8, screenWidth: 1920, screenHeight: 1080, ppi: 141, year: 2023 },
  
  // === WINDOWS LAPTOPS - LENOVO ===
  'ThinkPad X1 Carbon Gen 12': { model: 'ThinkPad X1 Carbon Gen 12', manufacturer: 'Lenovo', ram: 64, cpu: 'Intel Core Ultra 7 165U', cpuCores: 12, screenWidth: 2880, screenHeight: 1800, ppi: 245, year: 2024 },
  'ThinkPad X1 Carbon Gen 11': { model: 'ThinkPad X1 Carbon Gen 11', manufacturer: 'Lenovo', ram: 32, cpu: 'Intel Core i7-1365U', cpuCores: 10, screenWidth: 2560, screenHeight: 1600, ppi: 212, year: 2023 },
  'ThinkPad X1 Carbon Gen 10': { model: 'ThinkPad X1 Carbon Gen 10', manufacturer: 'Lenovo', ram: 32, cpu: 'Intel Core i7-1260P', cpuCores: 12, screenWidth: 2560, screenHeight: 1600, ppi: 212, year: 2022 },
  'Legion 9i Gen 9': { model: 'Legion 9i Gen 9', manufacturer: 'Lenovo', ram: 64, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 3200, screenHeight: 2000, ppi: 237, year: 2024 },
  'Legion 7i Gen 8': { model: 'Legion 7i Gen 8', manufacturer: 'Lenovo', ram: 32, cpu: 'Intel Core i9-13900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2023 },
  'Yoga 9i Gen 9': { model: 'Yoga 9i Gen 9', manufacturer: 'Lenovo', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2880, screenHeight: 1800, ppi: 243, year: 2024 },
  'IdeaPad Slim 5': { model: 'IdeaPad Slim 5', manufacturer: 'Lenovo', ram: 16, cpu: 'AMD Ryzen 7 7730U', cpuCores: 8, screenWidth: 1920, screenHeight: 1200, ppi: 150, year: 2023 },
  
  // === WINDOWS LAPTOPS - ASUS ===
  'ROG Zephyrus G16 (2024)': { model: 'ROG Zephyrus G16 (2024)', manufacturer: 'ASUS', ram: 32, cpu: 'Intel Core Ultra 9 185H', cpuCores: 16, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2024 },
  'ROG Zephyrus G14 (2024)': { model: 'ROG Zephyrus G14 (2024)', manufacturer: 'ASUS', ram: 32, cpu: 'AMD Ryzen 9 8945HS', cpuCores: 8, screenWidth: 2880, screenHeight: 1800, ppi: 243, year: 2024 },
  'ROG Strix Scar 18': { model: 'ROG Strix Scar 18', manufacturer: 'ASUS', ram: 64, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 165, year: 2024 },
  'ZenBook 14 OLED': { model: 'ZenBook 14 OLED (2024)', manufacturer: 'ASUS', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2880, screenHeight: 1800, ppi: 243, year: 2024 },
  'VivoBook Pro 15': { model: 'VivoBook Pro 15', manufacturer: 'ASUS', ram: 16, cpu: 'AMD Ryzen 7 6800H', cpuCores: 8, screenWidth: 2880, screenHeight: 1620, ppi: 220, year: 2022 },
  'TUF Gaming A15': { model: 'TUF Gaming A15', manufacturer: 'ASUS', ram: 16, cpu: 'AMD Ryzen 7 7735HS', cpuCores: 8, screenWidth: 1920, screenHeight: 1080, ppi: 141, year: 2023 },
  
  // === WINDOWS LAPTOPS - MSI ===
  'Titan 18 HX': { model: 'MSI Titan 18 HX', manufacturer: 'MSI', ram: 128, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 3840, screenHeight: 2400, ppi: 249, year: 2024 },
  'Raider GE78 HX': { model: 'MSI Raider GE78 HX', manufacturer: 'MSI', ram: 64, cpu: 'Intel Core i9-13980HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2023 },
  'Stealth 16 Studio': { model: 'MSI Stealth 16 Studio', manufacturer: 'MSI', ram: 64, cpu: 'Intel Core i9-13900H', cpuCores: 14, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2023 },
  'Prestige 16 AI Evo': { model: 'MSI Prestige 16 AI Evo', manufacturer: 'MSI', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2024 },
  
  // === WINDOWS LAPTOPS - RAZER ===
  'Razer Blade 18': { model: 'Razer Blade 18 (2024)', manufacturer: 'Razer', ram: 64, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 165, year: 2024 },
  'Razer Blade 16': { model: 'Razer Blade 16 (2024)', manufacturer: 'Razer', ram: 32, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2024 },
  'Razer Blade 15': { model: 'Razer Blade 15 (2023)', manufacturer: 'Razer', ram: 32, cpu: 'Intel Core i9-13950HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1440, ppi: 189, year: 2023 },
  'Razer Blade 14': { model: 'Razer Blade 14 (2024)', manufacturer: 'Razer', ram: 32, cpu: 'AMD Ryzen 9 8945HS', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 212, year: 2024 },
  
  // === WINDOWS LAPTOPS - ACER ===
  'Predator Helios 18': { model: 'Acer Predator Helios 18', manufacturer: 'Acer', ram: 64, cpu: 'Intel Core i9-14900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 165, year: 2024 },
  'Swift X 14': { model: 'Acer Swift X 14', manufacturer: 'Acer', ram: 32, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2880, screenHeight: 1800, ppi: 243, year: 2024 },
  'Nitro 5': { model: 'Acer Nitro 5', manufacturer: 'Acer', ram: 16, cpu: 'AMD Ryzen 7 7735HS', cpuCores: 8, screenWidth: 1920, screenHeight: 1080, ppi: 141, year: 2023 },
  
  // === WINDOWS LAPTOPS - GIGABYTE ===
  'Aorus 17X': { model: 'Gigabyte Aorus 17X', manufacturer: 'Gigabyte', ram: 64, cpu: 'Intel Core i9-13900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1600, ppi: 165, year: 2023 },
  'Aero 16 OLED': { model: 'Gigabyte Aero 16 OLED', manufacturer: 'Gigabyte', ram: 32, cpu: 'Intel Core i9-13900H', cpuCores: 14, screenWidth: 3840, screenHeight: 2400, ppi: 282, year: 2023 },
  
  // === WINDOWS DESKTOPS - CUSTOM BUILDS ===
  'Custom Gaming PC RTX 4090': { model: 'Custom Build RTX 4090', manufacturer: 'Custom', ram: 64, cpu: 'Intel Core i9-14900K', cpuCores: 24, screenWidth: 3840, screenHeight: 2160, ppi: 140, year: 2024 },
  'Custom Gaming PC RTX 4080': { model: 'Custom Build RTX 4080', manufacturer: 'Custom', ram: 32, cpu: 'AMD Ryzen 9 7950X', cpuCores: 16, screenWidth: 3840, screenHeight: 2160, ppi: 140, year: 2023 },
  'Custom Workstation A6000': { model: 'Custom Workstation RTX A6000', manufacturer: 'Custom', ram: 128, cpu: 'AMD Threadripper PRO 5995WX', cpuCores: 64, screenWidth: 3840, screenHeight: 2160, ppi: 140, year: 2023 },
  
  // === WINDOWS DESKTOPS - PREBUILT ===
  'Alienware Aurora R16': { model: 'Alienware Aurora R16', manufacturer: 'Dell', ram: 64, cpu: 'Intel Core i9-14900KF', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2024 },
  'HP Omen 45L': { model: 'HP Omen 45L', manufacturer: 'HP', ram: 64, cpu: 'Intel Core i9-13900K', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'Lenovo Legion Tower 7i': { model: 'Lenovo Legion Tower 7i', manufacturer: 'Lenovo', ram: 32, cpu: 'Intel Core i9-13900KF', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'ASUS ROG Strix GA35': { model: 'ROG Strix GA35', manufacturer: 'ASUS', ram: 32, cpu: 'AMD Ryzen 9 7950X', cpuCores: 16, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  'MSI MEG Aegis Ti5': { model: 'MSI MEG Aegis Ti5', manufacturer: 'MSI', ram: 64, cpu: 'Intel Core i9-13900KS', cpuCores: 24, screenWidth: 0, screenHeight: 0, ppi: 0, year: 2023 },
  
  // === LINUX LAPTOPS ===
  'System76 Oryx Pro': { model: 'System76 Oryx Pro', manufacturer: 'System76', ram: 64, cpu: 'Intel Core i9-13900HX', cpuCores: 24, screenWidth: 2560, screenHeight: 1440, ppi: 189, year: 2023 },
  'System76 Lemur Pro': { model: 'System76 Lemur Pro', manufacturer: 'System76', ram: 40, cpu: 'Intel Core i7-1355U', cpuCores: 10, screenWidth: 1920, screenHeight: 1080, ppi: 157, year: 2023 },
  'Framework Laptop 16': { model: 'Framework Laptop 16', manufacturer: 'Framework', ram: 64, cpu: 'AMD Ryzen 9 7940HS', cpuCores: 8, screenWidth: 2560, screenHeight: 1600, ppi: 189, year: 2024 },
  'Framework Laptop 13': { model: 'Framework Laptop 13', manufacturer: 'Framework', ram: 64, cpu: 'Intel Core Ultra 7 155H', cpuCores: 16, screenWidth: 2256, screenHeight: 1504, ppi: 201, year: 2024 },
  'Tuxedo Pulse 15': { model: 'Tuxedo Pulse 15', manufacturer: 'Tuxedo', ram: 64, cpu: 'AMD Ryzen 7 7840HS', cpuCores: 8, screenWidth: 2560, screenHeight: 1440, ppi: 189, year: 2023 },
  'Purism Librem 14': { model: 'Purism Librem 14', manufacturer: 'Purism', ram: 64, cpu: 'Intel Core i7-10710U', cpuCores: 6, screenWidth: 1920, screenHeight: 1080, ppi: 157, year: 2021 },
};

// CPU database for desktop identification
const CPU_DATABASE: Record<string, { name: string; cores: number; threads: number; year: number }> = {
  // Intel Desktop (12th-15th Gen)
  'i9-15900K': { name: 'Intel Core i9-15900K', cores: 24, threads: 32, year: 2025 },
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

  app?: {
    buildId?: string;
    sessionMs?: number;
    sessionStart?: number;
    cacheUsageMB?: number;
    cacheQuotaMB?: number;
    dataUsageMB?: string;
    dataTotalMB?: string;
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

type InitLevel = 'none' | 'light' | 'full';

export interface DeviceMonitorStartOptions {
  /**
   * Fetch Geo/IP (network request). Off by default for performance/privacy.
   */
  includeGeoIp?: boolean;
  /**
   * Run Cloudflare bandwidth tests periodically (heavy). Off by default.
   */
  enableNetworkSpeedTest?: boolean;
  /**
   * Run an internal RAF FPS counter. Prefer using UnifiedPerformance as the FPS source.
   */
  enableInternalFpsMonitor?: boolean;
  /**
   * Abort Geo/IP fetch after this many ms (only applies when includeGeoIp=true).
   */
  geoIpTimeoutMs?: number;
}

class DeviceMonitor {
  private info: Partial<DeviceInfo> = {};
  private fps = 60;
  private frameCount = 0;
  private networkSpeed = 0;
  private uploadSpeed = 0;
  private latency = 0;
  private latencyJitter = 0;
  private battery: any = null;
  private geoIpCache = { ip: 'Unknown', location: 'Unknown', isp: 'Unknown' };
  private initLevel: InitLevel = 'none';
  private initPromise: Promise<void> | null = null;
  private fullPromise: Promise<void> | null = null;
  private geoIpPromise: Promise<void> | null = null;
  private networkTestIntervalId: number | null = null;
  private fpsRafId: number | null = null;
  private externalFpsLastUpdated = 0;
  private liveNetworkIntervalId: number | null = null;
  private liveProbeCounter = 0;
  private networkListenersInstalled = false;
  private sessionStart = typeof performance !== 'undefined' ? performance.timeOrigin : Date.now();
  private autoRefreshIntervalId: number | null = null;

  constructor() {
    // Initialize minimal defaults so getInfo() is always safe/synchronous.
    this.info.live = {
      fps: this.fps,
      frameTime: 1000 / this.fps,
      networkSpeed: 0,
      uploadSpeed: 0,
      latency: 0,
      jitter: 0,
      timestamp: Date.now(),
    };

    // Kick off lightweight init (no network tests) without blocking first paint.
    if (typeof window !== 'undefined') {
      queueMicrotask(() => {
        void this.start('light');
      });
      // Opportunistic Geo/IP fetch so network fields aren't stuck as "Unknown"
      setTimeout(() => {
        if (this.geoIpCache.ip === 'Unknown') {
          void this.detectNetwork({ includeGeoIp: true, timeoutMs: 900 });
        }
      }, 1200);

      // Periodic auto-refresh check (cache bloat / long session). Will not clear auth/localStorage.
      this.startAutoRefreshCheck();
    }
  }

  /**
   * Backwards-compatible alias (full init).
   */
  async initialize(): Promise<void> {
    await this.start('full', { includeGeoIp: true });
  }

  /**
   * Start (or upgrade) device monitoring.
   * - `light`: no Geo/IP fetch, no bandwidth tests, no internal FPS loop
   * - `full`: optional Geo/IP fetch and optional bandwidth tests
   */
  async start(level: Exclude<InitLevel, 'none'> = 'light', options: DeviceMonitorStartOptions = {}): Promise<void> {
    if (this.initLevel === 'full') return;

    if (level === 'light') {
      if (this.initPromise) return this.initPromise;
      this.initPromise = (async () => {
        // Order matters: detectDevice feeds type/model used by performance/screen heuristics.
        await this.detectDevice();
        await this.detectPerformance();
      await this.detectNetwork({ includeGeoIp: false, timeoutMs: 0 });
      this.startLiveNetworkProbe();
      this.installNetworkListeners();
      this.startAutoRefreshCheck();
      this.detectScreen();
      this.initLevel = 'light';
      })().catch((err) => {
        console.warn('[DeviceMonitor] Light init failed:', err);
      });
      return this.initPromise;
    }

    // Full init (upgrade)
    if (this.fullPromise) return this.fullPromise;
    this.fullPromise = (async () => {
      await this.start('light');
      await this.detectBattery();
      await this.detectStorage();
      await this.detectNetwork({
        includeGeoIp: options.includeGeoIp ?? false,
        timeoutMs: options.geoIpTimeoutMs ?? 1200,
      });
      this.startLiveNetworkProbe();
      this.installNetworkListeners();
      this.startAutoRefreshCheck();

      if (options.enableInternalFpsMonitor) {
        this.startFPSMonitoring();
      }
      if (options.enableNetworkSpeedTest) {
        await this.startNetworkSpeedTest();
      }

      this.initLevel = 'full';
    })().catch((err) => {
      console.warn('[DeviceMonitor] Full init failed:', err);
    });
    return this.fullPromise;
  }

  /**
   * Prefer this over an extra RAF loop: UnifiedPerformance can feed FPS into DeviceMonitor.
   */
  setExternalFps(fps: number, avg?: number): void {
    const safeFps = Number.isFinite(fps) ? Math.max(1, Math.round(fps)) : this.fps;
    this.fps = safeFps;
    this.externalFpsLastUpdated = Date.now();
    if (!this.info.live) {
      this.info.live = {
        fps: safeFps,
        frameTime: 1000 / safeFps,
        networkSpeed: this.networkSpeed,
        uploadSpeed: this.uploadSpeed,
        latency: this.latency,
        jitter: this.latencyJitter,
        timestamp: Date.now(),
      };
      return;
    }
    this.info.live.fps = safeFps;
    this.info.live.frameTime = 1000 / Math.max(safeFps, 1);
    this.info.live.timestamp = Date.now();
    if (typeof avg === 'number' && Number.isFinite(avg)) {
      this.info.live.cpuUsage = undefined;
    }
  }

  private getPhysicalScreenPixels(): { width: number; height: number; pixelRatio: number } {
    const visualScale = (window as any).visualViewport?.scale || 1;
    const pixelRatio = (window.devicePixelRatio || 1) * visualScale;
    const width = Math.round(Math.max(screen.width, screen.height) * pixelRatio);
    const height = Math.round(Math.min(screen.width, screen.height) * pixelRatio);
    return { width, height, pixelRatio };
  }

  /**
   * Apply a network measurement to both network and live info objects.
   */
  private applyNetworkSample(sample: { downMbps?: number; uploadMbps?: number; latency?: number; jitter?: number; measured?: boolean }) {
    const { downMbps, uploadMbps, latency, jitter, measured = true } = sample;

    if (Number.isFinite(downMbps)) {
      this.networkSpeed = downMbps!;
    }
    if (Number.isFinite(uploadMbps)) {
      this.uploadSpeed = uploadMbps!;
    }
    if (Number.isFinite(latency)) {
      this.latency = latency!;
    }
    if (Number.isFinite(jitter)) {
      this.latencyJitter = jitter!;
    }

    if (!this.info.network) {
      this.info.network = {
        type: 'unknown',
        effectiveType: '4g',
        downlink: 0,
        rtt: 0,
        saveData: false,
        ip: this.geoIpCache.ip,
        location: this.geoIpCache.location,
        isp: this.geoIpCache.isp,
        measuredDownlink: 0,
        measuredUpload: 0,
        jitter: 0,
        testTimestamp: Date.now()
      };
    }

    const net = this.info.network!;
    if (Number.isFinite(this.networkSpeed)) {
      net.measuredDownlink = this.networkSpeed;
      net.downlink = net.downlink || this.networkSpeed;
      net.effectiveType = this.deriveEffectiveTypeFromSpeed(this.networkSpeed, net.effectiveType);
    }
    if (Number.isFinite(this.uploadSpeed)) {
      net.measuredUpload = this.uploadSpeed;
    }
    if (Number.isFinite(this.latency)) {
      net.rtt = this.latency;
    }
    if (Number.isFinite(this.latencyJitter)) {
      net.jitter = this.latencyJitter;
    }
    if (measured) {
      net.testTimestamp = Date.now();
    }

    if (!this.info.live) {
      this.info.live = {
        fps: this.fps,
        frameTime: 1000 / Math.max(this.fps, 1),
        networkSpeed: 0,
        uploadSpeed: 0,
        latency: 0,
        jitter: 0,
        timestamp: Date.now(),
      };
    }

    this.info.live.networkSpeed = this.networkSpeed;
    this.info.live.uploadSpeed = this.uploadSpeed;
    this.info.live.latency = this.latency;
    this.info.live.jitter = this.latencyJitter;
    this.info.live.timestamp = Date.now();
  }

  private matchesScreen(specW: number, specH: number, w: number, h: number): boolean {
    const tol = 3; // iOS can be off by 1-2px due to rounding/zoom
    const direct = Math.abs(specW - w) <= tol && Math.abs(specH - h) <= tol;
    const swapped = Math.abs(specW - h) <= tol && Math.abs(specH - w) <= tol;
    return direct || swapped;
  }

  private resolveAppleSpec(cpuName: string, ua: string): { deviceId: string; spec: DeviceSpec } | null {
    if (!/iPhone|iPad|iPod/i.test(ua)) return null;
    const { width, height } = this.getPhysicalScreenPixels();
    const prefix = /iPad/i.test(ua) ? 'iPad' : 'iPhone';

    const candidates = Object.entries(DEVICE_DATABASE).filter(([key, spec]) => {
      if (!key.startsWith(prefix)) return false;
      if (!spec.screenWidth || !spec.screenHeight) return false;
      return this.matchesScreen(spec.screenWidth, spec.screenHeight, width, height);
    });
    if (!candidates.length) return null;

    const normalizedCpu = (cpuName || '').toLowerCase();
    const hasSpecificAppleChip =
      normalizedCpu.includes('apple a') ||
      normalizedCpu.includes('apple m') ||
      normalizedCpu.includes('a18') ||
      normalizedCpu.includes('a17') ||
      normalizedCpu.includes('a16') ||
      normalizedCpu.includes('a15') ||
      normalizedCpu.includes('a14') ||
      normalizedCpu.includes('a13');

    let filtered = candidates;
    if (hasSpecificAppleChip) {
      filtered = candidates.filter(([, spec]) => spec.cpu.toLowerCase() === normalizedCpu);
      if (!filtered.length) {
        filtered = candidates.filter(([, spec]) => spec.cpu.toLowerCase().includes(normalizedCpu));
      }
    }

    // Choose conservatively when uncertain: prefer lower RAM, then newer year.
    filtered.sort((a, b) => (a[1].ram - b[1].ram) || ((b[1].year || 0) - (a[1].year || 0)));
    const [deviceId, spec] = filtered[0] || candidates[0]!;
    return { deviceId, spec };
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
    if (/apple m1/i.test(gpuRenderer)) return { name: 'Apple M1', threads: 8 };
    // IMPORTANT: iOS often reports a generic "Apple GPU" renderer; do not mislabel this as an M-series chip.
    if (/apple gpu/i.test(gpuRenderer)) {
      if (/iPhone|iPad|iPod/i.test(ua)) {
        return { name: 'Apple A-Series', threads: Math.max(cores, 6) };
      }
      return { name: 'Apple Silicon', threads: Math.max(cores, 8) };
    }
    
    // Check for A-series chips (iPhone/iPad)
    if (/apple a18 pro/i.test(gpuRenderer)) return { name: 'Apple A18 Pro', threads: 6 };
    if (/apple a18/i.test(gpuRenderer)) return { name: 'Apple A18', threads: 6 };
    if (/apple a17 pro/i.test(gpuRenderer)) return { name: 'Apple A17 Pro', threads: 6 };
    if (/apple a16/i.test(gpuRenderer)) return { name: 'Apple A16 Bionic', threads: 6 };
    if (/apple a15/i.test(gpuRenderer)) return { name: 'Apple A15 Bionic', threads: 6 };
    if (/apple a14/i.test(gpuRenderer)) return { name: 'Apple A14 Bionic', threads: 6 };
    if (/apple a13/i.test(gpuRenderer)) return { name: 'Apple A13 Bionic', threads: 6 };
    if (/apple a12/i.test(gpuRenderer)) return { name: 'Apple A12 Bionic', threads: 6 };
    
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
    const reportedCores = navigator.hardwareConcurrency || 4;
    let effectiveCores = reportedCores;
    
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
    const deviceMemoryApi =
      typeof (navigator as any).deviceMemory === 'number' ? (navigator as any).deviceMemory : undefined;
    let estimatedMemoryGb = deviceMemoryApi ?? 4;
    const jsMemory = (performance as any).memory;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      }
    }

    // Detect CPU name based on cores + GPU renderer context
    let cpuInfo = this.detectCPU(reportedCores, ua, renderer);

    // Resolve Apple iPhone/iPad model via screen pixels + chip hint.
    // This fixes iOS Safari where navigator.deviceMemory is unavailable and WebGL often reports generic "Apple GPU".
    const appleResolved = this.resolveAppleSpec(cpuInfo.name, ua);
    if (appleResolved) {
      const { deviceId, spec } = appleResolved;
      this.info.device = {
        ...(this.info.device || ({} as any)),
        manufacturer: 'Apple',
        model: spec.model,
        deviceId,
        year: spec.year,
      };
      estimatedMemoryGb = spec.ram;
      cpuInfo = { name: spec.cpu, threads: spec.cpuCores };
      // iOS core counts can be misleading; use known cores when we have the device spec.
      if ((this.info.device as any)?.os === 'iOS') {
        effectiveCores = spec.cpuCores;
      }
      architecture = 'ARM64';
    }

    // Get real RAM from device database or estimate
    let realRam = estimatedMemoryGb;
    const dbDevice = this.lookupDevice(ua);
    if (dbDevice?.ram) {
      realRam = dbDevice.ram;
    } else if (this.info.device?.type === 'desktop') {
      // For desktops, multiply by detected cores ratio for better estimate
      if (reportedCores >= 16) realRam = Math.max(realRam, 32);
      else if (reportedCores >= 12) realRam = Math.max(realRam, 16);
      else if (reportedCores >= 8) realRam = Math.max(realRam, 16);
      else if (reportedCores >= 6) realRam = Math.max(realRam, 8);
    }

    // GPU tier scoring uses real RAM when available (helps iOS where deviceMemory is missing)
    const gpuInfo = this.classifyGpuTier(renderer, vendor, realRam);

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
        cores: effectiveCores, 
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
            type: estimatedTotal >= 512 ? 'NVMe SSD' : estimatedTotal >= 256 ? 'SSD' : 'Storage',
          };
        }

        // Cache/App usage snapshot for panels
        const cacheUsageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
        const cacheQuotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;
        this.info.app = {
          ...(this.info.app || {}),
          cacheUsageMB,
          cacheQuotaMB,
        };
      }
    } catch (error) {
      console.warn('[DeviceMonitor] Storage detection failed:', error);
    }
  }

  /**
   * Detect network information
   */
  private async detectNetwork(options: { includeGeoIp: boolean; timeoutMs: number }): Promise<void> {
    const connection = (navigator as any).connection || {};

    const type = connection.type || 'unknown';
    const effectiveType = connection.effectiveType || '4g';
    const downlink = connection.downlink || connection.downlinkMax || this.networkSpeed || 0;
    const rtt = connection.rtt || 0;
    const saveData = connection.saveData || false;

    if (options.includeGeoIp) {
      if (!this.geoIpPromise) {
        this.geoIpPromise = (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs);
            const response = await fetch('https://ipapi.co/json/', { signal: controller.signal, cache: 'no-store' });
            window.clearTimeout(timeoutId);
            const data = await response.json();
            this.geoIpCache.ip = data.ip || this.geoIpCache.ip;
            this.geoIpCache.location =
              `${data.city || ''}, ${data.country_name || ''}`.trim() || this.geoIpCache.location;
            this.geoIpCache.isp = data.org || this.geoIpCache.isp;
          } catch (error) {
            // Ignore - keep Unknown values.
          } finally {
            this.geoIpPromise = null;
          }
        })();
      }
      await this.geoIpPromise;
    }

    // Keep live stats in sync even when speed test isn't running.
    this.networkSpeed = downlink || this.networkSpeed;
    this.latency = rtt || this.latency;

    this.info.network = {
      type,
      effectiveType,
      downlink,
      rtt,
      saveData,
      ip: this.geoIpCache.ip,
      location: this.geoIpCache.location,
      isp: this.geoIpCache.isp,
      measuredDownlink: downlink,
      measuredUpload: 0,
      jitter: 0,
      testTimestamp: Date.now()
    };

    this.applyNetworkSample({ downMbps: downlink || this.networkSpeed, uploadMbps: this.uploadSpeed, latency: this.latency, jitter: this.latencyJitter, measured: false });
  }

  /**
   * Keep network info fresh when the connection changes or the tab comes online.
   */
  private installNetworkListeners(): void {
    if (this.networkListenersInstalled || typeof window === 'undefined') return;
    const connection = (navigator as any).connection;
    const handler = () => {
      void this.detectNetwork({ includeGeoIp: false, timeoutMs: 0 });
    };
    if (connection?.addEventListener) {
      connection.addEventListener('change', handler);
    }
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    this.networkListenersInstalled = true;
  }

  /**
   * Periodically check cache usage/session age and refresh if bloated.
   * Does NOT clear localStorage/cookies, so logins remain.
   */
  private startAutoRefreshCheck(intervalMs = 60_000, options: { maxCacheMB?: number; maxSessionMinutes?: number } = {}) {
    if (this.autoRefreshIntervalId !== null || typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const maxCacheMB = options.maxCacheMB ?? 512; // soft cap for app cache
    const maxSessionMinutes = options.maxSessionMinutes ?? 12 * 60; // 12h session cap
    const minReloadGapMs = 30 * 60 * 1000; // don't auto-reload more than once per 30m

    const check = async () => {
      try {
        const now = Date.now();
        const last = Number(sessionStorage.getItem('bm_last_auto_refresh') || 0);
        if (now - last < minReloadGapMs) return;

        let usageMB = 0;
        let quotaMB = 0;

        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const usage = estimate.usage || 0;
          const quota = estimate.quota || 0;
          usageMB = Math.round((usage / 1024 / 1024) * 100) / 100;
          quotaMB = Math.round((quota / 1024 / 1024) * 100) / 100;

          // Update app cache snapshot for panels
          this.info.app = {
            ...(this.info.app || {}),
            cacheUsageMB: usageMB,
            cacheQuotaMB: quotaMB,
          };
        }

        const sessionMinutes = (now - this.sessionStart) / 60000;
        const cacheBloated = usageMB > maxCacheMB;
        const sessionTooLong = sessionMinutes > maxSessionMinutes;

        if (cacheBloated || sessionTooLong) {
          sessionStorage.setItem('bm_last_auto_refresh', String(now));
          try {
            if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
          } catch {
            // ignore cache clear failures
          }
          // Keep auth/localStorage intact; just reload.
          window.location.reload();
        }
      } catch (err) {
        console.warn('[DeviceMonitor] auto refresh check failed', err);
      }
    };

    this.autoRefreshIntervalId = window.setInterval(check, Math.max(15_000, intervalMs));
    void check();
  }

  /**
   * Lightweight live network probe (tiny payload) every second.
   * Keeps download/upload/latency fresh without heavy bandwidth use.
   */
  private startLiveNetworkProbe(intervalMs = 1000): void {
    if (this.liveNetworkIntervalId !== null || typeof window === 'undefined') return;

    const probe = async () => {
      try {
        if (this.info.network?.saveData) return;

        const bytes = 16000; // 16KB - tiny payload for live sampling
        const downUrl = `https://speed.cloudflare.com/__down?bytes=${bytes}&ts=${Date.now()}`;
        const start = performance.now();
        const response = await fetch(downUrl, { cache: 'no-store' });

        let downloaded = 0;
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            downloaded += value?.length || 0;
          }
        } else {
          const buf = await response.arrayBuffer();
          downloaded = buf.byteLength || bytes;
        }

        const elapsed = Math.max(performance.now() - start, 1);
        const downMbps = Math.round((((downloaded * 8) / (elapsed / 1000)) / 1_000_000) * 100) / 100;

        // Quick latency probe (HEAD)
        let latency = this.latency || 0;
        try {
          const latencyStart = performance.now();
          await fetch('https://speed.cloudflare.com/__down?bytes=1', { method: 'HEAD', cache: 'no-store' });
          latency = Math.round(performance.now() - latencyStart);
        } catch (e) {
          // Ignore latency failure
        }

        // Occasional small upload (every 5s) to keep upload current
        let uploadMbps = this.uploadSpeed;
        this.liveProbeCounter = (this.liveProbeCounter + 1) % 5;
        if (this.liveProbeCounter === 0) {
          const uploadBytes = 12000;
          const upStart = performance.now();
          await fetch(`https://speed.cloudflare.com/__up?ts=${Date.now()}`, {
            method: 'POST',
            cache: 'no-store',
            mode: 'cors',
            body: new Uint8Array(uploadBytes)
          });
          const upElapsed = Math.max(performance.now() - upStart, 1);
          uploadMbps = Math.round((((uploadBytes * 8) / (upElapsed / 1000)) / 1_000_000) * 100) / 100;
        }

        const jitter = Math.abs(latency - (this.latency || latency));
        this.applyNetworkSample({ downMbps, uploadMbps, latency, jitter, measured: true });
      } catch (error) {
        // keep silent; this is best-effort
      }
    };

    void probe();
    this.liveNetworkIntervalId = window.setInterval(probe, Math.max(500, intervalMs));
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
    const visualScale = (window as any).visualViewport?.scale || 1;
    const pixelRatio = (window.devicePixelRatio || 1) * visualScale;
    
    // Physical screen dimensions (using screen API with pixel ratio)
    let physicalWidth = Math.round(Math.max(screen.width, screen.height) * pixelRatio);
    let physicalHeight = Math.round(Math.min(screen.width, screen.height) * pixelRatio);
    
    // Also check screen.availWidth/availHeight for desktop
    const screenW = screen.width;
    const screenH = screen.height;
    
    // Try to get actual device resolution from database (prefer resolved deviceId)
    const resolvedId = this.info.device?.deviceId;
    const dbDevice =
      (resolvedId && DEVICE_DATABASE[resolvedId]) ? DEVICE_DATABASE[resolvedId] : this.lookupDevice(ua);
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
    
    // Detect refresh rate (prefer Screen API, fallback to heuristics)
    let refreshRate: number | undefined;
    if (typeof (window.screen as any)?.refreshRate === 'number') {
      refreshRate = Math.min((window.screen as any).refreshRate, 240);
    } else if (dbDevice) {
      const modelName = (dbDevice.model || '').toLowerCase();
      const isApple = dbDevice.manufacturer.toLowerCase() === 'apple';
      if (isApple) {
        // Apple: iPhone Pro/Pro Max + iPad Pro are 120Hz, most others are 60Hz.
        if (modelName.includes('pro') || modelName.includes('ipad pro')) refreshRate = 120;
        else refreshRate = 60;
      } else {
        // Android flagship heuristic by year.
        if (dbDevice.year >= 2022) refreshRate = 120;
        else if (dbDevice.year >= 2020) refreshRate = 90;
        else refreshRate = 60;
      }
    } else if (this.info.device?.type === 'desktop') {
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
    const resizeHandler = () => {
      if (this.info.screen) {
        this.info.screen.viewportWidth = window.innerWidth;
        this.info.screen.viewportHeight = window.innerHeight;
        this.info.screen.orientation = this.info.screen.physicalWidth > this.info.screen.physicalHeight ? 'landscape' : 'portrait';
      }
    };
    window.addEventListener('resize', resizeHandler);
    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', resizeHandler);
      (window as any).visualViewport.addEventListener('scroll', resizeHandler);
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    if (this.fpsRafId !== null) return;
    let lastTime = performance.now();

    const measureFPS = (timestamp: number) => {
      // If UnifiedPerformance is feeding FPS, don't run a second RAF loop.
      if (this.externalFpsLastUpdated && Date.now() - this.externalFpsLastUpdated < 1500) {
        this.fpsRafId = null;
        return;
      }

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

      this.fpsRafId = requestAnimationFrame(measureFPS);
    };

    this.fpsRafId = requestAnimationFrame(measureFPS);
  }

  /**
   * Start network speed test
   */
  private async startNetworkSpeedTest(): Promise<void> {
    if (this.networkTestIntervalId !== null) return;
    const pingUrl = 'https://speed.cloudflare.com/__down?bytes=64';
    // Keep payloads smaller; this is a background signal, not a benchmark.
    const downUrl = 'https://speed.cloudflare.com/__down?bytes=750000';
    const upUrl = 'https://speed.cloudflare.com/__up';

    const test = async () => {
      try {
        // Respect user data saver where possible
        if (this.info.network?.saveData) return;

        const latencyProbe = this.measureLatency(pingUrl);
        const downloadProbe = this.measureDownloadSpeed(`${downUrl}&ts=${Date.now()}`);
        const uploadProbe = this.measureUploadSpeed(`${upUrl}?ts=${Date.now()}`, 200000);

        const [{ latency, jitter }, measuredSpeed, measuredUpload] = await Promise.all([
          latencyProbe,
          downloadProbe,
          uploadProbe
        ]);

        this.applyNetworkSample({ downMbps: measuredSpeed, uploadMbps: measuredUpload, latency, jitter, measured: true });
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
    this.networkTestIntervalId = window.setInterval(test, 60000);
  }

  /**
   * Manual/quick speed test for UI triggers.
   */
  async runSpeedTest(options: { downloadBytes?: number; uploadBytes?: number; latencySamples?: number; quick?: boolean } = {}) {
    const downloadBytes = options.downloadBytes ?? (options.quick ? 200_000 : 750_000);
    const uploadBytes = options.uploadBytes ?? (options.quick ? 120_000 : 300_000);
    const latencySamples = options.latencySamples ?? 3;

    const pingUrl = 'https://speed.cloudflare.com/__down?bytes=64';
    const downUrl = `https://speed.cloudflare.com/__down?bytes=${downloadBytes}&ts=${Date.now()}`;
    const upUrl = `https://speed.cloudflare.com/__up?ts=${Date.now()}`;

    const [{ latency, jitter }, downMbps, upMbps] = await Promise.all([
      this.measureLatency(pingUrl, latencySamples),
      this.measureDownloadSpeed(downUrl),
      this.measureUploadSpeed(upUrl, uploadBytes)
    ]);

    this.applyNetworkSample({ downMbps, uploadMbps: upMbps, latency, jitter, measured: true });

    return {
      downMbps,
      upMbps,
      latency,
      jitter,
      timestamp: Date.now()
    };
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
    // Ensure light init is at least started; never block callers.
    if (this.initLevel === 'none' && typeof window !== 'undefined') {
      void this.start('light');
    }

    const fallbackDeviceType: 'mobile' | 'tablet' | 'desktop' =
      typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';

    const device = this.info.device || {
      type: fallbackDeviceType,
      model: 'Unknown',
      manufacturer: 'Unknown',
      os: 'Unknown',
      osVersion: '',
      browser: 'Unknown',
      browserVersion: '',
      deviceId: undefined,
      year: undefined,
    };

    const memoryFallback =
      typeof (navigator as any).deviceMemory === 'number' ? (navigator as any).deviceMemory : 4;
    const coresFallback = navigator.hardwareConcurrency || 4;

    const performance = this.info.performance || {
      cpu: {
        name: 'Unknown',
        cores: coresFallback,
        threads: coresFallback,
        architecture: 'unknown',
      },
      gpu: {
        vendor: 'Unknown',
        renderer: 'Unknown',
        tier: 'medium' as const,
        score: 50,
      },
      memory: {
        total: memoryFallback,
        used: 0,
        limit: 0,
        percentage: 0,
        type: memoryFallback >= 16 ? 'DDR5' : memoryFallback >= 8 ? 'DDR4' : 'DDR4/LPDDR',
      },
    };

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

    // If network info is still missing, kick off a geo/IP refresh in the background.
    if (typeof window !== 'undefined' && network.ip === 'Unknown') {
      void this.detectNetwork({ includeGeoIp: true, timeoutMs: 900 });
    }

    // Ensure the latest latency is reflected in the network payload
    network.rtt = this.latency || network.rtt;
    network.measuredDownlink = this.networkSpeed || network.measuredDownlink || network.downlink;
    network.measuredUpload = this.uploadSpeed || network.measuredUpload || 0;
    network.jitter = this.latencyJitter || network.jitter || 0;

    const screenInfo =
      this.info.screen ||
      (() => {
        if (typeof window === 'undefined') {
          return {
            physicalWidth: 0,
            physicalHeight: 0,
            viewportWidth: 0,
            viewportHeight: 0,
            orientation: 'portrait' as const,
            pixelRatio: 1,
            colorDepth: 24,
            touchSupport: false,
          };
        }
        const { width, height, pixelRatio } = this.getPhysicalScreenPixels();
        return {
          physicalWidth: width,
          physicalHeight: height,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          orientation: width > height ? 'landscape' as const : 'portrait' as const,
          pixelRatio,
          colorDepth: screen.colorDepth || 24,
          refreshRate: typeof (window.screen as any)?.refreshRate === 'number' ? (window.screen as any).refreshRate : undefined,
          hdr: typeof window.matchMedia === 'function' ? window.matchMedia('(dynamic-range: high)').matches : undefined,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        };
      })();

    const battery = this.info.battery || {
      level: -1,
      charging: false,
      chargingTime: -1,
      dischargingTime: -1,
    };

    // App/build/session info
    const buildId = (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.buildId) || undefined;
    const sessionMs = Date.now() - this.sessionStart;
    const dataUsage = this.getDataUsage();
    const app = {
      ...(this.info.app || {}),
      buildId,
      sessionMs,
      sessionStart: this.sessionStart,
      dataUsageMB: dataUsage.sessionMB,
      dataTotalMB: dataUsage.totalMB,
    };

    return {
      device,
      performance,
      network,
      battery,
      screen: screenInfo,
      app,
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
