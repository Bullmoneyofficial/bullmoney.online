// Auto-extracted from UltimateHub for modular structure
export function calculate3DPerformanceScore(fps: number, memoryPercentage: number, gpuScore: number, cores: number): number {
  let score = 0;
  
  // GPU tier (40 points)
  score += Math.min(40, Math.round((gpuScore / 100) * 40));
  
  // FPS (30 points)
  if (fps >= 60) score += 30;
  else if (fps >= 45) score += 20;
  else if (fps >= 30) score += 10;
  else score += 5;
  
  // Memory (20 points)
  if (memoryPercentage < 50) score += 20;
  else if (memoryPercentage < 70) score += 15;
  else if (memoryPercentage < 85) score += 10;
  else score += 5;
  
  // CPU cores (10 points)
  if (cores >= 8) score += 10;
  else if (cores >= 4) score += 7;
  else score += 3;
  
  return Math.min(100, score);
}

/**
 * Get Performance Grade from Score
 */
export function getPerformanceGrade(score: number): { grade: string; color: string; label: string } {
  if (score >= 90) return { grade: 'S', color: '#000000', label: 'Excellent' };
  if (score >= 80) return { grade: 'A', color: '#000000', label: 'Great' };
  if (score >= 70) return { grade: 'B', color: '#000000', label: 'Good' };
  if (score >= 60) return { grade: 'C', color: '#f59e0b', label: 'Fair' };
  if (score >= 50) return { grade: 'D', color: '#dc2626', label: 'Poor' };
  return { grade: 'F', color: '#dc2626', label: 'Critical' };
}

