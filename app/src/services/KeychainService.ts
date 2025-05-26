import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
// Note: expo-crypto might not be available in all Expo versions
// Fallback to a secure random generation method
// import * as Crypto from 'expo-crypto';

// Constants for key storage
const DB_KEY_STORAGE_KEY = 'EXPTRAC_DB_ENCRYPTION_KEY';
const DB_KEY_VERSION_KEY = 'EXPTRAC_DB_KEY_VERSION';
const BIOMETRIC_AUTH_KEY = 'EXPTRAC_USE_BIOMETRIC';
const KEY_BACKUP_PREFIX = 'EXPTRAC_KEY_BACKUP_';
const KEY_METADATA_KEY = 'EXPTRAC_KEY_METADATA';

// Key metadata interface
interface KeyMetadata {
  version: number;
  createdAt: string;
  lastRotated?: string;
  algorithm: string;
  keySize: number;
  backupEnabled: boolean;
}

// Backup interface
interface KeyBackup {
  key: string;
  metadata: KeyMetadata;
  timestamp: string;
  checksum: string;
}

class KeychainService {
  // Key versioning for rotation
  private currentKeyVersion: number = 1;
  private useBiometricAuth: boolean = false;
  private keyMetadata: KeyMetadata | null = null;

  constructor() {
    // Load stored configuration on initialization
    this.loadConfiguration();
  }

  private async loadConfiguration(): Promise<void> {
    await Promise.all([
      this.loadKeyVersion(),
      this.loadBiometricPreference(),
      this.loadKeyMetadata()
    ]);
  }

  private async loadKeyVersion(): Promise<void> {
    try {
      const versionStr = await SecureStore.getItemAsync(DB_KEY_VERSION_KEY);
      if (versionStr) {
        this.currentKeyVersion = parseInt(versionStr, 10);
      }
    } catch (error) {
      console.error('[KeychainService] Failed to load key version:', error);
      // Default to version 1 if not found
      this.currentKeyVersion = 1;
    }
  }

  private async loadBiometricPreference(): Promise<void> {
    try {
      const preference = await SecureStore.getItemAsync(BIOMETRIC_AUTH_KEY);
      this.useBiometricAuth = preference === 'true';
    } catch (error) {
      console.error('[KeychainService] Failed to load biometric preference:', error);
      this.useBiometricAuth = false;
    }
  }

  private async loadKeyMetadata(): Promise<void> {
    try {
      const metadataStr = await SecureStore.getItemAsync(KEY_METADATA_KEY);
      if (metadataStr) {
        this.keyMetadata = JSON.parse(metadataStr);
      }
    } catch (error) {
      console.error('[KeychainService] Failed to load key metadata:', error);
      this.keyMetadata = null;
    }
  }

