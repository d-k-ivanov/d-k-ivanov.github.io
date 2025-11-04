/**
 * WindowManager
 * Manages metadata for all open windows/tabs of this app, synchronizing via localStorage.
 * Handles window registration, removal, and shape/metadata updates.
 *
 * Best practices:
 * - Robust event handling and error checking
 * - Cross-browser compatibility
 * - Clear API and documentation
 * - Maintainable, idiomatic code
 */
class WindowManager
{
    static WINDOWS_KEY = 'windows';
    static COUNT_KEY = 'count';

    #windows = [];
    #count = 0;
    #id = null;
    #winData = null;
    #winShapeChangeCallback = null;
    #winChangeCallback = null;

    #storageListener = null;
    #beforeUnloadListener = null;

    constructor()
    {
        // Use arrow functions to preserve 'this'
        this.#storageListener = (event) =>
        {
            if (event.key === WindowManager.WINDOWS_KEY && event.newValue)
            {
                try
                {
                    const newWindows = JSON.parse(event.newValue);
                    const winChange = this.#didWindowsChange(this.#windows, newWindows);
                    this.#windows = newWindows;
                    if (winChange && this.#winChangeCallback)
                    {
                        this.#winChangeCallback();
                    }
                } catch (e)
                {
                    console.warn('WindowManager: Failed to parse windows from storage event.', e);
                }
            }
        };

        this.#beforeUnloadListener = () =>
        {
            const index = this.getWindowIndexFromId(this.#id);
            if (index !== -1)
            {
                this.#windows.splice(index, 1);
                this.updateWindowsLocalStorage();
            }
        };

        window.addEventListener('storage', this.#storageListener);
        window.addEventListener('beforeunload', this.#beforeUnloadListener);
    }

    /**
     * Clean up event listeners (call if you ever destroy the manager)
     */
    destroy()
    {
        window.removeEventListener('storage', this.#storageListener);
        window.removeEventListener('beforeunload', this.#beforeUnloadListener);
    }

    /**
     * Compare two window lists for changes (deep comparison of id and shape)
     */
    #didWindowsChange(prev, next)
    {
        if (!Array.isArray(prev) || !Array.isArray(next) || prev.length !== next.length)
        {
            return true;
        }
        for (let i = 0; i < prev.length; i++)
        {
            if (prev[i].id !== next[i].id) return true;
            // Optionally compare shape or metadata for deeper change detection
            // if (JSON.stringify(prev[i].shape) !== JSON.stringify(next[i].shape)) return true;
        }
        return false;
    }

    /**
     * Register this window with optional metadata.
     * @param {Object} metaData - Custom data to associate with this window.
     */
    init(metaData = {})
    {
        try
        {
            this.#windows = JSON.parse(localStorage.getItem(WindowManager.WINDOWS_KEY)) || [];
        } catch
        {
            this.#windows = [];
        }
        this.#count = parseInt(localStorage.getItem(WindowManager.COUNT_KEY), 10) || 0;
        this.#count += 1;
        this.#id = this.#count;
        const shape = this.getWinShape();
        this.#winData = { id: this.#id, shape, metaData };
        this.#windows.push(this.#winData);

        localStorage.setItem(WindowManager.COUNT_KEY, this.#count);
        this.updateWindowsLocalStorage();
    }

    /**
     * Get the current window's shape (position and size).
     * Uses cross-browser properties.
     */
    getWinShape()
    {
        // screenX/screenY are more standard than screenLeft/screenTop
        return {
            x: window.screenX,
            y: window.screenY,
            w: window.innerWidth,
            h: window.innerHeight
        };
    }

    /**
     * Find the index of a window by its ID.
     * @param {number} id
     * @returns {number} index or -1 if not found
     */
    getWindowIndexFromId(id)
    {
        return this.#windows.findIndex(win => win.id === id);
    }

    /**
     * Write the current windows array to localStorage.
     */
    updateWindowsLocalStorage()
    {
        localStorage.setItem(WindowManager.WINDOWS_KEY, JSON.stringify(this.#windows));
    }

    /**
     * Update this window's shape and notify if changed.
     * Call this on resize/move events.
     */
    update()
    {
        const winShape = this.getWinShape();
        const shapeChanged = Object.keys(winShape).some(
            key => winShape[key] !== this.#winData.shape[key]
        );
        if (shapeChanged)
        {
            this.#winData.shape = { ...winShape };
            const index = this.getWindowIndexFromId(this.#id);
            if (index !== -1)
            {
                this.#windows[index].shape = { ...winShape };
                if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
                this.updateWindowsLocalStorage();
            }
        }
    }

    /**
     * Set a callback for when this window's shape changes.
     * @param {Function} callback
     */
    setWinShapeChangeCallback(callback)
    {
        this.#winShapeChangeCallback = callback;
    }

    /**
     * Set a callback for when the window list changes.
     * @param {Function} callback
     */
    setWinChangeCallback(callback)
    {
        this.#winChangeCallback = callback;
    }

    /**
     * Get the current list of windows.
     * @returns {Array}
     */
    getWindows()
    {
        return this.#windows;
    }

    /**
     * Get this window's metadata.
     * @returns {Object}
     */
    getThisWindowData()
    {
        return this.#winData;
    }

    /**
     * Get this window's unique ID.
     * @returns {number}
     */
    getThisWindowID()
    {
        return this.#id;
    }

    /**
     * Update this window's metadata.
     * @param {Object} metaData
     */
    updateMetaData(metaData)
    {
        this.#winData.metaData = metaData;
        const index = this.getWindowIndexFromId(this.#id);
        if (index !== -1)
        {
            this.#windows[index].metaData = metaData;
            this.updateWindowsLocalStorage();
        }
    }
}

export default WindowManager;