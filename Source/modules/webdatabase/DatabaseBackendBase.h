/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef DatabaseBackendBase_h
#define DatabaseBackendBase_h

#include "modules/webdatabase/sqlite/SQLiteDatabase.h"
#include "modules/webdatabase/DatabaseBasicTypes.h"
#include "modules/webdatabase/DatabaseError.h"
#include "platform/heap/Handle.h"
#include "wtf/Forward.h"
#include "wtf/RefPtr.h"
#include "wtf/ThreadSafeRefCounted.h"
#include "wtf/text/WTFString.h"

#if !LOG_DISABLED || !ERROR_DISABLED
#include "platform/weborigin/SecurityOrigin.h"
#endif

namespace blink {

class DatabaseAuthorizer;
class DatabaseContext;
class DatabaseBase;
class ExecutionContext;
class SecurityOrigin;

class DatabaseBackendBase : public ThreadSafeRefCountedWillBeGarbageCollectedFinalized<DatabaseBackendBase> {
public:
    virtual ~DatabaseBackendBase();
    virtual void trace(Visitor*);

    virtual String version() const;

    bool opened() const { return m_opened; }
    bool isNew() const { return m_new; }
    bool isSyncDatabase() const { return m_isSyncDatabase; }

    virtual SecurityOrigin* securityOrigin() const;
    virtual String stringIdentifier() const;
    virtual String displayName() const;
    virtual unsigned long estimatedSize() const;
    virtual String fileName() const;
    SQLiteDatabase& sqliteDatabase() { return m_sqliteDatabase; }

    unsigned long long maximumSize() const;
    void incrementalVacuumIfNeeded();
    void interrupt();
    bool isInterrupted();

    void disableAuthorizer();
    void enableAuthorizer();
    void setAuthorizerPermissions(int permissions);
    bool lastActionChangedDatabase();
    bool lastActionWasInsert();
    void resetDeletes();
    bool hadDeletes();
    void resetAuthorizer();

    virtual void closeImmediately() = 0;

    DatabaseContext* databaseContext() const { return m_databaseContext.get(); }
    ExecutionContext* executionContext() const;
    void setFrontend(DatabaseBase* frontend) { m_frontend = frontend; }

protected:
    friend class ChangeVersionWrapper;
    friend class SQLStatementBackend;
    friend class SQLStatementSync;
    friend class SQLTransactionBackend;
    friend class SQLTransactionBackendSync;

    DatabaseBackendBase(DatabaseContext*, const String& name, const String& expectedVersion,
        const String& displayName, unsigned long estimatedSize, DatabaseType);

    void closeDatabase();

    virtual bool openAndVerifyVersion(bool setVersionInNewDatabase, DatabaseError&, String& errorMessage) = 0;
    virtual bool performOpenAndVerify(bool shouldSetVersionInNewDatabase, DatabaseError&, String& errorMessage);

    bool getVersionFromDatabase(String& version, bool shouldCacheVersion = true);
    bool setVersionInDatabase(const String& version, bool shouldCacheVersion = true);
    void setExpectedVersion(const String&);
    const String& expectedVersion() const { return m_expectedVersion; }
    String getCachedVersion()const;
    void setCachedVersion(const String&);
    bool getActualVersionForTransaction(String& version);

    void reportOpenDatabaseResult(int errorSite, int webSqlErrorCode, int sqliteErrorCode);
    void reportChangeVersionResult(int errorSite, int webSqlErrorCode, int sqliteErrorCode);
    void reportStartTransactionResult(int errorSite, int webSqlErrorCode, int sqliteErrorCode);
    void reportCommitTransactionResult(int errorSite, int webSqlErrorCode, int sqliteErrorCode);
    void reportExecuteStatementResult(int errorSite, int webSqlErrorCode, int sqliteErrorCode);
    void reportVacuumDatabaseResult(int sqliteErrorCode);
    void logErrorMessage(const String&);
    static const char* databaseInfoTableName();

    RefPtr<SecurityOrigin> m_contextThreadSecurityOrigin;
    RefPtrWillBeMember<DatabaseContext> m_databaseContext; // Associated with m_executionContext.

    String m_name;
    String m_expectedVersion;
    String m_displayName;
    unsigned long m_estimatedSize;
    String m_filename;

    DatabaseBase* m_frontend;

#if !LOG_DISABLED || !ERROR_DISABLED
    String databaseDebugName() const { return m_contextThreadSecurityOrigin->toString() + "::" + m_name; }
#endif

private:
    DatabaseGuid m_guid;
    bool m_opened;
    bool m_new;
    const bool m_isSyncDatabase;

    SQLiteDatabase m_sqliteDatabase;

    RefPtrWillBeMember<DatabaseAuthorizer> m_databaseAuthorizer;

    friend class DatabaseServer;
};

} // namespace blink

#endif // DatabaseBackendBase_h
