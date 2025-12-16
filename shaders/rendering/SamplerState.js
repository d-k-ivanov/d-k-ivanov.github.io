"use strict";

export class SamplerState
{
    constructor()
    {
        this.channels = [null, null, null, null];
        this.named = new Map();
    }

    reset()
    {
        this.channels = [null, null, null, null];
        this.named.clear();
    }

    setChannel(index, descriptor)
    {
        this.channels[index] = descriptor;
    }

    getChannels()
    {
        return this.channels;
    }

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

    getNamed(name)
    {
        return this.named.get(name);
    }

    getNamedEntries()
    {
        return Array.from(this.named.values());
    }
}
