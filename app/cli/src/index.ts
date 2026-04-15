#!/usr/bin/env node

import { Command } from "commander";
import { installCommand } from "./commands/install.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { restoreCommand } from "./commands/restore.js";
import { listCommand } from "./commands/list.js";
import { cacheListCommand, cacheCleanCommand } from "./commands/cache.js";

import pkg from "../package.json" with { type: "json" };

const program = new Command();

program
    .name("mlnpm")
    .description("The Distributed Machine Learning Package Manager")
    .version(pkg.version);

program
    .command("install <name>")
    .alias("i")
    .description("Install an ML model package into your project")
    .action(async (name: string) => {
        await installCommand(name);
    });

program
    .command("uninstall <name>")
    .alias("rm")
    .description("Remove an mlnpm package from your project")
    .action(async (name: string) => {
        await uninstallCommand(name);
    });

program
    .command("restore")
    .description("Restore all mlnpm packages from package.json (runs in postinstall)")
    .action(async () => {
        await restoreCommand();
    });

program
    .command("list")
    .alias("ls")
    .description("List all mlnpm packages in this project")
    .action(async () => {
        await listCommand();
    });

const cache = program
    .command("cache")
    .description("Manage the global model cache (~/.mlnpm/cache/)");

cache
    .command("list")
    .description("Show all cached models and their sizes")
    .action(async () => {
        await cacheListCommand();
    });

cache
    .command("clean [name]")
    .description("Clear the cache (optionally for a specific package)")
    .action(async (name?: string) => {
        await cacheCleanCommand(name);
    });

program.parse(process.argv);