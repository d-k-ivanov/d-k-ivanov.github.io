"use strict";
// A minimal output console that renders log lines into a DOM element. Used as the
// `console` available inside user scripts (so `console.log(...)` and `print(...)`
// route here instead of the browser devtools).

export class Console
{
    constructor(element)
    {
        this.el = element;
    }

    clear() { this.el.innerHTML = ''; }

    log(...args) { this._append('log', args); }
    info(...args) { this._append('info', args); }
    warn(...args) { this._append('warn', args); }
    error(...args) { this._append('error', args); }
    result(...args) { this._append('result', args); }

    _append(type, args)
    {
        const line = document.createElement('div');
        line.className = `cgs-line cgs-${type}`;
        line.textContent = args.map(Console.format).join(' ');
        this.el.appendChild(line);
        this.el.scrollTop = this.el.scrollHeight;
    }

    /** Render any value to a readable string (objects are pretty-printed as JSON). */
    static format(value)
    {
        if (typeof value === 'string')
        {
            return value;
        }
        if (value instanceof Error)
        {
            return value.stack || `${value.name}: ${value.message}`;
        }
        try
        {
            return JSON.stringify(value, Console._replacer(), 2);
        } catch
        {
            return String(value);
        }
    }

    /** JSON replacer that tolerates circular references and functions. */
    static _replacer()
    {
        const seen = new WeakSet();
        return (_key, val) =>
        {
            if (typeof val === 'function')
            {
                return `[Function ${val.name || 'anonymous'}]`;
            }
            if (typeof val === 'object' && val !== null)
            {
                if (seen.has(val))
                {
                    return '[Circular]';
                }
                seen.add(val);
            }
            return val;
        };
    }
}
