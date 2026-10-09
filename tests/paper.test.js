import { describe, expect, it } from 'vitest';
import { PRINTABLE_H_MM, PRINTABLE_W_MM, pageFit, pageNote } from '../shared/paper.js';

describe('pageFit', () => {
  it('fits an upright page up to the printable size', () => {
    expect(pageFit(100, 100)).toBe('portrait');
    expect(pageFit(PRINTABLE_W_MM, PRINTABLE_H_MM)).toBe('portrait');
  });

  it('fits only a sideways page when it is too wide for upright but short enough', () => {
    expect(pageFit(PRINTABLE_H_MM, PRINTABLE_W_MM)).toBe('landscape');
    expect(pageFit(202, 168)).toBe('landscape');
  });

  it('fits neither when too big either way, including a 250 mm square', () => {
    expect(pageFit(250, 250)).toBe('none');
    expect(pageFit(447, 268)).toBe('none');
    expect(pageFit(PRINTABLE_W_MM + 1, PRINTABLE_H_MM + 1)).toBe('none');
  });
});

describe('pageNote', () => {
  it('says nothing when it fits upright', () => {
    expect(pageNote(140, 216)).toEqual({ text: '', warn: false });
  });

  it('suggests landscape without warning', () => {
    const note = pageNote(250, 162);
    expect(note.text).toMatch(/landscape/);
    expect(note.warn).toBe(false);
  });

  it('warns when it will be cut off or split', () => {
    const note = pageNote(250, 250);
    expect(note.warn).toBe(true);
    expect(note.text).toMatch(/cut off or split/);
  });

  it('lets a narrow but tall exercise continue onto more pages when its rows stay whole', () => {
    const note = pageNote(175, 335, { rowsStayWhole: true });
    expect(note.warn).toBe(false);
    expect(note.text).toMatch(/more pages/);
    // ...but a wide one is still cut off, so that warns
    expect(pageNote(447, 268, { rowsStayWhole: true }).warn).toBe(true);
  });
});
