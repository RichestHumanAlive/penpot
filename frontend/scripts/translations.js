#!/usr/bin/env node

import getopts from "getopts";
import {promises as fs} from 'fs';
import gt from 'gettext-parser';
import l from 'lodash';
import path from 'path';

async function* getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

async function translationExists(locale) {
  const target = path.normalize("./translations/");
  const targetPath = path.join(target, `${locale}.po`);

  try {
    const result = await fs.stat(targetPath);
    return true;
  } catch (cause) {
    return false;
  }
}

async function readTranslationByPath(path) {
  const content = await fs.readFile(path);
  return gt.po.parse(content, "utf-8");
}

async function writeTranslationByPath(path, data) {
  const buff = gt.po.compile(data, {sort: true});
  await fs.writeFile(path, buff);
}

async function readTranslation(locale) {
  const target = path.normalize("./translations/");
  const targetPath = path.join(target, `${locale}.po`);
  return readTranslationByPath(targetPath);
}

async function writeTranslation(locale, data) {
  const target = path.normalize("./translations/");
  const targetPath = path.join(target, `${locale}.po`);
  return writeTranslationByPath(targetPath, data);
}

async function* getTranslations() {
  const fileRe = /.+\.po$/;
  const target = path.normalize("./translations/");
  const parent = path.join(target, "..");

  for await (const f of getFiles(target)) {
    if (!fileRe.test(f)) continue;
    const data = path.parse(f);
    yield data
  }
}

async function validate(options, ...params) {
  const locale = options.locale;

  for await (const {name} of getTranslations()) {
    if (locale === undefined || locale === name) {
      const data = await readTranslation(name);
      await writeTranslation(name, data);
      const keys = Object.keys(data.translations[""]);
      console.log(`=> Validating '${name}': (translations=${keys.length})`);
    }
  }
}

async function deleteByPrefix(options, prefix, ...params) {
  const locale = options.locale;

  if (!!locale) {
    const exists = await translationExists(locale);
    if (!exists) {
      console.error(`Locale '${locale}' not found`);
      process.exit(1);
    }
  }

  if (!prefix) {
    console.error(`Prefix undefined`);
    process.exit(1);
  }

  for await (const {name} of getTranslations()) {
    if (locale === undefined || locale === name) {

      const data = await readTranslation(name);
      let deleted = [];

      for (const [key, value] of Object.entries(data.translations[""])) {
        if (key.startsWith(prefix)) {
          delete data.translations[""][key];
          deleted.push(key);
        }
      }

      await writeTranslation(name, data);


      console.log(`=> Processed locale '${name}': deleting prefix '${prefix}' (deleted=${deleted.length})`);

      if (options.verbose) {
        for (let key of deleted) {
          console.log(`-> Deleted key: ${key}`);
        }
      }

    }
  }
}

const options = getopts(process.argv.slice(2), {
  boolean: ["h", "v"],
  alias: {
    help: ["h"],
    locale: ["l"],
    verbose: ["v"]
  },
  stopEarly: true
});

const [command, ...params] = options._;

if (command === "validate") {
  await validate(options, ...params)
} else if (command === "delete") {
  await deleteByPrefix(options, ...params);
} else {
  console.log(`Translations manipulation script.
How to use:
./scripts/translation.js <options> <subcommand>

Available options:

 --locale -l  : specify a concrete locale
 --verbose -v : enables verbose output
 --help -h    : prints this help

Available subcommands:
- validate: reads and writes all translations files, sorting and validating
- delete <prefix>: delete a single entry or all entries that start with a prefix
`);
}
