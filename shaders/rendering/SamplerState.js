"use strict";

/**
 * Tracks sampler/texture bindings for channels and named resources.
 */
export class SamplerState
{
    constructor()
    {
        this.named = new Map();
    }

    /**
     * Clears channel and named sampler bookkeeping.
     */
    reset()
    {
        this.named.clear();
    }

    /**
     * Stores or removes a named sampler descriptor.
     */
    setNamed(name, descriptor)
    {
        if (descriptor)
        {
            this.named.set(name, descriptor);
        }
        else
        {
            this.named.delete(name);
        }
    }

    /**
     * Fetches a named sampler descriptor.
     */
    getNamed(name)
    {
        return this.named.get(name);
    }

    /**
     * Returns all named sampler descriptors as an array.
     */
    getNamedEntries()
    {
        return Array.from(this.named.values());
    }
}
