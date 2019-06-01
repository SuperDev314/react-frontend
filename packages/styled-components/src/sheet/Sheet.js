// @flow

import { DISABLE_SPEEDY, IS_BROWSER } from '../constants';
import createStylisInstance, { type Stringifier } from '../utils/stylis';
import type { Sheet } from './types';
import { makeTag } from './Tag';
import { type GroupedTag, makeGroupedTag } from './GroupedTag';
import { getGroupForId } from './GroupIDAllocator';
import { outputSheet, rehydrateSheet } from './Rehydration';

let SHOULD_REHYDRATE = IS_BROWSER;

/** Contains the main stylesheet logic for stringification and caching */
class StyleSheet implements Sheet {
  isServer: boolean;

  names: Map<string, Set<string>>;

  stringifier: Stringifier;

  target: void | HTMLElement;

  tag: void | GroupedTag;

  useCSSOM: boolean;

  /** Register a group ID to give it an index */
  static registerId(id: string): number {
    return getGroupForId(id);
  }

  constructor(isServer: boolean, target?: HTMLElement) {
    this.names = new Map();
    this.isServer = isServer;
    this.stringifier = createStylisInstance();
    this.target = target;
    this.useCSSOM = !DISABLE_SPEEDY;

    // We rehydrate only once and use the sheet that is
    // created first
    if (!isServer && IS_BROWSER && SHOULD_REHYDRATE) {
      SHOULD_REHYDRATE = false;
      rehydrateSheet(this);
    }
  }

  /** Lazily initialises a GroupedTag for when it's actually needed */
  getTag(): GroupedTag {
    if (this.tag === undefined) {
      const tag = makeTag(this.isServer, this.useCSSOM, this.target);
      this.tag = makeGroupedTag(tag);
    }

    return this.tag;
  }

  /** Check whether a name is known for caching */
  hasNameForId(id: string, name: string): boolean {
    return this.names.has(id) && (this.names.get(id): any).has(name);
  }

  /** Mark a group's name as known for caching */
  registerName(id: string, name: string) {
    getGroupForId(id);

    if (!this.names.has(id)) {
      const groupNames = new Set();
      groupNames.add(name);
      this.names.set(id, groupNames);
    } else {
      (this.names.get(id): any).add(name);
    }
  }

  /** Insert new rules which also marks the name as known */
  insertRules(id: string, name: string, rules: string[]) {
    this.registerName(id, name);
    this.getTag().insertRules(getGroupForId(id), rules);
  }

  /** Clears all cached names for a given group ID */
  clearNames(id: string) {
    if (this.names.has(id)) {
      (this.names.get(id): any).clear();
    }
  }

  /** Clears all rules for a given group ID */
  clearRules(id: string) {
    this.getTag().clearGroup(getGroupForId(id));
    this.clearNames(id);
  }

  /** Clears the entire tag which deletes all rules but not its names */
  clearTag() {
    // NOTE: This does not clear the names, since it's only used during SSR
    // so that we can continuously output only new rules
    this.tag = undefined;
  }

  /** Outputs the current sheet as a CSS string with markers for SSR */
  toString(): string {
    return outputSheet(this);
  }
}

export default StyleSheet;