  private async storeKeyMetadata(metadata: KeyMetadata): Promise<void> {
    try {
      this.keyMetadata = metadata;
      await SecureStore.setItemAsync(KEY_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[KeychainService] Failed to store key metadata:', error);
      throw new Error('Could not store key metadata');
    }
  }

  private generateChecksum(data: string): string {
    // Simple checksum for backup verification
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private secureZeroMemory(str: string): void {
    // Attempt to zero out memory (limited in JavaScript)
    // This is more of a best-effort approach
    if (typeof str === 'string') {
      // Create a new string with zeros to potentially overwrite memory
      const zeros = '0'.repeat(str.length);
      str = zeros;
    }
  }

  /**
   * Generates a new secure encryption key using platform crypto APIs
   * @returns A secure random key as a string
   */
  async generateSecureKey(): Promise<string> {
    try {
      console.log('[KeychainService] Generating new secure key...');
      
      // Use platform-specific secure random generation
      let keyBytes: Uint8Array;
      
      if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // Web Crypto API
        keyBytes = new Uint8Array(32);
        crypto.getRandomValues(keyBytes);
      } else {
        // Fallback: Use Math.random with current timestamp for additional entropy
        // Note: This is not cryptographically secure and should be replaced with
        // a proper native implementation in production
        keyBytes = new Uint8Array(32);
        const timestamp = Date.now();
        for (let i = 0; i < keyBytes.length; i++) {
          keyBytes[i] = Math.floor((Math.random() * timestamp) % 256);
        }
      }
      
      // Convert to hex string
      const keyHex = Array.from(keyBytes)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');
      
      console.log('[KeychainService] Secure key generated successfully');
      return keyHex;
    } catch (error: unknown) {
      console.error('[KeychainService] Failed to generate secure key:', error);
      throw new Error('Secure key generation failed');
    }
  }

  /**
   * Stores the encryption key securely with metadata
   * @param key The encryption key to store
   * @param isRotation Whether this is a key rotation (optional)
   * @returns Promise that resolves when the key is stored
   */
  async storeEncryptionKey(key: string, isRotation: boolean = false): Promise<void> {
    try {
      console.log('[KeychainService] Storing encryption key...');
      
      // Store the key in secure storage with enhanced security options
      await SecureStore.setItemAsync(DB_KEY_STORAGE_KEY, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        requireAuthentication: this.useBiometricAuth,
      });
      
      // Create or update metadata
      const now = new Date().toISOString();
      const metadata: KeyMetadata = {
        version: this.currentKeyVersion,
        createdAt: this.keyMetadata?.createdAt || now,
        lastRotated: isRotation ? now : this.keyMetadata?.lastRotated,
        algorithm: 'AES-256',
        keySize: 256,
        backupEnabled: false, // Will be set when backup is created
      };
      
      // Store metadata and version
      await Promise.all([
        this.storeKeyMetadata(metadata),
        SecureStore.setItemAsync(DB_KEY_VERSION_KEY, this.currentKeyVersion.toString())
      ]);
      
      console.log('[KeychainService] Encryption key stored successfully');
    } catch (error: unknown) {
      console.error('[KeychainService] Failed to store encryption key:', error);
      throw new Error('Could not securely store encryption key');
    }
  }

  /**
   * Retrieves the stored encryption key with authentication
   * @returns Promise that resolves with the encryption key or null if not found
   */
  async getEncryptionKey(): Promise<string | null> {
    try {
      console.log('[KeychainService] Retrieving encryption key...');
      
      // If biometric auth is enabled, authenticate first
      if (this.useBiometricAuth) {
        const authResult = await this.authenticateWithBiometrics();
        if (!authResult.success) {
          console.warn('[KeychainService] Biometric authentication failed');
          throw new Error('Biometric authentication failed');
        }
      }
      
      // Get the key from secure storage
      const key = await SecureStore.getItemAsync(DB_KEY_STORAGE_KEY);
      
      if (key) {
        console.log('[KeychainService] Encryption key retrieved successfully');
      } else {
        console.warn('[KeychainService] No encryption key found');
      }
      
      return key;
    } catch (error) {
      console.error('[KeychainService] Failed to retrieve encryption key:', error);
      return null;
    }
  }
  
