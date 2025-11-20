#!groovy

/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

pipeline {
    agent any
    tools {
        // Einstellungen > Tools > NodeJS Installationen
        nodejs 'node-25.2.1'
    }

    // globale Umgebungsvariable:
    //environment {
    //    DATABASE_URL = 'postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=../src/config/resources/postgresql/certificate.cer'
    //}

    options {
        // Timeout fuer den gesamten Job
        timeout time: 60, unit: 'MINUTES'
    }

    stages {
        // Stage = Logisch-zusammengehoerige Aufgaben der Pipeline:
        // zur spaeteren Visualisierung
        stage('Init') {
            // Step = einzelne Aufgabe
            steps {
                script {
                    if (!isUnix()) {
                        error 'Unix ist erforderlich'
                    }
                }

                echo "Jenkins-Job ${env.JOB_NAME} #${env.BUILD_ID} mit Workspace ${env.WORKSPACE}"

                // Unterverzeichnisse src und test im WORKSPACE loeschen: vom letzten Build
                // Kurzform fuer: sh([script: '...'])
                sh '''
                    rm -rf src
                    rm -rf test
                    rm -rf node_modules
                    rm -rf dist
                    rm -rf .extras/doc/api
                    rm -rf .extras/doc/folien/folien.html
                    rm -rf .extras/doc/projekthandbuch/html
                '''

                // https://www.jenkins.io/doc/pipeline/steps/git
                // "named arguments" statt Funktionsaufruf mit Klammern
                git url: 'https://github.com/juergenzimmermann/buch', branch: 'main', poll: true
            }
        }

        stage('Install') {
            // Stage-spezifische Umgebungsvariable
            environment {
                DATABASE_URL = 'postgresql://buch:p@localhost/buch?schema=buch&connection_limit=10&sslnegotiation=direct?sslcert=../src/config/resources/postgresql/certificate.cer'
            }

            steps {
                // https://stackoverflow.com/questions/51416409/jenkins-env-node-no-such-file-or-directory
                // https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions
                // https://www.debian.org/distrib/packages
                // https://github.com/nodesource/distributions#installation-instructions
                // https://packages.debian.org/stable/python/python3
                // https://packages.debian.org/trixie/python3
                // https://packages.debian.org/trixie/python3-minimal
                // https://packages.debian.org/trixie/python3.13
                // https://computingforgeeks.com/how-to-install-python-on-debian-linux

                // apt show python3.11-minimal
                // apt list

                sh '''
                    id
                    cat /etc/passwd
                    pwd
                    uname -a
                    cat /etc/os-release
                    cat /etc/debian_version
                    lsb_release -a
                    node --version
                    npm --version
                    npm r -g yarn pnpm
                    npm i -g corepack
                    npm root -g
                    which corepack
                    ls -al ~/.cache/node
                    corepack --version
                    corepack enable pnpm
                    corepack prepare pnpm@latest-10 --activate
                    env | sort
                    which pnpm
                    pnpm --version
                    pnpm root -g
                    pnpm store path
                    pnpm config get cache-dir
                    pnpm root
                    pnpm bin
                    python --version
                '''

                script {
                    if (!fileExists("${env.WORKSPACE}/package.json")) {
                        error "package.json ist *NICHT* in ${env.WORKSPACE} vorhanden"
                    }
                }

                // /var/jenkins_home ist das Homedirectory vom User "jenkins"
                // /var/jenkins_home/workspace/buch (siehe "pwd" oben)
                echo "DATABASE_URL = ${env.DATABASE_URL}"
                sh '''
                    cat package.json
                    pnpm i --prefer-frozen-lockfile
                    pnpm prisma generate
                '''
            }
        }

        stage('Compile') {
            steps {
                // TODO Warum funktioniert npx nicht?
                sh '''
                    pnpm tsc --version
                    pnpm run tsc
                '''
            }
        }

        stage('Test, Codeanalyse, Security, Dok.') {
            steps {
                parallel(
                    'Test': {
                        echo 'TODO: Rechnername/IP-Adresse des DB-Servers fuer Tests konfigurieren'
                        //sh 'npm run test:coverage'
                    },
                    'ESLint': {
                        sh '''
                            pnpm eslint --version
                            pnpm run eslint
                        '''
                    },
                    'Security Audit': {
                        sh 'pnpm audit -P'
                    },
                    'AsciiDoctor': {
                        sh '''
                            pnpm asciidoctor --version
                            pnpm run asciidoctor
                        '''
                    },
                    'reveal.js': {
                        sh '''
                            pnpm asciidoctor-revealjs --version
                            pnpm run revealjs
                        '''
                    },
                    'TypeDoc': {
                        sh '''
                            pnpm typedoc --version
                            pnpm typedoc
                        '''
                    }
                )
            }

            post {
                always {
                    publishHTML (target : [
                        reportDir: '.extras/doc/projekthandbuch/html',
                        reportFiles: 'projekthandbuch.html',
                        reportName: 'Projekthandbuch',
                        reportTitles: 'Projekthandbuch'
                    ])

                    publishHTML target : [
                        reportDir: '.extras/doc/folien',
                        reportFiles: 'folien.html',
                        reportName: 'Folien (reveal.js)',
                        reportTitles: 'reveal.js'
                    ]

                    publishHTML target : [
                        reportDir: '.extras/doc/api',
                        reportFiles: 'index.html',
                        reportName: 'TypeDoc',
                        reportTitles: 'TypeDoc'
                    ]
                }

                success {
                    script {
                        if (fileExists("${env.WORKSPACE}/buch.zip")) {
                            sh 'rm buch.zip'
                        }
                    }
                    // https://www.jenkins.io/doc/pipeline/steps/pipeline-utility-steps/#zip-create-zip-file
                    zip zipFile: 'buch.zip', archive: false, dir: 'dist'
                    // jobs/buch/builds/.../archive/buch.zip
                    archiveArtifacts 'buch.zip'
                }
            }
        }

        stage('Docker Image bauen') {
            steps {
                echo 'TODO: Docker-Image bauen'
                // https://www.jenkins.io/doc/book/pipeline/docker/#building-containers
                // def image = docker.build("juergenzimmermann/buch:${env.BUILD_ID}")
                // image.push()
                // image.push('latest')
            }
        }

        stage('Deployment fuer Kubernetes') {
            steps {
                echo 'TODO: Deployment fuer Kubernetes mit z.B. Ansible, Terraform'
            }
        }
    }
}
