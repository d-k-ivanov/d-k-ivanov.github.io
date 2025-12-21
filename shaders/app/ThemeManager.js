"use strict";

/**
 * Remembers and toggles light/dark themes for canvas and control panels.
 */
export class ThemeManager
{
    constructor()
    {
        this.panels = {
            canvas: {
                element: document.getElementById("canvas-panel"),
                button: document.getElementById("canvas-theme-toggle"),
                isDark: true
            },
            control: {
                element: document.getElementById("control-panel"),
                button: document.getElementById("control-theme-toggle"),
                isDark: false
            }
        };

        this.init();
    }

    /**
     * Loads preferences and attaches theme toggle listeners.
     */
    init()
    {
        // Load saved preferences
        this.loadPreferences();

        // Setup event listeners
        if (this.panels.canvas.button)
        {
            this.panels.canvas.button.addEventListener("click", () => this.toggleTheme("canvas"));
        }

        if (this.panels.control.button)
        {
            this.panels.control.button.addEventListener("click", () => this.toggleTheme("control"));
        }

        // Apply initial themes
        this.applyTheme("canvas");
        this.applyTheme("control");
    }

    /**
     * Restores persisted theme choices.
     */
    loadPreferences()
    {
        try
        {
            const saved = localStorage.getItem("shaders-theme-prefs");
            if (saved)
            {
                const prefs = JSON.parse(saved);
                if (typeof prefs.canvas === "boolean")
                {
                    this.panels.canvas.isDark = prefs.canvas;
                }
                if (typeof prefs.control === "boolean")
                {
                    this.panels.control.isDark = prefs.control;
                }
            }
        }
        catch (e)
        {
            // Ignore localStorage errors
        }
    }

    /**
     * Persists current theme selections.
     */
    savePreferences()
    {
        try
        {
            localStorage.setItem("shaders-theme-prefs", JSON.stringify({
                canvas: this.panels.canvas.isDark,
                control: this.panels.control.isDark
            }));
        }
        catch (e)
        {
            // Ignore localStorage errors
        }
    }

    /**
     * Toggles theme for a specific panel.
     */
    toggleTheme(panelName)
    {
        const panel = this.panels[panelName];
        if (!panel) return;

        panel.isDark = !panel.isDark;
        this.applyTheme(panelName);
        this.savePreferences();
    }

    /**
     * Applies theme classes and button labels.
     */
    applyTheme(panelName)
    {
        const panel = this.panels[panelName];
        if (!panel || !panel.element) return;

        // Update theme class
        panel.element.classList.remove("theme-dark", "theme-light");
        panel.element.classList.add(panel.isDark ? "theme-dark" : "theme-light");

        // Update button icon
        if (panel.button)
        {
            // Show sun when dark (click to switch to light), moon when light (click to switch to dark)
            panel.button.textContent = panel.isDark ? "☀" : "☾";
            panel.button.title = panel.isDark ? "Switch to light theme" : "Switch to dark theme";
        }
    }

    /**
     * Clears stored theme preferences.
     */
    resetThemes()
    {
        try
        {
            localStorage.removeItem("shaders-theme-prefs");
        }
        catch (e)
        {
            // Ignore localStorage errors
        }
    }
}
