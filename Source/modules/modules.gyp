#
# Copyright (C) 2013 Google Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
{
  'includes': [
    '../build/scripts/scripts.gypi',
    '../build/win/precompile.gypi',
    '../bindings/modules/modules.gypi',  # modules can depend on bindings/modules, but not on bindings
    'modules.gypi',
  ],
  'targets': [{
    # GN version: //third_party/WebKit/Source/modules:modules
    'target_name': 'modules',
    'type': 'static_library',
    'dependencies': [
      '<(DEPTH)/third_party/zlib/zlib.gyp:zlib',
      '<(DEPTH)/third_party/sqlite/sqlite.gyp:sqlite',
      '../config.gyp:config',
      '../core/core.gyp:webcore',
      'modules_generated.gyp:make_modules_generated',
    ],
    'defines': [
      'BLINK_IMPLEMENTATION=1',
      'INSIDE_BLINK',
    ],
    'sources': [
      '<@(modules_files)',
      '<@(bindings_modules_v8_files)',
      '<@(bindings_modules_v8_generated_aggregate_files)',
    ],
    'actions': [
      {
        # GN version: //third_party/WebKit/Source/modules:modules_cache_polyfill
        'action_name': 'CachePolyfill',
        'process_outputs_as_sources': 1,
        'variables': {
            'resources': [
                 'serviceworkers/polyfills/cachePolyfill.js',
            ],
        },
        'inputs': [
            '../build/scripts/make-file-arrays.py',
            '<@(resources)',
        ],
        'outputs': [
            '<(blink_modules_output_dir)/CachePolyfill.h',
            '<(blink_modules_output_dir)/CachePolyfill.cpp',
        ],
        'action': [
            'python',
            '../build/scripts/make-file-arrays.py',
            '--out-h=<(blink_modules_output_dir)/CachePolyfill.h',
            '--out-cpp=<(blink_modules_output_dir)/CachePolyfill.cpp',
            '--namespace=blink',
            '<@(resources)',
        ],
      },
      {
        # GN version: //third_party/WebKit/Source/modules:modules_cache_storage_polyfill
        'action_name': 'CacheStoragePolyfill',
        'process_outputs_as_sources': 1,
        'variables': {
            'resources': [
                 'serviceworkers/polyfills/cacheStoragePolyfill.js',
            ],
        },
        'inputs': [
            '../build/scripts/make-file-arrays.py',
            '<@(resources)',
        ],
        'outputs': [
            '<(blink_modules_output_dir)/CacheStoragePolyfill.h',
            '<(blink_modules_output_dir)/CacheStoragePolyfill.cpp',
        ],
        'action': [
            'python',
            '../build/scripts/make-file-arrays.py',
            '--out-h=<(blink_modules_output_dir)/CacheStoragePolyfill.h',
            '--out-cpp=<(blink_modules_output_dir)/CacheStoragePolyfill.cpp',
            '--namespace=blink',
            '<@(resources)',
        ],
      },
    ],
    # Disable c4267 warnings until we fix size_t to int truncations.
    'msvs_disabled_warnings': [ 4267, 4334, ]
  },
  {
    # GN version: //third_party/WebKit/Source/modules:modules_testing
    'target_name': 'modules_testing',
    'type': 'static_library',
    'dependencies': [
      '../config.gyp:config',
      '../core/core.gyp:webcore',
    ],
    'defines': [
      'BLINK_IMPLEMENTATION=1',
      'INSIDE_BLINK',
    ],
    'sources': [
      '<@(modules_testing_files)',
    ],

  }],
}
