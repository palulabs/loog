const chalk = require('chalk');
const isWin = /^win/.test(process.platform);

const logLevels = [
    'all',
    'silly',
    'debug',
    'verbose',
    'timing',
    'http',
    'notice',
    'info',
    'success',
    'warn',
    'quiet',
    'error',
    'silent'
];

const textPrefixes = {
    error: '[ERR]',
    warn: '[WRN]',
    warning: '[WRN]',
    http: '[NET]',
    info: '[INF]',
    success: '[OK ]',
    notice: '[NOT]',
    timing: '[TIM]',
    verbose: '[VRB]',
    debug: '[DBG]',
    silly: '[LOL]',
    log: ''
};

const asciiPrefixes = {
    error: isWin ? '►' : '✖',
    warn: isWin ? '‼' : '⚠',
    warning: isWin ? '‼' : '⚠',
    http: isWin ? '≡' : '☷',
    info: isWin ? 'i' : 'ℹ',
    success: isWin ? '√' : '✔',
    notice: isWin ? 'i' : 'ℵ',
    timing: isWin ? '+' : '◷',
    verbose: isWin ? 'i' : 'ℹ',
    debug: isWin ? 'i': 'ℹ',
    silly: isWin ? '☺' : '☺',
    log: ''
};

const emojiPrefixes = {
    error: '❌ ',
    warn: '〽️',
    warning: '〽️',
    http: '🌐 ',
    info: '➡️ ',
    success: '✅ ',
    notice: '❕ ',
    timing: '🕒 ',
    verbose: '🎤 ',
    debug: '🔬 ',
    silly: '🙃 ',
    log: ''
};

const colorStyles = {
    error: chalk.red.bold,
    warn: chalk.yellow.bold,
    warning: chalk.yellow.bold,
    http: chalk.cyan.bold,
    info: chalk.green.bold,
    success: chalk.green.bold,
    notice: chalk.blue.bold,
    timing: chalk.blue,
    verbose: chalk.blue.bold,
    debug: chalk.gray.bold,
    silly: chalk.white.bold,
    /** @private */
    log: t => t
};

const npmPrefixes = {
    error: 'ERR',
    warn: 'WRN',
    warning: 'WRN',
    http: 'NET',
    info: 'INF',
    success: 'OK ',
    notice: 'NOT',
    timing: 'TIM',
    verbose: 'VRB',
    debug: 'DBG',
    silly: 'LOL',
    log: '>'
};

/**
 * This function serves as the loog object and a function to reconfigure it.
 * A quick example:
 * 
 *      // Use its methods directly, with the default configuration
 *      const loog = require('loog');
 *      loog.info('Hi!'); 
 * 
 *      // Use it as a function to reconfigure the instance
 *      const loog = require('loog')({
 *          prefixStyle: 'emoji'
 *      });
 *      loog.info('Hi!');
 * 
 * @function loog
 * @param {Object} [config] - The initial config
 * @param {string} [config.prefixStyle=text] - The prefix style, one of ['text', 'emoji', 'ascii', 'none']. 
 * @param {string} [config.logLevel=info] - The log level, one of ['silly', 'debug', 'info', 'warn', 'error', 'silent'].    
 */
function wrap () {
    let ex = function Loog (cfg) {
        _instance = new Log(Object.assign({}, defaultCfg, cfg));
        return wrap();
    }
    Object.getOwnPropertyNames(Log.prototype).forEach((method)=> {
        if (method !== "constructor" && method.charAt(0) !== "_") {
            ex[method] = _instance[method].bind(_instance);
        }
    });
    ex.$levels = logLevels;
    ex.$methods = logLevels.filter(l => !~['all','quiet','silent'].indexOf(l)).concat(['log']);
    ex.$prefixes = {
        text: textPrefixes,
        ascii: asciiPrefixes,
        emoji: emojiPrefixes,
        npm: npmPrefixes
    };
    ex.$colors = colorStyles;
    return ex;
}

