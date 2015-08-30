var Editor, Base64; // STFU JSLint

var CommonClass = {
    HTTP_URL: false,
    SSL_URL: false,
    UPLOADS_URL: false,
    isSecure: false,
    isFullScreen: false,
    formBuilderTop: 106,
    toolBoxTop: 175,
    session: (new Date()).getTime(),
    templateCache: {},
    useArgument: false,
    messageWindow: false,
    cssloaded: false,
    lang: "",
    user: false,
    imageFiles: ["png", "jpg", "jpeg", "ico", "tiff", "bmp", "gif", "apng", "jp2", "jfif"],
    // RegEx for checking email format and the allowed characters in the username.
    emailRegex: /[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])/,
    /**
     * initialize everything
     * @constructor
     */
    initialize: function () {
        var $this = this;
        try { // try for v8
            Object.extend(document.windowDefaults, {
                titleBackground: 'none repeat scroll 0 0 #FFA100',
                buttonsBackground: 'none repeat scroll 0 0 #DEDEDE',
                background: '', // Comes from CSS
                borderWidth: 6,
                borderOpacity: 0.5,
                borderRadius: '8px',
                closeButton: '<div class="close-wiz" title="' + 'Close Window' + '"> </div>',
                dimColor: '#444',
                dimOpacity: 0.5,
                borderColor: '#000',
                titleTextColor: '#fff'
                        // modal: true,
                        // hideTitle: false
            });

            this.setLoadingIndicator();
            var baseElem = $$('base')[0];

            // If there is a base element on the page then HTTP_URL is this
            if (baseElem) {

                this.HTTP_URL = baseElem.href;

            } else { // Cannot find base try to get it yourself
                var sub_folder = "";
                var uri = this.parseUri(location.href);
                if (uri.host == "localhost") {
                    sub_folder = "/jotform3";
                }
                if (document.APP) {
                    sub_folder = document.SUBFOLDER;
                }
                var folderCheck = new RegExp(".*" + sub_folder + "\/?$");

                if (sub_folder && sub_folder != "/" && folderCheck.test(uri.directory)) {
                    this.HTTP_URL = uri.protocol + "://" + uri.host + uri.directory;
                } else {
                    this.HTTP_URL = uri.protocol + "://" + uri.host + sub_folder + "/";
                }
            }

            this.UPLOADS_URL = this.HTTP_URL + "uploads/";
            this.SSL_URL = this.HTTP_URL.replace('http:', 'https:');
            this.isSecure = /^\bhttps\b\:\/\//.test(location.href);

            if (this.lang != "en" && this.lang != "tr") {
                //$$('body')[0].setStyle('font-size:11px');
                //$$('.big-button').each( function(elem){ elem.setStyle('font-size:10px'); });
                $$('.info').each(function (elem) {

                    elem.hide();
                });
            }
            /*
             if($('logo-banner-cont')){
             var stop = false;
             var bannerOn = false;

             $('logo-banner-cont').hover(function(){ stop = true; }, function(){ stop = false; });
             $('logo-cont').hover(function(){ stop = true; }, function(){ stop = false; });
             setInterval(function(){
             // Stop on mouseover
             if(stop){ return; }
             var logo = {duration:1}, banner = {duration:1};
             if(bannerOn){
             logo.top = 0;
             logo.opacity = 1;
             banner.top = -55;
             banner.opacity = 0;
             }else{
             logo.top = -55;
             logo.opaicty = 0;
             banner.top = 0;
             banner.opacity = 1;
             }
             bannerOn = !bannerOn;
             $('logo-banner-cont').shift(banner);
             $('logo-cont').shift(logo);
             }, 15000);
             }
             */
            this.themeSelector();
            this.updateOnResize();
            this.alignGlow();
            setInterval(function () {
                $this.alignGlow();
            }, 900);

            if ($('language-box') && $('language-box').bigSelect) {
                $('language-box').bigSelect({additionalClassName: 'big-button buttons buttons-dark'});
            }
            this.lang = $$('html')[0].getAttribute('lang');
        } catch (e) {
            console.log('CommonClass initialize error ', e);
        }
    },
    configs: {},
    getConfig: function (key) {
        if (!(key in this.configs)) {
            this.Request("getConfigs", {
                asynchronous: false,
                onComplete: function (res) {
                    this.configs = res.configs;
                }.bind(this)
            });
        }
        return this.configs[key];
    },
    debugInc: {},
    debug: function (name) {
        if (!(name in this.debugInc)) {
            this.debugInc[name] = 1;
        }
        console.log(name + ": " + this.debugInc[name]++);
    },
    /**
     * If there is a theme selector link on the page set onClick event
     */
    themeSelector: function () {
        if ($('themes-selector')) {
            var ts = $('themes-selector');
            var $this = this;
            var sc = function () {
                setTimeout(function () { // Defer function. It runs only when site is IDLE
                    var s = $this.getScrollMax();
                    if ((s[1] - window.scrollY) >= 400) {
                        ts.className = 'themes-fixed';
                    } else {
                        ts.className = "";
                    }
                }, 0);

            };

            Event.observe(window, 'scroll', sc);

            setTimeout(function () {
                sc();
            }, 2000);

            ts.observe('click', function () {
                this.loadCSS('css/wizards/theme-selector.css');
                this.loadScript('js/wizards/theme-selector.js', function () {
                    ThemeSelector.openWizard();
                });
            }.bind(this));
        }
    },
    checkSubmissionsEnabled: function (callback) {
        if (document.disableSubmissions) {
            this.alert('JotForm is currently under a maintenance mode. Our first priority is to keep your forms working. That\'s why Submissions page and Reports are <b>temporarily unavailable today between 9am-5pm EST</b>. Please check back later. We are sorry for the inconvenience.', 'Temporarily Unavailable', false, {
                noCenter: true,
                width: 400
            });
            return false;
        }
        if (callback) {
            callback();
        }
        return true;
    },
    /**
     * Clear all harmfull stuff from given value
     * @param value String or array to be cleaned
     * @param key additional parameter to define what is this value, we may add an exception later
     */
    clearXSS: function (value, key) {

        var cleanedValue;
        if (!value) {
            return value;
        } // if it's a falsy value then return it back

        if (Object.isString(value)) {
            cleanedValue = value.stripScripts();
            /*if(value !== cleanedValue){
             // console.log("Cleaned", cleanedValue, value);
             }*/
        } else if (Object.isArray(value)) {
            cleanedValue = [];
            for (var i = 0; i < value.length; i++) {
                cleanedValue[i] = this.clearXSS(value[i]);
            }
        } else if (typeof value == 'object' && Object.keys(value).length > 0) {
            cleanedValue = {};
            for (var k in value) {
                cleanedValue[k] = this.clearXSS(value[k]);
            }
        } else {
            cleanedValue = value;
        }

        return cleanedValue;
    },
    /**
     * Load a local script and run immediatelly
     * @param {Object} url
     * @param {Object} callback
     */
    require: function (url, callback) {
        this.loadTemplate(url, function (content) {
            if (!$(url)) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                if (Prototype.Browser.IE && !Prototype.Browser.IE9 && !Prototype.Browser.IE10) {
                    script.text = content;
                } else {
                    var scriptContent = document.createTextNode(content);
                    script.appendChild(scriptContent);
                }
                script.id = url;
                document.body.appendChild(script);
            }
            if (callback) {
                callback();
            }
        });
    },
    /**
     * Cleans up and compacts all class declerations then splits them into an array
     * @param {Object} css
     */
    getCSSArray: function (css) {

        //Emre: to remove @media from inject css because media queries break form builder
        var removeMediaQuery = function (css) {
            css = css.replace(/\n/gm, "");
            css = css.replace(/\@media[^\{]*\{(?:(?!\}\}).)*\s*\}\s*\}/gi, "");
            return css;
        }

        css = removeMediaQuery(css);


        css = css.replace(/\s*(\s|\s\()\s*|\/\*([^*\\\\]|\*(?!\/))+\*\/|[\n\r\t]/gim, ' ');
        css = css.replace(/\}/gim, '}\n');
        css = css.replace(/^\s+/gim, '');
        var arr = css.split(/\n/);
        var parsed = {};
        var match;
        for (var x = 0; x < arr.length; x++) {
            match = arr[x].match(/([\s\S]*)\{([\s\S]*)\}/im);
            if (match && match[1]) {
                if (match[1].strip() in parsed) {
                    parsed[match[1].strip()] += ";" + match[2].strip();
                } else {
                    parsed[match[1].strip()] = match[2].strip();
                }
            }
        }
        if ($H(parsed).size() < 1) {
            return false;
        } else {
            return parsed;
        }
    },
    /**
     * Keep the timer of loading indicator
     */
    loadTime: false,
    /**
     * Displays a loading indicator on long running ajax request
     */
    setLoadingIndicator: function () {

        if (!$('loading-indicator')) {
            return;
        }

        var $this = this;
        var hide = function (text) { /*$(document.body).removeClassName('waiting');*/
            $('loading-indicator').shift({bottom: -40, duration: 0.5, opacity: 0});
        };
        var show = function (text) { /*$(document.body).addClassName('waiting');*/
            $('loading-indicator').shift({bottom: 0, duration: 0.5, link: 'ignore', opacity: 1});
        };

        $('loading-indicator').observe('click', function () {
            hide();
        });

        Ajax.Responders.register({
            onCreate: function () {
                $this.loadTime = setTimeout(function () {
                    show();
                }, 350);
            },
            onComplete: function () {
                clearTimeout($this.loadTime);
                hide();
            }
        });
    },
    alignGlow: function () {
        if (!$('glow-mid')) {
            return;
        }
        if ($('stage') && $('stage').getHeight) {
            $('glow-mid').style.height = ($('stage').getHeight() - 115) + 'px';
        } else {
            if ($('content').getHeight)
                $('glow-mid').style.height = ($('content').getHeight() - 220) + 'px';
        }
    },
    openMovie: function () {
        this.lightWindow({
            width: 650,
            height: 400,
            //noReCenter:true,
            content: '<h2>JotForm In Two Minutes</h2><object width="651" height="366" style="border:1px solid #999">' +
                    '<param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=13669519&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1" />' +
                    '<embed src="http://vimeo.com/moogaloop.swf?clip_id=13669519&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="651" height="366">' +
                    '</embed>' +
                    '</object>',
            onReCenter: function () {
            },
            onClose: function () {
            }
        });
    },
    updateOnResize: function () {
        var resizeUpdater = function (e) {
            var width = document.viewport.getWidth();
            var height = document.viewport.getHeight();

            // Hide glow to prevent scrollbars on smaller screens
            if (width < 1160) {
                var diff = 1160 - width;
                $$('.glow div').invoke('setStyle', 'width:' + (width + (diff / 2) - 1) + 'px');
                //$$('.glow').invoke('hide');
            } else {
                $$('.glow div').invoke('setStyle', {width: ''});
                //$$('.glow').invoke('show');
            }

            if (width < 950) {
                if ($('feedback-tab')) {
                    $('feedback-tab').hide();
                }
                if ($('themes-selector')) {
                    $('themes-selector').hide();
                }
            } else {
                if ($('feedback-tab')) {
                    $('feedback-tab').show();
                }
                if ($('themes-selector')) {
                    $('themes-selector').show();
                }
            }

        };
        Event.observe(window, 'resize', resizeUpdater);
        Event.observe(window, 'load', resizeUpdater);
    },
    lightWindow: function (options) {
        var preview = new Element('div', {
            className: 'preview-box'
        }).setStyle('width:' + options.width + 'px');

        var dim = new Element('div', {className: 'preview-dim'}).setOpacity(0.5);
        var cont = new Element('div', {className: 'preview-container'});

        preview.insert(options.content);

        cont.insert(preview);

        // Close Actions
        var esc_close = function (e) {
            e = document.getEvent(e);
            if (e.keyCode == Event.KEY_ESC) {
                close.onclick();
            }
        };

        var reCenter = function () {
            if (options.noReCenter) {
                return;
            }
            var dm = document.viewport.getDimensions();
            var left = (dm.width - options.width - 20) / 2;
            var top = dm.height * 0.1;
            var height = (dm.height < options.height + 100 + top) ? dm.height - top * 2 : options.height + 40;
            preview.setStyle({
                top: top + 'px',
                left: left + 'px',
                height: height + 'px'
            });
            options.onReCenter(height);

        };

        Event.observe(window, 'resize', reCenter);
        document.observe('keyup', esc_close);
        // Close button
        var close = new Element('img', {
            id: 'preview-close',
            src: 'images/toolbar/collapse_closed.png',
            className: 'toolbar-collapse_closed'
        });
        preview.insert(close);
        close.onclick = function () {
            options.onClose();
            Event.stopObserving(window, 'resize', reCenter);
            document.stopObserving('keyup', esc_close);
            dim.remove();
            cont.remove();
        };

        preview.setDraggable({dragFromOriginal: true});

        try {
            reCenter();
        } catch (e) {
            console.error(e);
        }

        // Insert To body
        $(document.body).insert(dim);
        $(document.body).insert(cont);
    },
    /**
     * Sets a goal silently then calls the callback
     * @param {Object} name
     * @param {Object} callback
     */
    setGoal: function (name, testName, callback) {
        setTimeout(function () {
            this.Request({
                parameters: {
                    action: 'setGoal',
                    testName: testName,
                    name: name
                },
                onComplete: function () {
                    if (callback) {
                        callback();
                    }
                }
            });
        }.bind(this), 50);
    },
    /**
     * Wrapper for ajax requests
     * @param {Object} options
     */
    Request: function (options) {
        var action = "";
        if (Object.isString(options)) {
            action = options;
            options = arguments[1] || {};
        }

        options = Object.extend({
            onSuccess: Prototype.K,
            onFail: Prototype.K,
            onComplete: Prototype.K,
            onTimeout: Prototype.K,
            asynchronous: true,
            parameters: {},
            server: "/server.php",
            evalJSON: "force",
            method: 'post',
            timeout: false
        }, options || {});

        if (action !== "") {
            options.parameters.action = action;
        }

        var ajax = new Ajax.Request(options.server, {
            parameters: options.parameters,
            evalJSON: options.evalJSON,
            asynchronous: options.asynchronous,
            method: options.method,
            onComplete: function (t) {
                try {
                    if (t.status === 0) {
                        return;
                    } // aborted

                    var res = {success: false, error: 'There was an error on the page. Try reloading the page.<br>' + t.responseText};

                    if (options.evalJSON === false) {
                        res = {success: true, message: t.responseText};
                    }

                    if (t.responseJSON) {

                        res = t.responseJSON;
                    }

                    if (res.success) {
                        options.onSuccess(res, t.responseText);
                    } else {
                        options.onFail(res, t.responseText);
                    }
                    options.onComplete(res, t.responseText);

                    if ($('loading-indicator')) {
                        $('loading-indicator').shift({bottom: 0, link: 'ignore', duration: 0.5});
                    }
                } catch (e) {
                    console.error(e, 'Error on (' + options.parameters.action + ')');
                }
            }
        });

        if (options.timeout !== false) {
            setTimeout(function () {
                try {
                    if (ajax.getStatus() === 0) {
                        ajax.transport.abort();
                        var r = {success: false, error: 'Request Timeout'};
                        options.onComplete(r);
                        options.onTimeout(r);
                    }
                } catch (e) {
                }
            }, options.timeout * 1000);
        }

        return ajax;
    },
    /**
     * Gets the user information from server and sets for further use
     * @param {Object} response
     */
    setUserInfo: function (response) {
        if (response.success) {
            this.user = response.user;
            this.user.usage = response.usage;
            this.user.gravatar = response.gravatar;
            this.user.avatarUrl = response.avatarUrl;
        }
    },
    /**
     * Get file extension
     * @param {Object} filename
     */
    getFileExtension: function (filename) {
        return (/[.]/.exec(filename)) ? (/[^.]+$/.exec(filename))[0] : "";
    },
    fixIEDoubleLine: function (code) {
        code = code.replace(/<p\>/gim, '');
        code = code.replace(/<\/p\>/gim, '<br>');
        return code;
    },
    /**
     * Fix thetop position of the bars when an overflow occured
     * @param {Object} element
     * @param {Object} top
     * @param {Object} btop
     */
    fixBars: function (element, top, btop) {
        var theight = $('tools-wrapper').getHeight() + 10;
        var cheight = $('content').getHeight() + 50;
        $('tools-wrapper').setStyle({top: (cheight - theight) + 'px'}).updateScroll();
        $('tool_bar').setStyle({top: cheight - (theight + 68) + 'px'}).updateScroll();
    },
    /**
     * When you scrolldown, this function prevents toolboxes the overflow content area
     * @param {Object} element
     * @param {Object} top
     * @param {Object} btop
     */
    scrollLimits: function (element, top, btop) {

        if (this.isFullScreen /*|| Prototype.Browser.IE9*/) {
            return;
        }

        var cheight = $('content').getHeight() + 50;
        var theight = $('tools-wrapper').getHeight() + 68;
        if (btop + theight > cheight) {
            return false;
        }
    },
    /**
     * Toggles the fullscreen mode ON / OFF
     * @param {Object} button
     */
    screenToggle: function (button) {
        //Emre: dropdown report does not work (65626)
        function reportsBoxPositionChange(zIndex, top) {
            var box;
            if ((box = $('reportsBox'))) {
                var off = $('reportsButton').cumulativeOffset();
                var dim = $('reportsButton').getDimensions();
                box.setStyle({zIndex: zIndex, top: top, left: (off.left) + 'px'});
            }
        }
        if (!this.isFullScreen) {
            this.isFullScreen = true;
            $('main').className = 'fullscreen';
            button.src = "images/fs2.png";
            button.alt = button.title = "Go Normal Screen".locale();
            $('tools-wrapper').updateTop(108).updateScroll();
            $('tool_bar').updateTop(39).updateScroll();
            this.updateBarHeightInFullScreen();

            // Hide the feedback tab.
            if ($('feedback-tab')) {
                $('feedback-tab').hide();
            }
            if ($('themes-selector')) {
                $('themes-selector').hide();
            }
            if ($('prop-tabs')) {
                $('prop-tabs').setStyle({width: (document.viewport.getWidth() - 200) + 'px'});
            }
            Event.observe(window, 'resize', this.updateBarHeightInFullScreen.bind(this));
            document.createCookie('fullscreen', 'yes');
            //Emre: dropdown report does not work (65626)
            reportsBoxPositionChange(1000, "109px");

        } else {
            this.isFullScreen = false;
            $('main').className = 'main';
            button.src = "images/fs1.png";
            button.alt = button.title = "Go Full Screen".locale();
            $('tools-wrapper').updateTop(this.toolBoxTop).updateScroll();
            $('tool_bar').updateTop(this.formBuilderTop).updateScroll();
            $('right-panel').setStyle({height: 'auto'});
            $('stage').setStyle({height: 'auto', width: '699px'});
            if ($('search-bar')) {
                $('search-bar').setStyle({left: '201px', width: ''});
            }
            $('content').setStyle({height: ''});
            // Show the feedback tab.
            if ($('feedback-tab')) {
                $('feedback-tab').show();
            }
            if ($('themes-selector')) {
                $('themes-selector').show();
            }

            if ($('prop-tabs')) {
                $('prop-tabs').setStyle({width: '100%'});
            }
            Event.stopObserving(window, 'resize', this.updateBarHeightInFullScreen.bind(this));
            document.eraseCookie('fullscreen', 'yes');
            //Emre: dropdown report does not work (65626)
            reportsBoxPositionChange(1, "176px");

        }

        if ('closeActiveButton' in window) {
            closeActiveButton();
            if (selected) {
                var t = selected;
                unselectField();
                setTimeout(function () {
                    t.run('click');
                }, 10);
            }

            setTimeout(function () {
                makeToolbar(form);
            }, 10);
        }
        this.updateBuildMenusize();
    },
    /**
     * Makes sure the style menu size is always the same as stage size
     */
    updateBuildMenusize: function () {
        if ($('style-content')) {
            $('style-content').setStyle({height: ($('stage').getHeight() - 58) + "px"});
        }
    },
    /**
     * Calculates the max scroll for window
     * @param {Object} pass
     */
    getScrollMax: function () {
        var res = [];
        if (window.scrollMaxX === undefined) {
            res = [
                document.documentElement.scrollWidth - document.documentElement.clientWidth,
                document.documentElement.scrollHeight - document.documentElement.clientHeight
            ];
        } else {
            res = [
                window.scrollMaxX,
                window.scrollMaxY
            ];
        }

        return res;
    },
    /**
     * When we switched to full screen mode this function
     * manually updates some dimensions on the screen
     */
    updateBarHeightInFullScreen: function () {
        if (!this.isFullScreen) {
            return;
        }
        var removeScroll = this.getScrollMax()[1] < 0;
        if (removeScroll) {
            $(document.body).setStyle({overflow: 'hidden'});
        }

        var dwidth = document.viewport.getWidth();
        var dheight = document.viewport.getHeight();
        var fheight = $('forms') ? $('forms').getHeight() + 200 : ($('list') ? $('list').getHeight() : $('stage').getHeight());
        $('right-panel').setStyle({height: (((dheight > fheight) ? dheight - 40 : fheight + 68)) + 'px'});
        $('stage').setStyle({height: (((dheight > fheight) ? dheight - 108 : fheight)) + 'px', width: (dwidth - 200) + 'px'});
        $('content').setStyle({height: (((dheight > fheight) ? dheight - 108 : fheight)) + 'px'});
        if ($('search-bar')) {
            $('search-bar').setStyle({left: '200px', width: (dwidth - 216) + 'px'});
        }
        if ($('prop-tabs')) {
            $('prop-tabs').setStyle({width: (document.viewport.getWidth() - 200) + 'px'});
        }

        if (removeScroll) {
            $(document.body).setStyle({overflow: ''});
        }
    },
    /**
     * Checks the parameters and decides to swithc to fullscreen or not
     */
    fullScreenListener: function () {
        if ((location.hash.toLowerCase() == "#fullscreen" || document.readCookie('fullscreen')) && (!Utils.isFullScreen)) {
            this.screenToggle($('fullscreen-button'));
        }
    },
    /**
     * Make the toolbars floting on the screen when scrolled
     */
    setToolbarFloat: function () {
        window.scrollTo(0, 0);
        $('tool_bar').positionFixed({
            offset: 0,
            onBeforeScroll: this.scrollLimits,
            onBeforeScrollFail: this.fixBars,
            onScroll: function (element, top) {
                if (top > this.formBuilderTop || (this.isFullScreen && top > 20)) {
                    if (!$("toolbox_handler").buttonAdded) {
                        $("toolbox_handler").insert(new Element('img', {
                            src: "images/blank.gif",
                            className: "toolbar-arrow-top",
                            align: "bottom",
                            alt: 'Top'.locale(),
                            title: 'Go to Top'.locale()
                        }).setStyle({cursor: 'pointer'}).observe('click', function () {
                            $(document.body).shift({
                                scrollTop: 0
                            });
                        }));
                        $('tool_bar').setStyle('border-bottom:1px solid #aaa');
                        $("toolbox_handler").buttonAdded = true;
                    }
                } else { // top < formBuilderTop
                    if ($("toolbox_handler").buttonAdded) {
                        $('tool_bar').setStyle({borderBottom: ''});
                        $("toolbox_handler").update("&nbsp;");
                        $("toolbox_handler").buttonAdded = false;
                    }
                }
            }.bind(this)
        });
    },
    /**
     * Make the toolboxes floting on the screen when scrolled
     */
    setToolboxFloat: function () {
        window.scrollTo(0, 0);
        $('tools-wrapper').positionFixed({
            offset: 69,
            onBeforeScroll: this.scrollLimits,
            onBeforeScrollFail: this.fixBars
        });
    },
    /**
     * Updates the positions of toolbars resets the scroll bug
     */
    updateToolbars: function () {
        if ($('tools-wrapper')) {
            $('tools-wrapper').updateScroll();
        }
        if ($('tool_bar')) {
            $('tool_bar').updateScroll();
        }
    },
    /**
     * Alerts a message on the page
     * @param {Object} mess message to show
     * @param {Object} title Title of the window
     * @param {Object} callback function run after user closes the alert window
     */
    alert: function (mess, title, callback, options) {
        options = Object.extend({
            okText: 'OK'.locale(),
            width: 300,
            noCenter: false,
            onInsert: Prototype.K,
            onClose: Prototype.K
        }, options || {});

        if (this.messageWindow) {
            this.messageWindow.close();
        }

        this.messageWindow = document.window({
            title: title || 'Message From Jotform'.locale(),
            content: options.noCenter ? mess : '<center>' + mess + '</center>',
            modal: true,
            width: options.width,
            dimZindex: 10012,
            winZindex: 10013,
            contentPadding: '15',
            buttonsAlign: 'center',
            onClose: options.onClose,
            buttons: [{
                    title: options.okText,
                    name: 'OK',
                    handler: function (w) {
                        if (callback) {
                            if (callback() === false) {
                                return;
                            }
                        }
                        this.messageWindow = false;
                        w.close();
                    }.bind(this)
                }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({fontWeight: 'bold'});
                setTimeout(function () {
                    w.buttons.OK.focus();
                }, 100);
                options.onInsert(w);
            }
        });

        return this.messageWindow;
    },
    /**
     * Asks users to enter a value
     * @param {Object} mess         question to ask
     * @param {Object} defaultValue default value to show a tip or example
     * @param {Object} title        title of the window
     * @param {Object} callback     function to call after user enters a value
     */
    prompt: function (mess, defaultValue, title, callback, options) {

        options = Object.extend({
            okText: 'OK'.locale(),
            cancelText: 'Cancel'.locale(),
            width: 300,
            fieldType: 'text'
        }, options || {});

        if (this.messageWindow) {
            this.messageWindow.close();
        }

        var promptContent = new Element('div');
        promptContent.insert(mess);
        promptContent.insert("<br><br>");

        if (options.fieldType === 'textarea') {
            var input = new Element('textarea').setStyle({'width': '99%', 'height': '60px', 'resize': 'vertical'});
        } else {
            var input = new Element('input', {type: options.fieldType}).setStyle('width:100%');
        }
        if (options.placeholder) {
            input.setAttribute('placeholder', options.placeholder);
        }

        input.value = defaultValue || "";
        promptContent.insert(input);

        this.messageWindow = document.window({
            title: title || 'Message From Jotform'.locale(),
            content: promptContent,
            modal: true,
            width: options.width,
            dimZindex: 10014,
            winZindex: 10015,
            contentPadding: '15',
            onClose: function (w, key) {
                if (key == "ESC" || key == "CROSS") {
                    if (callback) {
                        if (callback(false, 'Cancel', false, this.messageWindow) !== false) {
                            this.messageWindow = false;
                            return true;
                        }
                    } else {
                        this.messageWindow = false;
                        return true;
                    }
                }
            }.bind(this),
            buttons: [{
                    title: options.cancelText,
                    name: 'Cancel',
                    link: true,
                    // hidden: true, // Disabled Cancel texts. They are very ugly and there is no need for them. You can click X button.
                    handler: function (w) {
                        if (callback) {
                            if (callback(false, 'Cancel', false, this.messageWindow) !== false) {
                                this.messageWindow = false;
                                w.close();
                            }
                        } else {
                            this.messageWindow = false;
                            w.close();
                        }
                    }.bind(this)
                }, {
                    title: options.okText,
                    name: 'OK',
                    color: 'green',
                    handler: function (w) {
                        if (callback) {
                            if (callback(input.value, 'OK', true, this.messageWindow) !== false) {
                                this.messageWindow = false;
                                w.close();
                            }
                        } else {
                            this.messageWindow = false;
                            w.close();
                        }
                    }.bind(this)
                }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({fontWeight: 'bold'});
                input.select();
                input.observe('keydown', function (e) {
                    e = document.getEvent(e);
                    if (e.keyCode == 13 && options.fieldType !== "textarea") {
                        w.buttons.OK.run('click');
                    }
                });
            }
        });

        this.messageWindow.inputBox = input;

        return this.messageWindow;
    },
    /**
     * Displays a confirm dialog
     * @param {Object} mess   Message to show user, question to ask
     * @param {Object} title  Title of the window
     * @param {Object} callback function to run when user makes a choice
     */
    confirm: function (mess, title, callback, confirm, cancel) {
        if (this.messageWindow) {
            this.messageWindow.close();
        }

        var confirmText = confirm ? confirm : 'OK';
        var cancelText = cancel ? cancel : 'Cancel';

        this.messageWindow = document.window({
            title: title || 'Message From Jotform'.locale(),
            content: '<center>' + mess + '</center>',
            modal: true,
            width: '300',
            dimZindex: 10010,
            winZindex: 10011,
            contentPadding: '15',
            //buttonsAlign:'center',
            buttons: [{
                    title: confirmText.locale(),
                    color: (confirm == "Ignore".locale() && cancel == "Translate".locale()) ? "blood" : "",
                    name: 'OK',
                    handler: function (w) {
                        this.messageWindow = false;
                        w.close();
                        if (callback) {
                            callback('OK', true);
                        }
                    }
                }, {
                    title: cancelText.locale(),
                    name: 'Cancel',
                    link: true,
                    handler: function (w) {
                        this.messageWindow = false;
                        w.close();
                        if (callback) {
                            callback('Cancel', false);
                        }
                    }
                }],
            onInsert: function (w) {
                w.buttons.OK.setStyle({fontWeight: 'bold'});
                setTimeout(function () {
                    w.buttons.OK.focus();
                }, 100);
            }
        });
        return this.messageWindow;
    },
    /**
     * Apple's sweet poof effect
     * @param {Object} e
     */
    poof: function (e) {
        if (Prototype.Browser.IE) {
            return;
        }
        var img = new Element("div").setStyle('height:55px; width:55px; background-image:url(images/poof.png); z-index:10000000');

        var interval = false;
        var c = 1;
        $(document.body).insert(img);
        img.setStyle({position: "absolute", top: (Event.pointerY(e) - 0) + "px", left: (Event.pointerX(e) - 0) + "px"});

        var positions = ["0", "55", "110", "165", "220"];
        setTimeout(function () {
            interval = setInterval(function () {
                if (c >= 4) {
                    clearInterval(interval);
                    img.remove();
                    return true;
                } else {
                    c++;
                }

                img.setStyle({backgroundPosition: '-' + positions[c] + "px"});
            }, 100);
        }, 100);
    },
    /**
     * adds zeros at the beggining of any number
     * kinda like strpad
     * @param {Object} n
     * @param {Object} totalDigits
     */
    addZeros: function (n, totalDigits) {
        n = n.toString();
        var pd = '';
        if (totalDigits > n.length) {
            for (var i = 0; i < (totalDigits - n.length); i++) {
                pd += '0';
            }
        }
        return pd + n.toString();
    },
    /**
     * PHP's number format function
     * @param {Object} number
     * @param {Object} decimals
     * @param {Object} dec_point
     * @param {Object} thousands_sep
     */
    numberFormat: function (number, decimals, dec_point, thousands_sep) {
        var n = number, prec = decimals;
        var toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return (Math.round(n * k) / k).toString();
        };
        n = !isFinite(+n) ? 0 : +n;
        prec = !isFinite(+prec) ? 0 : Math.abs(prec);
        var sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep;
        var dec = (typeof dec_point === 'undefined') ? '.' : dec_point;
        var s = (prec > 0) ? toFixedFix(n, prec) : toFixedFix(Math.round(n), prec);
        var abs = toFixedFix(Math.abs(n), prec);
        var _, i;
        if (abs >= 1000) {
            _ = abs.split(/\D/);
            i = _[0].length % 3 || 3;
            _[0] = s.slice(0, i + (n < 0)) + _[0].slice(i).replace(/(\d{3})/g, sep + '$1');
            s = _.join(dec);
        } else {
            s = s.replace('.', dec);
        }

        if (s.indexOf(dec) === -1 && prec > 1) {
            var preca = [];
            preca[prec - 1] = undefined;
            s += dec + preca.join(0) + '0';
        } else if (s.indexOf(dec) == s.length - 2) { // incorrect: 2.7, correct: 2.70
            s += '0';
        }
        return s;
    },
    /**
     * Formats the prices and currencies
     * @param {Object} amount amount of the money
     * @param {Object} curr Currency of the money
     * @param {Object} id specific id of the span wrapper of money, so that you can change it dynamically
     */
    formatPrice: function (amount, curr, id, nofree) {
        if (!curr) {
            curr = 'USD';
        }
        id = id || "";
        if (parseFloat(amount) === 0 && nofree !== true) {
            return 'Free';
        }
        amount = this.numberFormat(amount, 2, '.', ','); // Format the number for money currency
        switch (curr) {
            case "USD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> USD</span>';
            case "EUR":
                return "&euro;<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> EUR</span>';
            case "GBP":
                return "&pound;<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> GBP</span>';
            case "BRL":
                return "R$ <span id=\"" + id + "\">" + amount + '</span>';
            case "AUD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
            case "CAD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
            case "NZD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
            case "SGD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
            case "HKD":
                return "$<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
            default:
                return "<span id=\"" + id + "\">" + amount + '</span> <span class="curr-text"> ' + curr + '</span>';
        }
    },
    /**
     * Faster and sharper deepclone function
     * Clones an object without referencing the child nodes
     * @param {Object} obj
     */
    deepClone: function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var clone = Object.isArray(obj) ? [] : {};
        for (var i in obj) {
            var node = obj[i];
            if (typeof node == 'object') {
                if (Object.isArray(node)) {
                    clone[i] = [];
                    for (var j = 0; j < node.length; j++) {
                        if (typeof node[j] != 'object') {
                            clone[i].push(node[j]);
                        } else {
                            clone[i].push(this.deepClone(node[j]));
                        }
                    }
                } else {
                    clone[i] = this.deepClone(node);
                }
            } else {
                clone[i] = node;
            }
        }
        return clone;
    },
    convert24to12: function (time) {
        time = time.split(":");
        var suffix = "";
        if (Number(time[0]) > 12) {
            suffix = "pm";
            time[0] = time[0] - 12;
        }
        else if (Number(time[0]) == 12) {
            suffix = "pm";
        }
        else if (Number(time[0]) > 0) {
            suffix = "am";
        }
        else if (Number(time[0]) === 0) {
            suffix = "am";
            time[0] = 12;
        }
        return {time: time[0] + ":" + time[1], suffix: suffix};
    },
    convert12to24: function (time, suffix) {
        if (suffix.toLowerCase() == "am" && time.match(/^12:.*/)) {
            return time.replace(/^12:(.*)/, "00:$1");
        } else if (suffix.toLowerCase() == "am" || time.match(/^12:.*/)) {
            return time;
        } else {
            return time.replace(/^(.*):(.*)/, function (all, h, m) {
                return (Number(h) + 12) + ":" + m;
            });
        }
    },
    /**
     * Old version of deep clone, it's quite slow
     * @deprecated
     * @param {Object} obj
     */
    deepClone_old: function (obj) {
        pt.start('DeepClone');
        var s = Object.toJSON(obj); // Convert it to JSON
        s = s.evalJSON(); // When parsed it will be a completely new array
        pt.end('DeepClone');
        return s;
    },
    /*
     * Use this function to fire event (not custom events..)
     */
    fireEvent: function (element, event) {
        var evt;
        if (document.createEventObject) {
            // dispatch for IE
            evt = document.createEventObject();
            return element.fireEvent('on' + event, evt);
        }
        else {
            // dispatch for firefox + others
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true); // event type,bubbling,cancelable
            return !element.dispatchEvent(evt);
        }
    },
    /**
     * Creates the accordions in left toolbox
     * @param {Object} the container of the accordion. It's a prevention for two different accordions
     *                 the same page.
     * @param {Object} openIndex which panel to open initially
     */
    setAccordion: function (accordionContainer, options) {
        var openPanel; // Currently open panel
        // get all panels
        $$('#' + accordionContainer.id + ' .panel').each(function (panel, i) {

            var bar = panel.select('.panel-bar')[0];
            var content = panel.select('.panel-content')[0];
            content.setStyle({height: 'auto'}).absolutize();
            content.panel = panel;
            // Set the height of the opened division
            var h = 0;
            if (options.height) {
                h = options.height;
            } else {
                h = content.getHeight();
            }
            content.relativize().setStyle({position: ''});
            var tools = content.select('.tools')[0];
            if (options.openIndex != i) {
                panel.addClassName('panel-closed');
                content.setStyle({height: '0px', background: '#bbb'});
                tools.hide();
            } else {
                openPanel = content.setStyle({overflow: 'visible', height: h + "px", background: '#f5f5f5'}).addClassName('panel-content-open');
            }
            bar.setUnselectable();
            bar.observe('click', function () {
                if (openPanel) {
                    openPanel.style.position = 'relative';
                    openPanel.setStyle({
                        overflow: 'hidden'
                    }).shift({
                        height: 0,
                        background: '#bbb',
                        //scrollTop:h,
                        duration: 0.5,
                        onEnd: function (el) {
                            el.panel.addClassName('panel-closed');
                            el.removeClassName('panel-content-open');
                            if (el.select('.tools')) {
                                el.select('.tools')[0].hide();
                            }
                        }
                    });
                }
                if (openPanel != content) {
                    if (tools) {
                        tools.show();
                    }
                    content.panel.removeClassName('panel-closed');
                    openPanel = content.shift({
                        height: h,
                        //scrollTop:0,
                        duration: 0.5,
                        background: '#f5f5f5',
                        onEnd: function () {
                            openPanel.style.position = '';
                            content.setStyle({
                                overflow: 'visible'
                            });
                        }
                    }).addClassName('panel-content-open');
                } else {
                    openPanel = false;
                }
            });
        });
    },
    /**
     * Loads a template into page
     * @param {Object} template template name
     * @param {Object} callback callback function to run when the template is loaded
     */
    loadTemplate: function (template, callback) {
        try {
            if (this.templateCache[template]) {
                callback(this.templateCache[template]);
            } else {
                var t = new Ajax.Request(template + "?" + this.session, {
                    method: 'get',
                    onComplete: function (t) {
                        try {
                            if (t.status != 200) {
                                this.alert('There is an error on the wizard. Please contact Jotform Support.'.locale());
                                return;
                            }
                            this.templateCache[template] = t.responseText;
                            callback(t.responseText);
                        } catch (e) {
                            console.error(e);
                        }
                    }.bind(this)
                });
            }
        } catch (e) {
            //console.error(e);
        }
    },
    getCloudURL: function () {
        return this.isSecure ? 'https://static-interlogyllc.netdna-ssl.com/' : 'http://max.jotfor.ms/';
    },
    /**
     * Loads a script dynamically
     * @param {Object} file Script to load
     * @param {Object} callback callback function for further calls
     * @param {Object} arg argument for function
     */
    loadScript: function (file, callback, arg) {
        this.useArgument = arg;

        callback || (callback = function () {
        });

        if (this.templateCache[file]) {
            if (callback) {
                callback(arg);
            } else {
                this.templateCache[file](arg);
            }
        } else {
            try {
                this.templateCache[file] = callback;
                var script = document.createElement('script');
                script.type = "text/javascript";
                script.src = file + "?" + this.session;
                $(document.body).appendChild(script);
                if (arg === true) {
                    callback();
                }
            } catch (e) {
                console.error(e);
            }
        }
    },
    loadedLinks: [],
    /**
     * Dynamically loads given CSS file
     * @param {Object} url
     */
    loadCSS: function (url) {
        if ($A(this.loadedLinks).include(url)) {
            return;
        }
        this.loadedLinks.push(url);
        if (document.createStyleSheet) {
            document.createStyleSheet(url + ("?" + this.session));
        } else {
            $$('head')[0].insert('<link rel="stylesheet" type="text/css" href="' + url + ("?" + this.session) + '" />');
        }

        return $$('link[href=' + url + ']')[0];
    },
    /**
     * Loads a CSS file and calls given callback function
     */
    requireCSS: function (source, onLoad) {
        var $this = this;
        var link = new Element('link', {
            rel: 'stylesheet',
            media: 'screen',
            type: 'text/css',
            href: source
        });

        if (("onload" in link) && !Prototype.Browser.WebKit) {
            if (onLoad) {
                link.onload = onLoad;
            }
        } else {
            var img = new Element('img');
            img.style.display = 'none';
            img.onerror = function () {
                setTimeout(function () {
                    if (onLoad) {
                        onLoad(link);
                    }
                    img.remove();
                }, 100);
            };
            img.src = source;
            $(document.body).insert(img);
        }

        $$('head')[0].insert(link);

        return link;
    },
    /**
     * Dynamically creates CSS declerations
     * @param {Object} selector
     * @param {Object} declaration
     */
    createCSS: function (selector, declaration) {
        var self = this;
        var isIE = Prototype.Browser.IE;

        if (isIE) {
            // IE cannot create multiple class names at once
            // So we split them into single classes and create them one by one
            if (selector.include(',')) {
                $A(selector.split(/\s*,\s*/)).each(function (s) {
                    self.createCSS(s, declaration);
                });
                return;
            }
        }

        if (declaration === "") {
            return;
        }
        var id = "style-" + selector.replace(/\W/gim, '');
        if ($(id)) {
            $(id).remove();
        }

        // create the style node for all browsers
        var style_node = document.createElement("style");
        style_node.id = id;
        style_node.setAttribute("type", "text/css");
        style_node.setAttribute("media", "screen");

        // append a rule for good browsers
        if (!isIE) {
            style_node.appendChild(document.createTextNode(selector + " {" + declaration + "}"));
        }

        // append the style node
        document.getElementsByTagName("head")[0].appendChild(style_node);

        // use alternative methods for IE
        if (isIE && document.styleSheets && document.styleSheets.length > 0) {
            var last_style_node = document.styleSheets[document.styleSheets.length - 1];
            if (typeof (last_style_node.addRule) == "object") {
                try {
                    last_style_node.addRule(selector, declaration);
                } catch (e) {
                    console.error(Object.toJSON(e));
                }
            }
        }
    },
    /**
     * Checks if the CSS loaded already?
     * When it ensures CSS loaded then runs the callback
     * @param {Object} callback  this call back function throws an error if the CSS stylesheet not found
     */
    tryCSSLoad: function (callback) {
        if (this.cssloaded) {
            this.cssloaded = false;
            return;
        }
        try {
            callback();
            this.cssloaded = true;
        } catch (e) {
            setTimeout(function () {
                this.tryCSSLoad(callback);
            }.bind(this), 10);
        }
    },
    /**
     * Gets the style from style sheet
     * @param {Object} selector
     */
    getStyleBySelector: function (selector) {
        var sheetList = document.styleSheets;
        var ruleList;
        var i, j;

        /**
         * look through stylesheets in reverse order that
         * they appear in the document
         * if this throws an error, it means CSS file is not loaded yet
         */
        for (i = sheetList.length - 1; i >= 0; i--) {
            ruleList = sheetList[i].cssRules;
            for (j = 0; j < ruleList.length; j++) {
                if (ruleList[j].type == CSSRule.STYLE_RULE &&
                        ruleList[j].selectorText == selector) {
                    return ruleList[j].style;
                }
            }
        }
        return null;
    },
    /**
     * Validates email addresses
     * @param {Object} email
     */
    checkEmailFormat: function (email) {
        if (!Object.isString(email)) {
            return false;
        }
        email = email.toLowerCase();
        return email.match(this.emailRegex);
    },
    /**
     * parseUri 1.2.2
     * @author (c) Steven Levithan <stevenlevithan.com>
     * @license MIT License
     * @param {Object} str
     * @param {Object} options
     */
    parseUri: function (str, options) {

        options = Object.extend({
            strictMode: false,
            key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
            q: {
                name: "queryKey",
                parser: /(?:^|&)([^&=]*)=?([^&]*)/g
            },
            parser: {
                strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
            }
        }, options || {});

        var m = options.parser[ (options.strictMode) ? "strict" : "loose"].exec(str), uri = {}, i = 14;

        while (i--) {
            uri[options.key[i]] = m[i] || "";
        }

        uri[options.q.name] = {};
        uri[options.key[12]].replace(options.q.parser, function ($0, $1, $2) {
            if ($1) {
                uri[options.q.name][$1] = $2;
            }
        });

        return uri;
    },
    /**
     * Converts byte octets to human readable values
     * @param {Object} octets
     */
    bytesToHuman: function (octets) {
        units = ['B', 'kB', 'MB', 'GB', 'TB']; // ...etc
        for (var i = 0, size = octets; size > 1024; size = size / 1024) {
            i++;
        }
        return this.numberFormat(size, 2) + '<span class="octets">' + units[Math.min(i, units.length - 1)] + '</span>';
    },
    /**
     * Encodes given object as base64 string
     * @param parameters array or key value pair for parameters
     * @return string base64 encoded string
     */
    baseEncode: function (parameters) {
        var encoded = Base64.encode(Object.isArray(parameters) ? $A(parameters).toQueryString() : $H(parameters).toQueryString());
        return encodeURIComponent(encoded.replace(/([\+\/\=])/g, function (a) {
            switch (a) {
                case "/":
                    return "-";
                case "+" :
                    return "_";
                case "=":
                    return ",";
            }
            return a;
        }));
    },
    /**
     * Decodes given base64String and returns an array of parameters
     * @param string base65 encoded string to parse
     * @return Object parsed query string
     */
    baseDecode: function (string) {
        string = decodeURIComponent(string).replace(/([\-\_\,])/g, function (a) {
            switch (a) {
                case "-":
                    return "/";
                case "_" :
                    return "+";
                case ",":
                    return "=";
            }
            return a;
        });
        var decoded = Base64.decode(string);
        return decoded.parseQuery();
    },
    /**
     * Prompt a download and run callback when download is ready
     */
    promptDownload: function (file, callback, error) {
        var i = $(document.createElement('iframe'));
        i.name = "downloadFrame";

        $(document.body).insert(i);
        //post document src to prevent get length limit
        //insert download token
        var downloadToken = new Date().getTime();
        var form = new Element('form', {
            action: file + "&token=" + downloadToken,
            method: 'post',
            target: 'downloadFrame',
            acceptCharset: 'utf-8'
        });

        $(document.body).insert(form);
        form.submit();
        form.remove();

        //get cookie value
        function getCookie(name) {
            var parts = document.cookie.split(name + "=");
            if (parts.length == 2)
                return parts.pop().split(";").shift();
        }

        var attempts = 100;
        var downloadTimer = window.setInterval(function () {
            var token = getCookie("downloadToken");

            if (token == downloadToken) {
                window.clearInterval(downloadTimer);
                document.cookie = "downloadToken=deleted; expires=" + new Date(0).toUTCString();
                if (callback) {
                     callback(file);
                }
            } else if (attempts == 0) {
                if (error)
                    error(file);
                else if (callback)
                    callback();
                window.clearInterval(downloadTimer);
                document.cookie = "downloadToken=deleted; expires=" + new Date(0).toUTCString();
            }
            attempts--;
        }, 1000);
        setTimeout(function () {
            i.remove();
        }, 100000);
    },
    /**
     * Redirect a user to a page with given parameters
     */
    redirect: function (url, options) {

        options = Object.extend({
            download: false,
            onLoad: false, // only works when download:true
            onFail: false, // only works when download:true
            method: 'get',
            parameters: false,
            target: '_self',
            encode: false
        }, options || {});

        if (options.download === true) {
            var file;
            if (options.encode) {
                file = url + "?encoded=" + this.baseEncode(options.parameters);
            } else {
                file = url + "?" + $H(options.parameters).toQueryString();
            }
            this.promptDownload(file, options.onLoad, options.onFail);
        } else {
            var form = new Element('form', {
                action: url,
                method: options.method.toLowerCase(),
                target: options.target,
                acceptCharset: 'utf-8'
            });

            if (options.encode) {
                var encode = new Element('input', {type: 'hidden', name: 'encoded'});
                encode.value = this.baseEncode(options.parameters);
                form.insert(encode);
            } else {
                $H(options.parameters).each(function (field) {
                    var f = new Element('input', {type: 'hidden', name: field.key});
                    f.value = field.value;
                    form.insert(f);
                });
            }
            $(document.body).insert(form);
            form.submit();
            form.remove();
            setTimeout(function () {
                if (options.onLoad)
                    options.onLoad();
            }, 3000);
        }
    },
    selectAll: function (e) {
        e.target.focus();
        e.target.select();
    },
    addClipboard: function (holderId, sourceId) {
        var holder = $(holderId);
        if (!holder || !$(sourceId)) {
            return;
        }
        var clipboardId = sourceId + "Copy";
        var clipboardHTML = "<object width='14' height='14' id='clippy' class='clippy' classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000'>";
        clipboardHTML += "<param value='js/clippy.swf?v5' name='movie'>";
        clipboardHTML += "<param value='always' name='allowScriptAccess'>";
        clipboardHTML += "<param value='high' name='quality'>";
        clipboardHTML += "<param value='noscale' name='scale'>";
        clipboardHTML += "<param value='id=" + clipboardId + "&amp;copied=&amp;copyto=' name='FlashVars'>";
        clipboardHTML += "<param value='#FFFFFF' name='bgcolor'>";
        clipboardHTML += "<param value='opaque' name='wmode'>";
        clipboardHTML += "<embed width='14' height='14' wmode='opaque' bgcolor='#FFFFFF' flashvars='id=" + clipboardId + "&amp;copied=&amp;copyto=' pluginspage='http://www.macromedia.com/go/getflashplayer' type='application/x-shockwave-flash' allowscriptaccess='always' quality='high' name='clippy' src='js/clippy.swf?v5'>";
        clipboardHTML += "</object>";
        clipboardHTML += "<span id='" + clipboardId + "' style='display: none;'></span>";

        holder.update(clipboardHTML);
        var clipboard = $(clipboardId);
        // equalize both..
        clipboard.update($(sourceId).value);
        $(sourceId).observe('change',
                function (event) {
                    var element = event.target;
                    clipboard.update(element.value);
                }
        );

        buttonToolTips(holder, {
            message: 'Copy to clipboard'.locale(),
            title: 'Copy'.locale(),
            arrowPosition: 'top',
            offset: 10
        });
    },
    /**
     *
     * @param {Object} input
     * @param {Object} pad_length
     * @param {Object} pad_string
     * @param {Object} pad_type
     */
    strPad: function (input, pad_length, pad_string, pad_type) {

        var half = '', pad_to_go;

        var str_pad_repeater = function (s, len) {
            var collect = '', i;

            while (collect.length < len) {
                collect += s;
            }
            collect = collect.substr(0, len);

            return collect;
        };

        input += '';
        pad_string = pad_string !== undefined ? pad_string : ' ';

        if (pad_type != 'STR_PAD_LEFT' && pad_type != 'STR_PAD_RIGHT' && pad_type != 'STR_PAD_BOTH') {
            pad_type = 'STR_PAD_RIGHT';
        }
        if ((pad_to_go = pad_length - input.length) > 0) {
            if (pad_type == 'STR_PAD_LEFT') {
                input = str_pad_repeater(pad_string, pad_to_go) + input;
            }
            else if (pad_type == 'STR_PAD_RIGHT') {
                input = input + str_pad_repeater(pad_string, pad_to_go);
            }
            else if (pad_type == 'STR_PAD_BOTH') {
                half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
                input = half + input + half;
                input = input.substr(0, pad_length);
            }
        }

        return input;
    },
    /**
     * Creates the default email instead of the old one
     * @param {Object} type
     * @param {Boolean} textOnly
     * @param {Boolean} table Return tablecontent only
     */
    defaultEmail: function (type, textOnly, table) {
        var $this = this;
        // if hide empty fields is enabled, return a non-editable data table
        var tableClass = (form.getProperty('hideMailEmptyFields') === 'enable' || form.getProperty('hideMailEmptyFields') === 'Enabled') ? 'mceNonEditable' : 'mceEditable';
        var content = "";
        var tableContent = "";

        if (textOnly) {
            $A(getUsableElements()).each(function (elem, i) {
                content += '\n' + $this.strPad(elem.getProperty('text'), 25, ' ', 'STR_PAD_RIGHT');
                content += '{' + elem.getProperty('name') + '}';
            });
            return content;
        }
        var url = this.HTTP_URL;

        content = '<html><body bgcolor="#f7f9fc" class="Created on Form Builder">\n';
        content += '    <table bgcolor="#f7f9fc" width="100%" border="0" cellspacing="0" cellpadding="0">\n';
        content += '    <tr>\n';
        content += '      <td height="30">&nbsp;</td>\n';
        content += '    </tr>\n';
        content += '    <tr>\n';
        content += '      <td align="center"><table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#eeeeee" >\n';
        content += '        <tr>\n';
        content += '          <td width="13" height="30" background="' + url + 'images/win2_title_left.gif"></td>\n';
        content += '          <td align="left" background="' + url + 'images/win2_title.gif" valign="bottom"><img style="float:left" src="' + url + 'images/win2_title_logo.gif" width="63" height="26" alt="jotform.com" /></td>\n';
        content += '          <td width="14" background="' + url + 'images/win2_title_right.gif"></td>\n';
        content += '        </tr>\n';
        content += '      </table>\n';
        content += '      <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#eeeeee" >\n';
        content += '        <tr>\n';
        content += '          <td width="4" background="' + url + 'images/win2_left.gif"></td>\n';
        content += '          <td align="center" bgcolor="#FFFFFF">\n';

        content += '<table width="100%" border="0" cellspacing="0" cellpadding="5" id="emailFieldsTable" class="' + tableClass + '">\n';

        // Neil: to enable hiding of empty fields on customized email, we will lock and prevent editing of the question and answer table
        // by default. This can still be changed by the user.
        //
        // tableContent is separated here to allow regeneration of the default q&a rows if the table is locked


        tableContent += '<tr>\n';
        tableContent += '<td bgcolor="#f9f9f9" width="170" style="text-decoration:underline; padding:5px !important;"><b>Question</b></td>\n';
        tableContent += '<td bgcolor="#f9f9f9" style="text-decoration:underline; padding:5px !important;"><b>Answer</b></td>\n';
        tableContent += '</tr>\n';

        $A(getUsableElements()).each(function (elem, i) {
            var alt = (i % 2 !== 0) ? "#f9f9f9" : "white";
            tableContent += "<tr>\n";
            tableContent += '<td bgcolor="' + alt + '" style="padding:5px !important;" width="170">' + elem.getProperty('text') + '</td>';
            tableContent += '<td bgcolor="' + alt + '" style="padding:5px !important;">{' + elem.getProperty('name') + '}</td>';
            tableContent += "</tr>\n";
        });

        content += tableContent;
        content += '</table>\n';
        content += '          </td>\n';
        content += '          <td width="4" background="' + url + 'images/win2_right.gif"></td>\n';
        content += '        </tr>\n';
        content += '        <tr>\n';
        content += '          <td height="4" background="' + url + 'images/win2_foot_left.gif" style="font-size:4px;"></td>\n';
        content += '          <td background="' + url + 'images/win2_foot.gif" style="font-size:4px;"></td>\n';
        content += '          <td background="' + url + 'images/win2_foot_right.gif" style="font-size:4px;"></td>\n';
        content += '        </tr>\n';
        content += '      </table></td>\n';
        content += '    </tr>\n';
        content += '    <tr>\n';
        content += '      <td height="30">&nbsp;</td>\n';
        content += '    </tr>\n';
        content += '  </table><br /><br /><p></p></body></html><pre>\n';



        return !table ? content : tableContent;
    },
    sendEmail: function () {
        var fromField = $('fromField');
        var toField = $('toField');
        var subjectField = $('subjectField');
        var messageField = $('emailSource');

        $(fromField, toField).invoke("removeClassName", "error");

        if (!this.checkEmailFormat(fromField.value)) {
            fromField.addClassName('error');
            return;
        }

        if (!this.checkEmailFormat(toField.value)) {
            toField.addClassName('error');
            return;
        }

        var challenge = $('recaptcha_challenge_field') ? $('recaptcha_challenge_field').value : null;
        var response = $('recaptcha_response_field') ? $('recaptcha_response_field').value : null;

        this.Request({
            parameters: {
                action: "sendEmail",
                from: fromField.value,
                to: toField.value,
                subject: subjectField.value,
                body: Editor.getContent(messageField.id),
                challenge: challenge,
                response: response
            },
            onSuccess: function (res) {
                this.alert("Email sent successfully.".locale());
            }.bind(this),
            onFail: function (res) {
                this.alert(res.error, "Error");
            }.bind(this)
        });
    },
    getInternetExplorerVersion: function () {
        var rv = -1; // Return value assumes failure.
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
            if (re.exec(ua) !== null) {
                rv = parseFloat(RegExp.$1);
            }
        }
        return rv;
    }
};

