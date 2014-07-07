'use strict';
//Workitems service used for workitems REST endpoint
angular.module('mean.workitems').factory('decorator', ['$sce',
    function($sce) {

        // TODO: links and tags
        // tag suggestion, tag search

        // TODO: exports to util
        // decorate wi text:
        // 1. links
        // 2. key hilight
        // 3. @ #
        // 4. readonly
        var exports = {
            processors: [],
            addProcessor: function(key, pro, force) {
                if (this.processors[key] && force == false) {
                    console.log("The processor with the specified key ('" + key + "') has already been defined!");
                    return;
                }
                this.processors[key] = pro;
                return this;
            },

            removeProcessor: function(key) {
                delete this.processors[key];
                return this;
            },
            decorate: function(text) {
                /*text = this._removeHtml(text);
                for (var i in this.processors) {
                    var p = this.processors[i];
                    if (typeof p === "function")
                        text = this.processors[i](text, arguments[1]);
                }*/

                return $sce.trustAsHtml(text);
            },
            decorate4dir: function(text) {
                text = this._removeHtml(text);
                for (var i in this.processors) {
                    var p = this.processors[i];
                    if (typeof p === "function")
                        text = this.processors[i](text, arguments[1]);
                }
                return $sce.trustAsHtml(text);
            },
            _removeHtml: function(text) {
                return text ? text.replace(/<[^>]+>/g, "") : "";
            }

        };


        function _decorate_process(text, pattern, callback) {
            var escapetag = XRegExp('(^[^<,^>]+<)|(>[^<,^>]+<)|(>[^<,^>]+$)', 'g');
            if(!XRegExp.test(text, escapetag)){
                escapetag = XRegExp('^.+$', 'g');
            }
            return XRegExp.replace(text, escapetag, function(match) {
                return XRegExp.replace(match, pattern, function(m) {
                    return callback(m);
                });
            })
        }

        // Default built-ins
        function _decorate_highlight(text,keyword) {
            if(keyword == undefined || keyword=="")return text;
            var pattern = XRegExp(keyword, 'g');
            return _decorate_process(text, pattern, function(m) {
                return '<span class="label-warning">' + m + '</span>'
            })
        }

        // TODO: Tags suggestion
        // Tags CSS
        function _decorate_tags(text) {
            var pattern = XRegExp('#\\w+\\b', 'g');
            return _decorate_process(text, pattern, function(m) {
                return '<span target="_blank" href="javascript:void(0)" onclick="return query(this.innerHTML);" class="content-tag content-pound">' + m + "</span>";
            });

        }

        // TODO: @ suggestion
        // Tags CSS
        function _decorate_at(text) {
            var pattern = XRegExp('@\\w+\\b', 'g');
            return _decorate_process(text, pattern, function(m) {
                return '<span target="_blank" href="javascript:void(0)" onclick="return query(this.innerHTML);" class="content-tag content-at">' + m + "</span>";
            });

        }

        // TODO: http, https, ip, email....
        // TODO .com .cn .io .net....
        // Links CSS 
        function _decorate_urls(text) {
            var pattern = XRegExp('[a-zA-z]+://[^\\s]*', 'g');
            return _decorate_process(text, pattern, function(m) {
                return '<span  onclick="window.open(\''+m+'\', \'_blank\');" class="content-link">' + m + '</span>';
            });


        }
        // built-in handlers
        return function(disableDefault) {
            // add default processors
            if (!disableDefault) {
                exports.addProcessor("url", _decorate_urls);
                //exports.addProcessor(_highlightKey);
                exports.addProcessor("tag", _decorate_tags);

                exports.addProcessor("at", _decorate_at);
                exports.addProcessor("highlight", _decorate_highlight);
            }

            return exports;
        };
    }
]);