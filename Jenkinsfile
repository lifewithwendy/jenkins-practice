// Declarative pipeline: Jenkins reads this file from the repo on every build.
pipeline {
  // Run on any available executor (here: the controller itself).
  agent any

  options {
    timestamps()                                   // prefix each log line with the time
    timeout(time: 10, unit: 'MINUTES')             // kill hung builds
    buildDiscarder(logRotator(numToKeepStr: '20')) // keep the last 20 builds
  }

  environment {
    APP_DIR = 'app'
    CI      = 'true'   // many tools (npm included) behave non-interactively when CI is set
  }

  stages {
    stage('Checkout') {
      steps {
        // "scm" is the repo/branch configured in the job, so this file never hard-codes a URL.
        checkout scm
        sh 'git log -1 --oneline'
      }
    }

    stage('Build') {
      steps {
        dir(env.APP_DIR) {
          sh 'node --version && npm --version'
          sh 'npm ci'          // clean, reproducible install from package-lock.json
          sh 'npm run lint'
        }
      }
    }

    stage('Test') {
      steps {
        dir(env.APP_DIR) {
          sh 'npm test'
        }
      }
      post {
        always {
          // Publish JUnit XML so Jenkins shows a test trend and per-test results.
          junit "${env.APP_DIR}/test-results.xml"
        }
      }
    }

    stage('Package') {
      steps {
        dir(env.APP_DIR) {
          sh 'npm pack'        // produces jenkins-practice-app-<version>.tgz
        }
        // Keep the package with the build so you can download it from the build page.
        archiveArtifacts artifacts: "${env.APP_DIR}/*.tgz", fingerprint: true
      }
    }
  }

  post {
    success { echo "Build #${env.BUILD_NUMBER} passed" }
    failure { echo "Build #${env.BUILD_NUMBER} failed, check the stage that went red" }
    always  { cleanWs() }      // wipe the workspace so the next build starts clean
  }
}