var Common = null;
//this will define Common constructor using native methods, if page does not contain prototype.js
var defineCommonNative = function () {
    Common = function () {
        for (var i in CommonClass) {
            this[i] = CommonClass[i];
        }
        this.initialize();
    }
}

if (!('Class' in window)) {
    defineCommonNative();
} else {
    if (Class.create !== undefined) {
        Common = Class.create(CommonClass);
    } else {
        defineCommonNative();
    }
}

/**
 * Wrapper Object for HTML Editor
 */
Editor = {
    load: function (callback) {
        var EUtils;
        // Make sure you have the utils class
        if ("Utils" in window) {
            if (!("require" in window.Utils)) {
                EUtils = new Common();
            } else {
                EUtils = Utils;
            }
        } else {
            EUtils = new Common();
        }

        window.tinyMCEPreInit = {
            base: "/js/tinymce_v4.2.1/",
            suffix: '',
            query: ''
        };

        EUtils.require("js/tinymce_v4.2.1/tinymce.min.js", function () {
            if (callback) {
                callback.bind(this)();
            }
        }.bind(this));
    },
    overlay: function (id) {
        var overlay;
        var wrap = Element.wrap(id, 'div').setStyle('position:relative;display: inline-block;border: 1px solid #AAAAAA;').insert(overlay = new Element('div').setStyle({
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.97,
            background: '#FFFFFF url("images/loader-big.gif") no-repeat scroll center center',
            textAlign: 'center'
        }).update('Please Wait...'.locale()));

        var cl = function () {
            try {
                wrap.setStyle('border:none');
                overlay.remove();

            } catch (e) {
            }
        };
        overlay.setStyle({lineHeight: (overlay.getHeight() + 50) + "px"});
        overlay.onclick = cl;
        return cl;
    },
    /**
     * Creates an HTML Editor
     * @param {Object} id
     * @param {Object} type
     */
    set: function (id, type, callback) {


        callback = callback || Prototype.K;

        this.load(function () {
            tinyMCE.init(window);
            var cl = this.overlay(id);

            var oninit = function () {
                setTimeout(function () {
                    cl();
                }, 100);
                callback();
            };
            tinyMCE.execCommand('mceRemoveEditor', false, id); //should remove the editor for create new one without refreshing page!!
            //tinymce.execCommand('mceAddEditor', true, id);

            if (!type || type == 'simple') {
                tinyMCE.init({
                    mode: 'exact',
                    elements: id,
                    theme: "modern",
                    theme_modern_font_sizes: ["6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,17px,18px,19px,20px,21px,22px,23px,24px,25px,26px,27px,28px,29px,30px,31px,32px,36px,38px,40px"],
                    font_size_style_values: ["6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,17px,18px,19px,20px,21px,22px,23px,24px,25px,26px,27px,28px,29px,30px,31px,32px,36px,38px,40px"],
                    /*  width: 300,
                     height: 300, */
                    plugins: [
                        "advlist autolink link image imagetools lists charmap print preview hr anchor pagebreak spellchecker",
                        "searchreplace visualblocks visualchars code insertdatetime media nonbreaking",
                        "save table contextmenu directionality template paste textcolor"
                    ],
                    toolbar: "insertfile undo redo | hr removeformat visualaid | fontselect fontsizeselect styleselect | bold italic underline strikethrough| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullpage | forecolor backcolor | table | code",
                    // file_browser_callback: elFinderBrowser,
                    spellchecker_languages: 'English=en',
                    statusbar: false,
                    //theme_modern_toolbar_location: 'bottom', //doesnt work on tiny mce v4x
//                theme: 'modern',
//                skin: 'lightgray',
//                plugins: [
//                    "advlist autolink lists link image charmap print anchor",
//                    "searchreplace visualblocks code fullscreen noneditable media fullscreen",
//                    "insertdatetime media table contextmenu paste"
//                ],
//                fontsize_formats: "9px 10px 12px 13px 14px 16px 18px 21px 24px 28px 32px 36px",
//                toolbar: "insertfile undo redo | bold italic underline strikethrough | forecolor backcolor | styleselect | fontselect | fontsizeselect |alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | cut copy paste pastetext | selectall",
                    menubar: false, // you probably don't want to show the [file] etc bar
                    //block_formats: "Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3;Header 4=h4;Header 5=h5;Header 6=h6",
                    auto_focus: id,
                    setup: function (ed) {
                        ed.on('click', function (e) {
                            // console.log('Editor was clicked');
                        });
                    },
                    oninit: oninit
                });
            } else if (type == 'advanced') {
                tinyMCE.init({
                    mode: 'exact',
                    elements: id,
                    theme: "modern",
                    width: "80%",
                    theme_modern_toolbar_align: "left",
                    theme_modern_font_sizes: ["6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,17px,18px,19px,20px,21px,22px,23px,24px,25px,26px,27px,28px,29px,30px,31px,32px,36px,38px,40px"],
                    font_size_style_values: ["6px,7px,8px,9px,10px,11px,12px,13px,14px,15px,16px,17px,18px,19px,20px,21px,22px,23px,24px,25px,26px,27px,28px,29px,30px,31px,32px,36px,38px,40px"],
                    /*  width: 300,
                     height: 300, */
                    plugins: [
                        "advlist autolink link image imagetools lists charmap print preview hr anchor pagebreak spellchecker",
                        "searchreplace visualblocks visualchars code insertdatetime media nonbreaking",
                        "save table contextmenu directionality template paste textcolor autoresize"
                    ],
                    toolbar: "bold italic underline strikethrough | justifyleft justifycenter justifyright justifyfull | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent blockquote | link unlink anchor image cleanup code | tablecontrols | hr removeformat visualaid | fontselect fontsizeselect | table",
                    // file_browser_callback: elFinderBrowser,
                    spellchecker_languages: 'English=en',
                    statusbar: false,
                    menubar: false,
                    auto_focus: id,
                    setup: function (ed) {
                        ed.on('click', function (e) {
                            // console.log('Editor was clicked');

                        });
                        ed.on('focus', function (e) {
                            tinyMCE.execCommand('mceFocus', false, id);
                            $('fields-box').shift({top: 100, duration: 0.5});
                        });
                    },
                    oninit: oninit
                });
            }
            else if (type == "small") {
                tinyMCE.init({
                    mode: 'exact',
                    elements: id,
                    theme: 'modern',
                    plugins: [
                        "advlist autolink link image imagetools lists charmap print preview hr anchor pagebreak spellchecker",
                        "searchreplace visualblocks visualchars code insertdatetime media nonbreaking",
                        "save table contextmenu directionality template paste textcolor"
                    ],
                    toolbar: "bold italic underline strikethrough | justifyleft justifycenter | forecolor backcolor | fontsizeselect | link unlink image code",
                    statusbar: false,
                    menubar: false,
                    auto_focus: id,
                    setup: function (ed) {
                        ed.on('click', function (e) {
                            // console.log('Editor was clicked');

                        });
                        ed.on('focus', function (e) {
                            tinyMCE.execCommand('mceFocus', false, id);
                            $('fields-box').shift({top: 100, duration: 0.5});
                        });
                    },
                    oninit: oninit
                });
            } else if (type == "tiny") {
                tinyMCE.init({
                    mode: 'exact',
                    elements: id,
                    theme: 'modern',
                    height: "50",
                    plugins: [
                        "link code",
                    ],
                    toolbar: "bold italic underline strikethrough | link code",
                    statusbar: false,
                    menubar: false,
                    auto_focus: id,
                    oninit: oninit
                });
            }
        }
        );
        return true;
    },
    resize: function (width, height) {
        var ed = tinyMCE.activeEditor;
        ed.theme.resizeTo(width, height);

    },
    /**
     * Removes the editor and returns the content
     * @param {Object} id
     */
    remove: function (id) {
        var content = this.getContent(id);
        tinyMCE.execCommand('mceRemoveEditor', false, id);
        return content;
    },
    /**
     * Returns the content of the editor
     * @param {Object} id
     */
    getContent: function (id) {
        var content;
        try {
            content = tinyMCE.get(id).getContent();
        } catch (e) {
            setTimeout(function () {
                content = Editor.getContent(id);
            }, 50);
        }
        return content;
    },
    /**
     * Overwrites the editor content
     * @param {Object} id
     * @param {Object} content
     */
    setContent: function (id, content) {
        try {
            tinyMCE.get(id).setContent(content);
        } catch (e) {
            setTimeout(function () {
                Editor.setContent(id, content);
            }, 50);
        }
    },
    /**
     * Inserts and content on current cursor position
     * @param {Object} id
     * @param {Object} content
     */
    insertContent: function (id, content) {
        tinyMCE.get(id).execCommand('mceInsertContent', false, content);
    },
    /**
     * Gives focus to given editor
     * @param {Object} id
     */
//    focus: function (id)
//    {
//        tinymce.activeEditor.on('focus', function (id) {
//            console.log(id.blurredEditor);
//        });
//    },
    /**
     * Sets the given event to editor
     * @param {Object} id
     * @param {Object} event
     * @param {Object} callback
     */
    addEvent: function (id, event, callback) {
        try {
            tinyMCE.onAddEditor.add(tinyMCE.get(id).getWin(), event, callback);
            console.log('it worked');
        } catch (e) {
            setTimeout(function () {
                Editor.addEvent(id, event, callback);
            }, 50);
        }
    },
    get: function (id) {

        tinyMCE.get(id);
    }
};

