#!/usr/bin/env node

const { spawn } = require('child_process')
const { resolve } = require('path')
const { readFileSync } = require('fs')

const args = process.argv.slice(2)
const envFiles = []

/*
 * Parses a string or buffer into an object
 * @param {(string|Buffer)} src - source to be parsed
 * @returns {Object} keys and values from src
*/
function parse (src) {

    const obj = {}

    // convert Buffers before splitting into lines and processing
    src.toString().split('\n').forEach((line) => {

        // matching "KEY' and 'VAL' in 'KEY=VAL'
        const keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)

        // matched?
        if (keyValueArr != null) {

            const key = keyValueArr[1]

            // default undefined or missing values to empty string
            let value = keyValueArr[2] || ''

            // expand newlines in quoted values
            const len = value ? value.length : 0

            if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {

                value = value.replace(/\\n/gm, '\n')

            }

            // remove any surrounding quotes and extra spaces
            value = value.replace(/(^['"]|['"]$)/g, '').trim()

            obj[key] = value

        }

    })

    return obj
}

// -------- Parse arguments ----------

let i = 0
while (args[i] === '-f') {

    args.shift() // Shifting -f
    const filename = args.shift() // Shifting value
    envFiles.push(filename)

}

// -------- Reading files and merging them ----------

const mergedEnv = {}

envFiles.forEach(filename => {

    const filepath = resolve(process.cwd(), filename)
    const fileBuffer = readFileSync(filepath)
    const config = parse(fileBuffer) // will return an object

    Object.assign(mergedEnv, config)

})

// -------- Spawinig child process with required env ----------

const finalEnv = Object.assign({}, process.env, mergedEnv)

if (args.length > 0) {

    const command = args.shift()
    const child = spawn(command, args, {
        env: finalEnv
    })

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

}
