import chalk from "chalk";

export const log = {
    success(msg: string) {
        console.log(chalk.green("  ✓ ") + msg);
    },

    error(msg: string) {
        console.error(chalk.red("  ✗ ") + msg);
    },

    warn(msg: string) {
        console.log(chalk.yellow("  ⚠ ") + msg);
    },

    info(msg: string) {
        console.log(chalk.dim("  ℹ ") + msg);
    },

    header(msg: string) {
        console.log("\n" + chalk.bold(msg));
    },

    plain(msg: string) {
        console.log("  " + msg);
    },

    br() {
        console.log();
    },
};
