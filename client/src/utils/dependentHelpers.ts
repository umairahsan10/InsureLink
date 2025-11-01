import { Dependent } from '@/types/dependent';

/**
 * Get all dependents from localStorage
 */
export function getDependentsFromStorage(): Dependent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('insurelink_dependents');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading dependents from storage:', error);
    return [];
  }
}

/**
 * Save dependents to localStorage
 */
export function saveDependentsToStorage(dependents: Dependent[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('insurelink_dependents', JSON.stringify(dependents));
  } catch (error) {
    console.error('Error saving dependents to storage:', error);
  }
}

/**
 * Get dependents for a specific employee
 */
export function getDependentsByEmployee(employeeId: string): Dependent[] {
  const dependents = getDependentsFromStorage();
  return dependents.filter(dep => dep.employeeId === employeeId);
}

/**
 * Get pending dependent requests for a corporate
 */
export function getPendingDependentRequests(corporateId: string): Dependent[] {
  const dependents = getDependentsFromStorage();
  return dependents.filter(
    dep => dep.corporateId === corporateId && dep.status === 'Pending'
  );
}

/**
 * Get approved dependents for an employee
 */
export function getApprovedDependents(employeeId: string): Dependent[] {
  const dependents = getDependentsFromStorage();
  return dependents.filter(
    dep => dep.employeeId === employeeId && dep.status === 'Approved'
  );
}

/**
 * Add a new dependent request
 */
export function addDependentRequest(dependent: Dependent): void {
  const dependents = getDependentsFromStorage();
  dependents.push(dependent);
  saveDependentsToStorage(dependents);
}

/**
 * Approve a dependent request
 */
export function approveDependentRequest(
  dependentId: string,
  reviewerName: string
): void {
  const dependents = getDependentsFromStorage();
  const index = dependents.findIndex(dep => dep.id === dependentId);
  
  if (index !== -1) {
    dependents[index].status = 'Approved';
    dependents[index].reviewedAt = new Date().toISOString();
    dependents[index].reviewedBy = reviewerName;
    saveDependentsToStorage(dependents);
  }
}

/**
 * Reject a dependent request
 */
export function rejectDependentRequest(
  dependentId: string,
  reason: string,
  reviewerName: string
): void {
  const dependents = getDependentsFromStorage();
  const index = dependents.findIndex(dep => dep.id === dependentId);
  
  if (index !== -1) {
    dependents[index].status = 'Rejected';
    dependents[index].reviewedAt = new Date().toISOString();
    dependents[index].reviewedBy = reviewerName;
    dependents[index].rejectionReason = reason;
    saveDependentsToStorage(dependents);
  }
}

/**
 * Get dependent count for an employee
 */
export function getDependentCount(employeeId: string): number {
  return getApprovedDependents(employeeId).length;
}

/**
 * Generate unique dependent ID
 */
export function generateDependentId(): string {
  const dependents = getDependentsFromStorage();
  const maxId = dependents.reduce((max, dep) => {
    const num = parseInt(dep.id.split('-')[1]) || 0;
    return num > max ? num : max;
  }, 0);
  return `dep-${String(maxId + 1).padStart(3, '0')}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