function twitterIntent() {
    var intentRegex = /twitter\.com(\:\d{2,4})?\/intent\/(\w+)/, shortIntents = {tweet: true, retweet: true, favorite: true}, windowOptions = 'scrollbars=yes,resizable=yes,toolbar=no,location=yes', winHeight = screen.height, winWidth = screen.width;
    function handleIntent(e) {
        e = e || window.event;
        var target = e.target || e.srcElement, m, width, height, left, top;
        while (target && target.nodeName.toLowerCase() !== 'a') {
            target = target.parentNode;
        }
        if (target && target.nodeName.toLowerCase() === 'a' && target.href) {
            m = target.href.match(intentRegex);
            if (m) {
                width = 550;
                height = (m[2] in shortIntents) ? 420 : 560;
                left = Math.round((winWidth / 2) - (width / 2));
                top = 0;
                if (winHeight > height) {
                    top = Math.round((winHeight / 2) - (height / 2));
                }
                window.open(target.href, 'intent', windowOptions + ',width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
                e.returnValue = false;
                if (e.preventDefault) {
                    e.preventDefault();
                }
            }
        }
    }
    if (document.addEventListener) {
        document.addEventListener('click', handleIntent, false);
    } else if (document.attachEvent) {
        document.attachEvent('onclick', handleIntent);
    }
}

/**
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 */
Base64 = {_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    }, decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = Base64._utf8_decode(output);
        return output;
    }, _utf8_encode: function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }, _utf8_decode: function (utftext) {
        var string = "";
        var i = 0;
        var c = 0, c1 = 0, c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }};
