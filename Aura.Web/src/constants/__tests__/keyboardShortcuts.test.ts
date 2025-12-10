/**
 * Keyboard Shortcuts Constants Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  KEYBOARD_SHORTCUTS,
  CATEGORY_NAMES,
  getShortcutsByCategory,
  getPlatformModifier,
  formatShortcutKeys,
  type ShortcutCategory,
} from '../keyboardShortcuts';

describe('Keyboard Shortcuts Constants', () => {
  describe('KEYBOARD_SHORTCUTS', () => {
    it('should have shortcuts defined', () => {
      expect(KEYBOARD_SHORTCUTS).toBeDefined();
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    });

    it('should have all required properties', () => {
      KEYBOARD_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut).toHaveProperty('id');
        expect(shortcut).toHaveProperty('keys');
        expect(shortcut).toHaveProperty('description');
        expect(shortcut).toHaveProperty('category');
        expect(Array.isArray(shortcut.keys)).toBe(true);
        expect(shortcut.keys.length).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs', () => {
      const ids = KEYBOARD_SHORTCUTS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories: ShortcutCategory[] = [
        'playback',
        'timeline',
        'clips',
        'selection',
        'view',
        'file',
      ];

      KEYBOARD_SHORTCUTS.forEach((shortcut) => {
        expect(validCategories).toContain(shortcut.category);
      });
    });

    it('should have shortcuts in all categories', () => {
      const categories = KEYBOARD_SHORTCUTS.map((s) => s.category);
      const uniqueCategories = new Set(categories);

      expect(uniqueCategories.has('playback')).toBe(true);
      expect(uniqueCategories.has('timeline')).toBe(true);
      expect(uniqueCategories.has('clips')).toBe(true);
      expect(uniqueCategories.has('selection')).toBe(true);
      expect(uniqueCategories.has('view')).toBe(true);
      expect(uniqueCategories.has('file')).toBe(true);
    });

    it('should have essential playback shortcuts', () => {
      const playbackShortcuts = KEYBOARD_SHORTCUTS.filter((s) => s.category === 'playback');
      const playbackIds = playbackShortcuts.map((s) => s.id);

      expect(playbackIds).toContain('play-pause');
      expect(playbackIds).toContain('go-start');
      expect(playbackIds).toContain('go-end');
    });

    it('should have essential editing shortcuts', () => {
      const clipShortcuts = KEYBOARD_SHORTCUTS.filter((s) => s.category === 'clips');
      const clipIds = clipShortcuts.map((s) => s.id);

      expect(clipIds).toContain('split');
      expect(clipIds).toContain('delete');
      expect(clipIds).toContain('duplicate');
    });
  });

  describe('CATEGORY_NAMES', () => {
    it('should have names for all categories', () => {
      expect(CATEGORY_NAMES.playback).toBe('Playback');
      expect(CATEGORY_NAMES.timeline).toBe('Timeline');
      expect(CATEGORY_NAMES.clips).toBe('Clips');
      expect(CATEGORY_NAMES.selection).toBe('Selection');
      expect(CATEGORY_NAMES.view).toBe('View');
      expect(CATEGORY_NAMES.file).toBe('File');
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should group shortcuts by category', () => {
      const grouped = getShortcutsByCategory();

      expect(grouped.playback).toBeDefined();
      expect(grouped.timeline).toBeDefined();
      expect(grouped.clips).toBeDefined();
      expect(grouped.selection).toBeDefined();
      expect(grouped.view).toBeDefined();
      expect(grouped.file).toBeDefined();

      expect(Array.isArray(grouped.playback)).toBe(true);
      expect(grouped.playback.length).toBeGreaterThan(0);
    });

    it('should have all shortcuts in correct categories', () => {
      const grouped = getShortcutsByCategory();

      Object.entries(grouped).forEach(([category, shortcuts]) => {
        shortcuts.forEach((shortcut) => {
          expect(shortcut.category).toBe(category);
        });
      });
    });
  });

  describe('getPlatformModifier', () => {
    const originalPlatform = navigator.platform;

    afterEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should return ⌘ for Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      expect(getPlatformModifier()).toBe('⌘');
    });

    it('should return Ctrl for Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      expect(getPlatformModifier()).toBe('Ctrl');
    });

    it('should return Ctrl for Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });

      expect(getPlatformModifier()).toBe('Ctrl');
    });
  });

  describe('formatShortcutKeys', () => {
    const originalPlatform = navigator.platform;

    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should format single key', () => {
      expect(formatShortcutKeys(['S'])).toBe('S');
    });

    it('should format multiple keys with separator', () => {
      expect(formatShortcutKeys(['Ctrl', 'S'])).toBe('Ctrl + S');
    });

    it('should replace ⌘ with platform modifier on Windows', () => {
      expect(formatShortcutKeys(['⌘', 'S'])).toBe('Ctrl + S');
    });

    it('should replace ⌘ with platform modifier on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      expect(formatShortcutKeys(['⌘', 'S'])).toBe('⌘ + S');
    });

    it('should handle complex shortcuts', () => {
      expect(formatShortcutKeys(['⌘', 'Shift', 'Z'])).toBe('Ctrl + Shift + Z');
    });
  });
});
