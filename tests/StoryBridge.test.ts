import { Compiler } from 'inkjs/full';
import { describe, expect, it, vi } from 'vitest';
import { StoryBridge } from '../src/systems/StoryBridge';

const SOURCE = `
VAR suspicion = 0
VAR mood = "calm"
VAR met = false
-> END

=== chat ===
First line. #speaker:test
Second line, suspicion {suspicion}.
+ [Raise it]
    ~ suspicion += 1
    Raised.
+ [Leave it]
    Left.
- Done.
-> END
`;

function compile(): string {
  const compiler = new Compiler(SOURCE);
  try {
    return compiler.Compile().ToJson()!;
  } catch (error) {
    throw new Error(compiler.errors.join('\n') || String(error));
  }
}

function makeBridge(): StoryBridge {
  return new StoryBridge(compile());
}

function readAll(bridge: StoryBridge): string[] {
  const lines: string[] = [];
  for (let line = bridge.nextLine(); line; line = bridge.nextLine()) lines.push(line.text);
  return lines;
}

describe('StoryBridge', () => {
  it('accepts JSON as a string or an object', () => {
    const json = compile();
    expect(new StoryBridge(JSON.parse(json)).getVariable('suspicion')).toBe(0);
  });

  it('starts a knot and returns lines with tags', () => {
    const bridge = makeBridge();
    bridge.startKnot('chat');
    expect(bridge.nextLine()).toEqual({ text: 'First line.', tags: ['speaker:test'] });
    expect(bridge.nextLine()).toEqual({ text: 'Second line, suspicion 0.', tags: [] });
    expect(bridge.canContinue).toBe(false);
    expect(bridge.nextLine()).toBeNull();
  });

  it('throws a clear error for an unknown knot', () => {
    expect(() => makeBridge().startKnot('nope')).toThrow('no knot or stitch called "nope"');
  });

  it('lists choices and picks one', () => {
    const bridge = makeBridge();
    bridge.startKnot('chat');
    readAll(bridge);
    expect(bridge.choices()).toEqual([
      { index: 0, text: 'Raise it' },
      { index: 1, text: 'Leave it' },
    ]);
    bridge.choose(0);
    expect(readAll(bridge)).toEqual(['Raised.', 'Done.']);
    expect(bridge.isFinished).toBe(true);
    expect(bridge.getVariable('suspicion')).toBe(1);
  });

  it('rejects out-of-range choices', () => {
    const bridge = makeBridge();
    bridge.startKnot('chat');
    readAll(bridge);
    expect(() => bridge.choose(2)).toThrow('out of range');
    expect(() => bridge.choose(-1)).toThrow('out of range');
  });

  it('reads and writes variables, and ink sees the written value', () => {
    const bridge = makeBridge();
    expect(bridge.variableNames()).toEqual(['suspicion', 'mood', 'met']);
    expect(bridge.getVariable('mood')).toBe('calm');
    expect(bridge.getVariable('met')).toBe(false);
    bridge.setVariable('suspicion', 5);
    bridge.startKnot('chat');
    bridge.nextLine();
    expect(bridge.nextLine()?.text).toBe('Second line, suspicion 5.');
  });

  it('throws for undeclared variables', () => {
    const bridge = makeBridge();
    expect(() => bridge.getVariable('suspicon')).toThrow('no ink variable called "suspicon"');
    expect(() => bridge.setVariable('suspicon', 1)).toThrow('no ink variable');
  });

  it('notifies observers of changes from ink and from TypeScript, and can unsubscribe', () => {
    const bridge = makeBridge();
    const observer = vi.fn();
    const unsubscribe = bridge.observe('suspicion', observer);

    bridge.startKnot('chat');
    readAll(bridge);
    bridge.choose(0);
    readAll(bridge);
    expect(observer).toHaveBeenLastCalledWith('suspicion', 1);

    bridge.setVariable('suspicion', 7);
    expect(observer).toHaveBeenLastCalledWith('suspicion', 7);

    unsubscribe();
    bridge.setVariable('suspicion', 8);
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it('saves and restores state, including variables and position', () => {
    const bridge = makeBridge();
    bridge.setVariable('mood', 'tense');
    bridge.startKnot('chat');
    readAll(bridge);
    const saved = bridge.saveState();

    bridge.choose(0);
    readAll(bridge);
    bridge.setVariable('mood', 'other');

    const observer = vi.fn();
    bridge.observe('mood', observer);
    bridge.loadState(saved);
    expect(bridge.getVariable('mood')).toBe('tense');
    expect(bridge.getVariable('suspicion')).toBe(0);
    expect(bridge.choices()).toHaveLength(2);
    expect(observer).toHaveBeenCalledWith('mood', 'tense');
  });

  it('restores into a fresh bridge', () => {
    const a = makeBridge();
    a.setVariable('suspicion', 3);
    const b = makeBridge();
    b.loadState(a.saveState());
    expect(b.getVariable('suspicion')).toBe(3);
  });

  it('keeps its current state when given bad save data', () => {
    const bridge = makeBridge();
    bridge.setVariable('suspicion', 4);
    expect(() => bridge.loadState('not json')).toThrow('could not load ink state');
    expect(() => bridge.loadState('{"bad":1}')).toThrow('could not load ink state');
    expect(bridge.getVariable('suspicion')).toBe(4);
  });
});