/**
 * Version: 1.0 Alpha-1
 * Build Date: 13-Nov-2007
 * Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * License: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/.
 * Website: http://www.datejs.com/ or http://www.coolite.com/datejs/
 */
Date.CultureInfo = {name: "en-US", englishName: "English (United States)", nativeName: "English (United States)", dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"], monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], amDesignator: "AM", pmDesignator: "PM", firstDayOfWeek: 0, twoDigitYearMax: 2029, dateElementOrder: "mdy", formatPatterns: {shortDate: "M/d/yyyy", longDate: "dddd, MMMM dd, yyyy", shortTime: "h:mm tt", longTime: "h:mm:ss tt", fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt", sortableDateTime: "yyyy-MM-ddTHH:mm:ss", universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ", rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT", monthDay: "MMMM dd", yearMonth: "MMMM, yyyy"}, regexPatterns: {jan: /^jan(uary)?/i, feb: /^feb(ruary)?/i, mar: /^mar(ch)?/i, apr: /^apr(il)?/i, may: /^may/i, jun: /^jun(e)?/i, jul: /^jul(y)?/i, aug: /^aug(ust)?/i, sep: /^sep(t(ember)?)?/i, oct: /^oct(ober)?/i, nov: /^nov(ember)?/i, dec: /^dec(ember)?/i, sun: /^su(n(day)?)?/i, mon: /^mo(n(day)?)?/i, tue: /^tu(e(s(day)?)?)?/i, wed: /^we(d(nesday)?)?/i, thu: /^th(u(r(s(day)?)?)?)?/i, fri: /^fr(i(day)?)?/i, sat: /^sa(t(urday)?)?/i, future: /^next/i, past: /^last|past|prev(ious)?/i, add: /^(\+|after|from)/i, subtract: /^(\-|before|ago)/i, yesterday: /^yesterday/i, today: /^t(oday)?/i, tomorrow: /^tomorrow/i, now: /^n(ow)?/i, millisecond: /^ms|milli(second)?s?/i, second: /^sec(ond)?s?/i, minute: /^min(ute)?s?/i, hour: /^h(ou)?rs?/i, week: /^w(ee)?k/i, month: /^m(o(nth)?s?)?/i, day: /^d(ays?)?/i, year: /^y((ea)?rs?)?/i, shortMeridian: /^(a|p)/i, longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i, timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i, ordinalSuffix: /^\s*(st|nd|rd|th)/i, timeContext: /^\s*(\:|a|p)/i}, abbreviatedTimeZoneStandard: {GMT: "-000", EST: "-0400", CST: "-0500", MST: "-0600", PST: "-0700"}, abbreviatedTimeZoneDST: {GMT: "-000", EDT: "-0500", CDT: "-0600", MDT: "-0700", PDT: "-0800"}};
Date.getMonthNumberFromName = function (name) {
    var n = Date.CultureInfo.monthNames, m = Date.CultureInfo.abbreviatedMonthNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};
