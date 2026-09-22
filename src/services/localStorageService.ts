const STUDENT_ID_HISTORY_KEY = 'student_id_history';
const MAX_HISTORY_ITEMS = 10;

export class LocalStorageService {
  static getStudentIdHistory(): string[] {
    try {
      const history = localStorage.getItem(STUDENT_ID_HISTORY_KEY);
      if (!history) return [];
      const parsed: unknown = JSON.parse(history);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  static addStudentIdToHistory(studentId: string): void {
    const history = this.getStudentIdHistory();
    const filteredHistory = history.filter(id => id !== studentId);
    const newHistory = [studentId, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    try {
      localStorage.setItem(STUDENT_ID_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save student ID history:', error);
    }
  }

  static removeFromHistory(studentId: string): void {
    const history = this.getStudentIdHistory();
    const newHistory = history.filter(id => id !== studentId);
    
    try {
      localStorage.setItem(STUDENT_ID_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  }
}
