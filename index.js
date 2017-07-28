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
    'warn',
    'quiet',
    'error',
    'silent'
];

const textPrefixes = {
    error: chalk.red.bold('[ERR]'),
    warn: chalk.yellow.bold('[WRN]'),
    warning: chalk.yellow.bold('[WRN]'),
    http: chalk.cyan.bold('[NET]'),
    info: chalk.green.bold('[INF]'),
    notice: chalk.blue.bold('[NOT]'),
    timing: chalk.blue('[TIM]'),
    verbose: chalk.blue.bold('[VRB]'),
    debug: chalk.gray.bold('[DBG]'),
    silly: chalk.white.bold('[LOL]'),
    log: ''
};

const asciiPrefixes = {
    error: chalk.red.bold(isWin ? '►' : '✖'),
    warn: chalk.yellow.bold(isWin ? '‼' : '⚠'),
    warning: chalk.yellow.bold(isWin ? '‼' : '⚠'),
    http: chalk.cyan.bold(isWin ? '≡' : '☷'),
    info: chalk.green.bold(isWin ? 'i' : 'ℹ'),
    notice: chalk.blue.bold(isWin ? 'i' : 'ℵ'),
    timing: chalk.blue(isWin ? '+' : '◷'),
    verbose: chalk.blue.bold(isWin ? 'i' : 'ℹ'),
    debug: chalk.gray.bold(isWin ? 'i': 'ℹ'),
    silly: chalk.white.bold(isWin ? '☺' : '☺'),
    log: ''
};

const emojiPrefixes = {
    error: '❌ ',
    warn: '〽️ ',
    warning: "〽️ ",
    http: '🌐 ',
    info: '➡️ ',
    notice: '❕',
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
    notice: chalk.blue.bold,
    timing: chalk.blue,
    verbose: chalk.blue.bold,
    debug: chalk.gray.bold,
    silly: chalk.white.bold,
    /** @private */
    log: t => t
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
 * @function
 * @name loog
 * @param {Object} [config] - The initial config
 * @param {string} [config.prefixStyle=text] - The prefix style, one of ['text', 'emoji', 'ascii', 'none']. 
 * @param {string} [config.logLevel=info] - The log level, one of ['silly', 'debug', 'info', 'warn', 'error', 'silent'].    
 */
function wrap () {
    let ex = function reconfigure (cfg) {
        _instance = new Loog(Object.assign({}, defaultCfg, cfg));
        return wrap();
    }
    Object.getOwnPropertyNames(Loog.prototype).forEach((method)=> {
        if (method !== "constructor" && method.charAt(0) !== "_") {
            ex[method] = _instance[method].bind(_instance);
        }
    });
    ex.$levels = logLevels;
    ex.$methods = logLevels.filter(l => !~['all','quiet','silent'].indexOf(l));
    ex.$prefixes = {
        text: textPrefixes,
        ascii: asciiPrefixes,
        emoji: emojiPrefixes
    };
    ex.$colors = colorStyles;
    return ex;
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
class Loog {
    constructor (config) { 
        this._indentation = 0;
        this.cfg = Object.assign({}, config);
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
            case "none":
                this.cfg.prefixes = {};
                if (!this.cfg.color) {
                    this.cfg.colorStyle = {};
                } else {
                    this.cfg.colorStyle = colorStyles;
                }
                break;
        }
        this.setLogLevel(config.logLevel);
    } 

    /**
     * Clears the console
     * @function
     * @name module:loog#clear
     * @returns {loog}
     */
    clear () {
        if (!this._mute) {
            process.stdout.write('\x1Bc');
        }
        return this;
    }

    /**
     * Clears the last line from the console
     * @function
     * @name module:loog#clearLine
     * @returns {loog}
     */
    clearLine () {
        if (!this._mute) {
            process.stdout.write('\u001B[A\u001B[K');
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
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.timing`
     *    - `loog.log`
     *  - Level: **http**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.notice`
     *    - `loog.http`
     *    - `loog.log`
     *  - Level: **notice**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
     *    - `loog.notice`
     *    - `loog.log`
     *  - Level: **info**
     *    - `loog.error`
     *    - `loog.warn`
     *    - `loog.warning`
     *    - `loog.info`
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
    _getLogFn(level) {
        let me = this;
        return function logFn () {
            if (logFn.enable && !me._mute) {
                let args = Array.prototype.slice.call(arguments);
                if (me.cfg.prefixes[level]) {
                    args.unshift(me.cfg.prefixes[level]);
                }
                if (this._indentation > 0) {
                    args.unshift(" ".repeat(this._indentation));
                }
                if (me.cfg.colorStyle[level]) {
                    console.log(me.cfg.colorStyle[level](args.join(' ')));
                } else {
                    console.log(args.join(' '));
                }
            }
            return me;
        }
    }
}

Object.keys(textPrefixes).forEach(level => {
    Object.defineProperty(Loog.prototype, level, {
        /** @private */
        get: function () { 
            if (!this[`_${level}`]) {
                this[`_${level}`] = this._getLogFn(level);
            }
            return this[`_${level}`];
        }
    });
});

const defaultCfg = {
    prefixStyle: 'text',
    color: true,
    colorStyle: {},
    logLevel: process.env.npm_config_loglevel || 'info'
};

let _instance = new Loog(defaultCfg);
module.exports = wrap();