Date.getDayNumberFromName = function (name) {
    var n = Date.CultureInfo.dayNames, m = Date.CultureInfo.abbreviatedDayNames, o = Date.CultureInfo.shortestDayNames, s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};
Date.isLeapYear = function (year) {
    return(((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};
Date.getDaysInMonth = function (year, month) {
    return[31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};
Date.getTimezoneOffset = function (s, dst) {
    return(dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] : Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};
Date.getTimezoneAbbreviation = function (offset, dst) {
    var n = (dst || false) ? Date.CultureInfo.abbreviatedTimeZoneDST : Date.CultureInfo.abbreviatedTimeZoneStandard, p;
    for (p in n) {
        if (n[p] === offset) {
            return p;
        }
    }
    return null;
};
Date.prototype.clone = function () {
    return new Date(this.getTime());
};
Date.prototype.compareTo = function (date) {
    if (isNaN(this)) {
        throw new Error(this);
    }
    if (date instanceof Date && !isNaN(date)) {
        return(this > date) ? 1 : (this < date) ? -1 : 0;
    } else {
        throw new TypeError(date);
    }
};
Date.prototype.equals = function (date) {
    return(this.compareTo(date) === 0);
};
Date.prototype.between = function (start, end) {
    var t = this.getTime();
    return t >= start.getTime() && t <= end.getTime();
};
Date.prototype.addMilliseconds = function (value) {
    this.setMilliseconds(this.getMilliseconds() + value);
    return this;
};
Date.prototype.addSeconds = function (value) {
    return this.addMilliseconds(value * 1000);
};
Date.prototype.addMinutes = function (value) {
    return this.addMilliseconds(value * 60000);
};
Date.prototype.addHours = function (value) {
    return this.addMilliseconds(value * 3600000);
};
Date.prototype.addDays = function (value) {
    return this.addMilliseconds(value * 86400000);
};
Date.prototype.addWeeks = function (value) {
    return this.addMilliseconds(value * 604800000);
};
Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};
Date.prototype.addYears = function (value) {
    return this.addMonths(value * 12);
};
Date.prototype._add = function (config) {
    if (typeof config == "number") {
        this._orient = config;
        return this;
    }
    var x = config;
    if (x.millisecond || x.milliseconds) {
        this.addMilliseconds(x.millisecond || x.milliseconds);
    }
    if (x.second || x.seconds) {
        this.addSeconds(x.second || x.seconds);
    }
    if (x.minute || x.minutes) {
        this.addMinutes(x.minute || x.minutes);
    }
    if (x.hour || x.hours) {
        this.addHours(x.hour || x.hours);
    }
    if (x.month || x.months) {
        this.addMonths(x.month || x.months);
    }
    if (x.year || x.years) {
        this.addYears(x.year || x.years);
    }
    if (x.day || x.days) {
        this.addDays(x.day || x.days);
    }
    return this;
};
Date._validate = function (value, min, max, name) {
    if (typeof value != "number") {
        throw new TypeError(value + " is not a Number.");
    } else if (value < min || value > max) {
        throw new RangeError(value + " is not a valid value for " + name + ".");
    }
    return true;
};
Date.validateMillisecond = function (n) {
    return Date._validate(n, 0, 999, "milliseconds");
};
Date.validateSecond = function (n) {
    return Date._validate(n, 0, 59, "seconds");
};
Date.validateMinute = function (n) {
    return Date._validate(n, 0, 59, "minutes");
};
Date.validateHour = function (n) {
    return Date._validate(n, 0, 23, "hours");
};
Date.validateDay = function (n, year, month) {
    return Date._validate(n, 1, Date.getDaysInMonth(year, month), "days");
};
Date.validateMonth = function (n) {
    return Date._validate(n, 0, 11, "months");
};
Date.validateYear = function (n) {
    return Date._validate(n, 1, 9999, "seconds");
};
Date.prototype.set = function (config) {
    var x = config;
    if (!x.millisecond && x.millisecond !== 0) {
        x.millisecond = -1;
    }
    if (!x.second && x.second !== 0) {
        x.second = -1;
    }
    if (!x.minute && x.minute !== 0) {
        x.minute = -1;
    }
    if (!x.hour && x.hour !== 0) {
        x.hour = -1;
    }
    if (!x.day && x.day !== 0) {
        x.day = -1;
    }
    if (!x.month && x.month !== 0) {
        x.month = -1;
    }
    if (!x.year && x.year !== 0) {
        x.year = -1;
    }
    if (x.millisecond != -1 && Date.validateMillisecond(x.millisecond)) {
        this.addMilliseconds(x.millisecond - this.getMilliseconds());
    }
    if (x.second != -1 && Date.validateSecond(x.second)) {
        this.addSeconds(x.second - this.getSeconds());
    }
    if (x.minute != -1 && Date.validateMinute(x.minute)) {
        this.addMinutes(x.minute - this.getMinutes());
    }
    if (x.hour != -1 && Date.validateHour(x.hour)) {
        this.addHours(x.hour - this.getHours());
    }
    if (x.month !== -1 && Date.validateMonth(x.month)) {
        this.addMonths(x.month - this.getMonth());
    }
    if (x.year != -1 && Date.validateYear(x.year)) {
        this.addYears(x.year - this.getFullYear());
    }
    if (x.day != -1 && Date.validateDay(x.day, this.getFullYear(), this.getMonth())) {
        this.addDays(x.day - this.getDate());
    }
    if (x.timezone) {
        this.setTimezone(x.timezone);
    }
    if (x.timezoneOffset) {
        this.setTimezoneOffset(x.timezoneOffset);
    }
    return this;
};
Date.prototype._clearTime = function () {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
};
Date.prototype.isLeapYear = function () {
    var y = this.getFullYear();
    return(((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0));
};
Date.prototype.isWeekday = function () {
    return!(this.is().sat() || this.is().sun());
};
Date.prototype.getDaysInMonth = function () {
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};
Date.prototype.moveToFirstDayOfMonth = function () {
    return this.set({day: 1});
};
Date.prototype.moveToLastDayOfMonth = function () {
    return this.set({day: this.getDaysInMonth()});
};
Date.prototype.moveToDayOfWeek = function (day, orient) {
    var diff = (day - this.getDay() + 7 * (orient || +1)) % 7;
    return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff);
};
Date.prototype.moveToMonth = function (month, orient) {
    var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12;
    return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff);
};
Date.prototype.getDayOfYear = function () {
    return Math.floor((this - new Date(this.getFullYear(), 0, 1)) / 86400000);
};
Date.prototype.getWeekOfYear = function (firstDayOfWeek) {
    var y = this.getFullYear(), m = this.getMonth(), d = this.getDate();
    var dow = firstDayOfWeek || Date.CultureInfo.firstDayOfWeek;
    var offset = 7 + 1 - new Date(y, 0, 1).getDay();
    if (offset == 8) {
        offset = 1;
    }
    var daynum = ((Date.UTC(y, m, d, 0, 0, 0) - Date.UTC(y, 0, 1, 0, 0, 0)) / 86400000) + 1;
    var w = Math.floor((daynum - offset + 7) / 7);
    if (w === dow) {
        y--;
        var prevOffset = 7 + 1 - new Date(y, 0, 1).getDay();
        if (prevOffset == 2 || prevOffset == 8) {
            w = 53;
        } else {
            w = 52;
        }
    }
    return w;
};
Date.prototype.isDST = function () {
    return this.toString().match(/(E|C|M|P)(S|D)T/)[2] == "D";
};
Date.prototype._getTimezone = function () {
    return Date.getTimezoneAbbreviation(this.getUTCOffset, this.isDST());
};
Date.prototype.setTimezoneOffset = function (s) {
    var here = this.getTimezoneOffset(), there = Number(s) * -6 / 10;
    this.addMinutes(there - here);
    return this;
};
Date.prototype.setTimezone = function (s) {
    return this.setTimezoneOffset(Date.getTimezoneOffset(s));
};
Date.prototype.getUTCOffset = function () {
    var n = this.getTimezoneOffset() * -10 / 6, r;
    if (n < 0) {
        r = (n - 10000).toString();
        return r[0] + r.substr(2);
    } else {
        r = (n + 10000).toString();
        return"+" + r.substr(1);
    }
};
Date.prototype.getDayName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedDayNames[this.getDay()] : Date.CultureInfo.dayNames[this.getDay()];
};
Date.prototype.getMonthName = function (abbrev) {
    return abbrev ? Date.CultureInfo.abbreviatedMonthNames[this.getMonth()] : Date.CultureInfo.monthNames[this.getMonth()];
};
Date.prototype._toString = Date.prototype.toString;
Date.prototype.toString = function (format) {
    var self = this;
    var p = function p(s) {
        return(s.toString().length == 1) ? "0" + s : s;
    };
    return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, function (format) {
        switch (format) {
            case"hh":
                return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
            case"h":
                return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
            case"HH":
                return p(self.getHours());
            case"H":
                return self.getHours();
            case"mm":
                return p(self.getMinutes());
            case"m":
                return self.getMinutes();
            case"ss":
                return p(self.getSeconds());
            case"s":
                return self.getSeconds();
            case"yyyy":
                return self.getFullYear();
            case"yy":
                return self.getFullYear().toString().substring(2, 4);
            case"dddd":
                return self.getDayName();
            case"ddd":
                return self.getDayName(true);
            case"dd":
                return p(self.getDate());
            case"d":
                return self.getDate().toString();
            case"MMMM":
                return self.getMonthName();
            case"MMM":
                return self.getMonthName(true);
            case"MM":
                return p((self.getMonth() + 1));
            case"M":
                return self.getMonth() + 1;
            case"t":
                return self.getHours() < 12 ? Date.CultureInfo.amDesignator.substring(0, 1) : Date.CultureInfo.pmDesignator.substring(0, 1);
            case"tt":
                return self.getHours() < 12 ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
            case"zzz":
            case"zz":
            case"z":
                return"";
        }
    }) : this._toString();
};
Date.now = function () {
    return new Date();
};
Date.today = function () {
    return Date.now()._clearTime();
};
Date.prototype._orient = +1;
Date.prototype.next = function () {
    this._orient = +1;
    return this;
};
Date.prototype.last = Date.prototype.prev = Date.prototype.previous = function () {
    this._orient = -1;
    return this;
};
Date.prototype._is = false;
Date.prototype.is = function () {
    this._is = true;
    return this;
};
Number.prototype._dateElement = "day";
Number.prototype.fromNow = function () {
    var c = {};
    c[this._dateElement] = this;
    return Date.now()._add(c);
};
Number.prototype.ago = function () {
    var c = {};
    c[this._dateElement] = this * -1;
    return Date.now()._add(c);
};
(
        function () {
            var $D = Date.prototype, $N = Number.prototype;
            var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/), mx = ("january february march april may june july august september october november december").split(/\s/), px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/), de;
            var df = function (n) {
                return function () {
                    if (this._is) {
                        this._is = false;
                        return this.getDay() == n;
                    }
                    return this.moveToDayOfWeek(n, this._orient);
                };
            };
            for (var i = 0; i < dx.length; i++) {
                $D[dx[i]] = $D[dx[i].substring(0, 3)] = df(i);
            }
            var mf = function (n) {
                return function () {
                    if (this._is) {
                        this._is = false;
                        return this.getMonth() === n;
                    }
                    return this.moveToMonth(n, this._orient);
                };
            };
            for (var j = 0; j < mx.length; j++) {
                $D[mx[j]] = $D[mx[j].substring(0, 3)] = mf(j);
            }
            var ef = function (j) {
                return function () {
                    if (j.substring(j.length - 1) != "s") {
                        j += "s";
                    }
                    return this["add" + j](this._orient);
                };
            };
            var nf = function (n) {
                return function () {
                    this._dateElement = n;
                    return this;
                };
            };
            for (var k = 0; k < px.length; k++) {
                de = px[k].toLowerCase();
                $D[de] = $D[de + "s"] = ef(px[k]);
                $N[de] = $N[de + "s"] = nf(de);
            }
        }());
