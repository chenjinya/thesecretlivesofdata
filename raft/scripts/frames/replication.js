
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
            cluster = function(value) { model().nodes.toArray().forEach(function(node) { node.cluster(value); }); },
            wait = function() { var self = this; model().controls.show(function() { self.stop(); }); },
            subtitle = function(s, pause) { model().subtitle = s + model().controls.html(); layout.invalidate(); if (pause === undefined) { model().controls.show() }; },
            clear = function() { subtitle('', false); },
            removeAllNodes = function() { model().nodes.toArray().forEach(function(node) { node.state("stopped"); }); model().nodes.removeAll(); };

        //------------------------------
        // Title
        //------------------------------
        frame.after(0, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().title = '<h2 style="visibility:visible">日志复制</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = "";
            layout.invalidate();
        })

        //------------------------------
        // Cluster Initialization
        //------------------------------
        .after(300, function () {
            model().nodes.create("A");
            model().nodes.create("B");
            model().nodes.create("C");
            cluster(["A", "B", "C"]);
            layout.invalidate();
        })
        .after(500, function () {
            model().forceImmediateLeader();
        })


        //------------------------------
        // Overview
        //------------------------------
        .then(function () {
            subtitle('<h2>一旦我们有一个 Leader 被选举出来，我们需要复制所有的修改到我们的系统中的节点.</h2>', false);
        })
        .then(wait).indefinite()
        .then(function () {
            subtitle('<h2>这个操作同样是由 <em>追加信息</em> 消息来完成的，和心跳是一样的机制。</h2>', false);
        })
        .then(wait).indefinite()
        .then(function () {
            subtitle('<h2>让我们逐步完成这个过程</h2>', false);
        })
        .then(wait).indefinite()


        //------------------------------
        // Single Entry Replication
        //------------------------------
        .then(function () {
            model().clients.create("X");
            subtitle('<h2>首先，一个客户端向 Leader 发送一个修改请求.</h2>', false);
        })
        .then(wait).indefinite()
        .then(function () {
            client("X").send(model().leader(), "SET 5");
        })
        .after(model().defaultNetworkLatency, function() {
            subtitle('<h2>修改信息被追加到 Leader 的日志中...</h2>');
        })
        .at(model(), "appendEntriesRequestsSent", function () {})
        .after(model().defaultNetworkLatency * 0.25, function(event) {
            subtitle('<h2>...然后修改信息会在下一个心跳里被发送到它的 Followers </h2>');
        })
        .after(1, clear)
        .at(model(), "commitIndexChange", function (event) {
            if(event.target === model().leader()) {
                subtitle('<h2>一旦大多数 Followers 回执了心跳，这条信息将被正式提交...</h2>');
            }
        })
        .after(model().defaultNetworkLatency * 0.25, function(event) {
            subtitle('<h2>...并 Leader 将提交回执发送给 客户端.</h2>');
        })
        .after(1, clear)
        .after(model().defaultNetworkLatency, function(event) {
            subtitle('<h2>现在我们来发送一个命令，将数组自增 "2".</h2>');
            client("X").send(model().leader(), "ADD 2");
        })
        .after(1, clear)
        .at(model(), "recv", function (event) {
            subtitle('<h2>我们系统中的值已经被修改为 "7".</h2>', false);
        })
        .after(1, wait).indefinite()


        //------------------------------
        // Network Partition
        //------------------------------
        .after(1, function () {
            removeAllNodes();
            model().nodes.create("A");
            model().nodes.create("B");
            model().nodes.create("C");
            model().nodes.create("D");
            model().nodes.create("E");
            layout.invalidate();
        })
        .after(500, function () {
            node("A").init();
            node("B").init();
            node("C").init();
            node("D").init();
            node("E").init();
            cluster(["A", "B", "C", "D", "E"]);
            model().resetToNextTerm();
            node("B").state("leader");
        })
        .after(1, function () {
            subtitle('<h2>Raft 在面对网络分区隔离时，也可以保证一致性.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>让我们在 AB 与 CDE 之间加一个隔离层，将两方隔开</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            model().latency("A", "C", 0).latency("A", "D", 0).latency("A", "E", 0);
            model().latency("B", "C", 0).latency("B", "D", 0).latency("B", "E", 0);
            model().ensureExactCandidate("C");
        })
        .after(model().defaultNetworkLatency * 0.5, function () {
            var p = model().partitions.create("-");
            p.x1 = Math.min.apply(null, model().nodes.toArray().map(function(node) { return node.x;}));
            p.x2 = Math.max.apply(null, model().nodes.toArray().map(function(node) { return node.x;}));
            p.y1 = p.y2 = Math.round(node("B").y + node("C").y) / 2;
            layout.invalidate();
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "leader");
        })
        .after(1, function () {
            subtitle('<h2>由于我们的隔离，我们现在有了两个 Leader ，并且他们都属于不同的选举时期.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            model().clients.create("Y");
            subtitle('<h2>让我们再增加一个客户端，并修改两个 Leader 的值</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            client("Y").send(node("B"), "SET 3");
            subtitle('<h2>一个客户端将会尝试把节点 B 的值设置为 "3".</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>节点 B 不能将信息复制给大多数节点 ( 1 < 2/1 + 1)，所以他的信息日志一直保持未提交状态</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            var leader = model().leader(["C", "D", "E"]);
            client("X").send(leader, "SET 8");
            subtitle('<h2>另外一个客户端尝试设置节点 ' + leader.id + ' 的值为 "8".</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>这个操作将成功进行，因为他可以将信息复制给大多数节点.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>现在我们把中间的隔离拿走.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            model().partitions.removeAll();
            layout.invalidate();
        })
        .after(200, function () {
            model().resetLatencies();
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.id === "B" && event.target.state() === "follower");
        })
        .after(1, function () {
            subtitle('<h2>节点 B 将会看到更高的选举时期，自己则会退出.</h2>');
        })
        .after(1, function () {
            subtitle('<h2>A 和 B 两个节点将会回滚他们没有被提交的信息，并匹配新的 Leader 的日志.</h2>');
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>现在，我们的日志在整个集群中是一致的.</h2>', false);
        })
        .after(1, wait).indefinite()

        .then(function() {
            player.next();
        })

        player.play();
    };
});
