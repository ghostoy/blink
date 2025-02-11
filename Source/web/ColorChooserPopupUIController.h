/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#ifndef ColorChooserPopupUIController_h
#define ColorChooserPopupUIController_h

#include "core/page/PagePopupClient.h"
#include "web/ColorChooserUIController.h"
#include "wtf/OwnPtr.h"

namespace blink {
class ColorChooserClient;
class PagePopup;
}

namespace blink {

class ChromeClientImpl;

class ColorChooserPopupUIController FINAL : public ColorChooserUIController, public blink::PagePopupClient  {

public:
    ColorChooserPopupUIController(blink::LocalFrame*, ChromeClientImpl*, blink::ColorChooserClient*);
    virtual ~ColorChooserPopupUIController();

    // ColorChooserUIController functions:
    virtual void openUI() OVERRIDE;

    // ColorChooser functions
    void endChooser() OVERRIDE;

    // PagePopupClient functions:
    virtual blink::IntSize contentSize() OVERRIDE;
    virtual void writeDocument(blink::SharedBuffer*) OVERRIDE;
    virtual blink::Locale& locale() OVERRIDE;
    virtual void setValueAndClosePopup(int, const String&) OVERRIDE;
    virtual void setValue(const String&) OVERRIDE;
    virtual void closePopup() OVERRIDE;
    virtual void didClosePopup() OVERRIDE;

private:
    void openPopup();

    ChromeClientImpl* m_chromeClient;
    blink::ColorChooserClient* m_client;
    blink::PagePopup* m_popup;
    blink::Locale& m_locale;
};
}

#endif // ColorChooserPopupUIController_h
