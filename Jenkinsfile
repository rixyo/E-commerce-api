pipeline {
  agent any
  stages {
    stage('checkout_code') {
      steps {
        git(url: 'https://github.com/rixyo/E-commerce-api', branch: 'main')
      }
    }

    stage('log') {
      steps {
        sh 'ls -la'
      }
    }

  }
}