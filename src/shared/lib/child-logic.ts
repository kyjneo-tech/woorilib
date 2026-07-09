/**
 * Child Logic Utility
 * Centralized logic for age and developmental stage calculations.
 */

import { AGE_GROUPS } from '../config/constants';

/**
 * Calculates age in total months.
 * Preferred for detailed curation logic.
 */
export function calculateAgeMonths(birthDate: string | Date | number): number {
  const now = new Date();
  let birth: Date;

  if (typeof birthDate === 'number') {
    // If only birth year is provided
    return (now.getFullYear() - birthDate) * 12 + (now.getMonth() + 1);
  }

  birth = new Date(birthDate);
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  
  let totalMonths = years * 12 + months;
  
  // If birthday hasn't happened yet this month, we might want to be more precise
  // but for curation, monthly unit is usually sufficient.
  return totalMonths < 0 ? 0 : totalMonths;
}

/**
 * Calculates international age (man-nai)
 */
export function calculateAge(birthDate: string | Date): number {
  const now = new Date();
  const birth = new Date(birthDate);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }

  return age < 0 ? 0 : age;
}

/**
 * Calculates Korean style age (se-neun-nai)
 */
export function calculateKoreanAge(birthDate: string | Date | number): number {
  const now = new Date();
  const birthYear = typeof birthDate === 'number' 
    ? birthDate 
    : new Date(birthDate).getFullYear();
    
  return now.getFullYear() - birthYear + 1;
}

/**
 * Maps age/months to service-standard age groups
 */
export function getAgeGroupLabel(birthDate: string | Date | number): string {
  const months = calculateAgeMonths(birthDate);
  const age = Math.floor(months / 12);

  if (age < 1) return '영아';
  if (age < 3) return '영아';
  if (age < 5) return '유아';
  if (age < 7) return '취학 전';
  if (age < 10) return '초등 저학년';
  if (age < 13) return '초등 고학년';
  return '중학생 이상';
}

/**
 * Maps months to AgeGroupId used in config
 */
export function getAgeGroupId(months: number): string {
  if (months < 24) return '0-2';
  if (months < 48) return '3-4';
  if (months < 72) return '5-6';
  return '7+';
}
