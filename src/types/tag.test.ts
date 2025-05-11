import { Tag } from '@/types/tag';

describe('Tag', () => {
  it('should create a Tag instance with the given key and value', () => {
    const tag = new Tag('Opening', 'Sicilian Defense');
    expect(tag).toBeInstanceOf(Tag);
    expect(tag.getKey()).toBe('Opening');
    expect(tag.getValue()).toBe('Sicilian Defense');
  });

  it('getKey() should return the correct key', () => {
    const tag = new Tag('Event', 'World Championship');
    expect(tag.getKey()).toBe('Event');
  });

  it('getValue() should return the correct value', () => {
    const tag = new Tag('Site', 'London');
    expect(tag.getValue()).toBe('London');
  });

  it('toString() should return the correct string representation', () => {
    const tag = new Tag('Player', 'Magnus Carlsen');
    expect(tag.toString()).toBe('Player: Magnus Carlsen');
  });

  it('should handle empty strings for key and value', () => {
    const tag = new Tag('', '');
    expect(tag.getKey()).toBe('');
    expect(tag.getValue()).toBe('');
    expect(tag.toString()).toBe(': ');
  });

  it('should handle special characters in key and value', () => {
    const tag = new Tag('!@#$', '^&*()');
    expect(tag.getKey()).toBe('!@#$');
    expect(tag.getValue()).toBe('^&*()');
    expect(tag.toString()).toBe('!@#$: ^&*()');
  });

  it('getKey() should return the key when it is a normal string', () => {
    const tag = new Tag('Type', 'Blitz');
    expect(tag.getKey()).toBe('Type');
  });

  it('getKey() should return an empty string when key is empty', () => {
    const tag = new Tag('', 'Some Value');
    expect(tag.getKey()).toBe('');
  });

  it('getKey() should return the key with special characters', () => {
    const tag = new Tag('!@#$', 'Special');
    expect(tag.getKey()).toBe('!@#$');
  });

  it('getKey() should return the key with spaces', () => {
    const tag = new Tag('Player Name', 'Magnus');
    expect(tag.getKey()).toBe('Player Name');
  });

  it('getValue() should return the value when it is a normal string', () => {
    const tag = new Tag('Type', 'Rapid');
    expect(tag.getValue()).toBe('Rapid');
  });

  it('getValue() should return an empty string when value is empty', () => {
    const tag = new Tag('Key', '');
    expect(tag.getValue()).toBe('');
  });

  it('getValue() should return the value with special characters', () => {
    const tag = new Tag('Special', '!@#$%^&*()');
    expect(tag.getValue()).toBe('!@#$%^&*()');
  });

  it('getValue() should return the value with spaces', () => {
    const tag = new Tag('Description', 'A very long value');
    expect(tag.getValue()).toBe('A very long value');
  });

  it('toString() should return "key: value" for normal strings', () => {
    const tag = new Tag('Opening', 'French Defense');
    expect(tag.toString()).toBe('Opening: French Defense');
  });

  it('toString() should handle empty key', () => {
    const tag = new Tag('', 'Some Value');
    expect(tag.toString()).toBe(': Some Value');
  });

  it('toString() should handle empty value', () => {
    const tag = new Tag('Key', '');
    expect(tag.toString()).toBe('Key: ');
  });

  it('toString() should handle both key and value as empty strings', () => {
    const tag = new Tag('', '');
    expect(tag.toString()).toBe(': ');
  });

  it('toString() should handle special characters in key and value', () => {
    const tag = new Tag('!@#$', '^&*()');
    expect(tag.toString()).toBe('!@#$: ^&*()');
  });

  it('toString() should handle spaces in key and value', () => {
    const tag = new Tag('Player Name', 'Magnus Carlsen');
    expect(tag.toString()).toBe('Player Name: Magnus Carlsen');
  });

  it('toString() should handle long strings', () => {
    const longKey = 'k'.repeat(100);
    const longValue = 'v'.repeat(100);
    const tag = new Tag(longKey, longValue);
    expect(tag.toString()).toBe(`${longKey}: ${longValue}`);
  });
});
