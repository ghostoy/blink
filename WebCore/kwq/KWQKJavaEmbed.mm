/* This file is part of the KDE project
*
* Copyright (C) 2000 Wynn Wilkes <wynnw@caldera.com>
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Library General Public
* License as published by the Free Software Foundation; either
* version 2 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Library General Public License for more details.
*
* You should have received a copy of the GNU Library General Public License
* along with this library; see the file COPYING.LIB.  If not, write to
* the Free Software Foundation, Inc., 59 Temple Place - Suite 330,
* Boston, MA 02111-1307, USA.
*/

/****************************************************************************
This is a modified version of QXEmbed from Troll Tech.  It's been modified
to work better with java applets.
*****************************************************************************/


#include <kwqdebug.h>
#include <javaembed.h>

KJavaEmbed::KJavaEmbed( QWidget *parent=0, const char *name=0, WFlags f = 0 )
{
    _logNotYetImplemented();
}


KJavaEmbed::~KJavaEmbed()
{
    _logNotYetImplemented();
}


void KJavaEmbed::embed( WId w )
{
    _logNotYetImplemented();
}


QSize KJavaEmbed::sizeHint() const
{
    _logNotYetImplemented();
    return QSize();
}


QSize KJavaEmbed::minimumSizeHint() const
{
    _logNotYetImplemented();
    return QSize();
}


void KJavaEmbed::focusOutEvent( QFocusEvent * )
{
    _logNotYetImplemented();
}

