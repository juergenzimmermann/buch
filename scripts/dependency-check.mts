#!/usr/bin/env node
// Copyright (C) 2023 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Aufruf:      npm i --package-lock-only --legacy-peer-deps
//              cd scripts
//              node dependency-check.mts
//              cd ..
//              Remove-Item package-lock.json
//
// ggf. z.B.    bun why hono

import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { resolve } from 'node:path';

const nvdApiKey = '47fbc0a4-9240-4fda-9a26-d7d5624c16bf';
const project = 'buch';

let rootDir;
let baseScript = 'dependency-check';

// https://nodejs.org/api/os.html#osplatform
const betriebssystem = platform(); // win32, linux, ...
if (betriebssystem === 'win32') {
    rootDir = resolve('C:/');
    baseScript += '.bat';
} else {
    rootDir = resolve('/');
}
const script = resolve(
    rootDir,
    'Zimmermann',
    'dependency-check',
    'bin',
    baseScript,
);
console.log(`script=${script}`);

const dataPath = resolve(rootDir, 'Zimmermann', 'dependency-check-data');
const reportPath = '.';

let options = `--nvdApiKey ${nvdApiKey} --project ${project} `.concat(
    `--scan .. --suppression dependency-check-suppression.xml `,
    `--out ${reportPath} --data ${dataPath} `,
    // https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html
    // dependency-check.bat --advancedHelp
    '--nodeAuditSkipDevDependencies ',
    '--nodePackageSkipDevDependencies ',
    '--disableArchive ',
    '--disableAssembly ',
    '--disableAutoconf ',
    '--disableBundleAudit ',
    '--disableCarthageAnalyzer ',
    '--disableCentral ',
    '--disableCentralCache ',
    '--disableCmake ',
    '--disableCocoapodsAnalyzer ',
    '--disableComposer ',
    '--disableCpan ',
    '--disableDart ',
    '--disableGolangDep ',
    '--disableGolangMod ',
    '--disableJar ',
    '--disableMavenInstall ',
    '--disableMSBuild ',
    '--disableNugetconf ',
    '--disableNuspec ',
    '--disableOssIndex ',
    '--disablePip ',
    '--disablePipfile ',
    '--disablePoetry ',
    '--disablePyDist ',
    '--disablePyPkg ',
    '--disableRubygems ',
    '--disableSwiftPackageManagerAnalyzer ',
    '--disableSwiftPackageResolvedAnalyzer ',
    '--disableYarnAudit',
);
console.log(`options=${options}`);
console.log('');

// https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows
exec(`${script} ${options}`, (err, stdout) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});
