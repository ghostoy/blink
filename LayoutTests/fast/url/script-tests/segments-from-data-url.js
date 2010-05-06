description("Test URL segmentation");

cases = [ 
  // [URL, [SCHEME, HOST, PORT, PATH, QUERY, REF]]
  ["http://user:pass@foo:21/bar;par?b#c",    ["http:","foo","21","/bar;par","?b","#c"]],
  ["http:foo.com",                           ["http:","foo.com","0","/","",""]],
  ["\\t   :foo.com   \\n",                   [":","","0","","",""]],
  [" foo.com  ",                             [":","","0","","",""]],
  ["a:\\t foo.com",                          ["a:","","0"," foo.com","",""]],
  ["http://f:21/ b ? d # e ",                ["http:","f","21","/%20b%20","?%20d%20","# e"]],
  ["http://f:/c",                            ["http:","f","0","/c","",""]],
  ["http://f:0/c",                           ["http:","f","0","/c","",""]],
  ["http://f:00000000000000/c",              ["http:","f","0","/c","",""]],
  ["http://f:00000000000000000000080/c",     ["http:","f","0","/c","",""]],
  ["http://f:b/c",                           [":","","0","","",""]],
  ["http://f: /c",                           [":","","0","","",""]],
  ["http://f:\\n/c",                         ["http:","f","0","/c","",""]],
  ["http://f:fifty-two/c",                   [":","","0","","",""]],
  ["http://f:999999/c",                      [":","","0","","",""]],
  ["http://f: 21 / b ? d # e ",              [":","","0","","",""]],
  ["",                                       ["data:","","0","text/plain,baseURL","",""]],
  ["  \\t",                                  ["data:","","0","text/plain,baseURL","",""]],
  [":foo.com/",                              [":","","0","","",""]],
  [":foo.com\\\\",                           [":","","0","","",""]],
  [":",                                      [":","","0","","",""]],
  [":a",                                     [":","","0","","",""]],
  [":/",                                     [":","","0","","",""]],
  [":\\\\",                                  [":","","0","","",""]],
  [":#",                                     [":","","0","","",""]],
  ["#",                                      [":","","0","","",""]],
  ["#/",                                     [":","","0","","",""]],
  ["#\\\\",                                  [":","","0","","",""]],
  ["#;?",                                    [":","","0","","",""]],
  ["?",                                      [":","","0","","",""]],
  ["/",                                      [":","","0","","",""]],
  [":23",                                    [":","","0","","",""]],
  ["/:23",                                   ["data:","","0","/:23","",""]],
  ["//",                                     [":","","0","","",""]],
  ["::",                                     [":","","0","","",""]],
  ["::23",                                   [":","","0","","",""]],
  ["foo://",                                 ["foo:","","0","//","",""]],
  ["http://a:b@c:29/d",                      ["http:","c","29","/d","",""]],
  ["http::@c:29",                            ["http:","c","29","/","",""]],
  ["http://&a:foo(b]c@d:2/",                 ["http:","d","2","/","",""]],
  ["http://::@c@d:2",                        ["http:","d","2","/","",""]],
  ["http://foo.com:b@d/",                    ["http:","d","0","/","",""]],
  ["http://foo.com/\\\\@",                   ["http:","foo.com","0","//@","",""]],
  ["http:\\\\\\\\foo.com\\\\",               ["http:","foo.com","0","/","",""]],
  ["http:\\\\\\\\a\\\\b:c\\\\d@foo.com\\\\", ["http:","a","0","/b:c/d@foo.com/","",""]],
  ["foo:/",                                  ["foo:","","0","/","",""]],
  ["foo:/bar.com/",                          ["foo:","","0","/bar.com/","",""]],
  ["foo://///////",                          ["foo:","","0","/////////","",""]],
  ["foo://///////bar.com/",                  ["foo:","","0","/////////bar.com/","",""]],
  ["foo:////://///",                         ["foo:","","0","////://///","",""]],
  ["c:/foo",                                 ["c:","","0","/foo","",""]],
  ["//foo/bar",                              [":","","0","","",""]],
  ["http://foo/path;a??e#f#g",               ["http:","foo","0","/path;a","??e","#f#g"]],
  ["http://foo/abcd?efgh?ijkl",              ["http:","foo","0","/abcd","?efgh?ijkl",""]],
  ["http://foo/abcd#foo?bar",                ["http:","foo","0","/abcd","","#foo?bar"]],
  ["[61:24:74]:98",                          ["data:","","0","text/[61:24:74]:98","",""]],
  ["http://[61:27]:98",                      [":","","0","","",""]],
  ["http:[61:27]/:foo",                      [":","","0","","",""]],
  ["http://[1::2]:3:4",                      [":","","0","","",""]],
  ["http://2001::1",                         [":","","0","","",""]],
  ["http://[2001::1",                        [":","","0","","",""]],
  ["http://2001::1]",                        [":","","0","","",""]],
  ["http://2001::1]:80",                     [":","","0","","",""]],
  ["http://[2001::1]",                       ["http:","[2001::1]","0","/","",""]],
  ["http://[2001::1]:80",                    ["http:","[2001::1]","0","/","",""]],
  ["http://[[::]]",                          [":","","0","","",""]],
];

var originalBaseURL = canonicalize(".");
setBaseURL("data:text/plain,baseURL");

for (var i = 0; i < cases.length; ++i) {
  shouldBe("segments('" + cases[i][0] + "')",
           "'" + JSON.stringify(cases[i][1]) + "'");
}

setBaseURL(originalBaseURL);

var successfullyParsed = true;
