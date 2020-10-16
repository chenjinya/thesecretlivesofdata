
"use strict";
/*jslint browser: true, nomen: true*/
/*global define*/

define([], function () {
    return function (frame) {
        var player = frame.player(),
            layout = frame.layout(),
            model = function() { return frame.model(); },
            client = function(id) { return frame.model().clients.find(id); },
            node = function(id) { return frame.model().nodes.find(id); },
            wait = function() { var self = this; model().controls.show(function() { self.stop(); }); };

        frame.after(1, function() {
            model().nodeLabelVisible = false;
            frame.snapshot();
            frame.model().clear();
            layout.invalidate();
        })

        .after(1000, function () {
            frame.model().title = '<h2 style="visibility:visible">那么什么是分布式共识?</h2>'
                        + '<h3 style="visibility:hidden;">下面让我们看一个例子🌰 ...</h3>'
                        + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(1000, function () {
            layout.fadeIn($(".title h3"));
        })
        .after(1000, function () {
            frame.model().controls.show();
        })
        .after(50, function () {
            frame.model().title = frame.model().subtitle = "";
            layout.invalidate();
        })


        .after(800, function () {
            frame.snapshot();
            frame.model().subtitle = '<h2>假设我们有一个「单节点系统」</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("a");
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = "";
            frame.model().zoom([node("a")]);
            layout.invalidate();
        })
        .after(600, function () {
            frame.model().subtitle = '<h3>在此示例中，您可以将我们的<span style="color:steelblue">节点</span>视为存储单个值的数据库服务器。</h3>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            node("a")._value = "x";
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = "";
            frame.model().zoom(null);
            layout.invalidate();
        })
        .after(1000, function () {
            frame.model().subtitle = '<h3>我们还有一个<span style="color:green">客户端</span>，可以将值发送到服务器的。 </h3>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().clients.create("X");
            layout.invalidate();
        })
        .after(100, wait).indefinite()


        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle += "";
            client("X").value("8");
            layout.invalidate();
        })
        .after(200, function () {
            frame.model().send(client("X"), node("a"), null, function() {
                node("a")._value = "8";
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.model().subtitle = '<h3>一个节点就可以很容易承认或达成<em>共识</em></h3>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()


        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = '<h3>但是，如果我们有多个节点，我们将如何达成共识呢？</h3>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("b");
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("c");
            layout.invalidate();
        })
        .after(100, wait).indefinite()


        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = '<h3>这就是<em>分布式共识</em>的问题。</h3>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(300, function () {
            frame.snapshot();
            player.next();
        })


        frame.addEventListener("end", function () {
            frame.model().title = frame.model().subtitle = "";
            layout.invalidate();
        });

        player.play();
    };
});