function getLogFn(me, level) {
    return function _ () {
        if (_.enable && !me._mute) {
            let args = Array.prototype.slice.call(arguments);
            if (me.cfg.prefixes[level]) {
                if (me.cfg._noColors) {
                    args.unshift(me.cfg.prefixes[level]);
                } else {
                    args.unshift(me.cfg.colors[level](me.cfg.prefixes[level]));
                }
            }
            if (me._indentation > 0) {
                args.unshift(" ".repeat(me._indentation));
            }
            if (me.cfg.process) {
                args.unshift(me.cfg.process);
            }
            if (me.cfg._noPrefix) {
                if (me.cfg._noColors) {
                    console.log(args.join(' '));
                } else {
                    console.log(me.cfg.colors[level](args.join(' ')));
                }
            } else {
                console.log(args.join(' '));
            }
        }
        return me;
    }
}

/**
 * A simple log with an extra character.
 * 
 * The result of importing this module serves as the `loog` object and a function to reconfigure it.
 * A quick example:
 * 
 *      // Use its methods directly, with the default configuration
 *      const loog = require('loog');
 *      loog.info('Hi!'); 
 * 
 *      // Use it as a function to reconfigure the instance
 *      const loog = require('loog')({
 *          prefixStyle: 'emoji'
 *      });
 *      loog.info('Hi!');
 * 
 * See the docs for the global {@link loog} function for more documentation on how to reconfigure loog.
 * @module loog
 */
class Log {
    constructor (config) { 
        this._indentation = 0;
        this._counters = {};
        this._trackers = {};
        this.cfg = Object.assign({}, config);
        if (!('prefixes' in this.cfg)) {
            switch (this.cfg.prefixStyle) {
                case "text":
                    this.cfg.prefixes = textPrefixes;
                    break;
                case "emoji":
                    this.cfg.prefixes = emojiPrefixes;
                    break;
                case "ascii":
                    this.cfg.prefixes = asciiPrefixes;
                    break;
                case "npm":
                    this.cfg.prefixes = npmPrefixes;
                    break;
                default:
                    this.cfg.prefixes = {};
                    this.cfg._noPrefix = true;
                break;
            }
        } else if (Object.keys(this.cfg.prefixes).length == 0) {
            this.cfg._noPrefix = true;
        }
        if (!('colors' in this.cfg)) {
            this.cfg.colors = colorStyles;
        } else if (Object.keys(this.cfg.colors).length == 0) {
            this.cfg._noColors = true;
        }
        this.setLogLevel(config.logLevel);
    }

    /****** Instance methods ******/

    /**
     * Clears the console, does nothing if muted
     * @function
     * @name module:loog#clear
     * @see {@link module:loog#clearLine}
     * @returns {loog}
     */
    clear () {
        if (!this._mute) {
            process.stdout.write('\x1Bc');
        }
        return this;
    }

    /**
     * Clears a counter
     * @function
     * @name module:loog#clearCount
     * @param {string} [message=''] - The message or label to clear the counter for
     * @see {@link module:loog#count}
     * @returns {loog}
     */
    clearCount (label) {
        delete this._counters[label||'_'];
    }

    /**
     * Clears the last line from the console, does nothing if muted
     * @function
     * @name module:loog#clearLine
     * @see {@link module:loog#clear}
     * @returns {loog}
     */
    clearLine () {
        if (!this._mute) {
            process.stdout.write('\u001B[A\u001B[K');
        }
        return this;
    }

    /**
     * Count a given message or label and show a message (optional)
     * @function
     * @name module:loog#count
     * @param {string} [message=null] - The message or label
     * @param {string} [type=log] - The type of log to use, pass `null` to skip logging the current count
     * @see {@link module:loog#clearCount}
     * @returns {loog}
     */
    count (label, type='log') {
        let m = '';
        if (label) {
            m = `${label}: `;
        } else {
            label = '_';
        }
        this._counters[label] = (this._counters[label] || 0) + 1;
        if (type!==null) {
            this[type](`${m}${this._counters[label]}`);
        }
        return this;
    }

    /**
     * Indent subsequent log statements one level deeper.
     * @function
     * @name module:loog#indent
     * @see {@link module:loog#outdent}
     * @see {@link module:loog#pauseIndentation}
     * @see {@link module:loog#resumeIndentation}
     * @returns {loog}
     */
    indent () {
        this._indentation++;
        return this;
    }

