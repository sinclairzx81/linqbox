export async function start() {
    await file('spec.js').create().exec()
    await Promise.all([
        shell('tsc-bundle spec/tsconfig.json --outFile spec.js --watch').exec(),
        shell('smoke-run spec.js -x node spec.js').exec()
    ])
}

export async function spec() {
    await shell('tsc-bundle spec/tsconfig.json --outFile spec.js').exec(),
    await shell('node spec.js').exec()
}

export async function build() {
    await folder('dist').delete().exec()
    await shell('tsc --project src/tsconfig.json --outDir dist --module CommonJS').exec()
    await folder('dist').add('package.json').exec()
    await folder('dist').add('readme.md').exec()
    await folder('dist').add('license').exec()
    await shell('cd dist && npm pack').exec()
}