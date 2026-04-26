export type Theme = 'light' | 'dark' | 'forest' | 'green' | 'pride' | 'retro';

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
	{ id: 'light', label: 'Light', swatch: '#ffffff' },
	{ id: 'dark', label: 'Dark', swatch: '#141c2b' },
	{ id: 'forest', label: 'Forest', swatch: '#1a2e1e' },
	{ id: 'green', label: 'Green', swatch: '#d4f0d8' },
	{ id: 'pride', label: 'Pride', swatch: '#E40303' },
	{ id: 'retro', label: 'Retro', swatch: '#e8d9b0' }
];

const STORAGE_KEY = 'vethub-theme';
const VALID: Theme[] = ['light', 'dark', 'forest', 'green', 'pride', 'retro'];

function readStored(): Theme {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		if (v && (VALID as string[]).includes(v)) return v as Theme;
	} catch {
		// localStorage unavailable
	}
	return 'light';
}

function persist(theme: Theme) {
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// ignore
	}
}

function applyToDOM(theme: Theme) {
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', theme);
	}
}

let _current = $state<Theme>('light');

export const themeStore = {
	get current() {
		return _current;
	},
	init() {
		const stored = readStored();
		_current = stored;
		applyToDOM(stored);
	},
	set(theme: Theme) {
		_current = theme;
		applyToDOM(theme);
		persist(theme);
	}
};
