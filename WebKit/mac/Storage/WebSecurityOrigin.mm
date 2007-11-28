/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
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
#import "WebSecurityOriginPrivate.h"

#import "WebSecurityOriginInternal.h"

#import <WebCore/DatabaseTracker.h>
#import <WebCore/SecurityOriginData.h>

using namespace WebCore;

@implementation WebSecurityOrigin

- (id)initWithProtocol:(NSString *)protocol domain:(NSString *)domain
{
    return [self initWithProtocol:protocol domain:domain port:0];
}

- (id)initWithProtocol:(NSString *)protocol domain:(NSString *)domain port:(unsigned short)port
{
    self = [super init];
    if (!self)
        return nil;
    
    WebCoreSecurityOriginData *originData = new WebCoreSecurityOriginData(protocol, domain, port);  
    _private = reinterpret_cast<WebSecurityOriginPrivate*>(originData);

    return self;
}

- (NSString*)protocol
{
    return reinterpret_cast<WebCoreSecurityOriginData*>(_private)->protocol();
}

- (NSString*)domain
{
    return reinterpret_cast<WebCoreSecurityOriginData*>(_private)->host();
}

- (unsigned short)port
{
    return reinterpret_cast<WebCoreSecurityOriginData*>(_private)->port();
}

- (unsigned long long)usage
{
    return DatabaseTracker::tracker().usageForOrigin(*reinterpret_cast<WebCoreSecurityOriginData*>(_private));
}

- (unsigned long long)quota
{
    return DatabaseTracker::tracker().quotaForOrigin(*reinterpret_cast<WebCoreSecurityOriginData*>(_private));
}

// Sets the storage quota (in bytes)
// If the quota is set to a value lower than the current usage, that quota will "stick" but no data will be purged to meet the new quota.  
// This will simply prevent new data from being added to databases in that origin
- (void)setQuota:(unsigned long long)quota
{
    DatabaseTracker::tracker().setQuota(*reinterpret_cast<WebCoreSecurityOriginData*>(_private), quota);
}

- (void)dealloc
{
    delete reinterpret_cast<WebCoreSecurityOriginData*>(_private);
    [super dealloc];
}

- (void)finalize
{
    delete reinterpret_cast<WebCoreSecurityOriginData*>(_private);
    [super finalize];
}

@end

@implementation WebSecurityOrigin (WebInternal)

- (id)_initWithWebCoreSecurityOriginData:(const WebCoreSecurityOriginData *)securityOriginData
{
    ASSERT(securityOriginData);
    self = [super init];
    if (!self)
        return nil;

    WebCoreSecurityOriginData *originData = new WebCoreSecurityOriginData(*securityOriginData);  
    _private = reinterpret_cast<WebSecurityOriginPrivate*>(originData);

    return self;
}

- (WebCoreSecurityOriginData *)_core
{
    return reinterpret_cast<WebCoreSecurityOriginData*>(_private);
}

@end