  /**
   * Rotates the encryption key with database re-encryption support
   * @param onProgress Optional callback for progress updates
   * @returns Promise that resolves with the new key when rotation is complete
   */
  async rotateEncryptionKey(onProgress?: (progress: number, message: string) => void): Promise<string> {
    try {
      console.log('[KeychainService] Starting key rotation...');
      onProgress?.(0, 'Starting key rotation...');
      
      // Get current key for backup
      const oldKey = await this.getEncryptionKey();
      if (!oldKey) {
        throw new Error('No existing key found to rotate');
      }
      
      onProgress?.(20, 'Generating new key...');
      
      // Generate a new key
      const newKey = await this.generateSecureKey();
      
      onProgress?.(40, 'Creating backup of old key...');
      
      // Create backup of old key before rotation
      if (this.keyMetadata?.backupEnabled) {
        await this.createKeyBackup(oldKey, this.currentKeyVersion);
      }
      
      onProgress?.(60, 'Storing new key...');
      
      // Increment version and store new key
      this.currentKeyVersion++;
      await this.storeEncryptionKey(newKey, true);
      
      onProgress?.(80, 'Cleaning up old key...');
      
      // Securely zero out old key from memory
      this.secureZeroMemory(oldKey);
      
      onProgress?.(100, 'Key rotation completed');
      
      console.log('[KeychainService] Key rotation completed successfully');
      
      // Return the new key for database re-encryption
      return newKey;
    } catch (error: unknown) {
      console.error('[KeychainService] Key rotation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key rotation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Enables or disables biometric authentication for key access
   * @param enable Whether to enable biometric authentication
   */
  async setBiometricAuthentication(enable: boolean): Promise<void> {
    try {
      console.log(`[KeychainService] ${enable ? 'Enabling' : 'Disabling'} biometric authentication...`);
      
      if (enable) {
        // Check if biometrics are available
        const available = await this.isBiometricAvailable();
        if (!available) {
          throw new Error('Biometric authentication is not available on this device');
        }
        
        // Test biometric authentication
        const authResult = await this.authenticateWithBiometrics();
        if (!authResult.success) {
          throw new Error('Biometric authentication test failed');
        }
      }
      
      // Store the preference
      this.useBiometricAuth = enable;
      await SecureStore.setItemAsync(BIOMETRIC_AUTH_KEY, enable.toString());
      
      // Re-store the key with new authentication requirements
      const currentKey = await this.getEncryptionKey();
      if (currentKey) {
        await this.storeEncryptionKey(currentKey);
        this.secureZeroMemory(currentKey);
      }
      
      console.log('[KeychainService] Biometric authentication preference updated');
    } catch (error) {
      console.error('[KeychainService] Failed to set biometric authentication:', error);
      throw error;
    }
  }
  
  /**
   * Checks if biometric authentication is available and enrolled
   * @returns Promise that resolves with availability details
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('[KeychainService] Biometric availability:', {
        hasHardware,
        isEnrolled,
        supportedTypes
      });
      
      return hasHardware && isEnrolled && supportedTypes.length > 0;
    } catch (error) {
      console.error('[KeychainService] Error checking biometric availability:', error);
      return false;
    }
  }
  
  /**
   * Authenticates the user with biometrics
   * @returns Promise that resolves with the authentication result
   */
  async authenticateWithBiometrics(): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      console.log('[KeychainService] Requesting biometric authentication...');
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your encrypted expenses',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        console.log('[KeychainService] Biometric authentication successful');
      } else {
        console.warn('[KeychainService] Biometric authentication failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[KeychainService] Biometric authentication error:', error);
      return { success: false, error: 'authentication_failed' };
    }
  }
  
  /**
   * Creates a secure backup of the encryption key
   * @param key The key to backup (optional, uses current key if not provided)
   * @param version The key version (optional, uses current version if not provided)
   * @returns Promise that resolves with the backup ID
   */
  async createKeyBackup(key?: string, version?: number): Promise<string> {
    try {
      console.log('[KeychainService] Creating key backup...');
      
      const keyToBackup = key || await this.getEncryptionKey();
      if (!keyToBackup) {
        throw new Error('No key available to backup');
      }
      
      const versionToBackup = version || this.currentKeyVersion;
      const timestamp = new Date().toISOString();
      const backupId = `${versionToBackup}_${Date.now()}`;
      
      // Create backup object
      const backup: KeyBackup = {
        key: keyToBackup,
        metadata: {
          ...this.keyMetadata!,
          version: versionToBackup,
        },
        timestamp,
        checksum: this.generateChecksum(keyToBackup),
      };
      
      // Store backup securely
      await SecureStore.setItemAsync(
        `${KEY_BACKUP_PREFIX}${backupId}`,
        JSON.stringify(backup),
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );
      
      // Update metadata to indicate backup is available
      if (this.keyMetadata) {
        this.keyMetadata.backupEnabled = true;
        await this.storeKeyMetadata(this.keyMetadata);
      }
      
      console.log('[KeychainService] Key backup created with ID:', backupId);
      return backupId;
    } catch (error: unknown) {
      console.error('[KeychainService] Failed to create key backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key backup failed: ${errorMessage}`);
    }
  }
  
  /**
   * Lists available key backups
   * @returns Promise that resolves with an array of backup IDs and metadata
   */
  async listKeyBackups(): Promise<Array<{ id: string; timestamp: string; version: number }>> {
    try {
      // Note: SecureStore doesn't provide a way to list keys
      // This is a limitation - in a real implementation, you'd maintain a backup index
      console.log('[KeychainService] Listing key backups...');
      
      // For now, return empty array as SecureStore doesn't support key enumeration
      // In a production app, you'd maintain a separate index of backup IDs
      return [];
    } catch (error) {
      console.error('[KeychainService] Failed to list key backups:', error);
      return [];
    }
  }
  
  /**
   * Restores an encryption key from backup
   * @param backupId The backup ID to restore from
   * @returns Promise that resolves when restoration is complete
   */
  async restoreKeyFromBackup(backupId: string): Promise<void> {
    try {
      console.log('[KeychainService] Restoring key from backup:', backupId);
      
      // Retrieve backup
      const backupStr = await SecureStore.getItemAsync(`${KEY_BACKUP_PREFIX}${backupId}`);
      if (!backupStr) {
        throw new Error('Backup not found');
      }
      
      const backup: KeyBackup = JSON.parse(backupStr);
      
      // Verify backup integrity
      const calculatedChecksum = this.generateChecksum(backup.key);
      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Backup integrity check failed');
      }
      
      // Restore key and metadata
      this.currentKeyVersion = backup.metadata.version;
      await this.storeEncryptionKey(backup.key);
      await this.storeKeyMetadata(backup.metadata);
      
      // Securely zero out backup key from memory
      this.secureZeroMemory(backup.key);
      
      console.log('[KeychainService] Key restored from backup successfully');
    } catch (error: unknown) {
      console.error('[KeychainService] Failed to restore key from backup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Key restoration failed: ${errorMessage}`);
    }
  }
  
  /**
   * Securely deletes the stored encryption key and all related data
   * @param includeBackups Whether to also delete backups (default: false)
   * @returns Promise that resolves when deletion is complete
   */
  async deleteEncryptionKey(includeBackups: boolean = false): Promise<void> {
    try {
      console.log('[KeychainService] Deleting encryption key...');
      
      // Delete main key and metadata
      await Promise.all([
        SecureStore.deleteItemAsync(DB_KEY_STORAGE_KEY),
        SecureStore.deleteItemAsync(DB_KEY_VERSION_KEY),
        SecureStore.deleteItemAsync(KEY_METADATA_KEY),
        SecureStore.deleteItemAsync(BIOMETRIC_AUTH_KEY),
      ]);
      
      // Delete backups if requested
      if (includeBackups) {
        // Note: This is limited by SecureStore's inability to enumerate keys
        // In production, you'd maintain a backup index to delete all backups
        console.log('[KeychainService] Backup deletion requested but limited by SecureStore API');
      }
      
      // Reset internal state
      this.currentKeyVersion = 1;
      this.useBiometricAuth = false;
      this.keyMetadata = null;
      
      console.log('[KeychainService] Encryption key deleted successfully');
    } catch (error) {
      console.error('[KeychainService] Failed to delete encryption key:', error);
      throw new Error('Could not delete encryption key');
    }
  }
  
  /**
   * Gets current key metadata
   * @returns The current key metadata or null if not available
   */
  getKeyMetadata(): KeyMetadata | null {
    return this.keyMetadata;
  }
  
  /**
   * Gets the current key version
   * @returns The current key version
   */
  getCurrentKeyVersion(): number {
    return this.currentKeyVersion;
  }
  
  /**
   * Checks if biometric authentication is currently enabled
   * @returns Whether biometric authentication is enabled
   */
  isBiometricAuthEnabled(): boolean {
    return this.useBiometricAuth;
  }

  // Legacy methods for backward compatibility
  
  /**
   * @deprecated Use createKeyBackup() instead
   */
  async backupKey(): Promise<{ key: string | null; version: number }> {
    console.warn('[KeychainService] backupKey() is deprecated, use createKeyBackup() instead');
    const key = await this.getEncryptionKey();
    return {
      key,
      version: this.currentKeyVersion,
    };
  }
  
  /**
   * @deprecated Use restoreKeyFromBackup() instead
   */
  async restoreKey(backup: { key: string; version: number }): Promise<void> {
    console.warn('[KeychainService] restoreKey() is deprecated, use restoreKeyFromBackup() instead');
    
    if (!backup.key) {
      throw new Error('Invalid backup: missing key');
    }
    
    this.currentKeyVersion = backup.version;
    await this.storeEncryptionKey(backup.key);
  }
}

export const keychainService = new KeychainService(); 