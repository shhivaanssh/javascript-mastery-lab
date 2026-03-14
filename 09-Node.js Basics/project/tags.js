import path from "path";
import os   from "os";
import { readJSON, writeJSONAtomic } from "./files.js";

const DB_PATH = path.join(os.homedir(), ".fscli", "tags.json");

// Schema: { [absolutePath]: string[] }

export class TagDB {
  #data = {};
  #dirty = false;

  async load() {
    this.#data = await readJSON(DB_PATH, {});
    return this;
  }

  async save() {
    if (!this.#dirty) return;
    await writeJSONAtomic(DB_PATH, this.#data);
    this.#dirty = false;
  }

  // Add tags to a file
  add(filepath, ...tags) {
    const key    = path.resolve(filepath);
    const current = new Set(this.#data[key] ?? []);
    tags.forEach(t => current.add(t.toLowerCase().trim()));
    this.#data[key] = [...current].sort();
    this.#dirty = true;
    return this.#data[key];
  }

  // Remove tags from a file
  remove(filepath, ...tags) {
    const key = path.resolve(filepath);
    if (!this.#data[key]) return [];
    const remove = new Set(tags.map(t => t.toLowerCase().trim()));
    this.#data[key] = this.#data[key].filter(t => !remove.has(t));
    if (this.#data[key].length === 0) delete this.#data[key];
    this.#dirty = true;
    return this.#data[key] ?? [];
  }

  // Get tags for a file
  get(filepath) {
    return this.#data[path.resolve(filepath)] ?? [];
  }

  // Clear all tags for a file
  clear(filepath) {
    const key = path.resolve(filepath);
    delete this.#data[key];
    this.#dirty = true;
  }

  // Find all files with a specific tag
  findByTag(tag) {
    const t = tag.toLowerCase().trim();
    return Object.entries(this.#data)
      .filter(([, tags]) => tags.includes(t))
      .map(([filepath]) => filepath);
  }

  // Find files matching ALL given tags
  findByTags(tags) {
    const required = tags.map(t => t.toLowerCase().trim());
    return Object.entries(this.#data)
      .filter(([, fileTags]) => required.every(t => fileTags.includes(t)))
      .map(([filepath]) => filepath);
  }

  // All unique tags across all files
  allTags() {
    const tags = new Set();
    Object.values(this.#data).forEach(ts => ts.forEach(t => tags.add(t)));
    return [...tags].sort();
  }

  // Stats
  stats() {
    const taggedFiles = Object.keys(this.#data).length;
    const allT        = this.allTags();
    const tagCounts   = {};
    Object.values(this.#data).forEach(ts => ts.forEach(t => {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }));
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return { taggedFiles, totalTags: allT.length, topTags };
  }
}
