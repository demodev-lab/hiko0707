export class LocalStorage {
  private static instance: LocalStorage
  private prefix = 'hiko_'

  static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage()
    }
    return LocalStorage.instance
  }

  set<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `${this.prefix}${key}`, 
          JSON.stringify(value)
        )
      }
    } catch (error) {
      console.error('LocalStorage set error:', error)
    }
  }

  get<T>(key: string): T | null {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(`${this.prefix}${key}`)
        return item ? JSON.parse(item) : null
      }
      return null
    } catch (error) {
      console.error('LocalStorage get error:', error)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${this.prefix}${key}`)
    }
  }

  clear(): void {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key))
    }
  }
}

// Export singleton instance
export const storage = LocalStorage.getInstance()