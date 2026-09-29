import { readFileSync } from 'node:fs';
import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import { compileInk } from '../scripts/ink.mjs';

describe('ink pipeline', () => {
  it('compiles story/main.ink to JSON the runtime can load', () => {
    const result = compileInk();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);

    const story = new Story(readFileSync(result.outFile, 'utf8'));
    expect(story.variablesState['suspicion']).toBe(0);
    story.ChoosePathString('test_conversation');
    expect(story.ContinueMaximally()).toContain('test conversation');
    expect(story.currentChoices).toHaveLength(2);
  });
});
