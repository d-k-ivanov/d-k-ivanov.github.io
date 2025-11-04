/**
 * Simple event emitter for managing application events
 * Provides a lightweight pub/sub system for component communication
 */
export class EventEmitter
{
    constructor()
    {
        this.events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(eventName, callback)
    {
        if (!this.events.has(eventName))
        {
            this.events.set(eventName, []);
        }

        this.events.get(eventName).push(callback);

        // Return unsubscribe function
        return () =>
        {
            const listeners = this.events.get(eventName);
            if (listeners)
            {
                const index = listeners.indexOf(callback);
                if (index > -1)
                {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {...any} args - Arguments to pass to listeners
     */
    emit(eventName, ...args)
    {
        const listeners = this.events.get(eventName);
        if (listeners)
        {
            listeners.forEach(callback =>
            {
                try
                {
                    callback(...args);
                } catch (error)
                {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Name of the event
     */
    off(eventName)
    {
        this.events.delete(eventName);
    }

    /**
     * Remove all listeners
     */
    clear()
    {
        this.events.clear();
    }
}
