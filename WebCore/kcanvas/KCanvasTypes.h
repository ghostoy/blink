/*
    Copyright (C) 2004, 2005 Nikolas Zimmermann <wildfox@kde.org>
                  2004, 2005 Rob Buis <buis@kde.org>

    This file is part of the KDE project

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    aint with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 59 Temple Place - Suite 330,
    Boston, MA 02111-1307, USA.
*/

#ifndef KCanvasTypes_H
#define KCanvasTypes_H

#include <q3ptrlist.h>

// Some default constants

// Holds any ptr under a nice synonym :)
typedef void *KCanvasUserData;

#ifdef APPLE_CHANGES
class KCanvasPrivateUserData {

};

typedef Q3PtrList<KCanvasPrivateUserData> KCanvasUserDataList;
#else
typedef Q3PtrList<void> KCanvasUserDataList;
#endif

// aka "what to draw"
class KCanvas;
class KRenderingStyle;
class KCanvasCommonArgs
{
public:
    KCanvasCommonArgs();
    ~KCanvasCommonArgs();
    
    KCanvas *canvas() const;
    void setCanvas(KCanvas *canvas);

    KCanvasUserData path() const;
    void setPath(KCanvasUserData path);

    KRenderingStyle *style() const;
    void setStyle(KRenderingStyle *style);
    
private:
    KCanvas *m_canvas;
    KCanvasUserData m_path;
    KRenderingStyle *m_style;
};


#endif

// vim:ts=4:noet