    /**
     * Logs a JSON object using JSON.stringify
     * @function
     * @name module:loog$json
     * @param {Object} json - The JSON object to log
     * @param {number} [indent=4] - The number of spaces on each indent level
     * @param {string} [type=log] - The logging method to use
     */
    json (json, indent = 4, type='log') {
        JSON.stringify(json, null, indent).split('\n').map(l => {this[type](l)});
    }

    /**
     * Mutes all subsequent log statements
     * @function
     * @name module:loog#mute
     * @see {@link module:loog#unmute}
     * @returns {loog}
     */
    mute () {
        this._mute = true;
        return this;
    }

    /**
     * Outdent subsequent log statements one level.
     * @function
     * @name module:loog#outdent
     * @see {@link module:loog#indent}
     * @see {@link module:loog#pauseIndentation}
     * @see {@link module:loog#resumeIndentation}
     * @see {@link module:loog#resetIndentation}
     * @returns {loog}
     */
    outdent () {
        if (this._indentation > 0) {
            this._indentation--;
        }
        return this;
    }

    /**
     * Temporarily pause indentation, subsequent statements will be logged at the root level.
     * Use {@link module:loog#resumeIndentation} to recover the indent level.
     * @function
     * @name module:loog#pauseIndentation
     * @see {@link module:loog#resumeIndentation}
     * @see {@link module:loog#indent}
     * @see {@link module:loog#outdent}
     * @see {@link module:loog#resetIndentation}
     * @returns {loog}
     */
    pauseIndentation () {
        this._indentWas = this._indentation;
        this._indentation = 0;
        return this;
    }

    /**
     * Reports existing trackers, does nothing if muted
     * @function
     * @name module:loog#report
     * @see {@link module:loog#mute}
     * @returns {loog}
     */
    report (label, type = 'log') {
        let me = this;
        if (label && label in this._trackers) {
            me[type](`${label}: ${this._trackers[label]}`);
        } else {
            let msg = Object.keys(this._trackers).sort().map((k) => {
                return `${k}: ${this._trackers[k]}`;
            });
            if (msg.length) {
                me[type](msg.join(', '));
            }
        }
        return this;
    }

    /**
     * Resets the indent level to 0.
     * @function
     * @name module:loog#resetIndentation
     * @see {@link module:loog#indent}
     * @see {@link module:loog#outdent}
     * @see {@link module:loog#pauseIndentation}
     * @see {@link module:loog#resumeIndentation}
     * @returns {loog}
     */
    resetIndentation () {
        this._indentation = 0;
        delete this._indentWas;
        return this;
    }

    /**
     * Resumes the previously paused indentation.
     * @function
     * @name module:loog#resumeIndentation
     * @see {@link module:loog#pauseIndentation}
     * @see {@link module:loog#indent}
     * @see {@link module:loog#outdent}
     * @see {@link module:loog#resetIndentation}
     * @returns {loog}
     */
    resumeIndentation () {
        this._indentation = this._indentWas;
        delete this._indentWas;
        return this;
    }

    /**
     * Changes the log level for subsequent statements.
     * 
     * Possible levels are:
     *  
     *  - all
     *  - silly
     *  - debug
     *  - verbose
     *  - timing
     *  - http
     *  - notice
     *  - info
     *  - success
     *  - warn
     *  - quiet
     *  - error
     *  - silent
     * 
     * Log levels are aggregative, so they enable/or disable log functions like this:
     * 
     *  - Level: **all**, **silly**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.timing`
     *    - `loog.verbose`
     *    - `loog.debug`
     *    - `loog.silly`
     *    - `loog.log`
     *  - Level: **debug**, **verbose**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.timing`
     *    - `loog.verbose`
     *    - `loog.debug`
     *    - `loog.log`
     *  - Level: **timing**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.timing`
     *    - `loog.log`
     *  - Level: **http**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.log`
     *  - Level: **notice**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.notice`
     *    - `loog.log`
     *  - Level: **info**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.success`
     *    - `loog.log`
     *  - Level: **warn**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.log`
     *  - Level: **error**, **quiet**
     *    - `loog.error`
     *    - `loog.log`
     *  - Level: **silent**
     *    - *(none)*
     * 
     * @function
     * @name module:loog#setLogLevel
     * @param {string} [newLevel=quiet] - The log level to set, must be one of <br> - all<br> - silly<br> - debug<br> - verbose<br> - timing<br> - http<br> - notice<br> - info<br> - warn<br> - quiet<br> - error<br> - silent
     * @returns {loog}
     */
    setLogLevel(newLevel) {
        let me = this;
        if (!newLevel || logLevels.indexOf(newLevel) === -1) {
            newLevel = 'info';
        }
        switch (newLevel) {
            case "all":
            case "silly":
                me.silly.enable = true;
            case "debug":
            case "verbose":
                me.debug.enable = true;
                me.verbose.enable = true;
            case "timing":
                me.timing.enable = true;
            case "http":
                me.http.enable = true;
            case "notice":
                me.notice.enable = true;
            case "info":
                me.info.enable = true;
                me.success.enable = true;
            case "warn":
                me.warn.enable = true;
                me.warning.enable = true;
            case "quiet":
            case "error":
                me.error.enable = true;                
                me.log.enable = true;
                break;
            case "silent":
                me.mute();
                break;
        }
        return this;
    }

