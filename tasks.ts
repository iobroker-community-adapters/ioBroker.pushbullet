import { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } from '@iobroker/build-tools';

const src = `${__dirname}/src-admin/`;

function clean(): void {
    deleteFoldersRecursive(`${__dirname}/admin/custom`);
    deleteFoldersRecursive(`${src}build`);
}

function copyAllFiles(): void {
    copyFiles(['src-admin/build/assets/*.js'], 'admin/custom/assets');
    copyFiles(['src-admin/build/assets/*.map'], 'admin/custom/assets');
    copyFiles(['src-admin/build/customComponents.js'], 'admin/custom');
    copyFiles(['src-admin/build/customComponents.js.map'], 'admin/custom');
    // The admin reads this manifest to see which component library the build was made against,
    // and refuses to start the component if it targets an older GUI API generation.
    copyFiles(['src-admin/build/mf-manifest.json'], 'admin/custom');
    copyFiles(['src-admin/src/i18n/*.json'], 'admin/custom/i18n');
}

function build(): Promise<void> {
    // `rootDir` makes the build take over the version from the root package.json
    return buildReact(src, { rootDir: __dirname, vite: true, tsc: true, exec: true });
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(src).catch((e: unknown) => {
        console.error(`Cannot install packages: ${e as Error}`);
        process.exit(2);
    });
} else if (process.argv.includes('--2-compile')) {
    build().catch((e: unknown) => {
        console.error(`Cannot compile: ${e as Error}`);
        process.exit(2);
    });
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else {
    clean();
    npmInstall(src)
        .then(() => build())
        .then(() => copyAllFiles())
        .catch((e: unknown) => {
            console.error(`Cannot build: ${e as Error}`);
            process.exit(2);
        });
}
