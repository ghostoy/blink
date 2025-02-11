// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "config.h"
#include "modules/gamepad/WebKitGamepadList.h"

namespace blink {

WebKitGamepadList::WebKitGamepadList()
{
    ScriptWrappable::init(this);
}

void WebKitGamepadList::set(unsigned index, WebKitGamepad* gamepad)
{
    if (index >= WebGamepads::itemsLengthCap)
        return;
    m_items[index] = gamepad;
}

WebKitGamepad* WebKitGamepadList::item(unsigned index)
{
    return index < length() ? m_items[index].get() : 0;
}

void WebKitGamepadList::trace(Visitor* visitor)
{
    for (unsigned index = 0; index < WebGamepads::itemsLengthCap; index++) {
        visitor->trace(m_items[index]);
    }
}

} // namespace blink
