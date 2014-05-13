# Build For: Worker, Browser, Node
#
module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    writeBowerJson:
      angular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-angular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'angular'
            targetSrc: '1.2.9'
      workular:
        options:
          bowerJsonTemplate: 'etc/bower.json'
          dest: 'build/browser-workular/bower.json'
          data:
            pkg: grunt.file.readJSON 'package.json'
            target: 'workular'
            targetSrc:"git+ssh://dev.higginsregister.com/srv/bower/js-workular.git#v0.5.1"

    replace:
      angular:
        src: 'tmp/js-rpc-browser-workular.js'
        dest: 'tmp/js-rpc-browser-angular.js'
        replacements: [{from:'workular', to:'angular'}]

    mkdir:
      buildEnvironement:
        options:
          create: [
            'tmp',
            'build',
            'build/browser-angular',
            'build/browser-workular',
            'build/node-workular',
            'build/node-workular/lib'
          ]

    jshint:
      all: 'tmp/*.js'

    uglify:
      buildWorkular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-workular/js-rpc.min.js.map'
        files:
          'build/browser-workular/js-rpc.min.js': ['tmp/js-rpc-browser-workular.js']
      buildAngular:
        options:
          sourceMap: true,
          sourceMapName: 'build/browser-angular/js-rpc.min.js.map'
        files:
          'build/browser-angular/js-rpc.min.js': ['tmp/js-rpc-browser-angular.js']
      pristine:
        options:
          mangle: false
          compress: false
          beautify: true
          preserveComments: true
        files:
          'build/browser-workular/js-rpc.js': ['tmp/js-rpc-browser-workular.js']
          'build/browser-angular/js-rpc.js': ['tmp/js-rpc-browser-angular.js']

    copy:
      asyncNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'src/js-rpc.js'
        dest: 'build/node-workular/'
      packageNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'package.json'
        dest: 'build/node-workular/'
      readmeNodeWorkular:
        expand: true
        flatten: true
        filter: 'isFile'
        src: 'README.md'
        dest: 'build/node-workular/'

    preprocessor:
      node:
        options:
          context:
            NODE: true
        files:
          'tmp/js-rpc-node.js': ['src/js-rpc.js']
      browser:
        options:
          context:
            BROWSER: true
        files:
          'tmp/js-rpc-browser-workular.js': ['src/js-rpc.js']


  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-jshint'
  grunt.loadNpmTasks 'grunt-mkdir'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-text-replace'
  grunt.loadNpmTasks 'grunt-preprocessor'
  grunt.loadNpmTasks 'grunt-write-bower-json'

  grunt.registerTask('build', ['mkdir', 'preprocessor', 'replace', 'uglify', 'copy', 'writeBowerJson'])
  grunt.registerTask('default', ['build'])

