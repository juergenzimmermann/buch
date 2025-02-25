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

// https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

// Aufruf:      scripts
//              node dependency-check.js
// ggf. z.B.    npm ls express

// TODO dset https://github.com/lukeed/dset/issues/44#issuecomment-2122866311
// TODO graphql https://nvd.nist.gov/vuln/detail/CVE-2024-50312

import { exec } from 'node:child_process';
import { platform } from 'node:os';
import { resolve } from 'node:path';

const nvdApiKey = '47fbc0a4-9240-4fda-9a26-d7d5624c16bf';
const project = 'buch';

const execPath = resolve('C:/Zimmermann', 'dependency-check', 'bin');
const dataPath = resolve('C:\\Zimmermann', 'dependency-check-data');
const packageLockPath = '..\\package-lock.json';
const reportPath = '.';
let options = `--nvdApiKey ${nvdApiKey} --project ${project} --scan ${packageLockPath} --suppression suppression.xml --out ${reportPath} --data ${dataPath}`;
// dependency-check.bat --advancedHelp
options += ' --nodeAuditSkipDevDependencies';
options += ' --disableArchive';
options += ' --disableAssembly';
options += ' --disableAutoconf';
options += ' --disableBundleAudit';
options += ' --disableCarthageAnalyzer';
options += ' --disableCentral';
options += ' --disableCentralCache';
options += ' --disableCmake';
options += ' --disableCocoapodsAnalyzer';
options += ' --disableComposer';
options += ' --disableCpan';
options += ' --disableDart';
options += ' --disableGolangDep';
options += ' --disableGolangMod';
options += ' --disableJar';
options += ' --disableMavenInstall';
options += ' --disableMSBuild';
options += ' --disableNugetconf';
options += ' --disableNuspec';
options += ' --disablePip';
options += ' --disablePipfile';
options += ' --disablePnpmAudit';
options += ' --disablePoetry';
options += ' --disablePyDist';
options += ' --disablePyPkg';
options += ' --disableRubygems';
options += ' --disableSwiftPackageManagerAnalyzer';
options += ' --disableSwiftPackageResolvedAnalyzer';
options += ' --disableYarnAudit';

// https://nodejs.org/api/os.html#osplatform
const betriebssystem = platform(); // win32, linux, ...
let extension;
if (betriebssystem === 'win32') {
    extension = 'bat';
}
const baseScript = `dependency-check.${extension}`;
const script = `${resolve(execPath, baseScript)} ${options}`;
console.log(`skript=${script}`);

// https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows
exec(script, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});
