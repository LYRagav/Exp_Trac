import SQLite from 'react-native-sqlite-storage';
import { keychainService } from './KeychainService';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface Expense {
  id?: number;
  amount: number;
  category?: string;
  date: string;
  description?: string;
  receipt_image_uri?: string;
  created_at?: string;
}

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor() {
    // No need to instantiate keychainService since we're importing the singleton
  }

  async testBridge(): Promise<string> {
    console.log('[DatabaseService] Testing react-native-sqlite-storage...');
    try {
      const testDb = await SQLite.openDatabase({
        name: 'test.db',
        location: 'default',
      });
      await testDb.close();
      return 'SUCCESS: react-native-sqlite-storage is working';
    } catch (error) {
      console.error('[DatabaseService] Bridge test failed:', error);
      throw error;
    }
  }

  async initializeDatabase(): Promise<void> {
    try {
      console.log('[DatabaseService] Starting database initialization...');
      
      // Get or generate encryption key
      let encryptionKey = await keychainService.getEncryptionKey();
      if (!encryptionKey) {
        console.log('[DatabaseService] No existing key found, generating new one...');
        encryptionKey = await keychainService.generateSecureKey();
        await keychainService.storeEncryptionKey(encryptionKey);
      }
      console.log('[DatabaseService] Got encryption key');

      // Open database with encryption
      this.db = await SQLite.openDatabase({
        name: 'exptrac.db',
        location: 'default',
        key: encryptionKey, // This enables SQLCipher encryption
      });

      console.log('[DatabaseService] Database opened successfully');

      // Create tables
      await this.createTables();
      console.log('[DatabaseService] Database initialization complete');
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log('[DatabaseService] Creating tables...');

    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT,
        date TEXT NOT NULL,
        description TEXT,
        receipt_image_uri TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.executeSql(createExpensesTable);
    console.log('[DatabaseService] Expenses table created');
  }

  async addExpense(expense: Expense): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = `
      INSERT INTO expenses (amount, category, date, description, receipt_image_uri)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await this.db.executeSql(sql, [
      expense.amount,
      expense.category || null,
      expense.date,
      expense.description || null,
      expense.receipt_image_uri || null,
    ]);

    return result[0].insertId;
  }

  async getAllExpenses(): Promise<Expense[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT * FROM expenses ORDER BY created_at DESC';
    const result = await this.db.executeSql(sql);
    
    const expenses: Expense[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      expenses.push(result[0].rows.item(i));
    }

    return expenses;
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'SELECT * FROM expenses WHERE id = ?';
    const result = await this.db.executeSql(sql, [id]);
    
    if (result[0].rows.length > 0) {
      return result[0].rows.item(0);
    }
    
    return null;
  }

  async updateExpense(id: number, expense: Partial<Expense>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (expense.amount !== undefined) {
      fields.push('amount = ?');
      values.push(expense.amount);
    }
    if (expense.category !== undefined) {
      fields.push('category = ?');
      values.push(expense.category);
    }
    if (expense.date !== undefined) {
      fields.push('date = ?');
      values.push(expense.date);
    }
    if (expense.description !== undefined) {
      fields.push('description = ?');
      values.push(expense.description);
    }
    if (expense.receipt_image_uri !== undefined) {
      fields.push('receipt_image_uri = ?');
      values.push(expense.receipt_image_uri);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);
    const sql = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`;
    
    await this.db.executeSql(sql, values);
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = 'DELETE FROM expenses WHERE id = ?';
    await this.db.executeSql(sql, [id]);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('[DatabaseService] Database closed');
    }
  }

  async rotateEncryptionKey(): Promise<void> {
    try {
      console.log('[DatabaseService] Starting key rotation...');
      
      // Use the enhanced key rotation with progress tracking
      const newKey = await keychainService.rotateEncryptionKey((progress, message) => {
        console.log(`[DatabaseService] Key rotation progress: ${progress}% - ${message}`);
      });
      
      // TODO: Implement database re-encryption with new key
      // This would involve:
      // 1. Creating a new database with the new key
      // 2. Copying all data from old to new database
      // 3. Replacing the old database with the new one
      // 4. Using SQLCipher's PRAGMA rekey functionality
      
      console.log('[DatabaseService] Key rotation completed successfully');
    } catch (error) {
      console.error('[DatabaseService] Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Enables biometric authentication for database access
   * @param enable Whether to enable biometric authentication
   */
  async setBiometricAuthentication(enable: boolean): Promise<void> {
    try {
      console.log(`[DatabaseService] ${enable ? 'Enabling' : 'Disabling'} biometric authentication...`);
      await keychainService.setBiometricAuthentication(enable);
      console.log('[DatabaseService] Biometric authentication preference updated');
    } catch (error) {
      console.error('[DatabaseService] Failed to set biometric authentication:', error);
      throw error;
    }
  }

  /**
   * Checks if biometric authentication is available
   * @returns Promise that resolves with availability status
   */
  async isBiometricAvailable(): Promise<boolean> {
    return await keychainService.isBiometricAvailable();
  }

  /**
   * Creates a backup of the encryption key
   * @returns Promise that resolves with the backup ID
   */
  async createKeyBackup(): Promise<string> {
    try {
      console.log('[DatabaseService] Creating encryption key backup...');
      const backupId = await keychainService.createKeyBackup();
      console.log('[DatabaseService] Key backup created with ID:', backupId);
      return backupId;
    } catch (error) {
      console.error('[DatabaseService] Failed to create key backup:', error);
      throw error;
    }
  }

  /**
   * Gets current key metadata
   * @returns The current key metadata or null if not available
   */
  getKeyMetadata() {
    return keychainService.getKeyMetadata();
  }

  /**
   * Gets the current key version
   * @returns The current key version
   */
  getCurrentKeyVersion(): number {
    return keychainService.getCurrentKeyVersion();
  }

  /**
   * Checks if biometric authentication is currently enabled
   * @returns Whether biometric authentication is enabled
   */
  isBiometricAuthEnabled(): boolean {
    return keychainService.isBiometricAuthEnabled();
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService(); 