Date.prototype.toJSONString = function () {
    return this.toString("yyyy-MM-ddThh:mm:ssZ");
};
Date.prototype.toShortDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortDatePattern);
};
Date.prototype.toLongDateString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longDatePattern);
};
Date.prototype.toShortTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.shortTimePattern);
};
Date.prototype.toLongTimeString = function () {
    return this.toString(Date.CultureInfo.formatPatterns.longTimePattern);
};
Date.prototype.getOrdinal = function () {
    switch (this.getDate()) {
        case 1:
        case 21:
        case 31:
            return"st";
        case 2:
        case 22:
            return"nd";
        case 3:
        case 23:
            return"rd";
        default:
            return"th";
    }
};
(
        function () {
            Date.Parsing = {Exception: function (s) {
                    this.message = "Parse error at '" + s.substring(0, 10) + " ...'";
                }};
            var $P = Date.Parsing;
            var _ = $P.Operators = {rtoken: function (r) {
                    return function (s) {
                        var mx = s.match(r);
                        if (mx) {
                            return([mx[0], s.substring(mx[0].length)]);
                        } else {
                            throw new $P.Exception(s);
                        }
                    };
                }, token: function (s) {
                    return function (s) {
                        return _.rtoken(new RegExp("^\\s*" + s + "\\s*"))(s);
                    };
                }, stoken: function (s) {
                    return _.rtoken(new RegExp("^" + s));
                }, until: function (p) {
                    return function (s) {
                        var qx = [], rx = null;
                        while (s.length) {
                            try {
                                rx = p.call(this, s);
                            } catch (e) {
                                qx.push(rx[0]);
                                s = rx[1];
                                continue;
                            }
                            break;
                        }
                        return[qx, s];
                    };
                }, many: function (p) {
                    return function (s) {
                        var rx = [], r = null;
                        while (s.length) {
                            try {
                                r = p.call(this, s);
                            } catch (e) {
                                return[rx, s];
                            }
                            rx.push(r[0]);
                            s = r[1];
                        }
                        return[rx, s];
                    };
                }, optional: function (p) {
                    return function (s) {
                        var r = null;
                        try {
                            r = p.call(this, s);
                        } catch (e) {
                            return[null, s];
                        }
                        return[r[0], r[1]];
                    };
                }, not: function (p) {
                    return function (s) {
                        try {
                            p.call(this, s);
                        } catch (e) {
                            return[null, s];
                        }
                        throw new $P.Exception(s);
                    };
                }, ignore: function (p) {
                    return p ? function (s) {
                        var r = null;
                        r = p.call(this, s);
                        return[null, r[1]];
                    } : null;
                }, product: function () {
                    var px = arguments[0], qx = Array.prototype.slice.call(arguments, 1), rx = [];
                    for (var i = 0; i < px.length; i++) {
                        rx.push(_.each(px[i], qx));
                    }
                    return rx;
                }, cache: function (rule) {
                    var cache = {}, r = null;
                    return function (s) {
                        try {
                            r = cache[s] = (cache[s] || rule.call(this, s));
                        } catch (e) {
                            r = cache[s] = e;
                        }
                        if (r instanceof $P.Exception) {
                            throw r;
                        } else {
                            return r;
                        }
                    };
                }, any: function () {
                    var px = arguments;
                    return function (s) {
                        var r = null;
                        for (var i = 0; i < px.length; i++) {
                            if (px[i] === null) {
                                continue;
                            }
                            try {
                                r = (px[i].call(this, s));
                            } catch (e) {
                                r = null;
                            }
                            if (r) {
                                return r;
                            }
                        }
                        throw new $P.Exception(s);
                    };
                }, each: function () {
                    var px = arguments;
                    return function (s) {
                        var rx = [], r = null;
                        for (var i = 0; i < px.length; i++) {
                            if (px[i] === null) {
                                continue;
                            }
                            try {
                                r = (px[i].call(this, s));
                            } catch (e) {
                                throw new $P.Exception(s);
                            }
                            rx.push(r[0]);
                            s = r[1];
                        }
                        return[rx, s];
                    };
                }, all: function () {
                    var px = arguments, _ = _;
                    return _.each(_.optional(px));
                }, sequence: function (px, d, c) {
                    d = d || _.rtoken(/^\s*/);
                    c = c || null;
                    if (px.length == 1) {
                        return px[0];
                    }
                    return function (s) {
                        var r = null, q = null;
                        var rx = [];
                        for (var i = 0; i < px.length; i++) {
                            try {
                                r = px[i].call(this, s);
                            } catch (e) {
                                break;
                            }
                            rx.push(r[0]);
                            try {
                                q = d.call(this, r[1]);
                            } catch (ex) {
                                q = null;
                                break;
                            }
                            s = q[1];
                        }
                        if (!r) {
                            throw new $P.Exception(s);
                        }
                        if (q) {
                            throw new $P.Exception(q[1]);
                        }
                        if (c) {
                            try {
                                r = c.call(this, r[1]);
                            } catch (ey) {
                                throw new $P.Exception(r[1]);
                            }
                        }
                        return[rx, (r ? r[1] : s)];
                    };
                }, between: function (d1, p, d2) {
                    d2 = d2 || d1;
                    var _fn = _.each(_.ignore(d1), p, _.ignore(d2));
                    return function (s) {
                        var rx = _fn.call(this, s);
                        return[[rx[0][0], r[0][2]], rx[1]];
                    };
                }, list: function (p, d, c) {
                    d = d || _.rtoken(/^\s*/);
                    c = c || null;
                    return(p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c)));
                }, set: function (px, d, c) {
                    d = d || _.rtoken(/^\s*/);
                    c = c || null;
                    return function (s) {
                        var r = null, p = null, q = null, rx = null, best = [[], s], last = false;
                        for (var i = 0; i < px.length; i++) {
                            q = null;
                            p = null;
                            r = null;
                            last = (px.length == 1);
                            try {
                                r = px[i].call(this, s);
                            } catch (e) {
                                continue;
                            }
                            rx = [[r[0]], r[1]];
                            if (r[1].length > 0 && !last) {
                                try {
                                    q = d.call(this, r[1]);
                                } catch (ex) {
                                    last = true;
                                }
                            } else {
                                last = true;
                            }
                            if (!last && q[1].length === 0) {
                                last = true;
                            }
                            if (!last) {
                                var qx = [];
                                for (var j = 0; j < px.length; j++) {
                                    if (i != j) {
                                        qx.push(px[j]);
                                    }
                                }
                                p = _.set(qx, d).call(this, q[1]);
                                if (p[0].length > 0) {
                                    rx[0] = rx[0].concat(p[0]);
                                    rx[1] = p[1];
                                }
                            }
                            if (rx[1].length < best[1].length) {
                                best = rx;
                            }
                            if (best[1].length === 0) {
                                break;
                            }
                        }
                        if (best[0].length === 0) {
                            return best;
                        }
                        if (c) {
                            try {
                                q = c.call(this, best[1]);
                            } catch (ey) {
                                throw new $P.Exception(best[1]);
                            }
                            best[1] = q[1];
                        }
                        return best;
                    };
                }, forward: function (gr, fname) {
                    return function (s) {
                        return gr[fname].call(this, s);
                    };
                }, replace: function (rule, repl) {
                    return function (s) {
                        var r = rule.call(this, s);
                        return[repl, r[1]];
                    };
                }, process: function (rule, fn) {
                    return function (s) {
                        var r = rule.call(this, s);
                        return[fn.call(this, r[0]), r[1]];
                    };
                }, min: function (min, rule) {
                    return function (s) {
                        var rx = rule.call(this, s);
                        if (rx[0].length < min) {
                            throw new $P.Exception(s);
                        }
                        return rx;
                    };
                }};
            var _generator = function (op) {
                return function () {
                    var args = null, rx = [];
                    if (arguments.length > 1) {
                        args = Array.prototype.slice.call(arguments);
                    } else if (arguments[0]instanceof Array) {
                        args = arguments[0];
                    }
                    if (args) {
                        for (var i = 0, px = args.shift(); i < px.length; i++) {
                            args.unshift(px[i]);
                            rx.push(op.apply(null, args));
                            args.shift();
                            return rx;
                        }
                    } else {
                        return op.apply(null, arguments);
                    }
                };
            };
            var gx = "optional not ignore cache".split(/\s/);
            for (var i = 0; i < gx.length; i++) {
                _[gx[i]] = _generator(_[gx[i]]);
            }
            var _vector = function (op) {
                return function () {
                    if (arguments[0]instanceof Array) {
                        return op.apply(null, arguments[0]);
                    } else {
                        return op.apply(null, arguments);
                    }
                };
            };
            var vx = "each any all".split(/\s/);
            for (var j = 0; j < vx.length; j++) {
                _[vx[j]] = _vector(_[vx[j]]);
            }
        }());
