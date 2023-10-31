pipeline {
  agent any
  stages {
    stage('checkout_code') {
      steps {
        git(url: 'https://github.com/rixyo/E-commerce-api', branch: 'main')
      }
    }

    stage('log') {
      parallel {
        stage('log') {
          steps {
            sh 'ls -la'
          }
        }

        stage('unit_test') {
          steps {
            sh 'yarn  && yarn test'
          }
        }

      }
    }

  }
}