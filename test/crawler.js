/* global assert:true */


if (typeof require !== "undefined") {
    var buster = require("buster");
    var lib = require("../lib/ucss");
}


var pageSetOne = {
    "/rules1.css": ".foo {} .bar {}",
    "/rules2.css": ".foo {} .bar {} .baz {} .qux {}",
    "/rules3.css": ".foo {} .bar {} .baz {} .qux {} .quux {}",
    "/markup1.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo'>",
            "    <a href='markup2.html'>markup2</a>",
            "    <a href='markup1.html'>markup1</a>",
            "  </body>",
            "</html>"].join(""),
    "/markup2.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "    <a href='markup1.html'>markup1</a>",
            "  </body>",
            "</html>"].join(""),
    "/external_links.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "    <a href='http://127.0.0.1:9989/index.html'>index.html</a>",
            "    <a href='http://127.0.0.1:9988/markup1.html'>markup1</a>",
            "    <a href='/markup2.html'>markup2</a>",
            "  </body>",
            "</html>"].join(""),
    "/path1/relative_paths.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body>",
            "    <a href='http://127.0.0.1:9988/path1/relative1.html'>index.html</a>",
            "    <a href='../relative2.html'>markup1</a>",
            "    <a href='/relative3.html'>markup1</a>",
            "    <a href='../path2/relative4.html'>markup1</a>",
            "  </body>",
            "</html>"].join(""),
    "/path1/relative1.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo'>",
            "  </body>",
            "</html>"].join(""),
    "/relative2.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "  </body>",
            "</html>"].join(""),
    "/relative3.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='baz'>",
            "  </body>",
            "</html>"].join(""),
    "/path2/relative4.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='qux'>",
            "  </body>",
            "</html>"].join(""),
    "/not_linked_to.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='quux'>",
            "  </body>",
            "</html>"].join(""),
    "/deadlink.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo'>",
            "    <a href='markup1.html'>markup1.html</a>",
            "    <a href='not_existing.html'>not_existing.html</a>",
            "  </body>",
            "</html>"].join(""),
    "/subdomain_links.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo bar'>",
            "    <a href='no_links.html'>no_links.html</a>",
            "    <a href='/subdomain/doc1.html'>doc1.html</a>",
            "    <a href='http://127.0.0.1:9988/subdomain/doc2.html'>doc3.html</a>",
            "  </body>",
            "</html>"].join(""),
    "/subdomain/doc1.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo'>",
            "  </body>",
            "</html>"].join(""),
    "/subdomain/doc2.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "  </body>",
            "</html>"].join(""),
    "/parameters.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='foo'>",
            "    <a href='no_links.html?foo'>markup1</a>",
            "    <a href='no_links.html?bar'>markup1</a>",
            "  </body>",
            "</html>"].join(""),
    "/no_links.html":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "  </body>",
            "</html>"].join(""),
    "/no_links.html?foo":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "  </body>",
            "</html>"].join(""),
    "/no_links.html?bar":
            ["<html>",
            "  <head>",
            "  </head>",
            "  <body class='bar'>",
            "  </body>",
            "</html>"].join("")


};


var pageSetTwo = {
    "/index.html": "<html><head></head><body class='baz'></body></html>"
};


buster.testCase("uCSS crawler", {
    setUp: function () {
        var http = require("http");

        this.server = http.createServer(function (req, res) {
            if (req.url in pageSetOne) {
                res.end(pageSetOne[req.url]);
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(9988, "0.0.0.0");

        this.anotherServer = http.createServer(function (req, res) {
            if (req.url in pageSetTwo) {
                res.end(pageSetTwo[req.url]);
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(9989, "0.0.0.0");
    },

    tearDown: function () {
        this.server.close();
        this.anotherServer.close();
    },

    "can crawl webpages": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/markup1.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var expected = {};
        expected.used = {};
        expected.used[".bar"] = 1;
        expected.used[".foo"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "does not go outside given domain": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/external_links.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var expected = {};
        expected.used = {};
        expected.used[".bar"] = 2;
        expected.used[".foo"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles relative paths": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/path1/relative_paths.html"]
        };
        var css = ["http://127.0.0.1:9988/rules2.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 1;
        expected.used[".bar"] = 1;
        expected.used[".baz"] = 1;
        expected.used[".qux"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles includes": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/path1/relative_paths.html"],
            include: ["http://127.0.0.1:9988/not_linked_to.html"]
        };
        var css = ["http://127.0.0.1:9988/rules3.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 1;
        expected.used[".bar"] = 1;
        expected.used[".baz"] = 1;
        expected.used[".qux"] = 1;
        expected.used[".quux"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles excludes": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/path1/relative_paths.html"],
            exclude: ["http://127.0.0.1:9988/path1/relative1.html"]
        };
        var css = ["http://127.0.0.1:9988/rules3.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 0;
        expected.used[".bar"] = 1;
        expected.used[".baz"] = 1;
        expected.used[".qux"] = 1;
        expected.used[".quux"] = 0;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles dead links": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/deadlink.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 2;
        expected.used[".bar"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles exclude (given as string)": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/path1/relative_paths.html"],
            exclude: "http://127.0.0.1:9988/path1/relative1.html"
        };
        var css = ["http://127.0.0.1:9988/rules3.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 0;
        expected.used[".bar"] = 1;
        expected.used[".baz"] = 1;
        expected.used[".qux"] = 1;
        expected.used[".quux"] = 0;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "handles exclude of subdomain": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/subdomain_links.html"],
            exclude: ["http://127.0.0.1:9988/subdomain/*"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 1;
        expected.used[".bar"] = 2;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "Does not follow links in includes": function(done) {
        var pages = {
            include: ["http://127.0.0.1:9988/path1/relative_paths.html"]
        };
        var css = ["http://127.0.0.1:9988/rules3.css"];

        var expected = {};
        expected.used = {};
        expected.used[".foo"] = 0;
        expected.used[".bar"] = 0;
        expected.used[".baz"] = 0;
        expected.used[".qux"] = 0;
        expected.used[".quux"] = 0;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "can crawl webpages that requires login": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/markup1.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var context = {
            auth: {
                "username": "foo",
                "password": "bar",
                "loginUrl": "http://example.com/login/",
                "loginFunc": function(url, username, password, callback) {
                    callback("1234");
                }
            }
        };

        var expected = {};
        expected.used = {};
        expected.used[".bar"] = 2;
        expected.used[".foo"] = 2;
        expected.duplicates = {};

        lib.analyze(pages, css, context, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    },

    "does not revisit URLs with parameters": function(done) {
        var pages = {
            crawl: ["http://127.0.0.1:9988/parameters.html"]
        };
        var css = ["http://127.0.0.1:9988/rules1.css"];

        var expected = {};
        expected.used = {};
        expected.used[".bar"] = 1;
        expected.used[".foo"] = 1;
        expected.duplicates = {};

        lib.analyze(pages, css, null, function(result) {
            assert.equals(result.used, expected.used);
            assert.equals(result.duplicates, expected.duplicates);
            done();
        });
    }
});