(
        function () {
            var flattenAndCompact = function (ax) {
                var rx = [];
                for (var i = 0; i < ax.length; i++) {
                    if (ax[i]instanceof Array) {
                        rx = rx.concat(flattenAndCompact(ax[i]));
                    } else {
                        if (ax[i]) {
                            rx.push(ax[i]);
                        }
                    }
                }
                return rx;
            };
            Date.Grammar = {};
            Date.Translator = {hour: function (s) {
                    return function () {
                        this.hour = Number(s);
                    };
                }, minute: function (s) {
                    return function () {
                        this.minute = Number(s);
                    };
                }, second: function (s) {
                    return function () {
                        this.second = Number(s);
                    };
                }, meridian: function (s) {
                    return function () {
                        this.meridian = s.slice(0, 1).toLowerCase();
                    };
                }, timezone: function (s) {
                    return function () {
                        var n = s.replace(/[^\d\+\-]/g, "");
                        if (n.length) {
                            this.timezoneOffset = Number(n);
                        } else {
                            this.timezone = s.toLowerCase();
                        }
                    };
                }, day: function (x) {
                    var s = x[0];
                    return function () {
                        this.day = Number(s.match(/\d+/)[0]);
                    };
                }, month: function (s) {
                    return function () {
                        this.month = ((s.length == 3) ? Date.getMonthNumberFromName(s) : (Number(s) - 1));
                    };
                }, year: function (s) {
                    return function () {
                        var n = Number(s);
                        this.year = ((s.length > 2) ? n : (n + (((n + 2000) < Date.CultureInfo.twoDigitYearMax) ? 2000 : 1900)));
                    };
                }, rday: function (s) {
                    return function () {
                        switch (s) {
                            case"yesterday":
                                this.days = -1;
                                break;
                            case"tomorrow":
                                this.days = 1;
                                break;
                            case"today":
                                this.days = 0;
                                break;
                            case"now":
                                this.days = 0;
                                this.now = true;
                                break;
                        }
                    };
                }, finishExact: function (x) {
                    x = (x instanceof Array) ? x : [x];
                    var now = new Date();
                    this.year = now.getFullYear();
                    this.month = now.getMonth();
                    this.day = 1;
                    this.hour = 0;
                    this.minute = 0;
                    this.second = 0;
                    for (var i = 0; i < x.length; i++) {
                        if (x[i]) {
                            x[i].call(this);
                        }
                    }
                    this.hour = (this.meridian == "p" && this.hour < 13) ? this.hour + 12 : this.hour;
                    if (this.day > Date.getDaysInMonth(this.year, this.month)) {
                        throw new RangeError(this.day + " is not a valid value for days.");
                    }
                    var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second);
                    if (this.timezone) {
                        r.set({timezone: this.timezone});
                    } else if (this.timezoneOffset) {
                        r.set({timezoneOffset: this.timezoneOffset});
                    }
                    return r;
                }, finish: function (x) {
                    x = (x instanceof Array) ? flattenAndCompact(x) : [x];
                    if (x.length === 0) {
                        return null;
                    }
                    for (var i = 0; i < x.length; i++) {
                        if (typeof x[i] == "function") {
                            x[i].call(this);
                        }
                    }
                    if (this.now) {
                        return new Date();
                    }
                    var today = Date.today();
                    var method = null;
                    var expression = !!(this.days !== null || this.orient || this.operator);
                    if (expression) {
                        var gap, mod, orient;
                        orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1);
                        if (this.weekday) {
                            this.unit = "day";
                            gap = (Date.getDayNumberFromName(this.weekday) - today.getDay());
                            mod = 7;
                            this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                        }
                        if (this.month) {
                            this.unit = "month";
                            gap = (this.month - today.getMonth());
                            mod = 12;
                            this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod);
                            this.month = null;
                        }
                        if (!this.unit) {
                            this.unit = "day";
                        }
                        if (this[this.unit + "s"] === null || this.operator !== null) {
                            if (!this.value) {
                                this.value = 1;
                            }
                            if (this.unit == "week") {
                                this.unit = "day";
                                this.value = this.value * 7;
                            }
                            this[this.unit + "s"] = this.value * orient;
                        }
                        return today._add(this);
                    } else {
                        if (this.meridian && this.hour) {
                            this.hour = (this.hour < 13 && this.meridian == "p") ? this.hour + 12 : this.hour;
                        }
                        if (this.weekday && !this.day) {
                            this.day = (today.addDays((Date.getDayNumberFromName(this.weekday) - today.getDay()))).getDate();
                        }
                        if (this.month && !this.day) {
                            this.day = 1;
                        }
                        return today.set(this);
                    }
                }};
            var _ = Date.Parsing.Operators, g = Date.Grammar, t = Date.Translator, _fn;
            g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/);
            g.timePartDelimiter = _.stoken(":");
            g.whiteSpace = _.rtoken(/^\s*/);
            g.generalDelimiter = _.rtoken(/^(([\s\,]|at|on)+)/);
            var _C = {};
            g.ctoken = function (keys) {
                var fn = _C[keys];
                if (!fn) {
                    var c = Date.CultureInfo.regexPatterns;
                    var kx = keys.split(/\s+/), px = [];
                    for (var i = 0; i < kx.length; i++) {
                        px.push(_.replace(_.rtoken(c[kx[i]]), kx[i]));
                    }
                    fn = _C[keys] = _.any.apply(null, px);
                }
                return fn;
            };
            g.ctoken2 = function (key) {
                return _.rtoken(Date.CultureInfo.regexPatterns[key]);
            };
            g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour));
            g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour));
            g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour));
            g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour));
            g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute));
            g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute));
            g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second));
            g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second));
            g.hms = _.cache(_.sequence([g.H, g.mm, g.ss], g.timePartDelimiter));
            g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian));
            g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian));
            g.z = _.cache(_.process(_.rtoken(/^(\+|\-)?\s*\d\d\d\d?/), t.timezone));
            g.zz = _.cache(_.process(_.rtoken(/^(\+|\-)\s*\d\d\d\d/), t.timezone));
            g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone));
            g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz]));
            g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix);
            g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
            g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day));
            g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function (s) {
                return function () {
                    this.weekday = s;
                };
            }));
            g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month));
            g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month));
            g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month));
            g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year));
            g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year));
            g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year));
            g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year));
            _fn = function () {
                return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext")));
            };
            g.day = _fn(g.d, g.dd);
            g.month = _fn(g.M, g.MMM);
            g.year = _fn(g.yyyy, g.yy);
            g.orientation = _.process(g.ctoken("past future"), function (s) {
                return function () {
                    this.orient = s;
                };
            });
            g.operator = _.process(g.ctoken("add subtract"), function (s) {
                return function () {
                    this.operator = s;
                };
            });
            g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday);
            g.unit = _.process(g.ctoken("minute hour day week month year"), function (s) {
                return function () {
                    this.unit = s;
                };
            });
            g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function (s) {
                return function () {
                    this.value = s.replace(/\D/g, "");
                };
            });
            g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]);
            _fn = function () {
                return _.set(arguments, g.datePartDelimiter);
            };
            g.mdy = _fn(g.ddd, g.month, g.day, g.year);
            g.ymd = _fn(g.ddd, g.year, g.month, g.day);
            g.dmy = _fn(g.ddd, g.day, g.month, g.year);
            g.date = function (s) {
                return((g[Date.CultureInfo.dateElementOrder] || g.mdy).call(this, s));
            };
            g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function (fmt) {
                if (g[fmt]) {
                    return g[fmt];
                } else {
                    throw Date.Parsing.Exception(fmt);
                }
            }), _.process(_.rtoken(/^[^dMyhHmstz]+/), function (s) {
                return _.ignore(_.stoken(s));
            }))), function (rules) {
                return _.process(_.each.apply(null, rules), t.finishExact);
            });
            var _F = {};
            var _get = function (f) {
                _F[f] = (_F[f] || g.format(f)[0]);
                return _F[f];
            };
            g.formats = function (fx) {
                if (fx instanceof Array) {
                    var rx = [];
                    for (var i = 0; i < fx.length; i++) {
                        rx.push(_get(fx[i]));
                    }
                    return _.any.apply(null, rx);
                } else {
                    return _get(fx);
                }
            };
            g._formats = g.formats(["yyyy-MM-ddTHH:mm:ss", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "d"]);
            g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish);
            g.start = function (s) {
                try {
                    var r = g._formats.call({}, s);
                    if (r[1].length === 0) {
                        return r;
                    }
                } catch (e) {
                }
                return g._start.call({}, s);
            };
        }());
Date._parse = Date.parse;
Date.parse = function (s) {
    var r = null;
    if (!s) {
        return null;
    }
    try {
        r = Date.Grammar.start.call({}, s);
    } catch (e) {
        console.error(e);
        return null;
    }
    return((r[1].length === 0) ? r[0] : null);
};
Date.getParseFunction = function (fx) {
    var fn = Date.Grammar.formats(fx);
    return function (s) {
        var r = null;
        try {
            r = fn.call({}, s);
        } catch (e) {
            return null;
        }
        return((r[1].length === 0) ? r[0] : null);
    };
};
Date.parseExact = function (s, fx) {
    return Date.getParseFunction(fx)(s);
};