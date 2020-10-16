
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
            subtitle = function(s, pause) { model().subtitle = s + model().controls.html(); layout.invalidate(); if (pause === undefined) { model().controls.show() }; };

        //------------------------------
        // Title
        //------------------------------
        frame.after(1, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().title = '<h2 style="visibility:visible">Leader 选举</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = "";
            layout.invalidate();
        })

        //------------------------------
        // Initialization
        //------------------------------
        .after(300, function () {
            model().nodes.create("A").init();
            model().nodes.create("B").init();
            model().nodes.create("C").init();
            cluster(["A", "B", "C"]);
        })

        //------------------------------
        // Election Timeout
        //------------------------------
        .after(1, function () {
            model().ensureSingleCandidate();
            model().subtitle = '<h2>在 Raft 中，通过两个「超时时间」用来控制选举策略.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(model().electionTimeout / 2, function() { model().controls.show(); })
        .after(100, function () {
            subtitle('<h2>第一个是 <span style="color:green">选举超时</span>.</h2>');
        })
        .after(1, function() {
            subtitle('<h2>选举超时 是指 Follwer 成为 Candidate 之前等待的时间</h2>');
        })
        .after(1, function() {
            subtitle('<h2>选举超时的时长为 150ms 到 300ms 之间的随机值</h2>');
        })
        .after(1, function() {
            subtitle("", false);
        })

        //------------------------------
        // Candidacy
        //------------------------------
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "candidate");
        })
        .after(1, function () {
            subtitle('<h2>在超时结束后，Follwer 将成为 Candidate，并开起新的<em>选举时期</em>...</h2>');
        })
        .after(1, function () {
            subtitle('<h2>...首先为他自己投票...</h2>');
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>...同时向其他节点<em>发起投票</em>。</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>如果接收节点在此时期还没有投票，那么他就会投票给候给这个 Condidate...</h2>');
        })
        .after(1, function () {
            subtitle('<h2>...然后这个节点重置他的选举超时时间.</h2>');
        })


        //------------------------------
        // Leadership & heartbeat timeout.
        //------------------------------
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "leader");
        })
        .after(1, function () {
            subtitle('<h2>一旦 Candidate 获得了大多数的选票，那么它将成为 Leader。</h2>');
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>Leader 开始向它的 Followers 发送 <em>追加条目（可以理解为心跳信息）</em> 消息</h2>');
        })
        .after(1, function () {
            subtitle('<h2>这些消息以<span style="color:red">心跳超时</span> 为时间间隔发送.</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>Followers 对 <em>追加条目</em> 发送回执消息.</h2>');
        })
        .after(1, function () {
            subtitle('', false);
        })
        .after(model().heartbeatTimeout * 2, function () {
            subtitle('<h2>这个选举时期将会一直持续到有一个 Follwer 停止接收心跳并成为一个新的候选者</h2>', false);
        })
        .after(100, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
        })

        //------------------------------
        // Leader re-election
        //------------------------------
        .after(model().heartbeatTimeout * 2, function () {
            subtitle('<h2>让我们停掉 Leader，观察一下重新选举是如何发生的.</h2>', false);
        })
        .after(100, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
            model().leader().state("stopped")
        })
        .after(model().defaultNetworkLatency, function () {
            model().ensureSingleCandidate()
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "leader");
        })
        .after(1, function () {
            subtitle('<h2>节点 ' + model().leader().id + ' 现在是时期 ' + model().leader().currentTerm() + ' 的 Leader.</h2>', false);
        })
        .after(1, wait).indefinite()

        //------------------------------
        // Split Vote
        //------------------------------
        .after(1, function () {
            subtitle('<h2>选举成功需要大多数投票，这保证了每个选举时期内只选出一个 Leader.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>如果两个节点同时变成了候选者，那么就会出现拆分表决</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>让我们看看拆分表决的例子🌰...</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
            model().nodes.create("D").init().currentTerm(node("A").currentTerm());
            cluster(["A", "B", "C", "D"]);

            // Make sure two nodes become candidates at the same time.
            model().resetToNextTerm();
            var nodes = model().ensureSplitVote();

            // Increase latency to some nodes to ensure obvious split.
            model().latency(nodes[0].id, nodes[2].id, model().defaultNetworkLatency * 1.25);
            model().latency(nodes[1].id, nodes[3].id, model().defaultNetworkLatency * 1.25);
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "candidate");
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>同一时期有两个节点开始了选举...</h2>');
        })
        .after(model().defaultNetworkLatency * 0.75, function () {
            subtitle('<h2>...并且选举都比对方提前到达了一个 Follower</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>现在每个 Candidate 有两票，并且这个时期无法收到更多的票.</h2>');
        })
        .after(1, function () {
            subtitle('<h2>所有节点将会等待一个新的选举，并重试以上策略.</h2>', false);
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "leader");
        })
        .after(1, function () {
            model().resetLatencies();
            subtitle('<h2>节点 ' + model().leader().id + ' 在时期 ' + model().leader().currentTerm() + ' 收到了大多数选票，所以他成为了新 Leader.</h2>', false);
        })
        .after(1, wait).indefinite()

        .then(function() {
            player.next();
        })


        player.play();
    };
});
