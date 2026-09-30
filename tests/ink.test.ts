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
    expect(story.variablesState['food_store']).toBe(8);
    expect(story.variablesState['dialogue_style']).toBe('');
  });

  it('has Mum ask how you are the first time, and remembers your dialogue style', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    story.ChoosePathString('home_mum');
    expect(story.ContinueMaximally()).toContain('How are you feeling');
    expect(story.currentChoices).toHaveLength(3);
    story.ChooseChoiceIndex(1);
    story.ContinueMaximally();
    expect(story.variablesState['dialogue_style']).toBe('joke');
    story.ChoosePathString('home_mum');
    expect(story.ContinueMaximally()).not.toContain('How are you feeling');
  });

  it('has a prologue ending in #end', () => {
    const story = new Story(readFileSync(compileInk().outFile, 'utf8'));
    story.ChoosePathString('prologue');
    let tags: string[] = [];
    while (story.canContinue) {
      story.Continue();
      tags = story.currentTags ?? [];
    }
    expect(tags).toContain('end');
  });
});
