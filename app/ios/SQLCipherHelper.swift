import Foundation
// We'll need to import the SQLCipher module.
// The exact import might depend on how Cocoapods exposes it.
// It could be `import SQLCipher` or a more specific module name if SQLCipher is modularized.
// For now, let\'s assume `import SQLCipher` or it\'s automatically available via the bridging header.

@objc(SQLCipherHelper)
class SQLCipherHelper: NSObject {

    private var db: OpaquePointer? // OpaquePointer is used for C pointers like sqlite3*

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false // Can be initialized on a background thread
    }

    override init() {
        super.init()
        // Initialization if needed
    }

    @objc(openDatabase:encryptionKey:resolver:rejecter:)
    func openDatabase(databasePath: String, encryptionKey: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // Placeholder: Construct full path if databasePath is relative
        let fileURL = try! FileManager.default
            .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
            .appendingPathComponent(databasePath)

        // 1. Open the database
        if sqlite3_open_v2(fileURL.path, &db, SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX, nil) == SQLITE_OK {
            // 2. Set the encryption key
            if sqlite3_key(db, encryptionKey, Int32(encryptionKey.utf8.count)) == SQLITE_OK {
                // 3. Try a simple query to verify (e.g., pragma user_version)
                var statement: OpaquePointer?
                if sqlite3_prepare_v2(db, "PRAGMA user_version;", -1, &statement, nil) == SQLITE_OK {
                    if sqlite3_step(statement) == SQLITE_ROW {
                        sqlite3_finalize(statement)
                        resolve("Database opened and keyed successfully at \(fileURL.path)")
                        return
                    }
                    sqlite3_finalize(statement)
                }
                let errMsg = String(cString: sqlite3_errmsg(db))
                sqlite3_close(db)
                db = nil
                reject("DB_KEY_ERROR", "Failed to key/verify database: \(errMsg)", nil)
            } else {
                let errMsg = String(cString: sqlite3_errmsg(db))
                sqlite3_close(db)
                db = nil
                reject("DB_KEY_ERROR", "Failed to set encryption key: \(errMsg)", nil)
            }
        } else {
            let errMsg = db != nil ? String(cString: sqlite3_errmsg(db)) : "Unknown error opening database"
            if db != nil { sqlite3_close(db) }
            db = nil
            reject("DB_OPEN_ERROR", "Failed to open database at \(fileURL.path): \(errMsg)", nil)
        }
    }

    @objc(closeDatabase:rejecter:)
    func closeDatabase(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let currentDB = db {
            if sqlite3_close(currentDB) == SQLITE_OK {
                db = nil
                resolve("Database closed successfully.")
            } else {
                let errMsg = String(cString: sqlite3_errmsg(currentDB))
                // Don't nullify db here as close failed, it might still be open or in an inconsistent state
                reject("DB_CLOSE_ERROR", "Failed to close database: \(errMsg)", nil)
            }
        } else {
            resolve("Database was not open.")
        }
    }

    @objc(executeSQL:arguments:resolver:rejecter:)
    func executeSQL(sql: String, arguments: [Any]?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let currentDB = db else {
            reject("DB_NOT_OPEN", "Database is not open.", nil)
            return
        }

        var statement: OpaquePointer?
        if sqlite3_prepare_v2(currentDB, sql, -1, &statement, nil) == SQLITE_OK {
            // Bind arguments
            if let args = arguments {
                for (index, value) in args.enumerated() {
                    let sqlIndex = Int32(index + 1)
                    switch value {
                    case let text as String:
                        sqlite3_bind_text(statement, sqlIndex, (text as NSString).utf8String, -1, nil)
                    case let number as NSNumber:
                        if CFNumberIsFloatType(number) {
                             sqlite3_bind_double(statement, sqlIndex, number.doubleValue)
                        } else {
                             sqlite3_bind_int64(statement, sqlIndex, number.int64Value)
                        }
                    case is NSNull:
                        sqlite3_bind_null(statement, sqlIndex)
                    // Add other types like Blob if needed
                    default:
                        sqlite3_finalize(statement)
                        reject("BIND_ERROR", "Unsupported argument type at index \(index)", nil)
                        return
                    }
                }
            }

            if sqlite3_step(statement) == SQLITE_DONE {
                let changedRows = sqlite3_changes(currentDB)
                // For INSERT, last_insert_rowid() might be useful
                let lastInsertRowId = sqlite3_last_insert_rowid(currentDB)
                sqlite3_finalize(statement)
                resolve(["rowsAffected": changedRows, "lastInsertRowId": lastInsertRowId])
            } else {
                let errMsg = String(cString: sqlite3_errmsg(currentDB))
                sqlite3_finalize(statement)
                reject("EXEC_ERROR", "Failed to execute SQL: \(errMsg)", nil)
            }
        } else {
            let errMsg = String(cString: sqlite3_errmsg(currentDB))
            reject("PREPARE_ERROR", "Failed to prepare SQL statement: \(errMsg)", nil)
        }
    }

    @objc(selectSQL:arguments:resolver:rejecter:)
    func selectSQL(sql: String, arguments: [Any]?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let currentDB = db else {
            reject("DB_NOT_OPEN", "Database is not open.", nil)
            return
        }

        var statement: OpaquePointer?
        var results: [[String: Any]] = []

        if sqlite3_prepare_v2(currentDB, sql, -1, &statement, nil) == SQLITE_OK {
            // Bind arguments (same as executeSQL)
            if let args = arguments {
                for (index, value) in args.enumerated() {
                    let sqlIndex = Int32(index + 1)
                    switch value {
                    case let text as String:
                        sqlite3_bind_text(statement, sqlIndex, (text as NSString).utf8String, -1, nil)
                    case let number as NSNumber:
                         if CFNumberIsFloatType(number) {
                             sqlite3_bind_double(statement, sqlIndex, number.doubleValue)
                        } else {
                             sqlite3_bind_int64(statement, sqlIndex, number.int64Value)
                        }
                    case is NSNull:
                        sqlite3_bind_null(statement, sqlIndex)
                    default:
                        sqlite3_finalize(statement)
                        reject("BIND_ERROR", "Unsupported argument type at index \(index)", nil)
                        return
                    }
                }
            }

            while sqlite3_step(statement) == SQLITE_ROW {
                var row: [String: Any] = [:]
                let columnCount = sqlite3_column_count(statement)
                for i in 0..<columnCount {
                    let columnName = String(cString: sqlite3_column_name(statement, i))
                    let columnType = sqlite3_column_type(statement, i)
                    switch columnType {
                    case SQLITE_INTEGER:
                        row[columnName] = sqlite3_column_int64(statement, i)
                    case SQLITE_FLOAT:
                        row[columnName] = sqlite3_column_double(statement, i)
                    case SQLITE_TEXT:
                        row[columnName] = String(cString: sqlite3_column_text(statement, i))
                    case SQLITE_NULL:
                        row[columnName] = NSNull()
                    // Add SQLITE_BLOB if needed
                    default:
                        // Potentially skip or log unsupported type
                        row[columnName] = "Unsupported_Type_\(columnType)"
                    }
                }
                results.append(row)
            }
            sqlite3_finalize(statement)
            resolve(results)
        } else {
            let errMsg = String(cString: sqlite3_errmsg(currentDB))
            reject("PREPARE_ERROR", "Failed to prepare SQL statement: \(errMsg)", nil)
        }
    }
} 