    /**
     * Tracks a label or message so that it can be later retrieved using `report`.
     * @function
     * @name module:loog#track
     * @param {string} label - The label or message to track
     * @see {@link module:loog#report}
     * @see {@link module:loog#untrack}
     * @returns {loog}
     */
    track (label) {
        if (label) {
            this._trackers[label] = (this._trackers[label] || 0) + 1;
        }
        return this;
    }

    /**
     * Unmutes all subsequent log statements
     * @function
     * @name module:loog#unmute
     * @see {@link module:loog#mute}
     * @returns {loog}
     */
    unmute () {
        this._mute = false;
        return this;
    }

    /**
     * Stops tracking a label
     * @function
     * @name module:loog#untrack
     * @param {string} label - The label or message to stop tracking
     * @see {@link module:loog#track}
     * @returns {loog}
     */
    untrack (label) {
        if (label && label in this._trackers) {
            delete this._trackers[label];
        }
        return this;
    }

    /****** Private methods ******/
    
    /**
     * Logs `message` as **error**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing`, `http`, `notice`, `info`, `warn`, `quiet` or `error`.
     * 
     * @function
     * @name module:loog#error
     * @param {string} message - The message to log
     * @returns {loog}
     */
    /**
     * Logs `message` as **warn**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing`, `http`, `notice`, `info` or `warn`
     * 
     * @function
     * @name module:loog#warn
     * @alias module:loog#warning
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **info**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing`, `http`, `notice` or `info`
     * 
     * @function
     * @name module:loog#info
     * @param {string} message - The message to log
     * @returns {loog}
     */
    /**
     * Logs `message` as **success**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing`, `http`, `notice` or `info`
     * 
     * @function
     * @name module:loog#success
     * @param {string} message - The message to log
     * @returns {loog}
     */        
    /**
     * Logs `message` as **notice**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing`, `http` or `notice`
     * 
     * @function
     * @name module:loog#notice
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **http**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose`, `timing` or `http`
     * 
     * @function
     * @name module:loog#http
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **timing**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug`, `verbose` or `timing`
     * 
     * @function
     * @name module:loog#timing
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **verbose**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly`, `debug` or `verbose`
     * 
     * @function
     * @name module:loog#verbose
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **debug**.
     * 
     * Visible when `logLevel` is set to: `all`, `silly` or `debug`
     * 
     * @function
     * @name module:loog#debug
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Logs `message` as **silly**.
     * 
     * Visible when `logLevel` is set to: `all` or `silly`
     * 
     * @function
     * @name module:loog#silly
     * @param {string} message - The message to log
     * @returns {loog}
     */    
    /**
     * Issues a log statement marked as 'log'
     * @function
     * @name module:loog#log
     * @param {string} message - The message to log
     * @returns {loog}
     */
    _ () {} // This is mock function helps the docs above to be included
}

Object.keys(textPrefixes).forEach(level => {
    Object.defineProperty(Log.prototype, level, {
        /** @private */
        get: function () { 
            if (!this[`_${level}`]) {
                this[`_${level}`] = getLogFn(this, level);
            }
            return this[`_${level}`];
        }
    });
});

const defaultCfg = {
    prefixStyle: 'text',
    logLevel: process.env.npm_config_loglevel || 'info'
};

let _instance = new Log(defaultCfg);
module.exports = wrap();