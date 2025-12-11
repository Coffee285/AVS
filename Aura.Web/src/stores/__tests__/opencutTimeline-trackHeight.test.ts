/**
 * OpenCut Timeline Store - Track Height Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOpenCutTimelineStore, TRACK_HEIGHTS } from '../opencutTimeline';

describe('OpenCut Timeline Store - Track Heights', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useOpenCutTimelineStore.getState();
    store.clearHistory();
  });

  describe('TRACK_HEIGHTS constants', () => {
    it('defines correct heights for video tracks', () => {
      expect(TRACK_HEIGHTS.video.compact).toBe(32);
      expect(TRACK_HEIGHTS.video.default).toBe(64);
      expect(TRACK_HEIGHTS.video.expanded).toBe(96);
    });

    it('defines correct heights for audio tracks', () => {
      expect(TRACK_HEIGHTS.audio.compact).toBe(24);
      expect(TRACK_HEIGHTS.audio.default).toBe(48);
      expect(TRACK_HEIGHTS.audio.expanded).toBe(72);
    });

    it('defines correct heights for text tracks', () => {
      expect(TRACK_HEIGHTS.text.compact).toBe(24);
      expect(TRACK_HEIGHTS.text.default).toBe(40);
      expect(TRACK_HEIGHTS.text.expanded).toBe(56);
    });

    it('defines correct heights for image tracks', () => {
      expect(TRACK_HEIGHTS.image.compact).toBe(32);
      expect(TRACK_HEIGHTS.image.default).toBe(64);
      expect(TRACK_HEIGHTS.image.expanded).toBe(96);
    });
  });

  describe('default track heights', () => {
    it('creates video track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const videoTrack = store.tracks.find((t) => t.type === 'video');
      expect(videoTrack?.height).toBe(TRACK_HEIGHTS.video.default);
    });

    it('creates audio track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const audioTrack = store.tracks.find((t) => t.type === 'audio');
      expect(audioTrack?.height).toBe(TRACK_HEIGHTS.audio.default);
    });

    it('creates text track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const textTrack = store.tracks.find((t) => t.type === 'text');
      expect(textTrack?.height).toBe(TRACK_HEIGHTS.text.default);
    });
  });

  describe('setTrackHeight', () => {
    it('updates track height within bounds', () => {
      const store = useOpenCutTimelineStore.getState();
      const trackId = store.tracks[0].id;

      store.setTrackHeight(trackId, 80);

      const updatedStore = useOpenCutTimelineStore.getState();
      const updatedTrack = updatedStore.tracks.find((t) => t.id === trackId);
      expect(updatedTrack?.height).toBe(80);
    });

    it('clamps height to minimum 24px', () => {
      const store = useOpenCutTimelineStore.getState();
      const trackId = store.tracks[0].id;

      store.setTrackHeight(trackId, 10);

      const updatedStore = useOpenCutTimelineStore.getState();
      const updatedTrack = updatedStore.tracks.find((t) => t.id === trackId);
      expect(updatedTrack?.height).toBe(24);
    });

    it('clamps height to maximum 120px', () => {
      const store = useOpenCutTimelineStore.getState();
      const trackId = store.tracks[0].id;

      store.setTrackHeight(trackId, 150);

      const updatedStore = useOpenCutTimelineStore.getState();
      const updatedTrack = updatedStore.tracks.find((t) => t.id === trackId);
      expect(updatedTrack?.height).toBe(120);
    });
  });

  describe('setAllTracksViewMode', () => {
    it('sets all tracks to compact view', () => {
      const store = useOpenCutTimelineStore.getState();
      store.setAllTracksViewMode('compact');

      const updatedStore = useOpenCutTimelineStore.getState();
      updatedStore.tracks.forEach((track) => {
        expect(track.height).toBe(TRACK_HEIGHTS[track.type].compact);
      });
    });

    it('sets all tracks to default view', () => {
      const store = useOpenCutTimelineStore.getState();
      store.setAllTracksViewMode('default');

      const updatedStore = useOpenCutTimelineStore.getState();
      updatedStore.tracks.forEach((track) => {
        expect(track.height).toBe(TRACK_HEIGHTS[track.type].default);
      });
    });

    it('sets all tracks to expanded view', () => {
      const store = useOpenCutTimelineStore.getState();
      store.setAllTracksViewMode('expanded');

      const updatedStore = useOpenCutTimelineStore.getState();
      updatedStore.tracks.forEach((track) => {
        expect(track.height).toBe(TRACK_HEIGHTS[track.type].expanded);
      });
    });

    it('respects different track types when setting view mode', () => {
      const store = useOpenCutTimelineStore.getState();

      // Set to compact
      store.setAllTracksViewMode('compact');

      let updatedStore = useOpenCutTimelineStore.getState();
      let videoTrack = updatedStore.tracks.find((t) => t.type === 'video');
      let audioTrack = updatedStore.tracks.find((t) => t.type === 'audio');
      let textTrack = updatedStore.tracks.find((t) => t.type === 'text');

      expect(videoTrack?.height).toBe(TRACK_HEIGHTS.video.compact);
      expect(audioTrack?.height).toBe(TRACK_HEIGHTS.audio.compact);
      expect(textTrack?.height).toBe(TRACK_HEIGHTS.text.compact);

      // Set to expanded
      store.setAllTracksViewMode('expanded');

      updatedStore = useOpenCutTimelineStore.getState();
      videoTrack = updatedStore.tracks.find((t) => t.type === 'video');
      audioTrack = updatedStore.tracks.find((t) => t.type === 'audio');
      textTrack = updatedStore.tracks.find((t) => t.type === 'text');

      expect(videoTrack?.height).toBe(TRACK_HEIGHTS.video.expanded);
      expect(audioTrack?.height).toBe(TRACK_HEIGHTS.audio.expanded);
      expect(textTrack?.height).toBe(TRACK_HEIGHTS.text.expanded);
    });
  });

  describe('addTrack with type-based heights', () => {
    it('adds video track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const newTrackId = store.addTrack('video');

      const updatedStore = useOpenCutTimelineStore.getState();
      const newTrack = updatedStore.tracks.find((t) => t.id === newTrackId);
      expect(newTrack?.height).toBe(TRACK_HEIGHTS.video.default);
    });

    it('adds audio track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const newTrackId = store.addTrack('audio');

      const updatedStore = useOpenCutTimelineStore.getState();
      const newTrack = updatedStore.tracks.find((t) => t.id === newTrackId);
      expect(newTrack?.height).toBe(TRACK_HEIGHTS.audio.default);
    });

    it('adds text track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const newTrackId = store.addTrack('text');

      const updatedStore = useOpenCutTimelineStore.getState();
      const newTrack = updatedStore.tracks.find((t) => t.id === newTrackId);
      expect(newTrack?.height).toBe(TRACK_HEIGHTS.text.default);
    });

    it('adds image track with correct default height', () => {
      const store = useOpenCutTimelineStore.getState();
      const newTrackId = store.addTrack('image');

      const updatedStore = useOpenCutTimelineStore.getState();
      const newTrack = updatedStore.tracks.find((t) => t.id === newTrackId);
      expect(newTrack?.height).toBe(TRACK_HEIGHTS.image.default);
    });
  });
});
